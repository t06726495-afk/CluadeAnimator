import { useState } from 'react';
import TeamPicker from '../components/TeamPicker';
import { post } from '../lib/api';
import { teamByName } from '../lib/teams';

type ScheduleRow = { week: number; opponent: string; home: boolean };

const blankRow = (week: number): ScheduleRow => ({ week, opponent: '', home: true });

export default function StartDynasty({ onStarted }: { onStarted: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamName, setTeamName] = useState('');
  const [rows, setRows] = useState<ScheduleRow[]>(Array.from({ length: 12 }, (_, i) => blankRow(i + 1)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const picked = teamByName(teamName);

  const updateRow = (i: number, patch: Partial<ScheduleRow>) =>
    setRows((prev) => prev.map((r, ri) => (ri === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await post('/api/dynasty', {
        team_name: picked!.name,
        primary_color: picked!.primary,
        secondary_color: picked!.secondary,
        schedule: rows.filter((r) => r.opponent.trim()),
      });
      onStarted();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="start-logo">DYNASTY<span>TRACKER</span></div>
        <div className="start-sub">A broadcast-quality companion for your CFB 27 dynasty</div>
        <div className="step-dots">
          <span className={`step-dot${step === 1 ? ' active' : ''}`} />
          <span className={`step-dot${step === 2 ? ' active' : ''}`} />
        </div>

        {step === 1 && (
          <div className="card">
            <h3>Start Season — who are you playing as?</h3>
            <label className="field">
              Team
              <TeamPicker value={teamName} onChange={setTeamName} placeholder="Start typing... e.g. Notre Dame" />
            </label>
            {picked && (
              <div className="picked-team-banner" style={{ borderColor: picked.primary }}>
                <span className="team-swatch" style={{ background: picked.primary }} />
                <span className="team-swatch" style={{ background: picked.secondary }} />
                <strong>{picked.name}</strong>
                <span style={{ color: 'var(--muted)' }}>— this becomes your dashboard's accent color</span>
              </div>
            )}
            <div className="row" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn primary" disabled={!picked} onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h3>Lay in your {picked?.name} schedule for 2026</h3>
            <p style={{ color: 'var(--text-2)', marginTop: -4, fontSize: 12 }}>
              Enter every opponent up front — leave a row blank to skip it. You can always add or edit games later.
            </p>
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

            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <div className="row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
              <button className="btn" onClick={() => setStep(1)}>← Back</button>
              <button className="btn primary" disabled={saving} onClick={submit}>
                {saving ? 'Starting…' : 'Start Season'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
