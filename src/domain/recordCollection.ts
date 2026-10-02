export function moveRecord<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [record] = next.splice(from, 1);
  next.splice(to, 0, record);
  return next;
}

export function insertRecord<T>(items: readonly T[], index: number, record: T): T[] {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, record);
  return next;
}
