# CV Editor

A personal resume editor with a live, paginated preview and one-click PDF export. Everything runs
client-side — your data never leaves the browser.

## Features

- **Live preview** that mirrors the exported PDF page-for-page, including automatic page breaks that
  never split an entry in half.
- **Two output modes** — a styled, single-page-friendly layout and a plain single-column **ATS mode**
  built to parse cleanly in applicant tracking systems.
- **Click-to-edit** — click any text in the preview to jump straight to its field in the editor.
- **Drag-and-drop layout** — reorder sections and move them between the left/right columns (with
  keyboard-accessible move-up/move-down/move-column controls as an alternative to dragging).
  Add free-form custom sections for anything not covered by the built-ins.
- **Export** to PDF (print), JSON (full data, re-importable), or plain text (ATS mode).
- **Autosave** to `localStorage`, plus an explicit save/load draft slot so you can experiment without
  losing your working copy.

## Tech stack

[Next.js](https://nextjs.org) (App Router) · [React](https://react.dev) ·
[react-hook-form](https://react-hook-form.com) · [Zod](https://zod.dev) ·
[Tailwind CSS](https://tailwindcss.com) · TypeScript

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds itself with example data on first
load (`src/lib/seed.placeholder.ts`) — replace it with your own details in the editor, or import a
previously exported JSON file.

### Using your own data in local dev

The public seed (`src/lib/seed.placeholder.ts`) ships generic sample data. To auto-seed your real
CV locally without ever committing it, create `src/lib/seed.local.ts` (gitignored) exporting a
`seedResume` of the same shape:

```ts
import { Resume } from './types'

export const seedResume: Resume = {
  /* ... your real data ... */
}
```

When present, `next.config.ts` aliases the app's seed import to this file instead of the
placeholder — for local dev only, since the file never ships in the repo or a production build.

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start the dev server              |
| `npm run build`  | Production build                  |
| `npm run start`  | Serve the production build        |
| `npm run lint`   | Lint the codebase                 |
| `npm run format` | Format the codebase with Prettier |

## License

[MIT](./LICENSE)
