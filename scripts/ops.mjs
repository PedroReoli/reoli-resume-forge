import process from 'node:process';
import {
  buildPortable,
  openRelease,
  openReleaseDirectory,
  projectSnapshot,
  runAudit,
  runCliSmoke,
  runDoctor,
  runRustQuality,
  runTauriDev,
  runVerify,
  showCliHelp,
  showCliVersion,
} from './ops/actions.mjs';
import { directUsage, normalizeDirectAction } from './ops/catalog.mjs';
import { ask, clearScreen, color, divider, failure, option, section } from './ops/terminal.mjs';

const actions = {
  dev: runTauriDev,
  release: openRelease,
  'cli-help': showCliHelp,
  'cli-version': showCliVersion,
  'cli-smoke': runCliSmoke,
  verify: runVerify,
  rust: runRustQuality,
  audit: runAudit,
  build: buildPortable,
  doctor: runDoctor,
  folder: openReleaseDirectory,
};

function renderBanner() {
  const snapshot = projectSnapshot();
  const releaseTone = snapshot.release.state === 'ready' ? color.green : color.yellow;
  clearScreen();
  console.log('');
  console.log(`  ${color.bold}${color.cyan}REOLI RESUME FORGE${color.reset} ${color.dim}/ Operations Console${color.reset}`);
  console.log(`  ${color.dim}v${snapshot.version} · ${snapshot.branch}@${snapshot.commit} · Node ${snapshot.node}${color.reset}`);
  console.log(`  ${color.dim}Tauri v2 · Release ${releaseTone}${snapshot.release.label}${color.reset}`);
  console.log(`  ${divider()}`);
}

function renderMainMenu() {
  renderBanner();
  section('DESENVOLVIMENTO');
  option('1', 'ABRIR DESKTOP', 'Tauri Dev + hot reload  [PADRÃO / ENTER]', color.green);
  option('2', 'EXECUTAR RELEASE', 'Abre release/bin/reoli-cv.exe');
  option('3', 'CLI & AUTOMAÇÃO', 'Help, versão e smoke multiformato', color.blue);
  section('QUALIDADE');
  option('4', 'VALIDAÇÕES', 'Verify, Rust rigoroso e auditoria', color.yellow);
  option('5', 'DIAGNÓSTICO', 'Node, npm, Rust, Cargo, Git e checksum');
  section('ENTREGA');
  option('6', 'BUILD PORTÁTIL', 'Compila o executável único Windows', color.magenta);
  option('7', 'ABRIR RELEASE/BIN', 'Mostra os artefatos no Explorer');
  console.log(`\n  ${color.dim}[0] Sair · aliases: npm run ops -- doctor | verify | build${color.reset}`);
  console.log(`  ${divider()}`);
}

async function cliMenu() {
  while (true) {
    renderBanner();
    section('CLI & AUTOMAÇÃO');
    option('1', 'REFERÊNCIA', 'Lista comandos, modelos, templates e formatos', color.blue);
    option('2', 'VERSÃO', 'Confirma a versão do binário');
    option('3', 'SMOKE MULTIFORMATO', 'Gera PDF, DOCX, JSON e Markdown em output/ops-smoke', color.green);
    option('0', 'VOLTAR', 'Menu principal');
    const choice = await ask(`\n  ${color.cyan}›${color.reset} Escolha [1]: `, '1');
    if (choice === '0') return;
    if (choice === '1') showCliHelp();
    else if (choice === '2') showCliVersion();
    else if (choice === '3') runCliSmoke();
    else failure('Opção inválida.');
    await ask(`  ${color.dim}Pressione Enter para continuar...${color.reset}`);
  }
}

async function qualityMenu() {
  while (true) {
    renderBanner();
    section('QUALIDADE');
    option('1', 'VERIFY COMPLETO', 'ESLint + TypeScript/Vite + testes Node/Rust', color.green);
    option('2', 'RUST RIGOROSO', 'Rustfmt + Clippy -D warnings + testes');
    option('3', 'NPM AUDIT', 'Vulnerabilidades high/critical', color.yellow);
    option('0', 'VOLTAR', 'Menu principal');
    const choice = await ask(`\n  ${color.cyan}›${color.reset} Escolha [1]: `, '1');
    if (choice === '0') return;
    if (choice === '1') runVerify();
    else if (choice === '2') runRustQuality();
    else if (choice === '3') runAudit();
    else failure('Opção inválida.');
    await ask(`  ${color.dim}Pressione Enter para continuar...${color.reset}`);
  }
}

function printHelp() {
  console.log('\nReoli Resume Forge Operations Console\n');
  console.log('Uso:');
  console.log('  npm run ops                 Abre o menu; Enter inicia Tauri Dev');
  console.log('  npm run ops -- <ação>       Executa uma ação diretamente\n');
  for (const [name, description] of directUsage) {
    console.log(`  ${name.padEnd(10)} ${description}`);
  }
  console.log('');
}

async function interactiveMenu() {
  while (true) {
    renderMainMenu();
    const choice = await ask(`\n  ${color.cyan}›${color.reset} Escolha [1]: `, '1');
    if (choice === '0') return;
    if (choice === '1') runTauriDev();
    else if (choice === '2') openRelease();
    else if (choice === '3') await cliMenu();
    else if (choice === '4') await qualityMenu();
    else if (choice === '5') runDoctor();
    else if (choice === '6') buildPortable();
    else if (choice === '7') openReleaseDirectory();
    else failure('Opção inválida.');

    if (!['3', '4'].includes(choice)) {
      await ask(`  ${color.dim}Pressione Enter para voltar ao menu...${color.reset}`);
    }
  }
}

async function main() {
  const rawAction = process.argv[2];
  if (['help', '-h', '--help'].includes(rawAction)) {
    printHelp();
    return;
  }
  if (rawAction) {
    const action = normalizeDirectAction(rawAction);
    if (!action) {
      failure(`Ação desconhecida: ${rawAction}`);
      printHelp();
      process.exitCode = 1;
      return;
    }
    const succeeded = actions[action]();
    if (succeeded === false) process.exitCode = 1;
    return;
  }
  await interactiveMenu();
}

main().catch((error) => {
  failure(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
