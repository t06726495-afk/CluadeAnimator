// Levenshtein-based fuzzy matching of extracted names against the roster, so
// OCR near-misses ("Marcus Delaine") resolve to existing players instead of
// creating duplicates.

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[n];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

export type Match<T> = { item: T; kind: 'exact' | 'close' | 'none'; distance: number };

export function bestMatch<T extends { name: string }>(name: string, candidates: T[]): Match<T> | null {
  const target = norm(name);
  if (!target) return null;
  let best: Match<T> | null = null;
  for (const item of candidates) {
    const candidate = norm(item.name);
    if (candidate === target) return { item, kind: 'exact', distance: 0 };
    const distance = levenshtein(target, candidate);
    if (!best || distance < best.distance) best = { item, kind: 'none', distance };
  }
  if (!best) return null;
  // Allow more edits on longer names; require a meaningfully close match.
  const threshold = Math.max(2, Math.floor(target.length / 4));
  if (best.distance <= threshold) best.kind = 'close';
  return best.kind === 'close' ? best : null;
}
