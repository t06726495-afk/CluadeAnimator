import { eraOf, seasonLabel } from '../lib/format'
import type { Player } from '../types'

export default function PlayerDossier({
  player,
  revealed,
}: {
  player: Player
  revealed: boolean
}) {
  return (
    <section className="dossier">
      <div className="dossier__head">
        <div className="dossier__label">Employee record · {eraOf(player.season)}</div>
        <h2 className="dossier__name">{player.name}</h2>
        <div className="dossier__line">
          <span className="dossier__season num">{seasonLabel(player)}</span>
          <span className="dossier__sep">·</span>
          <span>{player.team}</span>
          <span className="dossier__sep">·</span>
          <span>{player.league}</span>
        </div>
      </div>

      <ul className="dossier__stats">
        {player.stats.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      {!revealed && (
        <div className="dossier__prompt">
          What did this season pay? &mdash; annual salary, US dollars of the day
        </div>
      )}
    </section>
  )
}
