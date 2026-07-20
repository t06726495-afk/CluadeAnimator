import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import type { Season } from './lib/types';
import { get, post } from './lib/api';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import ReviewPage from './pages/ReviewPage';
import GamesPage from './pages/GamesPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import RecruitingPage from './pages/RecruitingPage';

type SeasonCtx = { season: Season | null; seasons: Season[]; reload: () => void };
const SeasonContext = createContext<SeasonCtx>({ season: null, seasons: [], reload: () => {} });
export const useSeason = () => useContext(SeasonContext);

export default function App() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [streamMode, setStreamMode] = useState(false);

  const reload = () => {
    get<Season[]>('/api/seasons').then(setSeasons).catch(() => setSeasons([]));
  };
  useEffect(reload, []);

  const season = seasons.find((s) => s.active === 1) ?? seasons[0] ?? null;

  const activate = async (id: number) => {
    await post(`/api/seasons/${id}/activate`);
    reload();
  };

  const newSeason = async () => {
    const year = Number(prompt('Season year?', String((season?.year ?? new Date().getFullYear()) + 1)));
    if (!year) return;
    await post('/api/seasons', { year });
    reload();
  };

  return (
    <SeasonContext.Provider value={{ season, seasons, reload }}>
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
          <div className="brand-sub">Stanford Cardinal · CFB 27</div>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Import Stats</NavLink>
          <NavLink to="/games" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Games</NavLink>
          <NavLink to="/players" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Players</NavLink>
          <NavLink to="/recruiting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Recruiting</NavLink>
          <div className="sidebar-footer">
            {seasons.length > 0 && (
              <select value={season?.id ?? ''} onChange={(e) => activate(Number(e.target.value))}>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.archived ? ' (archived)' : ''}
                  </option>
                ))}
              </select>
            )}
            <button className="btn sm" onClick={newSeason}>+ New season</button>
            <button className="btn sm" onClick={() => setStreamMode(true)}>🎥 Stream mode</button>
            <a className="btn sm" href="/api/export" download style={{ textAlign: 'center' }}>Export backup</a>
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
          </Routes>
        </main>
      </div>
    </SeasonContext.Provider>
  );
}
