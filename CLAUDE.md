# DEV 64 — N64-style developer portfolio

Single-page portfolio styled as a late-90s console title screen. A sculptable
low-poly three.js head sits behind a four-screen menu (Title → File select →
File detail → Profile / Continue).

## Stack

Next.js (App Router, `src/` dir) · React · TypeScript · raw three.js (no R3F) ·
no Tailwind — bespoke pixel styles. Fonts via `next/font/google` (Press Start
2P + JetBrains Mono). The only other assets are real project screenshots under
`public/projects/<slug>/` (see Hard rules).

## Sources of truth

- `docs/design-handoff/README.md` — the design contract. Pixel-accurate
  fidelity: colors, typography, spacing, z-index stack, per-screen head
  placement, interactions, touch targets.
- `docs/design-handoff/reference/sculpt-face.js` — real, working three.js for
  the head. Geometry constants and sculpt/reset math are copied verbatim,
  never re-derived.
- `docs/design-handoff/reference/Portfolio Prototype.dc.html` — layout/state
  reference (open directly in a browser to interact). `support.js` and the
  `.dc.html` runtime are prototype scaffolding — never port them.

## Hard rules

- The 3D head component never unmounts between screens — sculpt state must
  persist. It only moves/resizes/fades via style.
- The low-res pixelated render (pixelScale 0.3, `setPixelRatio(1)`,
  `image-rendering: pixelated`, flat shading) is deliberate. Don't "fix" it.
- 3D is client-only: dynamic import with `ssr: false`, guard
  `window`/`matchMedia` for SSR.
- Breakpoint `w < 720` = mobile. Mobile is first-class: bottom nav, ≥44px
  touch targets, coarse-pointer copy, double-tap reset.
- Border radius is always 0. Hard offset shadows only.
- No data fetching — `PROJECTS` and `SKILLS` are static arrays. Handoff copy
  is placeholder until replaced with real projects.
- No decorative images or SVG in the UI — glyphs and CSS only. Two exceptions,
  both deliberate deviations from the handoff's no-assets stance (owner
  decision, 2026-08):
  - Real project screenshots: pre-resized WebP under `public/projects/<slug>/`,
    declared as `Screenshot` entries on a `Project` and rendered by
    `src/components/PixelGallery.tsx`. Plain `<img>` with intrinsic
    `width`/`height`, not `next/image` — the files are already optimised.
  - Brand icons: `src/app/{icon.png,apple-icon.png,favicon.ico}`, a render of
    the head. These replaced a code-generated `icon.tsx`; don't reinstate it.
    `public/og/head.png` is the same render, embedded as base64 by
    `opengraph-image.tsx` at build.
  - Per-project marks: optional `icon` on a `Project`, cropped from that
    project's own artwork, shown on its file-select card.
- Inline styles are written as CSS declaration strings run through `css()` in
  `src/lib/css.ts`. Any new component matches that idiom, no CSS modules.

## Workflow

Before any non-trivial implementation task, consult the `advisor` agent
(`.claude/agents/advisor.md`) for a grounded plan.

Verify with `npm run build`, `npm run lint`, and visual checks via the
`agent-browser` CLI (Node 24 on PATH first — see user CLAUDE.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
