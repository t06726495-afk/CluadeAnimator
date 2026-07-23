# DiamondPlan

A mobile-first practice builder for youth baseball coaches (6U-14U). Coaches
manage teams and assemble practices out of timed blocks (Warm-Up, Hitting,
Defense, Pitching, Mixed); drill suggestions inside each block automatically
adjust to the team's age range and skill level, grounded in real coaching
standards (age-appropriate warm-ups, Pitch Smart daily pitch limits,
rec-league-realistic equipment and throwing distances).

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS
- Prisma + SQLite (`prisma/dev.db`, local file DB — no external service needed)
- Hand-rolled email/password auth (bcrypt + opaque session token cookie)
- Client-side PDF export (jsPDF)
- Mocked subscription upgrade (no real payment processor wired up yet — see
  `lib/actions/billing.ts`)

## Getting Started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx prisma db seed       # seeds the ~70-drill content library
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, create a team,
and start building a practice.

## Testing

```bash
npm run test    # Vitest: drill suggestion logic, age-tier mapping, billing limits
npm run lint
npx tsc --noEmit
```

`scripts/smoke-test.mjs` is a Playwright script that walks the full user flow
end to end (signup → team → practice builder → free-tier limits → mock
upgrade → duplicate → PDF export). Run it against a local dev server with
`node scripts/smoke-test.mjs`.

## Key directories

- `prisma/schema.prisma` — data model
- `prisma/seed-data/drills.ts` — the age/skill-tiered drill content library
- `lib/drills/suggest.ts` — the suggestion-matching logic
- `lib/billing/limits.ts` — free-tier limit enforcement
- `lib/actions/` — Server Actions (all mutations)
- `components/practices/PracticeBuilder/` — the core practice builder UI
