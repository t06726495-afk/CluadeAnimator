// FBS team reference data for autocomplete + dynasty color theming.
// Colors are best-effort approximations of each school's primary brand
// colors — easy to tweak here if one looks off.

export type Team = { name: string; primary: string; secondary: string };

export const TEAMS: Team[] = [
  { name: 'Air Force', primary: '#004a7b', secondary: '#a2aaad' },
  { name: 'Akron', primary: '#00285e', secondary: '#a89968' },
  { name: 'Alabama', primary: '#9e1b32', secondary: '#828a8f' },
  { name: 'App State', primary: '#000000', secondary: '#ffcc00' },
  { name: 'Arizona', primary: '#ab0520', secondary: '#0c234b' },
  { name: 'Arizona State', primary: '#8c1d40', secondary: '#ffc627' },
  { name: 'Arkansas', primary: '#9d2235', secondary: '#000000' },
  { name: 'Arkansas State', primary: '#cc092f', secondary: '#000000' },
  { name: 'Army', primary: '#000000', secondary: '#d4bf91' },
  { name: 'Auburn', primary: '#0c2340', secondary: '#e87722' },
  { name: 'Ball State', primary: '#ba0c2f', secondary: '#ffffff' },
  { name: 'Baylor', primary: '#154734', secondary: '#ffb81c' },
  { name: 'Boise State', primary: '#0033a0', secondary: '#d64309' },
  { name: 'Boston College', primary: '#98002e', secondary: '#bc9b6a' },
  { name: 'Bowling Green', primary: '#4f2c1d', secondary: '#fe5000' },
  { name: 'BYU', primary: '#002e5d', secondary: '#ffffff' },
  { name: 'Buffalo', primary: '#005bbb', secondary: '#000000' },
  { name: 'California', primary: '#003262', secondary: '#fdb515' },
  { name: 'Central Michigan', primary: '#6a0032', secondary: '#ffc82e' },
  { name: 'Charlotte', primary: '#046a38', secondary: '#a49665' },
  { name: 'Cincinnati', primary: '#e00122', secondary: '#000000' },
  { name: 'Clemson', primary: '#f56600', secondary: '#522d80' },
  { name: 'Coastal Carolina', primary: '#006f71', secondary: '#a27752' },
  { name: 'Colorado', primary: '#cfb87c', secondary: '#000000' },
  { name: 'Colorado State', primary: '#1e4d2b', secondary: '#c8c372' },
  { name: 'Duke', primary: '#00539b', secondary: '#000000' },
  { name: 'East Carolina', primary: '#592a8a', secondary: '#fdc82f' },
  { name: 'Eastern Michigan', primary: '#00694e', secondary: '#046a38' },
  { name: 'FAU', primary: '#003366', secondary: '#cc0000' },
  { name: 'FIU', primary: '#081e3f', secondary: '#b6862c' },
  { name: 'Florida', primary: '#0021a5', secondary: '#fa4616' },
  { name: 'Florida State', primary: '#782f40', secondary: '#ceb888' },
  { name: 'Fresno State', primary: '#c41230', secondary: '#002856' },
  { name: 'Georgia', primary: '#ba0c2f', secondary: '#000000' },
  { name: 'Georgia Southern', primary: '#001c48', secondary: '#0092d0' },
  { name: 'Georgia State', primary: '#0039a6', secondary: '#ffffff' },
  { name: 'Georgia Tech', primary: '#b3a369', secondary: '#003057' },
  { name: 'Hawaii', primary: '#024731', secondary: '#c8c9c7' },
  { name: 'Houston', primary: '#c8102e', secondary: '#000000' },
  { name: 'Illinois', primary: '#e84a27', secondary: '#13294b' },
  { name: 'Indiana', primary: '#990000', secondary: '#eeedeb' },
  { name: 'Iowa', primary: '#ffcd00', secondary: '#000000' },
  { name: 'Iowa State', primary: '#c8102e', secondary: '#f1be48' },
  { name: 'Jacksonville State', primary: '#a6192e', secondary: '#a2aaad' },
  { name: 'James Madison', primary: '#450084', secondary: '#cbb677' },
  { name: 'Kansas', primary: '#0051ba', secondary: '#e8000d' },
  { name: 'Kansas State', primary: '#512888', secondary: '#a2aaad' },
  { name: 'Kent State', primary: '#002664', secondary: '#eaab00' },
  { name: 'Kentucky', primary: '#0033a0', secondary: '#ffffff' },
  { name: 'Liberty', primary: '#002d62', secondary: '#c8102e' },
  { name: 'Louisiana', primary: '#c8102e', secondary: '#a2aaad' },
  { name: 'Louisiana Tech', primary: '#003087', secondary: '#c02033' },
  { name: 'Louisville', primary: '#ad0000', secondary: '#000000' },
  { name: 'LSU', primary: '#461d7c', secondary: '#fdd023' },
  { name: 'Marshall', primary: '#00b140', secondary: '#000000' },
  { name: 'Maryland', primary: '#e21833', secondary: '#ffd200' },
  { name: 'Memphis', primary: '#003087', secondary: '#898d8d' },
  { name: 'Miami', primary: '#f47321', secondary: '#005030' },
  { name: 'Miami OH', primary: '#c41230', secondary: '#000000' },
  { name: 'Michigan', primary: '#00274c', secondary: '#ffcb05' },
  { name: 'Michigan State', primary: '#18453b', secondary: '#ffffff' },
  { name: 'Middle Tennessee', primary: '#0066cc', secondary: '#000000' },
  { name: 'Minnesota', primary: '#7a0019', secondary: '#ffcc33' },
  { name: 'Ole Miss', primary: '#ce1126', secondary: '#14213d' },
  { name: 'Mississippi State', primary: '#660000', secondary: '#ffffff' },
  { name: 'Missouri', primary: '#f1b82d', secondary: '#000000' },
  { name: 'Navy', primary: '#00205b', secondary: '#c5b783' },
  { name: 'NC State', primary: '#cc0000', secondary: '#000000' },
  { name: 'Nebraska', primary: '#e41c38', secondary: '#ffffff' },
  { name: 'Nevada', primary: '#003366', secondary: '#a2aaad' },
  { name: 'New Mexico', primary: '#ba0c2f', secondary: '#63666a' },
  { name: 'New Mexico State', primary: '#8c2131', secondary: '#ffffff' },
  { name: 'North Carolina', primary: '#7bafd4', secondary: '#13294b' },
  { name: 'North Texas', primary: '#00853e', secondary: '#000000' },
  { name: 'Northern Illinois', primary: '#c8102e', secondary: '#000000' },
  { name: 'Northwestern', primary: '#4e2a84', secondary: '#ffffff' },
  { name: 'Notre Dame', primary: '#0c2340', secondary: '#c99700' },
  { name: 'Ohio', primary: '#00694e', secondary: '#ffffff' },
  { name: 'Ohio State', primary: '#bb0000', secondary: '#666666' },
  { name: 'Oklahoma', primary: '#841617', secondary: '#ffffff' },
  { name: 'Oklahoma State', primary: '#ff7300', secondary: '#000000' },
  { name: 'Old Dominion', primary: '#003057', secondary: '#a1d0f5' },
  { name: 'Oregon', primary: '#154733', secondary: '#fee123' },
  { name: 'Oregon State', primary: '#dc4405', secondary: '#000000' },
  { name: 'Penn State', primary: '#041e42', secondary: '#ffffff' },
  { name: 'Pittsburgh', primary: '#003594', secondary: '#ffb81c' },
  { name: 'Purdue', primary: '#ceb888', secondary: '#000000' },
  { name: 'Rice', primary: '#00205b', secondary: '#c1c6c8' },
  { name: 'Rutgers', primary: '#cc0033', secondary: '#000000' },
  { name: 'Sam Houston', primary: '#f26522', secondary: '#04263b' },
  { name: 'San Diego State', primary: '#a6192e', secondary: '#000000' },
  { name: 'San Jose State', primary: '#0055a2', secondary: '#e5a823' },
  { name: 'SMU', primary: '#c8102e', secondary: '#354ca1' },
  { name: 'South Alabama', primary: '#00205b', secondary: '#c41230' },
  { name: 'South Carolina', primary: '#73000a', secondary: '#000000' },
  { name: 'South Florida', primary: '#006747', secondary: '#cfc493' },
  { name: 'Southern Miss', primary: '#000000', secondary: '#fdbb30' },
  { name: 'Stanford', primary: '#8c1515', secondary: '#ffffff' },
  { name: 'Syracuse', primary: '#d44500', secondary: '#000e54' },
  { name: 'TCU', primary: '#4d1979', secondary: '#a3a9ac' },
  { name: 'Temple', primary: '#9d2235', secondary: '#a7a9ac' },
  { name: 'Tennessee', primary: '#ff8200', secondary: '#58595b' },
  { name: 'Texas', primary: '#bf5700', secondary: '#ffffff' },
  { name: 'Texas A&M', primary: '#500000', secondary: '#ffffff' },
  { name: 'Texas State', primary: '#501214', secondary: '#a7a9ac' },
  { name: 'Texas Tech', primary: '#cc0000', secondary: '#000000' },
  { name: 'Toledo', primary: '#003e7e', secondary: '#ffc72c' },
  { name: 'Troy', primary: '#8b2332', secondary: '#a7a9ac' },
  { name: 'Tulane', primary: '#006747', secondary: '#4ba3dd' },
  { name: 'Tulsa', primary: '#002d72', secondary: '#c8102e' },
  { name: 'UAB', primary: '#1e6b52', secondary: '#ffc72c' },
  { name: 'UCF', primary: '#000000', secondary: '#bf9d5e' },
  { name: 'UCLA', primary: '#2d68c4', secondary: '#f2a900' },
  { name: 'ULM', primary: '#8a1f2e', secondary: '#a2aaad' },
  { name: 'UMass', primary: '#881c1c', secondary: '#000000' },
  { name: 'UNLV', primary: '#cf0a2c', secondary: '#000000' },
  { name: 'USC', primary: '#990000', secondary: '#ffc72c' },
  { name: 'UTEP', primary: '#ff8200', secondary: '#041e42' },
  { name: 'UTSA', primary: '#0c2340', secondary: '#f15a22' },
  { name: 'Utah', primary: '#be0000', secondary: '#000000' },
  { name: 'Utah State', primary: '#0f2439', secondary: '#a3a9ac' },
  { name: 'Vanderbilt', primary: '#866d4b', secondary: '#000000' },
  { name: 'Virginia', primary: '#232d4b', secondary: '#e57200' },
  { name: 'Virginia Tech', primary: '#630031', secondary: '#cf4420' },
  { name: 'Wake Forest', primary: '#9e7e38', secondary: '#000000' },
  { name: 'Washington', primary: '#4b2e83', secondary: '#b7a57a' },
  { name: 'Washington State', primary: '#981e32', secondary: '#5e6a71' },
  { name: 'West Virginia', primary: '#002855', secondary: '#eaaa00' },
  { name: 'Western Kentucky', primary: '#c8102e', secondary: '#000000' },
  { name: 'Western Michigan', primary: '#6c4023', secondary: '#a49665' },
  { name: 'Wisconsin', primary: '#c5050c', secondary: '#000000' },
  { name: 'Wyoming', primary: '#492f24', secondary: '#ffc425' },
];

const norm = (s: string) => s.toLowerCase().trim();

export function searchTeams(query: string, limit = 8): Team[] {
  const q = norm(query);
  if (!q) return [];
  const starts = TEAMS.filter((t) => norm(t.name).startsWith(q));
  const contains = TEAMS.filter((t) => !norm(t.name).startsWith(q) && norm(t.name).includes(q));
  return [...starts, ...contains].slice(0, limit);
}

export function teamByName(name: string): Team | undefined {
  return TEAMS.find((t) => norm(t.name) === norm(name));
}

// Lighten a hex color toward white until it's readable as text/line color
// on a near-black surface. Most school colors are fine as-is; this only
// kicks in for very dark primaries (navy, black, etc).
export function accentFor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#d14747';
  let r = parseInt(m[1].slice(0, 2), 16);
  let g = parseInt(m[1].slice(2, 4), 16);
  let b = parseInt(m[1].slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.32) {
    const t = 0.55; // blend toward white
    r = Math.round(r + (255 - r) * t);
    g = Math.round(g + (255 - g) * t);
    b = Math.round(b + (255 - b) * t);
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Position -> selectable archetypes, matching the game's archetype system.
export const ARCHETYPES_BY_POSITION: Record<string, string[]> = {
  QB: ['Field General', 'Strong Arm', 'Backfield Creator', 'Dual Threat', 'Pure Runner'],
  RB: ['Elusive Bruiser', 'Contact Seeker', 'East/West Playmaker', 'Backfield Boss'],
  FB: ['Blocking', 'Utility'],
  WR: ['Elusive Route Runner', 'Physical Route Runner', 'Gadget', 'Gritty Possession Route Runner', 'Speedster', 'Contested Specialist'],
  TE: ['Vertical Threat', 'Physical Route Runner', 'Possession Route Runner', 'Blocking'],
  OT: ['Pass Protector', 'Raw Strength', 'Agile'],
  LT: ['Pass Protector', 'Raw Strength', 'Agile'],
  IOL: ['Pass Protector', 'Raw Strength', 'Agile'],
  EDGE: ['Speed Rusher', 'Power Rusher', 'Contain Specialist'],
  DT: ['Gap Specialist', 'Physical Freak', 'Power Rusher'],
  LB: ['Signal Caller', 'Thumper', 'Coverage Specialist'],
  CB: ['Boundary', 'Bump and Run', 'Field', 'Zone'],
  S: ['Coverage Specialist', 'Hybrid', 'Run Support'],
  K: ['Accurate', 'Power'],
  P: ['Accurate', 'Power'],
  ATH: ['Athlete', 'Utility'],
};
