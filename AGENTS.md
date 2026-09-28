# Bootcamp LMS Agent Rules

## Important constraints

- Do NOT install any npm package unless I explicitly approve it.
- Do NOT run `npm install`, `npm update`, `npx` package installers, or package-manager upgrades automatically.
- Do NOT add large dependencies when the same result can be achieved with Next.js, React, Tailwind CSS, or browser APIs.
- Do NOT download models, binaries, language servers, SDKs, databases, Docker images, or external assets.
- Do NOT introduce Docker at this stage.
- Do NOT run production builds repeatedly unless necessary.
- Prefer editing existing files over creating unnecessary files.
- Keep the project lightweight.

## Current stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- PostgreSQL later
- Custom JWT authentication later
- HTTP-only cookies
- No Supabase Auth

## Development approach

Build the LMS incrementally.

Do not implement multiple phases at once.

Before making a large architectural change:

1. Explain what you intend to change.
2. Explain why.
3. Wait for approval if it requires a new dependency.

Keep UI components simple and reusable.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
