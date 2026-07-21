import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../lib/api';
import { bestMatch } from '../lib/fuzzy';
import { POSITIONS, SCREEN_TYPE_LABELS, type Game, type ImportRow, type Player, type Recruit } from '../lib/types';

// One resolution entry per extracted player/recruit name.
type Resolution =
  | { kind: 'matched'; id: number; label: string }
  | { kind: 'suggest'; id: number; label: string }
  | { kind: 'new'; position: string };

const CATEGORY_DEFAULT_POS: Record<string, string> = {
  passing: 'QB', rushing: 'RB', receiving: 'WR', defense: 'LB', kicking: 'K', punting: 'P', returns: 'WR', other: 'ATH',
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function parseCell(raw: string): number | string | null {
  if (raw.trim() === '') return null;
  const n = Number(raw.replace(/,/g, ''));
  return Number.isNaN(n) ? raw : n;
}

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imp, setImp] = useState<ImportRow | null>(null);
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [ourTeamIdx, setOurTeamIdx] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const load = async () => {
    const row = await get<ImportRow>(`/api/imports/${id}`);
    setImp(row);
    const parsed = row.raw_extraction ? JSON.parse(row.raw_extraction) : null;
    // Standings: pre-fill "our" line from a row that looks like our team.
    if (parsed && row.screen_type === 'standings' && parsed.our_conf_rank === undefined) {
      const mine = parsed.rows?.find((r: any) => /stanford/i.test(r.team ?? ''));
      parsed.our_conf_rank = parsed.kind === 'conference' ? mine?.rank ?? null : null;
      parsed.our_poll_rank = parsed.kind === 'poll' ? mine?.rank ?? null : null;
      parsed.our_conf_record = mine?.conf_record ?? null;
      parsed.our_overall_record = mine?.overall_record ?? null;
    }
    setData(parsed);
    if (row.season_id) {
      get<Game[]>(`/api/games?season_id=${row.season_id}`).then(setGames).catch(() => {});
      get<Recruit[]>(`/api/recruits?season_id=${row.season_id}`).then(setRecruits).catch(() => {});
    }
    get<Player[]>('/api/players').then(setPlayers).catch(() => {});
  };
  useEffect(() => { load().catch((e) => setError(e.message)); }, [id]);

  // Seed fuzzy-match resolutions once data + rosters are loaded.
  useEffect(() => {
    if (!data || !imp?.screen_type) return;
    const next: Record<string, Resolution> = {};
    const resolveName = (key: string, name: string, category: string, pool: Array<{ id: number; name: string }>) => {
      const match = bestMatch(name, pool);
      if (match?.kind === 'exact') next[key] = { kind: 'matched', id: match.item.id, label: match.item.name };
      else if (match?.kind === 'close') next[key] = { kind: 'suggest', id: match.item.id, label: match.item.name };
      else next[key] = { kind: 'new', position: CATEGORY_DEFAULT_POS[category] ?? 'ATH' };
    };
    if (imp.screen_type === 'player_game_stats' && players.length) {
      data.tables?.forEach((t: any, ti: number) =>
        t.rows?.forEach((r: any, ri: number) => resolveName(`${ti}:${ri}`, r.player, t.category, players))
      );
    } else if (imp.screen_type === 'player_ratings' && players.length) {
      data.rows?.forEach((r: any, ri: number) => resolveName(`0:${ri}`, r.player, r.position ?? 'other', players));
    } else if ((imp.screen_type === 'recruiting_board' || imp.screen_type === 'recruit_profile') && data) {
      const rows = imp.screen_type === 'recruit_profile' ? [data] : data.rows ?? [];
      rows.forEach((r: any, ri: number) => resolveName(`0:${ri}`, r.name, r.position ?? 'other', recruits));
    }
    setResolutions(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data == null, players.length, recruits.length, imp?.screen_type]);

  const mostlyNull = useMemo(() => {
    if (!data) return false;
    const values: unknown[] = [];
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      else values.push(v);
    };
    walk(data);
    const nulls = values.filter((v) => v == null).length;
    return values.length > 8 && nulls / values.length > 0.55;
  }, [data]);

  if (error && !imp) return <div className="error-box">{error}</div>;
  if (!imp) return <p className="page-sub">Loading…</p>;

  const updateBinding = async (patch: Partial<Pick<ImportRow, 'season_id' | 'week' | 'game_id'>>) => {
    const next = await put<ImportRow>(`/api/imports/${imp.id}`, {
      season_id: patch.season_id ?? imp.season_id,
      week: patch.week !== undefined ? patch.week : imp.week,
      game_id: patch.game_id !== undefined ? patch.game_id : imp.game_id,
    });
    setImp(next);
  };

  const reprocessAs = async (screenType: string) => {
    setReprocessing(true);
    setError('');
    try {
      await post(`/api/imports/${imp.id}/process`, { screen_type: screenType });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReprocessing(false);
    }
  };

  const playerRef = (key: string) => {
    const r = resolutions[key];
    if (!r) return { new_player: { name: 'Unknown', position: 'ATH' } };
    if (r.kind === 'matched' || r.kind === 'suggest') return { player_id: r.id };
    return null; // caller supplies new_player with the extracted name
  };

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      let payload: any = {};
      switch (imp.screen_type) {
        case 'box_score': {
          const us = data.teams[ourTeamIdx];
          const them = data.teams[1 - ourTeamIdx];
          const team_stats: Record<string, unknown> = {};
          for (const s of data.stats ?? []) {
            if (!s.label) continue;
            const key = slug(s.label);
            team_stats[`our_${key}`] = s.values[ourTeamIdx];
            team_stats[`opp_${key}`] = s.values[1 - ourTeamIdx];
          }
          payload = { our_score: us.score, opp_score: them.score, team_stats };
          break;
        }
        case 'player_game_stats': {
          const rows: any[] = [];
          data.tables.forEach((t: any, ti: number) =>
            t.rows.forEach((r: any, ri: number) => {
              const key = `${ti}:${ri}`;
              const res = resolutions[key];
              const stats: Record<string, unknown> = {};
              t.columns.forEach((c: string, ci: number) => { stats[c] = r.values[ci] ?? null; });
              const ref = playerRef(key) ?? {
                new_player: { name: r.player, position: (res as any)?.position ?? CATEGORY_DEFAULT_POS[t.category] ?? 'ATH' },
              };
              rows.push({ ...ref, category: t.category, stats });
            })
          );
          payload = { rows };
          break;
        }
        case 'standings': {
          payload = {
            conf_rank: data.our_conf_rank ?? null,
            poll_rank: data.our_poll_rank ?? null,
            conf_record: data.our_conf_record ?? null,
            overall_record: data.our_overall_record ?? null,
            raw: { kind: data.kind, rows: data.rows },
          };
          break;
        }
        case 'schedule':
          payload = { rows: data.rows };
          break;
        case 'player_ratings': {
          const rows = data.rows.map((r: any, ri: number) => {
            const key = `0:${ri}`;
            const res = resolutions[key];
            const attributes: Record<string, number> = {};
            for (const a of r.attributes ?? []) if (a.name && a.value != null) attributes[a.name] = a.value;
            const ref = playerRef(key) ?? {
              new_player: { name: r.player, position: (res as any)?.position ?? r.position ?? 'ATH', class_year: r.class_year ?? 'FR' },
            };
            return { ...ref, overall: r.overall, attributes };
          });
          payload = { rows };
          break;
        }
        case 'recruiting_board':
        case 'recruit_profile': {
          const source = imp.screen_type === 'recruit_profile' ? [data] : data.rows;
          const rows = source.map((r: any, ri: number) => {
            const res = resolutions[`0:${ri}`];
            return {
              recruit_id: res && res.kind !== 'new' ? res.id : undefined,
              name: r.name, position: r.position, stars: r.stars,
              national_rank: r.national_rank, position_rank: r.position_rank,
              state: r.state, archetype: r.archetype, dev_trait: r.dev_trait,
              status: r.status, hours_spent: r.hours_spent,
              competitors: Array.isArray(r.competitors) ? r.competitors.join(', ') : r.competitors,
            };
          });
          payload = imp.screen_type === 'recruit_profile' ? rows[0] : { rows };
          break;
        }
        case 'team_stats':
        case 'season_stats':
          payload = { rows: data.rows };
          break;
        default:
          throw new Error('Nothing to confirm for this screen type.');
      }
      const out = await post<{ message: string }>(`/api/imports/${imp.id}/confirm`, payload);
      alert(out.message);
      navigate('/import');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const mutate = (fn: (draft: any) => void) => {
    setData((prev: any) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  };

  // ---------- name-resolution cell ----------
  const NameCell = ({ rkey, name, onRename }: { rkey: string; name: string; onRename: (v: string) => void }) => {
    const res = resolutions[rkey];
    return (
      <div>
        <input className="cell-input" value={name} onChange={(e) => onRename(e.target.value)} style={{ minWidth: 140 }} />
        {res?.kind === 'matched' && <div className="match-ok">✓ matched {res.label}</div>}
        {res?.kind === 'suggest' && (
          <div className="match-suggest">
            Close to <strong>{res.label}</strong>
            <button className="btn sm" onClick={() => setResolutions({ ...resolutions, [rkey]: { kind: 'matched', id: res.id, label: res.label } })}>Use</button>
            <button className="btn sm" onClick={() => setResolutions({ ...resolutions, [rkey]: { kind: 'new', position: 'ATH' } })}>Keep new</button>
          </div>
        )}
        {res?.kind === 'new' && (
          <div className="match-new">
            new →{' '}
            <select
              value={res.position}
              onChange={(e) => setResolutions({ ...resolutions, [rkey]: { kind: 'new', position: e.target.value } })}
              style={{ padding: '1px 4px', fontSize: 11 }}
            >
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>
    );
  };

  // ---------- per-type editors ----------
  const editor = () => {
    if (!data) return null;
    switch (imp.screen_type) {
      case 'box_score':
        return (
          <>
            <table style={{ marginBottom: 12 }}>
              <thead><tr><th>Us?</th><th>Team</th><th className="num">Score</th></tr></thead>
              <tbody>
                {data.teams.map((t: any, i: number) => (
                  <tr key={i}>
                    <td><input type="radio" checked={ourTeamIdx === i} onChange={() => setOurTeamIdx(i)} /></td>
                    <td><input className="cell-input" value={t.name ?? ''} onChange={(e) => mutate((d) => { d.teams[i].name = e.target.value; })} /></td>
                    <td className="num">
                      <input className="cell-input" style={{ maxWidth: 70 }} value={t.score ?? ''} onChange={(e) => mutate((d) => { d.teams[i].score = parseCell(e.target.value); })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.stats?.length > 0 && (
              <table>
                <thead><tr><th>Stat</th><th className="num">{data.teams[0]?.name}</th><th className="num">{data.teams[1]?.name}</th></tr></thead>
                <tbody>
                  {data.stats.map((s: any, si: number) => (
                    <tr key={si} className={s.confidence === 'low' ? 'low-conf' : ''}>
                      <td><input className="cell-input" value={s.label ?? ''} onChange={(e) => mutate((d) => { d.stats[si].label = e.target.value; })} /></td>
                      {[0, 1].map((vi) => (
                        <td className="num" key={vi}>
                          <input className="cell-input" style={{ maxWidth: 80 }} value={s.values[vi] ?? ''} onChange={(e) => mutate((d) => { d.stats[si].values[vi] = parseCell(e.target.value); })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        );

      case 'player_game_stats':
        return (
          <>
            {data.tables.map((t: any, ti: number) => (
              <div key={ti} style={{ marginBottom: 16 }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <select value={t.category} onChange={(e) => mutate((d) => { d.tables[ti].category = e.target.value; })}>
                    {['passing', 'rushing', 'receiving', 'defense', 'kicking', 'punting', 'returns', 'other'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        {t.columns.map((c: string, ci: number) => <th className="num" key={ci}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {t.rows.map((r: any, ri: number) => (
                        <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                          <td>
                            <NameCell rkey={`${ti}:${ri}`} name={r.player} onRename={(v) => mutate((d) => { d.tables[ti].rows[ri].player = v; })} />
                          </td>
                          {t.columns.map((_: string, ci: number) => (
                            <td className="num" key={ci}>
                              <input className="cell-input" style={{ maxWidth: 76 }} value={r.values[ci] ?? ''} onChange={(e) => mutate((d) => { d.tables[ti].rows[ri].values[ci] = parseCell(e.target.value); })} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        );

      case 'standings': {
        return (
          <>
            <div className="note-box" style={{ marginBottom: 10 }}>
              Fill in <strong>our</strong> line below (auto-filled if a row matches "Stanford"), then confirm to snapshot week {imp.week ?? '?'}.
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <label className="field">Our conf rank<input type="number" className="cell-input" style={{ width: 70 }} value={data.our_conf_rank ?? ''} onChange={(e) => mutate((d) => { d.our_conf_rank = parseCell(e.target.value); })} /></label>
              <label className="field">Our poll rank<input type="number" className="cell-input" style={{ width: 70 }} value={data.our_poll_rank ?? ''} onChange={(e) => mutate((d) => { d.our_poll_rank = parseCell(e.target.value); })} /></label>
              <label className="field">Conf record<input className="cell-input" style={{ width: 80 }} value={data.our_conf_record ?? ''} onChange={(e) => mutate((d) => { d.our_conf_record = e.target.value || null; })} /></label>
              <label className="field">Overall record<input className="cell-input" style={{ width: 80 }} value={data.our_overall_record ?? ''} onChange={(e) => mutate((d) => { d.our_overall_record = e.target.value || null; })} /></label>
            </div>
            <table>
              <thead><tr><th className="num">Rank</th><th>Team</th><th>Conf</th><th>Overall</th><th>Extra</th></tr></thead>
              <tbody>
                {data.rows.map((r: any, ri: number) => (
                  <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                    <td className="num">{r.rank ?? '—'}</td>
                    <td style={{ fontWeight: /stanford/i.test(r.team ?? '') ? 700 : 400 }}>{r.team}</td>
                    <td>{r.conf_record ?? ''}</td>
                    <td>{r.overall_record ?? ''}</td>
                    <td style={{ color: 'var(--muted)' }}>{r.extra ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      }

      case 'schedule':
        return (
          <table>
            <thead><tr><th>Wk</th><th>Opponent</th><th>Site</th><th className="num">Us</th><th className="num">Them</th></tr></thead>
            <tbody>
              {data.rows.map((r: any, ri: number) => (
                <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                  <td><input type="number" className="cell-input" style={{ width: 54 }} value={r.week ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].week = parseCell(e.target.value); })} /></td>
                  <td><input className="cell-input" value={r.opponent ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].opponent = e.target.value; })} /></td>
                  <td>
                    <select value={r.home === false ? 'away' : 'home'} onChange={(e) => mutate((d) => { d.rows[ri].home = e.target.value === 'home'; })}>
                      <option value="home">Home</option><option value="away">Away</option>
                    </select>
                  </td>
                  <td className="num"><input className="cell-input" style={{ maxWidth: 64 }} value={r.our_score ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].our_score = parseCell(e.target.value); })} /></td>
                  <td className="num"><input className="cell-input" style={{ maxWidth: 64 }} value={r.opp_score ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].opp_score = parseCell(e.target.value); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'player_ratings':
        return (
          <table>
            <thead><tr><th>Player</th><th>Pos</th><th className="num">OVR</th><th>Attributes</th></tr></thead>
            <tbody>
              {data.rows.map((r: any, ri: number) => (
                <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                  <td><NameCell rkey={`0:${ri}`} name={r.player} onRename={(v) => mutate((d) => { d.rows[ri].player = v; })} /></td>
                  <td style={{ color: 'var(--text-2)' }}>{r.position ?? ''}</td>
                  <td className="num"><input className="cell-input" style={{ maxWidth: 60 }} value={r.overall ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].overall = parseCell(e.target.value); })} /></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                    {(r.attributes ?? []).map((a: any, ai: number) => (
                      <span key={ai} style={{ marginRight: 8, whiteSpace: 'nowrap' }}>
                        {a.name}{' '}
                        <input className="cell-input" style={{ width: 46, display: 'inline-block' }} value={a.value ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].attributes[ai].value = parseCell(e.target.value); })} />
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'recruiting_board':
      case 'recruit_profile': {
        const rows = imp.screen_type === 'recruit_profile' ? [data] : data.rows;
        const set = (ri: number, key: string, value: unknown) =>
          mutate((d) => {
            const target = imp.screen_type === 'recruit_profile' ? d : d.rows[ri];
            target[key] = value;
          });
        return (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Name</th><th>Pos</th><th className="num">★</th><th className="num">Natl</th><th>State</th><th>Status</th><th>Competing</th></tr></thead>
              <tbody>
                {rows.map((r: any, ri: number) => (
                  <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                    <td><NameCell rkey={`0:${ri}`} name={r.name} onRename={(v) => set(ri, 'name', v)} /></td>
                    <td><input className="cell-input" style={{ width: 56 }} value={r.position ?? ''} onChange={(e) => set(ri, 'position', e.target.value)} /></td>
                    <td className="num"><input className="cell-input" style={{ width: 44 }} value={r.stars ?? ''} onChange={(e) => set(ri, 'stars', parseCell(e.target.value))} /></td>
                    <td className="num"><input className="cell-input" style={{ width: 64 }} value={r.national_rank ?? ''} onChange={(e) => set(ri, 'national_rank', parseCell(e.target.value))} /></td>
                    <td><input className="cell-input" style={{ width: 50 }} value={r.state ?? ''} onChange={(e) => set(ri, 'state', e.target.value)} /></td>
                    <td>
                      <select value={r.status ?? 'scouting'} onChange={(e) => set(ri, 'status', e.target.value)}>
                        {['scouting', 'offered', 'top 5', 'committed', 'signed', 'lost'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><input className="cell-input" value={Array.isArray(r.competitors) ? r.competitors.join(', ') : r.competitors ?? ''} onChange={(e) => set(ri, 'competitors', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'team_stats':
      case 'season_stats':
        return (
          <table>
            <thead><tr><th>Stat</th><th className="num">Value</th></tr></thead>
            <tbody>
              {data.rows.map((r: any, ri: number) => (
                <tr key={ri} className={r.confidence === 'low' ? 'low-conf' : ''}>
                  <td><input className="cell-input" value={r.label ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].label = e.target.value; })} /></td>
                  <td className="num"><input className="cell-input" style={{ maxWidth: 100 }} value={r.value ?? ''} onChange={(e) => mutate((d) => { d.rows[ri].value = parseCell(e.target.value); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return <div className="note-box">No editor for this screen type.</div>;
    }
  };

  return (
    <>
      <p style={{ marginBottom: 8 }}><Link to="/import" style={{ color: 'var(--muted)' }}>← Import queue</Link></p>
      <h1 className="page-title">Review — {imp.screen_type ? SCREEN_TYPE_LABELS[imp.screen_type] : 'unprocessed'}</h1>
      <p className="page-sub">Check the extraction against the photo. Yellow rows were flagged low-confidence. Nothing is saved until you confirm.</p>

      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
      {mostlyNull && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          Most of this extraction came back empty — the photo is probably too blurry or angled. Consider retaking it straighter and closer, or fix values by hand below.
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          <label className="field">Bound to game
            <select
              value={imp.game_id ?? ''}
              onChange={(e) => {
                const gidVal = e.target.value ? Number(e.target.value) : null;
                const g = games.find((x) => x.id === gidVal);
                updateBinding({ game_id: gidVal, week: g ? g.week : imp.week });
              }}
            >
              <option value="">(none)</option>
              {games.map((g) => <option key={g.id} value={g.id}>W{g.week} {g.home ? 'vs' : '@'} {g.opponent}</option>)}
            </select>
          </label>
          <label className="field">Week
            <input type="number" style={{ width: 70 }} value={imp.week ?? ''} onChange={(e) => updateBinding({ week: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <label className="field">Screen type (re-extracts)
            <select value={imp.screen_type ?? ''} disabled={reprocessing} onChange={(e) => reprocessAs(e.target.value)}>
              {Object.entries(SCREEN_TYPE_LABELS).filter(([k]) => k !== 'unknown').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {reprocessing && <span className="badge"><span className="spinner" /> re-extracting…</span>}
        </div>
      </div>

      <div className="review-split">
        <div>
          <img className="review-image" src={`/uploads/${imp.image_path}`} alt="uploaded screenshot" />
        </div>
        <div className="card">
          {editor()}
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => navigate('/import')}>Cancel</button>
            <button className="btn primary" onClick={confirm} disabled={saving || !data}>
              {saving ? 'Saving…' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
