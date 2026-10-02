pub struct ZipEntry<'a> {
    pub name: &'a str,
    pub bytes: &'a [u8],
}

pub fn create(entries: &[ZipEntry<'_>]) -> Result<Vec<u8>, String> {
    if entries.len() > u16::MAX as usize {
        return Err("arquivo ZIP excede o limite de entradas".into());
    }
    let mut output = Vec::new();
    let mut central = Vec::new();
    for entry in entries {
        let name = entry.name.as_bytes();
        let name_length =
            u16::try_from(name.len()).map_err(|_| "nome de entrada ZIP muito longo")?;
        let size = u32::try_from(entry.bytes.len()).map_err(|_| "entrada ZIP excede 4 GB")?;
        let offset = u32::try_from(output.len()).map_err(|_| "arquivo ZIP excede 4 GB")?;
        let checksum = crc32(entry.bytes);

        u32_le(&mut output, 0x0403_4b50);
        u16_le(&mut output, 20);
        u16_le(&mut output, 0x0800);
        u16_le(&mut output, 0);
        u16_le(&mut output, 0);
        u16_le(&mut output, 0);
        u32_le(&mut output, checksum);
        u32_le(&mut output, size);
        u32_le(&mut output, size);
        u16_le(&mut output, name_length);
        u16_le(&mut output, 0);
        output.extend_from_slice(name);
        output.extend_from_slice(entry.bytes);

        u32_le(&mut central, 0x0201_4b50);
        u16_le(&mut central, 20);
        u16_le(&mut central, 20);
        u16_le(&mut central, 0x0800);
        u16_le(&mut central, 0);
        u16_le(&mut central, 0);
        u16_le(&mut central, 0);
        u32_le(&mut central, checksum);
        u32_le(&mut central, size);
        u32_le(&mut central, size);
        u16_le(&mut central, name_length);
        u16_le(&mut central, 0);
        u16_le(&mut central, 0);
        u16_le(&mut central, 0);
        u16_le(&mut central, 0);
        u32_le(&mut central, 0);
        u32_le(&mut central, offset);
        central.extend_from_slice(name);
    }
    let central_offset = u32::try_from(output.len()).map_err(|_| "arquivo ZIP excede 4 GB")?;
    let central_size = u32::try_from(central.len()).map_err(|_| "diretório ZIP excede 4 GB")?;
    output.extend_from_slice(&central);
    u32_le(&mut output, 0x0605_4b50);
    u16_le(&mut output, 0);
    u16_le(&mut output, 0);
    u16_le(&mut output, entries.len() as u16);
    u16_le(&mut output, entries.len() as u16);
    u32_le(&mut output, central_size);
    u32_le(&mut output, central_offset);
    u16_le(&mut output, 0);
    Ok(output)
}

fn crc32(bytes: &[u8]) -> u32 {
    let mut crc = 0xffff_ffff_u32;
    for byte in bytes {
        crc ^= u32::from(*byte);
        for _ in 0..8 {
            let mask = (crc & 1).wrapping_neg();
            crc = (crc >> 1) ^ (0xedb8_8320 & mask);
        }
    }
    !crc
}

fn u16_le(output: &mut Vec<u8>, value: u16) {
    output.extend_from_slice(&value.to_le_bytes());
}

fn u32_le(output: &mut Vec<u8>, value: u32) {
    output.extend_from_slice(&value.to_le_bytes());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_store_only_zip_with_expected_signatures() {
        let bytes = create(&[ZipEntry {
            name: "test.txt",
            bytes: b"hello",
        }])
        .unwrap();
        assert!(bytes.starts_with(b"PK\x03\x04"));
        assert!(bytes.windows(4).any(|value| value == b"PK\x01\x02"));
        assert!(bytes.ends_with(b"\0\0"));
    }
}
