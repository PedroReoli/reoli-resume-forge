export function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
}
