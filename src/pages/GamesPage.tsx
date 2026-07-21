import { useEffect, useState } from 'react';
import { useSeason } from '../App';
import { del, get, post, put } from '../lib/api';
import type { Game } from '../lib/types';
import TeamPicker from '../components/TeamPicker';

const empty = { week: 1, opponent: '', home: true, our_score: '', opp_score: '' };

export default function GamesPage() {
  const { season } = useSeason();
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const reload = () => {
    if (!season) return;
    get<Game[]>(`/api/games?season_id=${season.id}`).then(setGames).catch((e) => setError(e.message));
  };
  useEffect(reload, [season]);

  const submit = async () => {
    try {
      const body = {
        season_id: season?.id,
        week: Number(form.week),
        opponent: form.opponent,
        home: form.home,
        our_score: form.our_score === '' ? null : Number(form.our_score),
        opp_score: form.opp_score === '' ? null : Number(form.opp_score),
      };
      if (editing) await put(`/api/games/${editing}`, body);
      else await post('/api/games', body);
      setForm({ ...empty, week: Number(form.week) + 1 });
      setEditing(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const edit = (g: Game) => {
    setEditing(g.id);
    setForm({
      week: g.week, opponent: g.opponent, home: !!g.home,
      our_score: g.our_score == null ? '' : String(g.our_score),
      opp_score: g.opp_score == null ? '' : String(g.opp_score),
    });
  };

  return (
    <>
      <h1 className="page-title">Games</h1>
      <p className="page-sub">Schedule and results for {season?.name}. Everything is editable after the fact.</p>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{editing ? 'Edit game' : 'Add game'}</h3>
        <div className="row">
          <label className="field">Week
            <input type="number" style={{ width: 70 }} value={form.week} onChange={(e) => setForm({ ...form, week: Number(e.target.value) })} />
          </label>
          <label className="field">Opponent
            <TeamPicker value={form.opponent} onChange={(v) => setForm({ ...form, opponent: v })} placeholder="Notre Dame" style={{ width: 200 }} />
          </label>
          <label className="field">Site
            <select value={form.home ? 'home' : 'away'} onChange={(e) => setForm({ ...form, home: e.target.value === 'home' })}>
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </label>
          <label className="field">Our score
            <input type="number" style={{ width: 80 }} value={form.our_score} onChange={(e) => setForm({ ...form, our_score: e.target.value })} />
          </label>
          <label className="field">Opp score
            <input type="number" style={{ width: 80 }} value={form.opp_score} onChange={(e) => setForm({ ...form, opp_score: e.target.value })} />
          </label>
          <button className="btn primary" onClick={submit} disabled={!form.opponent}>{editing ? 'Save' : 'Add'}</button>
          {editing && <button className="btn" onClick={() => { setEditing(null); setForm({ ...empty }); }}>Cancel</button>}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Week</th><th>Opponent</th><th>Site</th><th className="num">Score</th><th>Result</th><th></th></tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id}>
                <td>{g.week}</td>
                <td style={{ fontWeight: 600 }}>{g.opponent}</td>
                <td style={{ color: 'var(--text-2)' }}>{g.home ? 'Home' : 'Away'}</td>
                <td className="num">{g.our_score != null ? `${g.our_score}–${g.opp_score}` : '—'}</td>
                <td>{g.result ? <span className={`badge ${g.result === 'W' ? 'win' : g.result === 'L' ? 'loss' : ''}`}>{g.result}</span> : <span className="badge">TBD</span>}</td>
                <td className="num">
                  <button className="btn sm" onClick={() => edit(g)}>Edit</button>{' '}
                  <button className="btn sm danger" onClick={async () => { if (confirm(`Delete week ${g.week} vs ${g.opponent}?`)) { await del(`/api/games/${g.id}`); reload(); } }}>✕</button>
                </td>
              </tr>
            ))}
            {!games.length && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>No games yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
