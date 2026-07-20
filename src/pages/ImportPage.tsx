import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../App';
import { del, get, post } from '../lib/api';
import { SCREEN_TYPE_LABELS, type Game, type ImportRow } from '../lib/types';

export default function ImportPage() {
  const { season } = useSeason();
  const [games, setGames] = useState<Game[]>([]);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [week, setWeek] = useState('');
  const [gameId, setGameId] = useState('');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const reload = () => get<ImportRow[]>('/api/imports').then(setImports).catch((e) => setError(e.message));
  useEffect(() => {
    reload();
    if (season) get<Game[]>(`/api/games?season_id=${season.id}`).then(setGames).catch(() => {});
  }, [season]);

  // Selecting a game infers the week automatically (context binding).
  const pickGame = (id: string) => {
    setGameId(id);
    const g = games.find((x) => x.id === Number(id));
    if (g) setWeek(String(g.week));
  };

  const processImport = useCallback(async (id: number) => {
    setBusy((prev) => new Set(prev).add(id));
    try {
      await post<ImportRow>(`/api/imports/${id}/process`);
    } finally {
      setBusy((prev) => { const next = new Set(prev); next.delete(id); return next; });
      reload();
    }
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setError('');
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    if (season) fd.append('season_id', String(season.id));
    if (week) fd.append('week', week);
    if (gameId) fd.append('game_id', gameId);
    try {
      const res = await fetch('/api/imports', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed');
      const rows: ImportRow[] = await res.json();
      reload();
      // Kick off classification+extraction for each image immediately.
      rows.forEach((r) => processImport(r.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const statusBadge = (imp: ImportRow) => {
    if (busy.has(imp.id) || imp.status === 'processing') return <span className="badge"><span className="spinner" /> reading…</span>;
    switch (imp.status) {
      case 'extracted': return <span className="badge gold">ready to review</span>;
      case 'confirmed': return <span className="badge win">saved</span>;
      case 'failed': return <span className="badge loss">failed</span>;
      case 'unreadable': return <span className="badge loss">unreadable</span>;
      default: return <span className="badge">{imp.status}</span>;
    }
  };

  return (
    <>
      <h1 className="page-title">Import Stats</h1>
      <p className="page-sub">
        Drop photos of your TV — box scores, player stats, standings, recruiting screens. Claude reads them; you review before anything is saved.
      </p>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <h3>Context — which game does this batch belong to?</h3>
        <div className="row">
          <label className="field">Game
            <select value={gameId} onChange={(e) => pickGame(e.target.value)}>
              <option value="">(none / not game-specific)</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>W{g.week} {g.home ? 'vs' : '@'} {g.opponent}</option>
              ))}
            </select>
          </label>
          <label className="field">Week
            <input type="number" style={{ width: 70 }} value={week} onChange={(e) => setWeek(e.target.value)} placeholder="wk" />
          </label>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            Week is used for standings, ratings, and recruiting snapshots. You can change bindings later on the review screen.
          </span>
        </div>
      </div>

      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        <div className="big">Drop screenshots here</div>
        <div>or click to browse — multiple photos at once is fine</div>
        <input
          ref={fileInput} type="file" accept="image/*" multiple hidden
          onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Import queue</h3>
        {imports.map((imp) => (
          <div className="import-row" key={imp.id}>
            <img className="import-thumb" src={`/uploads/${imp.image_path}`} alt="" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>
                {imp.screen_type ? SCREEN_TYPE_LABELS[imp.screen_type] ?? imp.screen_type : imp.original_name}
                {imp.week != null && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · week {imp.week}</span>}
              </div>
              {imp.status === 'unreadable' && (
                <div style={{ color: 'var(--loss)', fontSize: 12 }}>
                  Couldn't read this one — try a straighter, closer shot with less glare.
                </div>
              )}
              {imp.status === 'failed' && <div style={{ color: 'var(--loss)', fontSize: 12 }}>{imp.error}</div>}
            </div>
            {statusBadge(imp)}
            {imp.status === 'extracted' && <Link className="btn sm primary" to={`/import/${imp.id}`}>Review</Link>}
            {(imp.status === 'failed' || imp.status === 'unreadable' || imp.status === 'uploaded') && (
              <button className="btn sm" disabled={busy.has(imp.id)} onClick={() => processImport(imp.id)}>Retry</button>
            )}
            <button className="btn sm danger" onClick={async () => { await del(`/api/imports/${imp.id}`); reload(); }}>✕</button>
          </div>
        ))}
        {!imports.length && <p style={{ color: 'var(--muted)', margin: 0 }}>Nothing imported yet.</p>}
      </div>
    </>
  );
}
