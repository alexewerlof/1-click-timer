# Contributing to 1-click timer

Thanks for wanting to help. Bug reports and feature ideas are welcome, and so are
pull requests — please
[open an issue](https://github.com/alexewerlof/1-click-timer/issues) first for
anything large, so we can agree on the approach before you write it.

## Prerequisites

- Node.js ≥ 22.13 (see `engines` in `package.json`)
- Chrome, for loading the built extension

## Set up

```bash
npm install
npm run dev
```

`npm run dev` serves the interface with Vite at `/popup.html`, `/fullscreen.html`
and `/settings.html`. Vite prints the port, and moves to the next free one if 5173
is taken.

In a plain browser the `chrome.*` APIs do not exist, so `src/app/runtime/` falls
back to in-memory mocks (`mockRuntime.ts`, `mockSettings.ts`). The layout, the
themes and the settings screen all behave the same, which is what makes the browser
loop a fast way to work on the interface.

## Commands

| Command                      | What it does                                       |
| ---------------------------- | -------------------------------------------------- |
| `npm install`                | install dependencies                               |
| `npm run dev`                | Vite dev server → `/popup.html`, `/fullscreen.html`, `/settings.html` |
| `npm run build`              | build the unpacked extension into `dist/`          |
| `npm run deploy`             | lint + typecheck + test + build, then ZIP the release into `dashboard/package/` |
| `npm run lint`               | ESLint (flat config)                               |
| `npm run lint:fix`           | ESLint with `--fix`                                |
| `npm run typecheck`          | `tsc --noEmit`                                     |
| `npm test`                   | unit tests (node)                                  |
| `npm run test:visual`        | browser-mode visual tests (screenshot diff)        |
| `npm run test:visual:update` | rewrite the screenshot baselines                   |
| `npm run screenshots`        | build, then capture the store gallery into `dashboard/screenshots/` |
| `npm run format`             | Prettier write                                     |
| `npm run format:check`       | Prettier check                                     |

Run `lint`, `typecheck` and `test` before considering a change done — or just
`npm run deploy`, which runs all three.

## Project layout

```
src/
  manifest.json        MV3 manifest
  popup.html           popup entry      (data-surface="popup")
  fullscreen.html      tab entry        (data-surface="fullscreen")
  settings.html        settings entry   (data-surface="settings")
  app/                 the React UI
    components/        TimerFace (the dial), TransportControls (the corners)
    design/            tokens.css (every colour and size), global.css, palette.ts
    lib/               dial geometry, time, links, chimes, fullscreen
    runtime/           the TimerRuntime + SettingsStore contracts, with a
                       chrome and a mock implementation each
  shared/              the timer protocol shared by the UI and the worker
  background/          the service worker (framework-free TypeScript)
  images/              toolbar and store icons
```

`src/AGENTS.md` documents the files in detail, and `AGENTS.md` covers the
architecture, the interface vocabulary and the traps.

## Testing

- `npm test` — the node project. Pure logic only: dial geometry, time formatting,
  the badge, settings, the worker's reducer, and a guard that keeps
  `manifest.json` and `package.json` in step.
- `npm run test:visual` — the browser project. Runs the real components in
  Chromium and compares screenshots, so CSS Modules and SVG rendering are actually
  exercised. It needs a browser once per machine:

```bash
npx playwright install chromium
```

Baselines live in `src/app/__screenshots__/`. Rewrite them with
`npm run test:visual:update`, but only when the change is meant to move the pixels.

## Conventions

- **Colours and sizes are tokens.** They live in `src/app/design/tokens.css`, and a
  component only ever references `var(--…)`. The exceptions are the values derived
  from the dial's geometry in `src/app/lib/dial.ts`.
- **The interface has one vocabulary.** The terms in `AGENTS.md` → UI vocabulary
  (face, dial, disc, tick, numeral, remaining sector, preview arc, readout…) are
  the words the code uses too, so a change asked for in one of them maps to a
  single place in the source.
- **Icons are Lucide** (`lucide-react`), never hand-drawn SVG. Lucide has no brand
  marks, so the GitHub link uses a code glyph.
- **Formatting is Prettier's job** — tabs, single quotes, no semicolons. Run
  `npm run format` rather than hand-formatting.
- **Keep the docs honest.** `AGENTS.md` is how an agent and the next person find
  their way around; update it when the layout or a convention changes.

## Release

```bash
npm run deploy
```

That runs the checks, builds, and writes
`dashboard/package/1-click-timer-<version>.zip` — the archive to upload to the
Chrome Web Store. It holds the contents of `dist/`, so `manifest.json` sits at the
archive root. Packaging prefers `zip(1)` and falls back to `python3`.

`CHROMEWEBSTORE.md` is the source of truth for the store listing, the permission
justifications and the privacy disclosure; `PRIVACY.md` is the policy the listing
links to. Bump the version in **both** `src/manifest.json` and `package.json` —
`src/manifest.test.ts` fails if they drift apart.

The listing's screenshots and the promo tile come from `npm run screenshots`,
which builds `dist/`, loads the packed extension in Playwright's Chromium and
drives it into each state at 1280×800 (440×280 for the tile). The images land in
`dashboard/screenshots/`, which is gitignored — reproducible on demand, and never
a gallery that lies about the current interface.

## Try it in Chrome

1. `npm run build`
2. Open `chrome://extensions` and switch on Developer mode
3. Choose "Load unpacked" and select `dist/`

Debug logs are prefixed `[1-click-timer:sw]`. Read them from the service worker's
inspector, on the extension's card.
