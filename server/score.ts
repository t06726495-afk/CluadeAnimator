// Simple per-category performance score used for the Top Performers table.
// Weights favor scoring plays and turnovers; tuned for readability on camera,
// not for analytics rigor.

type Stats = Record<string, unknown>;

function num(stats: Stats, ...keys: string[]): number {
  for (const key of keys) {
    const v = stats[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const parsed = Number(v.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed) && v.trim() !== '') return parsed;
    }
  }
  return 0;
}

export function performanceScore(category: string, stats: Stats): number {
  switch (category) {
    case 'passing':
      return (
        num(stats, 'YDS', 'yds', 'pass_yds') * 0.04 +
        num(stats, 'TD', 'td', 'pass_td') * 4 -
        num(stats, 'INT', 'int') * 3
      );
    case 'rushing':
      return (
        num(stats, 'YDS', 'yds', 'rush_yds') * 0.1 +
        num(stats, 'TD', 'td', 'rush_td') * 6 -
        num(stats, 'FUM', 'fum') * 3
      );
    case 'receiving':
      return (
        num(stats, 'YDS', 'yds', 'rec_yds') * 0.1 +
        num(stats, 'TD', 'td', 'rec_td') * 6 +
        num(stats, 'REC', 'rec', 'CATCHES') * 0.5
      );
    case 'defense':
      return (
        num(stats, 'TKL', 'tackles', 'TAK') * 1 +
        num(stats, 'SACK', 'SCK', 'sacks') * 4 +
        num(stats, 'INT', 'int') * 6 +
        num(stats, 'TFL', 'tfl') * 2 +
        num(stats, 'FF', 'ff') * 3 +
        num(stats, 'TD', 'td') * 6
      );
    default:
      return 0;
  }
}

export function keyStatLine(category: string, stats: Stats): string {
  const parts: string[] = [];
  const push = (label: string, ...keys: string[]) => {
    const v = num(stats, ...keys);
    if (v) parts.push(`${v} ${label}`);
  };
  switch (category) {
    case 'passing': {
      const cmpAtt = stats['CMP/ATT'] ?? stats['C/A'];
      if (typeof cmpAtt === 'string') parts.push(cmpAtt);
      push('YDS', 'YDS', 'yds');
      push('TD', 'TD', 'td');
      push('INT', 'INT', 'int');
      break;
    }
    case 'rushing':
      push('CAR', 'CAR', 'ATT', 'att');
      push('YDS', 'YDS', 'yds');
      push('TD', 'TD', 'td');
      break;
    case 'receiving':
      push('REC', 'REC', 'rec');
      push('YDS', 'YDS', 'yds');
      push('TD', 'TD', 'td');
      break;
    case 'defense':
      push('TKL', 'TKL', 'TAK', 'tackles');
      push('SACK', 'SACK', 'SCK', 'sacks');
      push('INT', 'INT', 'int');
      break;
  }
  return parts.join(', ') || '—';
}
