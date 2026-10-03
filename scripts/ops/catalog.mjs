export const directActions = Object.freeze({
  dev: 'dev',
  tauri: 'dev',
  ui: 'dev',
  release: 'release',
  cli: 'cli-help',
  'cli-help': 'cli-help',
  version: 'cli-version',
  smoke: 'cli-smoke',
  verify: 'verify',
  rust: 'rust',
  audit: 'audit',
  build: 'build-release',
  portable: 'build-portable',
  installer: 'build-installer',
  'build-release': 'build-release',
  doctor: 'doctor',
  folder: 'folder',
});

export function normalizeDirectAction(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase().replace(/^--/, '');
  return directActions[normalized] || null;
}

export const directUsage = [
  ['dev', 'inicia a aplicação com Tauri Dev'],
  ['release', 'abre o executável portátil já compilado'],
  ['cli', 'exibe a referência da CLI headless'],
  ['version', 'exibe a versão da CLI'],
  ['smoke', 'gera PDF, DOCX, JSON e Markdown de teste'],
  ['verify', 'executa lint, build web e testes'],
  ['rust', 'executa fmt, Clippy e testes Rust'],
  ['audit', 'audita dependências npm'],
  ['build', 'gera o executavel portatil e o instalador Windows'],
  ['portable', 'gera release/bin/reoliresume.exe'],
  ['installer', 'gera release/installer/ReoliResumeSetup-*.exe'],
  ['doctor', 'diagnostica o ambiente local'],
  ['folder', 'abre release/bin no Explorer'],
];
