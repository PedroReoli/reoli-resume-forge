import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { formatBytes, inspectReleaseArtifacts } from './actions.mjs';

test('valida o checksum do executável portátil', () => {
  const directory = mkdtempSync(join(tmpdir(), 'reoli-ops-'));
  const executablePath = join(directory, 'reoli-cv.exe');
  const checksumPath = join(directory, 'reoli-cv.sha256');
  const bytes = Buffer.from('portable-binary');
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  writeFileSync(executablePath, bytes);
  writeFileSync(checksumPath, `${sha256}  reoli-cv.exe\n`);

  const result = inspectReleaseArtifacts({ executablePath, checksumPath });
  assert.equal(result.state, 'ready');
  assert.equal(result.actual, sha256);
});

test('distingue release ausente e checksum inválido', () => {
  const missing = inspectReleaseArtifacts({
    executablePath: join(tmpdir(), 'reoli-ops-missing.exe'),
    checksumPath: join(tmpdir(), 'reoli-ops-missing.sha256'),
  });
  assert.equal(missing.state, 'missing');

  const directory = mkdtempSync(join(tmpdir(), 'reoli-ops-'));
  const executablePath = join(directory, 'reoli-cv.exe');
  const checksumPath = join(directory, 'reoli-cv.sha256');
  writeFileSync(executablePath, 'changed');
  writeFileSync(checksumPath, `${'0'.repeat(64)}  reoli-cv.exe\n`);
  assert.equal(inspectReleaseArtifacts({ executablePath, checksumPath }).state, 'invalid');
});

test('formata bytes para o resumo do menu', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1.0 KiB');
  assert.equal(formatBytes(1_536), '1.5 KiB');
  assert.equal(formatBytes(5_242_880), '5.0 MiB');
});
