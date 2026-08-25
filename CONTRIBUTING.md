# Contributing to ReadmeForge

Thanks for considering a contribution.

## Getting set up

```bash
git clone <this-repo>
cd readmeforge
npm install
npm run dev
```

This starts the Express API on `:4783` and the Vite dev server on `:5183` (proxied under `/api`).

## Project layout

- `packages/core` — analyzer, generator, quality scorer, AI provider abstraction. No UI code, no Express. Runs in Node.
- `apps/web` — React/Vite frontend and the Express server that exposes `packages/core` over HTTP.
- `apps/cli` — command-line companion, reuses `packages/core` directly.

## Before opening a PR

```bash
npm run test -w packages/core
npm run build
```

Both should pass. If you're changing analyzer or generator behavior, add or update a test in `packages/core/tests`.

## Ground rules

- `packages/core` must never import Express, React, or browser-only APIs — it should run standalone in any Node context (CLI, server, future integrations).
- The analyzer must never read `.env`, credentials, or key files into memory for anything other than exclusion checks. See `packages/core/src/analyzer/exclusions.ts`.
- The README generator should never invent functionality that isn't verifiable from `ProjectInfo`. When in doubt, mark a section as requiring user input instead of guessing.

## Reporting issues

Open an issue with the repository you tested against (if applicable), the command or UI flow you used, and what you expected instead.
