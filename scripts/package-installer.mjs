import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
const bundleDirectory = resolve('src-tauri/target/release/bundle/nsis');
const candidates = (await readdir(bundleDirectory))
  .filter((name) => name.endsWith('-setup.exe') && name.includes(`_${packageJson.version}_`))
  .sort();

if (candidates.length !== 1) {
  throw new Error(
    `Era esperado exatamente um instalador NSIS da versao ${packageJson.version}, encontrados: ${candidates.join(', ') || 'nenhum'}`,
  );
}

const source = resolve(bundleDirectory, candidates[0]);
const outputDirectory = resolve('release/installer');
const filename = `ReoliResumeSetup-${packageJson.version}.exe`;
const destination = resolve(outputDirectory, filename);

await stat(source);
await mkdir(outputDirectory, { recursive: true });
await copyFile(source, destination);

const bytes = await readFile(destination);
const sha256 = createHash('sha256').update(bytes).digest('hex');
await writeFile(
  resolve(outputDirectory, `ReoliResumeSetup-${packageJson.version}.sha256`),
  `${sha256}  ${filename}\n`,
  'utf8',
);

console.log(`Instalador Windows: ${destination}`);
console.log(`SHA-256: ${sha256}`);
