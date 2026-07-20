import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, post, put } from '../lib/api';
import { POSITIONS, type Player } from '../lib/types';
import { useSeason } from '../App';

const empty = { name: '', position: 'QB', class_year: 'FR', archetype: '', dev_trait: '', jersey: '' };

export default function PlayersPage() {
  const { season, reload: reloadSeasons } = useSeason();
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const reload = () => get<Player[]>('/api/players').then(setPlayers).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, []);

  const submit = async () => {
    try {
      const body = {
        name: form.name, position: form.position, class_year: form.class_year,
        archetype: form.archetype || null, dev_trait: form.dev_trait || null,
        jersey: form.jersey === '' ? null : Number(form.jersey), active: true,
      };
      if (editing) await put(`/api/players/${editing}`, body);
      else await post('/api/players', body);
      setForm({ ...empty });
      setEditing(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const rollover = async () => {
    if (!season) return;
    const seniors = players.filter((p) => p.class_year === 'SR');
    const names = seniors.map((s) => s.name).join(', ') || 'none';
    if (!confirm(
      `Roll over ${season.name}?\n\nThis archives the season, bumps every class year, promotes committed/signed recruits to freshmen, and graduates these seniors:\n${names}`
    )) return;
    await post(`/api/seasons/${season.id}/rollover`, { graduate_player_ids: seniors.map((s) => s.id) });
    reloadSeasons();
    reload();
  };

  return (
    <>
      <h1 className="page-title">Players</h1>
      <p className="page-sub">Roster — click a name for game-by-game stats and development.</p>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{editing ? 'Edit player' : 'Add player'}</h3>
        <div className="row">
          <label className="field">Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">Pos
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="field">Class
            <select value={form.class_year} onChange={(e) => setForm({ ...form, class_year: e.target.value })}>
              {['FR', 'SO', 'JR', 'SR'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">Archetype
            <input value={form.archetype} onChange={(e) => setForm({ ...form, archetype: e.target.value })} />
          </label>
          <label className="field">Dev trait
            <input value={form.dev_trait} onChange={(e) => setForm({ ...form, dev_trait: e.target.value })} placeholder="Star / Impact / Normal" />
          </label>
          <label className="field">#
            <input type="number" style={{ width: 60 }} value={form.jersey} onChange={(e) => setForm({ ...form, jersey: e.target.value })} />
          </label>
          <button className="btn primary" onClick={submit} disabled={!form.name}>{editing ? 'Save' : 'Add'}</button>
          {editing && <button className="btn" onClick={() => { setEditing(null); setForm({ ...empty }); }}>Cancel</button>}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Active roster ({players.length})</h3>
          <button className="btn" onClick={rollover}>Offseason rollover…</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Pos</th><th>Class</th><th>Archetype</th><th>Dev</th><th></th></tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--muted)' }}>{p.jersey ?? ''}</td>
                <td><Link to={`/players/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</Link></td>
                <td>{p.position}</td>
                <td>{p.class_year}</td>
                <td style={{ color: 'var(--text-2)' }}>{p.archetype}</td>
                <td>{p.dev_trait && <span className={`badge${p.dev_trait === 'Star' ? ' gold' : ''}`}>{p.dev_trait}</span>}</td>
                <td className="num">
                  <button
                    className="btn sm"
                    onClick={() => {
                      setEditing(p.id);
                      setForm({
                        name: p.name, position: p.position, class_year: p.class_year,
                        archetype: p.archetype ?? '', dev_trait: p.dev_trait ?? '',
                        jersey: p.jersey == null ? '' : String(p.jersey),
                      });
                    }}
                  >Edit</button>{' '}
                  <button className="btn sm danger" onClick={async () => { if (confirm(`Delete ${p.name}? Their stats go too.`)) { await del(`/api/players/${p.id}`); reload(); } }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
