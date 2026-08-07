/**
 * Deterministic pseudo-random number generation.
 *
 * Math.random() is never used for puzzle selection — the daily puzzle has to be
 * byte-identical for every player in the world, so everything is seeded from the
 * UTC date string plus the mode name.
 */

/** FNV-1a, 32-bit. Stable across engines; no floating point involved. */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    // h *= 16777619, done with shifts to stay inside 32-bit integer math.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

/** Mulberry32. Small, fast, and identical everywhere because it is pure uint32 math. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rngFromSeed(seed: string): () => number {
  return mulberry32(hashString(seed))
}

/**
 * Fisher-Yates using a seeded generator. Returns a new array; the input is untouched.
 * Same seed + same input order === same output, on every browser.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice()
  const rand = rngFromSeed(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
