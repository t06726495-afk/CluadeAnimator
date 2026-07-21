import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { get, put } from '../lib/api';
import type { Player, PlayerGameStat, RatingSnapshot } from '../lib/types';
import type { AbilityEntry } from '../lib/abilities';
import { SeriesChart } from '../components/charts';
import { AbilitiesEditor, AbilityBadges } from '../components/Abilities';

type Detail = { player: Player; stats: PlayerGameStat[]; ratings: RatingSnapshot[]; abilities: AbilityEntry[] };

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [editingCell, setEditingCell] = useState<{ statId: number; key: string } | null>(null);
  const [editingAbilities, setEditingAbilities] = useState(false);
  const [abilityDraft, setAbilityDraft] = useState<AbilityEntry[]>([]);
  const [savingAbilities, setSavingAbilities] = useState(false);

  const reload = () => get<Detail>(`/api/players/${id}/detail`).then(setDetail).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, [id]);

  const byCategory = useMemo(() => {
    const map = new Map<string, PlayerGameStat[]>();
    for (const s of detail?.stats ?? []) {
      map.set(s.stat_category, [...(map.get(s.stat_category) ?? []), s]);
    }
    return map;
  }, [detail]);

  if (error) return <div className="error-box">{error}</div>;
  if (!detail) return <p className="page-sub">Loading…</p>;
  const { player, ratings } = detail;

  // Growth badges: compare latest snapshot's attributes to the earliest.
  const growth: Array<{ name: string; delta: number }> = [];
  if (ratings.length >= 2) {
    const first = ratings[0];
    const last = ratings[ratings.length - 1];
    for (const [name, value] of Object.entries(last.attributes)) {
      const before = first.attributes[name];
      if (typeof before === 'number' && value > before) growth.push({ name, delta: value - before });
    }
    growth.sort((a, b) => b.delta - a.delta);
  }
  const ovrDelta =
    ratings.length >= 2 && ratings[0].overall != null && ratings[ratings.length - 1].overall != null
      ? ratings[ratings.length - 1].overall! - ratings[0].overall!
      : null;

  const saveCell = async (stat: PlayerGameStat, key: string, raw: string) => {
    const value = raw === '' ? null : Number.isNaN(Number(raw)) ? raw : Number(raw);
    const next = { ...stat.stats, [key]: value };
    await put(`/api/player-stats/${stat.id}`, { stats: next });
    setEditingCell(null);
    reload();
  };

  const startEditingAbilities = () => {
    setAbilityDraft(detail.abilities);
    setEditingAbilities(true);
  };
  const saveAbilities = async () => {
    setSavingAbilities(true);
    try {
      await put(`/api/players/${player.id}/abilities`, { abilities: abilityDraft });
      setEditingAbilities(false);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingAbilities(false);
    }
  };

  const sumNumeric = (rows: PlayerGameStat[], key: string) => {
    let total = 0;
    let any = false;
    for (const r of rows) {
      const v = r.stats[key];
      if (typeof v === 'number') { total += v; any = true; }
    }
    return any ? total : null;
  };

  return (
    <>
      <p style={{ marginBottom: 8 }}><Link to="/players" style={{ color: 'var(--muted)' }}>← Players</Link></p>
      <h1 className="page-title">
        {player.jersey != null && <span style={{ color: 'var(--muted)' }}>#{player.jersey} </span>}
        {player.name}
      </h1>
      <p className="page-sub">
        {player.position} · {player.class_year}
        {player.archetype ? ` · ${player.archetype}` : ''}
        {player.dev_trait ? ` · ${player.dev_trait} dev` : ''}
      </p>

      {ratings.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Overall rating over time</h3>
            {ovrDelta != null && ovrDelta > 0 && <span className="badge win">+{ovrDelta} OVR since {ratings[0]?.season_year ?? ''}</span>}
          </div>
          <SeriesChart
            data={ratings.map((r) => ({ year: r.season_year ?? r.season_id, overall: r.overall }))}
            xKey="year" yKey="overall" name="Overall" height={200}
            yDomain={['dataMin - 2', 'dataMax + 2']} xLabel="Year"
          />
          {growth.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {growth.slice(0, 8).map((g) => (
                <span key={g.name} className="growth-badge">+{g.delta} {g.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Abilities</h3>
          {!editingAbilities && <button className="btn sm" onClick={startEditingAbilities}>Edit</button>}
        </div>
        {editingAbilities ? (
          <>
            <AbilitiesEditor position={player.position} archetype={player.archetype} value={abilityDraft} onChange={setAbilityDraft} />
            <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditingAbilities(false)}>Cancel</button>
              <button className="btn primary" onClick={saveAbilities} disabled={savingAbilities}>
                {savingAbilities ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <AbilityBadges abilities={detail.abilities} />
        )}
      </div>

      {[...byCategory.entries()].map(([category, rows]) => {
        const keys = [...new Set(rows.flatMap((r) => Object.keys(r.stats)))];
        return (
          <div className="card" key={category} style={{ marginBottom: 16 }}>
            <h3>{category} — game by game <span style={{ textTransform: 'none', fontWeight: 400 }}>(click a value to edit)</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Game</th>
                    {keys.map((k) => <th key={k} className="num">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>W{r.week} {r.result === 'W' ? 'def.' : r.result === 'L' ? 'lost to' : 'vs'} {r.opponent}</td>
                      {keys.map((k) => {
                        const isEditing = editingCell?.statId === r.id && editingCell.key === k;
                        const v = r.stats[k];
                        return (
                          <td key={k} className="num" onClick={() => !isEditing && setEditingCell({ statId: r.id, key: k })} style={{ cursor: 'pointer' }}>
                            {isEditing ? (
                              <input
                                className="cell-input" autoFocus defaultValue={v == null ? '' : String(v)}
                                onBlur={(e) => saveCell(r, k, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingCell(null); }}
                                style={{ maxWidth: 76 }}
                              />
                            ) : v == null ? '—' : String(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}>
                    <td>Season totals</td>
                    {keys.map((k) => {
                      const total = sumNumeric(rows, k);
                      return <td key={k} className="num">{total ?? '—'}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {byCategory.size === 0 && (
        <div className="note-box">No game stats yet for {player.name}. Import a player-stats screenshot or add them from a game.</div>
      )}
    </>
  );
}
