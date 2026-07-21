import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import type { Dynasty, Season } from './lib/types';
import { get } from './lib/api';
import { accentFor } from './lib/teams';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import ReviewPage from './pages/ReviewPage';
import GamesPage from './pages/GamesPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import RecruitingPage from './pages/RecruitingPage';
import StartDynasty from './pages/StartDynasty';
import SeasonTransition from './pages/SeasonTransition';

type SeasonCtx = {
  season: Season | null;
  seasons: Season[];
  dynasty: Dynasty | null;
  reload: () => void;
  reloadDynasty: () => void;
};
const SeasonContext = createContext<SeasonCtx>({ season: null, seasons: [], dynasty: null, reload: () => {}, reloadDynasty: () => {} });
export const useSeason = () => useContext(SeasonContext);

export default function App() {
  const [dynasty, setDynasty] = useState<Dynasty | null>(null);
  const [dynastyLoaded, setDynastyLoaded] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [streamMode, setStreamMode] = useState(false);
  const navigate = useNavigate();

  const reloadDynasty = () => {
    get<Dynasty | null>('/api/dynasty').then((d) => { setDynasty(d); setDynastyLoaded(true); }).catch(() => setDynastyLoaded(true));
  };
  const reload = () => {
    get<Season[]>('/api/seasons').then(setSeasons).catch(() => setSeasons([]));
  };
  useEffect(reloadDynasty, []);
  useEffect(reload, []);

  useEffect(() => {
    if (!dynasty) return;
    const bright = accentFor(dynasty.primary_color);
    document.documentElement.style.setProperty('--accent', dynasty.primary_color);
    document.documentElement.style.setProperty('--accent-bright', bright);
  }, [dynasty]);

  const season = seasons.find((s) => s.active === 1) ?? null;
  const latestSeason = seasons.length ? seasons.reduce((a, b) => (b.year > a.year ? b : a)) : null;
  const isViewingLatest = !!season && !!latestSeason && season.id === latestSeason.id;

  const switchSeason = async (id: number) => {
    await fetch(`/api/seasons/${id}/activate`, { method: 'POST' });
    reload();
  };

  if (!dynastyLoaded) return null;

  if (!dynasty) {
    return <StartDynasty onStarted={() => { reloadDynasty(); reload(); }} />;
  }

  return (
    <SeasonContext.Provider value={{ season, seasons, dynasty, reload, reloadDynasty }}>
      <div className={`layout${streamMode ? ' stream' : ''}`}>
        {streamMode && (
          <button className="btn sm stream-exit" onClick={() => setStreamMode(false)}>
            Exit stream mode
          </button>
        )}
        <aside className="sidebar">
          <div className="brand">
            DYNASTY<span>TRACKER</span>
          </div>
          <div className="brand-sub">{dynasty.team_name} · CFB 27</div>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Import Stats</NavLink>
          <NavLink to="/games" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Games</NavLink>
          <NavLink to="/players" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Players</NavLink>
          <NavLink to="/recruiting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Recruiting</NavLink>
          <div className="sidebar-footer">
            <button className="btn sm" onClick={() => setStreamMode(true)}>🎥 Stream mode</button>
            <a className="btn sm" href="/api/export" download style={{ textAlign: 'center' }}>Export backup</a>

            <div style={{ marginTop: 8 }}>
              <div className="label" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Seasons
              </div>
              <div className="season-strip">
                {[...seasons].sort((a, b) => a.year - b.year).map((s) => (
                  <button
                    key={s.id}
                    className={`season-chip${s.id === season?.id ? ' active' : ''}`}
                    onClick={() => switchSeason(s.id)}
                  >
                    {s.year}
                  </button>
                ))}
              </div>
              {isViewingLatest && (
                <button className="btn sm primary" style={{ width: '100%', marginTop: 6 }} onClick={() => navigate('/next-season')}>
                  Next season →
                </button>
              )}
            </div>
          </div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/import/:id" element={<ReviewPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/players/:id" element={<PlayerDetailPage />} />
            <Route path="/recruiting" element={<RecruitingPage />} />
            <Route path="/next-season" element={<SeasonTransition />} />
          </Routes>
        </main>
      </div>
    </SeasonContext.Provider>
  );
}
