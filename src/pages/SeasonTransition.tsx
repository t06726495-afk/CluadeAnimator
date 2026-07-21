import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../App';
import { get, post } from '../lib/api';
import { classYearLabel, type Player } from '../lib/types';
import TeamPicker from '../components/TeamPicker';

type ScheduleRow = { week: number; opponent: string; home: boolean };
const blankRow = (week: number): ScheduleRow => ({ week, opponent: '', home: true });

export default function SeasonTransition() {
  const { season, reload } = useSeason();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [returning, setReturning] = useState<Record<number, boolean>>({});
  const [rows, setRows] = useState<ScheduleRow[]>(Array.from({ length: 12 }, (_, i) => blankRow(i + 1)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newSeasonId, setNewSeasonId] = useState<number | null>(null);

  useEffect(() => {
    get<Player[]>('/api/players').then((list) => {
      setPlayers(list);
      const init: Record<number, boolean> = {};
      for (const p of list) init[p.id] = p.class_year !== 'SR';
      setReturning(init);
    });
  }, []);

  const updateRow = (i: number, patch: Partial<ScheduleRow>) =>
    setRows((prev) => prev.map((r, ri) => (ri === i ? { ...r, ...patch } : r)));

  const confirmRoster = async () => {
    if (!season) return;
    setSaving(true);
    setError('');
    try {
      const departed = players.filter((p) => !returning[p.id]).map((p) => p.id);
      const out = await post<{ newSeasonId: number }>(`/api/seasons/${season.id}/rollover`, { departed_player_ids: departed });
      setNewSeasonId(out.newSeasonId);
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!newSeasonId) return;
    setSaving(true);
    setError('');
    try {
      await post('/api/games/bulk', { season_id: newSeasonId, games: rows.filter((r) => r.opponent.trim()) });
      reload();
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const returningCount = Object.values(returning).filter(Boolean).length;

  return (
    <>
      <h1 className="page-title">Next Season</h1>
      <p className="page-sub">
        Closing out {season?.name}. {step === 1 ? 'Confirm who returns for next year.' : `Set up the ${season ? season.year + 1 : ''} schedule.`}
      </p>

      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      {step === 1 && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Who stayed? ({returningCount} of {players.length} returning)</h3>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn sm" onClick={() => setReturning(Object.fromEntries(players.map((p) => [p.id, true])))}>All stay</button>
              <button className="btn sm" onClick={() => setReturning(Object.fromEntries(players.map((p) => [p.id, false])))}>None stay</button>
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: -4 }}>
            Seniors are unchecked by default (graduating). Uncheck anyone else who transferred out or left early for the draft — everyone else gets bumped up a class year.
          </p>
          <div className="roster-review-list">
            {players.map((p) => (
              <label key={p.id} className={`roster-review-row${returning[p.id] ? '' : ' leaving'}`}>
                <input
                  type="checkbox"
                  checked={!!returning[p.id]}
                  onChange={(e) => setReturning({ ...returning, [p.id]: e.target.checked })}
                />
                <span style={{ width: 30, color: 'var(--muted)' }}>{p.position}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span className="badge">{classYearLabel(p)}</span>
              </label>
            ))}
            {!players.length && <p style={{ padding: 12, color: 'var(--muted)' }}>No active players on the roster.</p>}
          </div>
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => navigate('/')}>Cancel</button>
            <button className="btn primary" disabled={saving} onClick={confirmRoster}>
              {saving ? 'Rolling over…' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>{season ? season.year + 1 : ''} schedule</h3>
          {rows.map((r, i) => (
            <div className="schedule-builder-row" key={i}>
              <input type="number" value={r.week} onChange={(e) => updateRow(i, { week: Number(e.target.value) })} />
              <TeamPicker value={r.opponent} onChange={(v) => updateRow(i, { opponent: v })} placeholder="Opponent" />
              <select value={r.home ? 'home' : 'away'} onChange={(e) => updateRow(i, { home: e.target.value === 'home' })}>
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>Wk {r.week}</span>
              <button className="btn sm danger" onClick={() => setRows((prev) => prev.filter((_, ri) => ri !== i))}>✕</button>
            </div>
          ))}
          <button className="btn sm" onClick={() => setRows((prev) => [...prev, blankRow(prev.length + 1)])}>+ Add week</button>
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn primary" disabled={saving} onClick={finish}>
              {saving ? 'Finishing…' : `Start ${season ? season.year + 1 : 'next'} season`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
