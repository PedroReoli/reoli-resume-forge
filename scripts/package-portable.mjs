import { copyFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src-tauri/target/release/reoli-cv.exe');
const outputDirectory = resolve('release/bin');
const destination = resolve(outputDirectory, 'reoli-cv.exe');

await stat(source);
await mkdir(outputDirectory, { recursive: true });
await copyFile(source, destination);

const bytes = await readFile(destination);
const sha256 = createHash('sha256').update(bytes).digest('hex');
await writeFile(
  resolve(outputDirectory, 'reoli-cv.sha256'),
  `${sha256}  reoli-cv.exe\n`,
  'utf8',
);

console.log(`Executável portátil: ${destination}`);
console.log(`SHA-256: ${sha256}`);
