import { useState } from 'react';
import {
  abilitiesForArchetype, MAX_MENTAL_ABILITIES, MENTAL_ABILITIES, TIER_COLORS, TIER_LABELS, TIERS,
  type AbilityEntry, type Tier,
} from '../lib/abilities';

function Dot({ tier }: { tier: Tier }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[tier], marginRight: 7, flexShrink: 0 }} />;
}

// Read-only display: two columns (Physical / Mental), each a colored tier
// dot + ability name — no game icon assets, so the dot carries the tier.
export function AbilityBadges({ abilities }: { abilities: AbilityEntry[] }) {
  const physical = abilities.filter((a) => a.category === 'physical');
  const mental = abilities.filter((a) => a.category === 'mental');
  if (!physical.length && !mental.length) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>No abilities set yet.</p>;
  }
  const Column = ({ title, items }: { title: string; items: AbilityEntry[] }) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6 }}>
        {title}
      </div>
      {items.length ? (
        items.map((a) => (
          <div key={a.name} style={{ display: 'flex', alignItems: 'center', fontSize: 13, padding: '3px 0' }}>
            <Dot tier={a.tier} /> {a.name}
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>—</div>
      )}
    </div>
  );
  return (
    <div className="row" style={{ gap: 40, alignItems: 'flex-start' }}>
      <Column title="Physical" items={physical} />
      <Column title="Mental" items={mental} />
    </div>
  );
}

type EditorProps = {
  position: string;
  archetype: string | null;
  value: AbilityEntry[];
  onChange: (next: AbilityEntry[]) => void;
};

// Physical abilities are a fixed set determined by archetype — the editor
// only lets you assign a tier per ability (or "-" to unset it). Mental
// abilities are freely chosen from the shared pool, capped at 3.
export function AbilitiesEditor({ position, archetype, value, onChange }: EditorProps) {
  const [addingMental, setAddingMental] = useState('');
  const physicalNames = archetype ? abilitiesForArchetype(position, archetype) : [];
  const mental = value.filter((a) => a.category === 'mental');
  const availableMental = MENTAL_ABILITIES.filter((m) => !mental.some((a) => a.name === m));

  const setPhysicalTier = (name: string, tier: Tier | '') => {
    const rest = value.filter((a) => !(a.category === 'physical' && a.name === name));
    onChange(tier ? [...rest, { name, category: 'physical', tier }] : rest);
  };
  const setMentalTier = (name: string, tier: Tier) => {
    onChange(value.map((a) => (a.category === 'mental' && a.name === name ? { ...a, tier } : a)));
  };
  const addMental = () => {
    if (!addingMental || mental.length >= MAX_MENTAL_ABILITIES) return;
    onChange([...value, { name: addingMental, category: 'mental', tier: 'bronze' }]);
    setAddingMental('');
  };
  const removeMental = (name: string) => onChange(value.filter((a) => !(a.category === 'mental' && a.name === name)));

  return (
    <div className="row" style={{ gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6 }}>
          Physical {archetype ? `(${archetype})` : ''}
        </div>
        {physicalNames.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>No archetype selected yet.</div>}
        {physicalNames.map((name) => {
          const current = value.find((a) => a.category === 'physical' && a.name === name)?.tier ?? '';
          return (
            <div key={name} className="row" style={{ gap: 8, padding: '3px 0' }}>
              <span style={{ fontSize: 13, minWidth: 150 }}>{name}</span>
              <select value={current} onChange={(e) => setPhysicalTier(name, e.target.value as Tier | '')} style={{ padding: '3px 6px', fontSize: 12 }}>
                <option value="">—</option>
                {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6 }}>
          Mental ({mental.length}/{MAX_MENTAL_ABILITIES})
        </div>
        {mental.map((a) => (
          <div key={a.name} className="row" style={{ gap: 8, padding: '3px 0' }}>
            <span style={{ fontSize: 13, minWidth: 110 }}>{a.name}</span>
            <select value={a.tier} onChange={(e) => setMentalTier(a.name, e.target.value as Tier)} style={{ padding: '3px 6px', fontSize: 12 }}>
              {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
            <button className="btn sm danger" onClick={() => removeMental(a.name)}>✕</button>
          </div>
        ))}
        {mental.length < MAX_MENTAL_ABILITIES && (
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            <select value={addingMental} onChange={(e) => setAddingMental(e.target.value)} style={{ padding: '3px 6px', fontSize: 12 }}>
              <option value="">Add mental ability…</option>
              {availableMental.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn sm" onClick={addMental} disabled={!addingMental}>Add</button>
          </div>
        )}
      </div>
    </div>
  );
}
