// npm run reset — deletes the local database file so the next `npm run dev`
// starts from a genuinely blank slate (the Start Season screen). Prefer the
// in-app "Reset dynasty..." button in the sidebar; this is the terminal
// fallback for when that's not convenient (or the app won't load).
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
let removed = 0;
for (const file of ['dynasty.db', 'dynasty.db-wal', 'dynasty.db-shm']) {
  const p = path.join(DATA_DIR, file);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    removed++;
  }
}

console.log(removed ? 'Database reset — run npm run dev for a blank slate.' : 'No database found — already blank.');
