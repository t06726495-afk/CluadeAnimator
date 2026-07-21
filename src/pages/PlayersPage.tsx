import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, post, put } from '../lib/api';
import { POSITIONS, classYearLabel, type Player } from '../lib/types';
import { ARCHETYPES_BY_POSITION } from '../lib/teams';

const empty = { name: '', position: 'QB', class_year: 'FR', archetype: '', dev_trait: '', jersey: '', redshirt: false };

export default function PlayersPage() {
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
        jersey: form.jersey === '' ? null : Number(form.jersey), active: true, redshirt: form.redshirt,
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

  const archetypeOptions = ARCHETYPES_BY_POSITION[form.position] ?? [];
  const setPosition = (position: string) => {
    const options = ARCHETYPES_BY_POSITION[position] ?? [];
    setForm({ ...form, position, archetype: options.includes(form.archetype) ? form.archetype : options[0] ?? '' });
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
            <select value={form.position} onChange={(e) => setPosition(e.target.value)}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="field">Class
            <select value={form.class_year} onChange={(e) => setForm({ ...form, class_year: e.target.value })}>
              {['FR', 'SO', 'JR', 'SR'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 }}>
            <input type="checkbox" checked={form.redshirt} onChange={(e) => setForm({ ...form, redshirt: e.target.checked })} />
            Redshirt
          </label>
          <label className="field">Archetype
            <select value={form.archetype} onChange={(e) => setForm({ ...form, archetype: e.target.value })}>
              {archetypeOptions.map((a) => <option key={a}>{a}</option>)}
            </select>
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
        <h3>Active roster ({players.length})</h3>
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
                <td>{classYearLabel(p)}</td>
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
                        jersey: p.jersey == null ? '' : String(p.jersey), redshirt: !!p.redshirt,
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
