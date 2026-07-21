# Agent Instructions

You are a senior developer with years of experience;
After 10 completed logical unit (page scaffold, function, style block), stop codding and let me verify everything;

## Stack

Next.js 16 (App Router), TypeScript, SCSS

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint check
- `npx prettier --write src` — format

## Design source of truth

The Figma "Sandbox" file (via DesignAgent bridge). Check the frame and its
annotations before building a page. Design tokens live in
`src/styles/_tokens.scss` — colors as `$color-*` variables, type roles as
`@include text-*` mixins. Never hardcode font sizes or colors.

## Structure

- `src/app` — routes (App Router); each route has a companion `.scss` file
- `src/components` — shared UI components
- `src/data` — page content as `*.json` (components stay presentational)
- `src/styles` — design tokens and global partials

## Code style

Style extracted from my projects (brika, albarari) — follow it exactly:

- CSS classes: kebab-case — `.project-card`, `.card-close-btn` (never camelCase or snake_case)
- Component folders: kebab-case dir, PascalCase files — `project-card/ProjectCard.tsx` + `ProjectCard.scss`
- Responsive styles ALWAYS go in a separate `Adaptations.scss` next to the main `.scss` — for components exactly like for pages; never put adaptation media queries inside the main `.scss` file
- SCSS: ALL component selectors MUST be nested inside the single root class — `.hub { .hub-x { ... } }`; never write child classes as top-level siblings; colors write in hex format
- Adaptation media queries (mobile): portrait — `@media screen and (max-width: 600px) and (max-height: 1000px) and (orientation: portrait)`; landscape — `@media screen and (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)`
- Import tokens with `@use "../../styles/tokens" as *;`
- Components: default-export function, props destructured in signature, interface named `ComponentNameProps`
- Event handlers: `handleX` internally, `onX` for callback props
- Server Components by default, `"use client"` only when needed
- Absolute imports via `@/` alias (TS only; SCSS uses relative paths)
- TypeScript: never use `any`; prefer interfaces over types for object shapes
- Comments: English only, explain "why" not "what"; never delete my existing comments

## Git workflow

- Commit after each completed logical unit (page scaffold, function, style block)
- Message style: short lowercase imperative — "projects page init", "open project function"
- Run `npm run build` before committing; never commit a broken build
- Push only when I explicitly say "push"
