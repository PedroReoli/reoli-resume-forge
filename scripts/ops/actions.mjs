import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { captureProcess, failure, runProcess, success, warning } from './terminal.mjs';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(currentDirectory, '..', '..');
export const releaseExecutable = resolve(projectRoot, 'release', 'bin', 'reoliresume.exe');
const releaseChecksum = resolve(projectRoot, 'release', 'bin', 'reoliresume.sha256');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
const npmCli = process.env.npm_execpath;

const cargoHome = process.env.CARGO_HOME || (process.env.USERPROFILE ? resolve(process.env.USERPROFILE, '.cargo') : null);
if (cargoHome) {
  const cargoBin = resolve(cargoHome, 'bin');
  if (existsSync(cargoBin)) {
    const delimiter = process.platform === 'win32' ? ';' : ':';
    if (!process.env.PATH || !process.env.PATH.toLowerCase().includes(cargoBin.toLowerCase())) {
      process.env.PATH = `${cargoBin}${delimiter}${process.env.PATH || ''}`;
    }
  }
}

const cargoExecutable = process.platform === 'win32' ? 'cargo.exe' : 'cargo';

function npm(script, label) {
  if (!npmCli) {
    failure('npm_execpath não está disponível. Inicie pelo comando npm run ops.');
    return false;
  }
  return runProcess({
    executable: process.execPath,
    args: [npmCli, 'run', script],
    cwd: projectRoot,
    label,
  });
}

function cargo(args, label) {
  return runProcess({ executable: cargoExecutable, args, cwd: projectRoot, label });
}

export function projectSnapshot() {
  const branch = captureProcess('git.exe', ['branch', '--show-current'], projectRoot) || 'sem branch';
  const commit = captureProcess('git.exe', ['rev-parse', '--short', 'HEAD'], projectRoot) || 'sem commit';
  return {
    version: packageJson.version,
    node: process.version,
    branch,
    commit,
    release: inspectReleaseArtifacts(),
  };
}

export function inspectReleaseArtifacts({
  executablePath = releaseExecutable,
  checksumPath = releaseChecksum,
} = {}) {
  if (!existsSync(executablePath) || !existsSync(checksumPath)) {
    return { state: 'missing', label: 'não gerada' };
  }

  const expected = readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0]?.toLowerCase();
  const actual = createHash('sha256').update(readFileSync(executablePath)).digest('hex');
  const size = statSync(executablePath).size;
  return {
    state: expected === actual ? 'ready' : 'invalid',
    label: expected === actual ? `${formatBytes(size)} · SHA válido` : 'checksum inválido',
    actual,
    expected,
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

export function runTauriDev() {
  return npm('tauri:dev', 'Desktop em desenvolvimento (Tauri)');
}

export function openRelease() {
  const inspection = inspectReleaseArtifacts();
  if (inspection.state !== 'ready') {
    failure('A release portátil não está pronta. Execute a opção de build primeiro.');
    return false;
  }

  const child = spawn(releaseExecutable, ['ui'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
  success(`Interface aberta pelo executável de release (PID ${child.pid}).`);
  return true;
}

function runCli(argumentsList, label) {
  const inspection = inspectReleaseArtifacts();
  if (inspection.state === 'ready') {
    return runProcess({
      executable: releaseExecutable,
      args: argumentsList,
      cwd: projectRoot,
      label,
    });
  }

  warning('Release ausente; a CLI será executada pelo Cargo em modo de desenvolvimento.');
  return cargo(
    ['run', '--manifest-path', 'src-tauri/Cargo.toml', '--', ...argumentsList],
    label,
  );
}

export function showCliHelp() {
  return runCli(['help'], 'Referência da CLI');
}

export function showCliVersion() {
  return runCli(['version'], 'Versão da CLI');
}

export function runCliSmoke() {
  const output = resolve(projectRoot, 'output', 'ops-smoke');
  mkdirSync(output, { recursive: true });
  return runCli([
    'generate',
    '--model', 'fullstack',
    '--template', 'clean',
    '--format', 'pdf,docx,json,md',
    '--on-conflict', 'overwrite',
    '--out', output,
  ], 'Smoke test da CLI');
}

export function runVerify() {
  return npm('verify', 'Validação completa');
}

export function runRustQuality() {
  if (!cargo(['fmt', '--manifest-path', 'src-tauri/Cargo.toml', '--', '--check'], 'Rustfmt')) return false;
  if (!cargo(['clippy', '--manifest-path', 'src-tauri/Cargo.toml', '--all-targets', '--', '-D', 'warnings'], 'Clippy rigoroso')) return false;
  return cargo(['test', '--manifest-path', 'src-tauri/Cargo.toml'], 'Testes Rust');
}

export function runAudit() {
  if (!npmCli) {
    failure('npm_execpath não está disponível. Inicie pelo comando npm run ops.');
    return false;
  }
  return runProcess({
    executable: process.execPath,
    args: [npmCli, 'audit', '--audit-level=high'],
    cwd: projectRoot,
    label: 'Auditoria de dependências',
  });
}

export function buildPortable() {
  return npm('build:portable', 'Build portátil Windows');
}

export function buildInstaller() {
  return npm('build:installer', 'Instalador Windows NSIS');
}

export function buildRelease() {
  return npm('build:release', 'Release completa Windows');
}

export function runDoctor() {
  const checks = [
    ['Node.js', process.version],
    ['npm', npmCli ? captureProcess(process.execPath, [npmCli, '--version'], projectRoot) : null],
    ['Rust', captureProcess('rustc.exe', ['--version'], projectRoot)],
    ['Cargo', captureProcess(cargoExecutable, ['--version'], projectRoot)],
    ['Git', captureProcess('git.exe', ['--version'], projectRoot)],
  ];
  const release = inspectReleaseArtifacts();
  const dependenciesInstalled = existsSync(resolve(projectRoot, 'node_modules'));

  console.log('');
  for (const [name, value] of checks) {
    console.log(`  ${value ? '✓' : '✗'} ${name.padEnd(12)} ${value || 'não encontrado'}`);
  }
  console.log(`  ${release.state === 'ready' ? '✓' : '!'} ${'Release'.padEnd(12)} ${release.label}`);
  console.log(`  ${dependenciesInstalled ? '✓' : '!'} ${'Dependências'.padEnd(12)} ${dependenciesInstalled ? 'instaladas' : 'execute npm ci'}`);
  console.log('');

  const failed = checks.some(([, value]) => !value) || !dependenciesInstalled;
  if (failed) {
    failure('Há ferramentas obrigatórias ou dependências ausentes no ambiente.');
    return false;
  }
  success('Ambiente essencial disponível.');
  return true;
}

export function openReleaseDirectory() {
  const directory = resolve(projectRoot, 'release');
  mkdirSync(directory, { recursive: true });
  if (process.platform !== 'win32') {
    warning(`Diretório da release: ${directory}`);
    return true;
  }
  const child = spawn('explorer.exe', [directory], { detached: true, stdio: 'ignore' });
  child.unref();
  success('Pasta release aberta no Explorer.');
  return true;
}
