# Repository Guidelines

## Project Structure & Module Organization
This repository is a Turborepo monorepo.
- `apps/`: deployable Next.js apps (`wabbit-re`, `gsrealty-client`, `gs-site`, `growthadvisory`, plus early `wabbit` work).
- `packages/`: shared workspace packages (`auth`, `supabase`, `ui`, `utils`).
- `docs/`: architecture, deployment, and operational references.
- Root config: `turbo.json`, `package.json`, `.env.sample`, Vercel configs.

Keep app-specific logic inside its app. Promote reusable code to `packages/*` instead of cross-app imports.

## Build, Test, and Development Commands
Run from repo root unless noted.
- `npm run dev`: start all workspaces via Turbo.
- `npm run build`: build all apps/packages.
- `npm run lint`: run lint tasks across workspaces.
- `npm run typecheck`: run TypeScript checks.
- `npm run test`: run workspace tests configured for Turbo.
- `npm run format`: Prettier write pass for JS/TS/CSS/JSON/MD.

Target one app with workspace flags, for example:
- `npm run dev -w gsrealty-client`
- `npm run test -w gs-site`
- `npm run test:e2e -w gsrealty-client`

## Coding Style & Naming Conventions
- Language: TypeScript-first in apps/packages.
- Formatting: Prettier (`prettier --write`).
- Linting: Next.js ESLint configs per app (`next lint`).
- Indentation: follow existing file style (default 2 spaces in TS/JS/JSON).
- Naming: React components `PascalCase.tsx`; hooks `useX.ts`; utilities/services `kebab-case.ts` or domain-oriented names.
- Prefer path aliases (for example `@/lib/...`) within each app.

## Testing Guidelines
- Unit/integration: Jest (`apps/gsrealty-client`, `apps/gs-site`, `apps/wabbit-re`).
- E2E: Playwright in `apps/gsrealty-client/tests/e2e`.
- Test file patterns: `*.test.ts` / `*.test.tsx`; keep tests near source (`__tests__`) or in app-level `tests/`.
- Before opening a PR, run: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style (`docs:`, `fix(scope):`, `chore(scope):`). Use:
- `type(scope): concise summary`
- Example: `fix(gsrealty): correct map test db script reference`

PRs should include:
- Clear description of what changed and why.
- Linked issue/task when applicable.
- Screenshots or short recordings for UI changes.
- Notes for env vars, migrations, or operational impact.
