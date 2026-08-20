# CV Editor

A personal resume editor with a live, paginated preview and one-click PDF export. Your resume is
stored only in your browser; nothing is uploaded and there is no account. The one exception is the
optional AI features, which send your resume text to the AI provider you choose, on your own API
key — see [Privacy](#privacy).

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
- **AI assistance** (optional, bring your own key) — tailor the whole resume to a pasted job
  description, score it against one, or rewrite a single bullet. Every suggestion goes through a
  review where you accept or reject each change individually; nothing is ever written for you.

## AI features

These are optional and off until you add an API key. Open **Tailor** in the toolbar, then
**AI settings**, and pick a provider:

| Provider  | Default model      | Get a key                                                            |
| --------- | ------------------ | -------------------------------------------------------------------- |
| Anthropic | `claude-opus-5`    | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| OpenAI    | `gpt-5.1`          | [platform.openai.com](https://platform.openai.com/api-keys)          |
| Google    | `gemini-3.7-flash` | [aistudio.google.com](https://aistudio.google.com/apikey)            |

Any other model id from these providers can be entered by hand. Calls are billed to your key by
your provider; this project adds no charge and has no server-side key of its own.

**Prompts are tuned against the default Anthropic model.** The other providers run the same
prompts and are supported, but output quality varies between models — the safety rules below do
not.

Three things the AI is not allowed to do:

- **Invent anything.** It may only re-angle, reorder, tighten, and reword what you already wrote.
  Requirements your resume doesn't support are reported as gaps, never added to it.
- **Write without review.** Every proposal lands in a diff you accept or reject line by line, and
  by default the accepted changes go into a _new_ document, leaving the original untouched.
- **Corrupt your resume.** The model returns a patch addressed by index, not a whole resume, and
  that patch is reconciled against your actual data before you ever see it: out-of-range edits are
  dropped, and a reordered skill list is forced back into a true permutation of your own skills, so
  a reorder can never add or lose one.

Applying suggestions is a single undo away, like any other edit.

## Privacy

Your resume lives in `localStorage` and is never uploaded — with one exception, which is entirely
opt-in:

- **Without AI**, nothing leaves your browser. No account, no server, no telemetry.
- **With AI**, pressing an AI button sends your resume text and the job description you pasted to
  the provider you chose, authenticated with your own key. The request passes through this app's
  own API route, which uses the key for that single call and stores neither the key nor your
  content. Your key is kept in `localStorage` and can be cleared at any time from AI settings.
- **What the provider does with it** is governed by their terms, not this project's. If that
  matters to you, check your provider's data-retention policy before enabling AI.

You are shown this once, in-app, before the first AI request.

## Tech stack

[Next.js](https://nextjs.org) (App Router) · [React](https://react.dev) ·
[react-hook-form](https://react-hook-form.com) · [Zod](https://zod.dev) ·
[Tailwind CSS](https://tailwindcss.com) · TypeScript · [AI SDK](https://ai-sdk.dev)

## Getting started

```bash
pnpm install
pnpm dev
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

export const seedResume: Resume = {/* ... your real data ... */}
```

When present, `next.config.ts` aliases the app's seed import to this file instead of the
placeholder — for local dev only, since the file never ships in the repo or a production build.

## Scripts

| Command       | Description                       |
| ------------- | --------------------------------- |
| `pnpm dev`    | Start the dev server              |
| `pnpm build`  | Production build                  |
| `pnpm start`  | Serve the production build        |
| `pnpm lint`   | Lint the codebase                 |
| `pnpm format` | Format the codebase with Prettier |

## License

[MIT](./LICENSE)
