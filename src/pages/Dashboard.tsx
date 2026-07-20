import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../App';
import { get } from '../lib/api';
import type { Dashboard as DashboardData } from '../lib/types';
import { CHART, SeriesChart } from '../components/charts';

export default function Dashboard() {
  const { season } = useSeason();
  const [data, setData] = useState<DashboardData | null>(null);
  const [showYards, setShowYards] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!season) return;
    get<DashboardData>(`/api/dashboard?season_id=${season.id}`).then(setData).catch((e) => setError(e.message));
  }, [season]);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <p className="page-sub">Loading…</p>;

  const played = data.games.filter((g) => g.result);
  const wins = played.filter((g) => g.result === 'W').length;
  const losses = played.filter((g) => g.result === 'L').length;
  const { current, previous } = data.standings;
  const pollMove = current?.poll_rank != null && previous?.poll_rank != null ? previous.poll_rank - current.poll_rank : null;
  const confMove = current?.conf_rank != null && previous?.conf_rank != null ? previous.conf_rank - current.conf_rank : null;

  const arrow = (move: number | null) =>
    move == null || move === 0 ? <span className="delta" style={{ color: 'var(--muted)' }}>—</span> : move > 0 ? (
      <span className="delta up">▲ {move}</span>
    ) : (
      <span className="delta down">▼ {Math.abs(move)}</span>
    );

  const tooltipLabel = (label: unknown) => {
    const row = data.trend.find((t) => t.week === label);
    return row ? `Week ${label} · ${row.opponent}` : `Week ${label}`;
  };

  return (
    <>
      <h1 className="page-title">{season?.name ?? 'Season'}</h1>
      <p className="page-sub">
        {wins}–{losses}
        {current?.conf_record ? ` · ${current.conf_record} conference` : ''}
        {current?.poll_rank ? ` · #${current.poll_rank} in the polls` : ''}
      </p>

      <div className="results-strip" style={{ marginBottom: 16 }}>
        {data.games.map((g) => (
          <div key={g.id} className={`game-card ${g.result ?? ''}`}>
            <div className="wk">Week {g.week}</div>
            <div className="opp">{g.home ? 'vs' : '@'} {g.opponent}</div>
            {g.result ? (
              <div className={`score ${g.result}`}>
                {g.result} {g.our_score}–{g.opp_score}
              </div>
            ) : (
              <div className="score tbd">Upcoming</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ marginBottom: 0 }}>Point differential by game</h3>
            <div className="chip-row" style={{ marginBottom: 0 }}>
              <button className={`chip${showYards ? '' : ' active'}`} onClick={() => setShowYards(false)}>Points only</button>
              <button className={`chip${showYards ? ' active' : ''}`} onClick={() => setShowYards(true)}>+ Yards</button>
            </div>
          </div>
          <SeriesChart
            data={data.trend} xKey="week" yKey="point_diff" name="Point diff"
            color={CHART.cardinal} zeroLine height={showYards ? 180 : 260} labelFormatter={tooltipLabel}
          />
          {showYards && (
            <>
              <SeriesChart
                data={data.trend} xKey="week" yKey="yards_diff" name="Yards diff"
                color={CHART.gold} zeroLine height={140} labelFormatter={tooltipLabel}
              />
              <p style={{ color: 'var(--muted)', fontSize: 11, margin: '4px 0 0' }}>
                Total yards differential, same weeks — separate scale, so it gets its own panel.
              </p>
            </>
          )}
        </div>

        <div className="card">
          <h3>Top performers</h3>
          <table>
            <thead>
              <tr>
                <th>Player</th><th>Pos</th><th>Yr</th><th>Last game</th><th className="num">Score</th><th className="num">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.performers.slice(0, 8).map((p) => (
                <tr key={p.player_id}>
                  <td><Link to={`/players/${p.player_id}`} style={{ fontWeight: 600 }}>{p.name}</Link></td>
                  <td>{p.position}</td>
                  <td>{p.class_year}</td>
                  <td style={{ color: 'var(--text-2)' }}>{p.key_line}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{p.score}</td>
                  <td className="num">
                    <span className={`trend-arrow ${p.trend}`}>{p.trend === 'up' ? '▲' : p.trend === 'down' ? '▼' : '→'}</span>
                  </td>
                </tr>
              ))}
              {!data.performers.length && (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>No player stats yet — import a box score.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Standings &amp; rankings</h3>
          {current ? (
            <div className="row" style={{ gap: 32 }}>
              <div className="stat-tile">
                <div className="value">{current.poll_rank ? `#${current.poll_rank}` : 'NR'}</div>
                <div className="label">Poll rank</div>
                {arrow(pollMove)}
              </div>
              <div className="stat-tile">
                <div className="value">{current.conf_rank ? `#${current.conf_rank}` : '—'}</div>
                <div className="label">Conference</div>
                {arrow(confMove)}
              </div>
              <div className="stat-tile">
                <div className="value">{current.overall_record ?? '—'}</div>
                <div className="label">Record</div>
              </div>
              <div className="stat-tile">
                <div className="value">{current.conf_record ?? '—'}</div>
                <div className="label">Conf record</div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Import a standings screenshot to populate this card.</p>
          )}
        </div>

        <div className="card">
          <h3>Recruiting class</h3>
          <div className="row" style={{ gap: 32 }}>
            <div className="stat-tile">
              <div className="value">{data.recruiting.class_rank ? `#${data.recruiting.class_rank}` : '—'}</div>
              <div className="label">Class rank</div>
            </div>
            <div className="stat-tile">
              <div className="value">{data.recruiting.commit_count}</div>
              <div className="label">Commits</div>
            </div>
            <div className="stat-tile">
              <div className="value">{data.recruiting.star_avg ?? '—'}</div>
              <div className="label">Star average</div>
            </div>
          </div>
          {data.recruiting.latest_commit && (
            <p style={{ marginTop: 12, marginBottom: 0 }}>
              <span className="badge accent">Latest</span>{' '}
              <span style={{ color: 'var(--text-2)' }}>{data.recruiting.latest_commit}</span>
            </p>
          )}
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            <Link to="/recruiting" style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>Open recruiting board →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
