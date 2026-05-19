# Repository Guidelines

## Project Structure & Module Organization
This project is a Vite + React + TypeScript JSON utility app.

- `src/main.tsx` bootstraps the app.
- `src/router/AppRouter.tsx` owns route wiring.
- `src/features/json-tool/` contains the main feature modules (`JsonToolPage`, `ActionBar`, mode workspaces, state hook, and mode routing).
- `components/ui/` contains reusable UI primitives.
- `lib/` contains shared helpers.
- `public/` stores static assets.
- `dist/` is build output (generated; do not edit manually).

## Build, Test, and Development Commands
- `npm ci`: install dependencies from lockfile (preferred in CI/local clean setup).
- `npm run dev`: start dev server on `http://0.0.0.0:3000`.
- `npm run lint`: run TypeScript type-check (`tsc --noEmit`).
- `npm run build`: create production build in `dist/`.
- `npm run preview`: serve built output locally.
- `npm run clean`: remove generated build artifacts.

## Coding Style & Naming Conventions
- Use TypeScript with React function components and hooks.
- Follow existing style: 2-space indentation, semicolons, and single quotes.
- Component files use `PascalCase` (for example, `SchemaValidateWorkspace.tsx`).
- Hooks/utilities use `camelCase` (for example, `useJsonToolState.ts`, `modeRoutes.ts`).
- Prefer named exports for feature modules.
- Use alias imports with `@` for `src/*` when it improves readability.

## Testing Guidelines
No automated unit/integration test framework is configured yet. For every change:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Manually verify impacted modes in the browser (`/editor`, `/diff`, `/query`, `/yaml`, `/schema-generate`, `/schema-validate`, `/csv`, `/escape`).

If you add tests, place them near feature code (for example, `src/features/json-tool/__tests__/`).

## Commit & Pull Request Guidelines
- Recent history includes short messages and one Conventional Commit example (`feat: ...`). Prefer clear, scoped messages like `feat(json-tool): add schema validation error summary`.
- Keep commits focused on one logical change.
- PRs should include a problem statement, summary of changes, verification steps/commands, screenshots or short recordings for UI changes, and a linked issue/task when available.

## Security & Configuration Tips
- Keep secrets in local env files; never commit real keys.
- Use `.env.example` as the template (`GEMINI_API_KEY`, `APP_URL`).
