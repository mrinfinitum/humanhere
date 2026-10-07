# HUMAN:HERE

A Next.js application for discovering human stories, sharing privately, and publishing with verified consent.

The backend uses **Neon Postgres, Data API, Managed Better Auth, and Object Storage**. Start with [Neon setup](docs/neon-setup.md) to create a project and configure `.env.local` from `.env.example`.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The globe demonstration works before backend setup. Login, submissions, and uploads require a configured Neon project.

```sh
npm run db:migrate     # Apply schema to the configured Neon project
npm run storage:setup  # Verify browser upload access to Neon buckets
npm run test:rls       # Real SQL/RLS tests in disposable local PostgreSQL
npm run typecheck
npm run lint
npm run build
```

Read [the architecture](docs/human-archive-architecture.md) for data boundaries. Consult the installed Next.js guides in `node_modules/next/dist/docs/` before changing framework code.
