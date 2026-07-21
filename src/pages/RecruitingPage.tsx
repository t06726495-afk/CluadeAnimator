import { useEffect, useMemo, useState } from 'react';
import { useSeason } from '../App';
import { del, get, post, put } from '../lib/api';
import { POSITIONS, RECRUIT_STATUSES, type DynastyEvent, type PositionNeed, type Recruit } from '../lib/types';
import { ARCHETYPES_BY_POSITION } from '../lib/teams';
import type { AbilityEntry } from '../lib/abilities';
import TeamPicker from '../components/TeamPicker';
import { AbilitiesEditor } from '../components/Abilities';

const emptyForm = {
  name: '', position: 'QB', stars: '4', national_rank: '', position_rank: '', state: '',
  archetype: '', status: 'scouting', competitors: '', hours_spent: '',
};

export default function RecruitingPage() {
  const { season } = useSeason();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [events, setEvents] = useState<DynastyEvent[]>([]);
  const [needs, setNeeds] = useState<PositionNeed[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<number | null>(null);
  const [statusWeek, setStatusWeek] = useState('1');
  const [error, setError] = useState('');
  const [abilities, setAbilities] = useState<AbilityEntry[]>([]);
  const [savingAbilities, setSavingAbilities] = useState(false);

  const reload = () => {
    if (!season) return;
    const q = `season_id=${season.id}`;
    get<Recruit[]>(`/api/recruits?${q}`).then(setRecruits).catch((e) => setError(e.message));
    get<DynastyEvent[]>(`/api/events?${q}`).then(setEvents).catch(() => {});
    get<PositionNeed[]>(`/api/needs?${q}`).then(setNeeds).catch(() => {});
  };
  useEffect(reload, [season]);

  const commits = useMemo(() => recruits.filter((r) => ['committed', 'signed'].includes(r.status)), [recruits]);
  const classByPos = useMemo(() => {
    const map = new Map<string, Recruit[]>();
    for (const r of commits) map.set(r.position, [...(map.get(r.position) ?? []), r]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [commits]);
  const starAvg = commits.length
    ? (commits.reduce((s, r) => s + (r.stars ?? 0), 0) / commits.length).toFixed(2)
    : '—';

  const archetypeOptions = ARCHETYPES_BY_POSITION[form.position] ?? [];

  const setPosition = (position: string) => {
    const options = ARCHETYPES_BY_POSITION[position] ?? [];
    setForm({ ...form, position, archetype: options.includes(form.archetype) ? form.archetype : options[0] ?? '' });
  };

  const submit = async () => {
    try {
      const body = {
        season_id: season?.id, name: form.name, position: form.position,
        stars: form.stars === '' ? null : Number(form.stars),
        national_rank: form.national_rank === '' ? null : Number(form.national_rank),
        position_rank: form.position_rank === '' ? null : Number(form.position_rank),
        state: form.state || null, archetype: form.archetype || null,
        status: form.status, competitors: form.competitors.replace(/,\s*$/, '') || null,
        hours_spent: form.hours_spent === '' ? null : Number(form.hours_spent),
        week: Number(statusWeek),
      };
      if (editing) await put(`/api/recruits/${editing}`, body);
      else await post('/api/recruits', body);
      setForm({ ...emptyForm });
      setEditing(null);
      setAbilities([]);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const editRecruit = (r: Recruit) => {
    setEditing(r.id);
    setForm({
      name: r.name, position: r.position, stars: String(r.stars ?? ''),
      national_rank: String(r.national_rank ?? ''), position_rank: String(r.position_rank ?? ''),
      state: r.state ?? '', archetype: r.archetype ?? '', status: r.status,
      competitors: r.competitors ?? '', hours_spent: String(r.hours_spent ?? ''),
    });
    get<AbilityEntry[]>(`/api/recruits/${r.id}/abilities`).then(setAbilities).catch(() => setAbilities([]));
  };

  const saveAbilities = async () => {
    if (!editing) return;
    setSavingAbilities(true);
    try {
      await put(`/api/recruits/${editing}/abilities`, { abilities });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingAbilities(false);
    }
  };

  const setNeed = async (position: string, target: number) => {
    await put('/api/needs', { season_id: season?.id, position, target_count: target });
    reload();
  };

  const statusBadge = (status: string) => {
    const cls = status === 'committed' || status === 'signed' ? 'win' : status === 'lost' ? 'loss' : status === 'top 5' ? 'gold' : '';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <>
      <h1 className="page-title">Recruiting</h1>
      <p className="page-sub">{season?.name} class — {commits.length} commits · {starAvg}★ average</p>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Needs board</h3>
        <div className="needs-grid">
          {needs.map((n) => {
            const filled = commits.filter((c) => c.position === n.position).length;
            return (
              <div key={n.id} className={`need-cell${filled >= n.target_count ? ' filled' : ''}`}>
                <div className="pos">{n.position}</div>
                <div className="count">
                  {filled}<span className="of"> / {n.target_count}</span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn sm" onClick={() => setNeed(n.position, Math.max(0, n.target_count - 1))}>−</button>
                  <button className="btn sm" onClick={() => setNeed(n.position, n.target_count + 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <select id="new-need-pos" defaultValue="QB">{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select>
          <button
            className="btn sm"
            onClick={() => setNeed((document.getElementById('new-need-pos') as HTMLSelectElement).value, 1)}
          >+ Add position target</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{editing ? 'Edit recruit' : 'Quick add recruit'}</h3>
        <div className="row">
          <label className="field">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field">Pos
            <select value={form.position} onChange={(e) => setPosition(e.target.value)}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="field">Stars
            <select value={form.stars} onChange={(e) => setForm({ ...form, stars: e.target.value })}>{[5, 4, 3, 2, 1].map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field">Natl rank<input type="number" style={{ width: 84 }} value={form.national_rank} onChange={(e) => setForm({ ...form, national_rank: e.target.value })} /></label>
          <label className="field">Pos rank<input type="number" style={{ width: 74 }} value={form.position_rank} onChange={(e) => setForm({ ...form, position_rank: e.target.value })} /></label>
          <label className="field">State<input style={{ width: 60 }} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
          <label className="field">Archetype
            <select value={form.archetype} onChange={(e) => setForm({ ...form, archetype: e.target.value })}>
              {archetypeOptions.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="field">Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{RECRUIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field">Competing schools
            <TeamPicker multi value={form.competitors} onChange={(v) => setForm({ ...form, competitors: v })} placeholder="Start typing..." style={{ width: 200 }} />
          </label>
          <label className="field">Hours<input type="number" style={{ width: 68 }} value={form.hours_spent} onChange={(e) => setForm({ ...form, hours_spent: e.target.value })} /></label>
          <label className="field">Week (for timeline)<input type="number" style={{ width: 60 }} value={statusWeek} onChange={(e) => setStatusWeek(e.target.value)} /></label>
          <button className="btn primary" onClick={submit} disabled={!form.name}>{editing ? 'Save' : 'Add'}</button>
          {editing && <button className="btn" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setAbilities([]); }}>Cancel</button>}
        </div>

        {editing && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Abilities</h3>
              <button className="btn sm primary" onClick={saveAbilities} disabled={savingAbilities}>
                {savingAbilities ? 'Saving…' : 'Save abilities'}
              </button>
            </div>
            <AbilitiesEditor position={form.position} archetype={form.archetype} value={abilities} onChange={setAbilities} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Recruit board ({recruits.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Recruit</th><th>Pos</th><th>Stars</th><th className="num">Natl</th><th className="num">Pos</th>
                <th>State</th><th>Archetype</th><th>Status</th><th>Competing</th><th className="num">Hours</th><th></th>
              </tr>
            </thead>
            <tbody>
              {recruits.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.position}</td>
                  <td><span className="star">{'★'.repeat(r.stars ?? 0)}</span></td>
                  <td className="num">{r.national_rank ?? '—'}</td>
                  <td className="num">{r.position_rank ?? '—'}</td>
                  <td>{r.state ?? ''}</td>
                  <td style={{ color: 'var(--text-2)' }}>{r.archetype ?? ''}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.competitors ?? ''}</td>
                  <td className="num">{r.hours_spent ?? '—'}</td>
                  <td className="num">
                    <button className="btn sm" onClick={() => editRecruit(r)}>Edit</button>{' '}
                    <button className="btn sm danger" onClick={async () => { if (confirm(`Remove ${r.name} from the board?`)) { await del(`/api/recruits/${r.id}`); reload(); } }}>✕</button>
                  </td>
                </tr>
              ))}
              {!recruits.length && <tr><td colSpan={11} style={{ color: 'var(--muted)' }}>No recruits yet — add one above or import a recruiting board screenshot.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Class by position</h3>
          {classByPos.length ? (
            <table>
              <thead><tr><th>Pos</th><th>Commits</th><th className="num">Avg ★</th></tr></thead>
              <tbody>
                {classByPos.map(([posn, list]) => (
                  <tr key={posn}>
                    <td style={{ fontWeight: 700 }}>{posn}</td>
                    <td style={{ color: 'var(--text-2)' }}>{list.map((r) => `${r.stars ?? '?'}★ ${r.name}`).join(', ')}</td>
                    <td className="num">{(list.reduce((s, r) => s + (r.stars ?? 0), 0) / list.length).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No commits yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Timeline — storyline beats</h3>
          <div className="timeline">
            {events.map((ev) => (
              <div className="timeline-item" key={ev.id}>
                <span className="timeline-week">Wk {ev.week}</span>
                <span className={`badge ${ev.type === 'commit' || ev.type === 'signed' ? 'win' : ev.type === 'loss' ? 'loss' : ''}`}>{ev.type}</span>
                <span style={{ flex: 1 }}>{ev.description}</span>
                <button className="btn sm danger" onClick={async () => { await del(`/api/events/${ev.id}`); reload(); }}>✕</button>
              </div>
            ))}
            {!events.length && <p style={{ color: 'var(--muted)' }}>Commits, decommits, and portal moves land here automatically when you change a recruit's status (with a week set).</p>}
          </div>
        </div>
      </div>
    </>
  );
}
