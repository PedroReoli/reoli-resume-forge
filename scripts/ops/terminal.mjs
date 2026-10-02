import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;
const ansi = (code) => (useColor ? `\u001B[${code}m` : '');

export const color = {
  reset: ansi(0),
  bold: ansi(1),
  dim: ansi(2),
  red: ansi(31),
  green: ansi(32),
  yellow: ansi(33),
  blue: ansi(34),
  magenta: ansi(35),
  cyan: ansi(36),
  white: ansi(37),
  gray: ansi(90),
};

export function clearScreen() {
  if (process.stdout.isTTY) process.stdout.write('\u001Bc');
}

export function divider(width = 68) {
  return `${color.dim}${'─'.repeat(width)}${color.reset}`;
}

export async function ask(question, fallback = '') {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await terminal.question(question)).trim();
    return answer || fallback;
  } finally {
    terminal.close();
  }
}

export function section(title) {
  console.log(`\n  ${color.bold}${color.cyan}${title}${color.reset}`);
}

export function option(key, title, description, tone = color.white) {
  console.log(`  ${color.bold}${tone}[${key}]${color.reset} ${color.bold}${title.padEnd(23)}${color.reset} ${color.dim}${description}${color.reset}`);
}

export function success(message) {
  console.log(`\n  ${color.green}✓${color.reset} ${message}\n`);
}

export function warning(message) {
  console.log(`\n  ${color.yellow}!${color.reset} ${message}\n`);
}

export function failure(message) {
  console.error(`\n  ${color.red}✗${color.reset} ${message}\n`);
}

export function runProcess({ executable, args = [], cwd, label, env }) {
  console.log(`\n  ${color.cyan}›${color.reset} ${color.bold}${label}${color.reset}`);
  console.log(`  ${color.dim}${[executable, ...args].join(' ')}${color.reset}\n`);
  const startedAt = Date.now();
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: false,
  });
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (result.error) {
    failure(`${label} não pôde ser iniciado: ${result.error.message}`);
    return false;
  }
  if (result.status !== 0) {
    failure(`${label} terminou com código ${result.status ?? 'desconhecido'} após ${seconds}s.`);
    return false;
  }

  success(`${label} concluído em ${seconds}s.`);
  return true;
}

export function captureProcess(executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}
