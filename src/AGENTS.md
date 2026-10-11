# src/ — source code

Three layers, deliberately separate:

1. **`background/`** — the service worker. Framework-free TypeScript; no React.
2. **`app/runtime/`** — the contract the UI talks to about time.
3. **`app/`** — the React UI. Presentation only; it never keeps time itself.

**Names come from the spec.** `MANUAL.md` → "UI elements" defines the vocabu-
lary (face, dial, disc, tick, major tick, numeral, remaining sector, preview
arc, readout, readout disc, caption). Code identifiers use those exact words, so
a change asked for in one term maps to one place in the source. There is exactly
one dial face; the multi-variant experiment is over.

## Files

| Path                                | Role                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `manifest.json`                     | Extension manifest (MV3). Service worker runs as an ES module.                                              |
| `popup.html`                        | Popup entry. Sets `data-surface="popup"`.                                                                   |
| `fullscreen.html`                   | Tab entry for the big view. Sets `data-surface="fullscreen"`.                                               |
| `app/main.tsx`                      | Mounts `TimerApp`, reads the surface and picks the runtime.                                                 |
| `app/TimerApp.tsx`                  | Composition shared by both surfaces.                                                                        |
| `app/components/TimerFace/`         | The dial. Geometry in `lib/dial.ts`; one component per element (`Disc`, `RemainingTime`, `PreviewArc`, `PreviewTicks`, `PreviewNumeral`, `CenterReadout`, `ReadoutControl`, `Caption`, `CreatorMark`); static chrome in `dialChrome.tsx` (`DIAL_TICKS`, `DIAL_NUMERALS`, and the `Tick` both tick groups share). `ReadoutControl` is the one non-SVG element — an HTML `<button>` overlaid on the face. |
| `app/components/TransportControls/` | The four corner controls (mute, fullscreen, reset, and info), ghost glyphs pinned to the corners of the dial's square. Icons from Lucide. The fullscreen control shows expand or shrink with the document's own fullscreen state. The info control opens the author's site in a new tab (`AUTHOR_SITE_URL` + `openTab`, both from `app/lib/links.ts`). The group fades out while the dial is previewed, so nothing competes with the choice being made. Pause/resume and restart are the `ReadoutControl` on the readout disc. |
| `app/design/tokens.css`             | Every colour, size and stroke weight, in one `:root` block.                                                 |
| `app/design/global.css`             | Resets, body, and the popup/tab sizing per `[data-surface]`.                                                |
| `app/lib/dial.ts`                   | Dial geometry: counter-clockwise mapping, sector/arc paths, pointer → dial point/minute, disc/readout-disc regions, and the derived readout size. |
| `app/lib/time.ts`                   | `MAX_MINUTES` clamp, `formatClock`, `toWholeMinutes`.                                                       |
| `app/lib/surface.ts`                | Surface type, `readSurface`, and the fullscreen button behaviour.                                           |
| `app/lib/links.ts`                  | Outbound destinations (`AUTHOR_SITE_URL`) and `openTab`, the one way the app opens a new tab: `chrome.tabs` in the extension, `window.open` in the design preview. |
| `app/lib/useDocumentFullscreen.ts`  | `useSyncExternalStore` binding to the Fullscreen API's `fullscreenchange` event.                            |
| `app/runtime/types.ts`              | `TimerState` / `TimerRuntime` contract. **The seam Phase 3 implements.**                                    |
| `app/runtime/mockRuntime.ts`        | In-memory implementation (interval-driven) + `forceStatus`, the mock-only parking helper (`MockRuntime`) the visual tests use to freeze a state.                                              |
| `app/runtime/runtime.ts`            | The single line that swaps mock → Chrome runtime.                                                                         |
| `app/runtime/useTimerState.ts`      | `useSyncExternalStore` binding.                                                                                           |
| `background/index.ts`               | Service worker: storage, alarms, badge/icon, notifications, messages.                                                     |
| `images/`, `audio/`                 | Extension icons (toolbar/store) and the alarm sound. Copied verbatim into `dist/`.                          |

## Key patterns

- **Time is a timestamp.** State holds an absolute `endTime`; remaining seconds
  are computed, never accumulated. This is what survives SW termination.
- **One visual source of truth.** All colours live in `design/tokens.css`;
  components only reference `var(--…)`. Nothing names a colour directly.
- **Derive, don't eyeball.** `READOUT_FONT_SIZE` comes from
  `readoutFontSizeFor(READOUT_DISC_RADIUS, …)`, and both shadows come from
  `shadowFor(radius, ratios)`, sized off the radius they ride so they stay in
  proportion if the dial is resized. The disc's inner shadow deliberately uses
  tighter ratios than the readout disc's: scaled to the disc's radius, the
  readout's proportions greyed the whole face. `DIAL_VIEWBOX` is derived from
  `NUMERAL_RADIUS` for the same reason — hand-picked sizes drift the moment the
  geometry is tuned.
- **Shadows are SVG filters**, not CSS `box-shadow` (SVG has no such property),
  and the disc has no outline: `DISC_INNER_SHADOW` is what draws its edge.
  `Disc` subtracts an offset copy of the disc from itself (`feComposite
  operator="out"`), which leaves the shadow inside the rim; `CenterReadout`
  declares an `feDropShadow` instead. Two details matter to both: the filter
  region is widened so the blur is not clipped at the disc's edge, and
  `colorInterpolationFilters="sRGB"` is set because the SVG default
  (`linearRGB`) renders the shadow far lighter than the token looks. The colour
  reaches each filter through `style={{ floodColor: 'var(--…)' }}`, which does
  resolve custom properties on presentation attributes.
- **Static SVG is hoisted.** The tick and numeral rings are built once at
  module load (`DIAL_TICKS`, `DIAL_NUMERALS`). Only the sector and the preview
  chrome are stateful: previewing swaps the numeral ring for the preview numeral
  and redraws the covered ticks in the remaining colour, over the untouched ring
  (MANUAL "Preview numeral", "Preview ticks").
- **One click sets a timer.** Clicking the disc starts the previewed duration;
  clicking a numeral starts that many minutes outright (the 0 numeral marks a
  whole turn, so it starts 60). A numeral carries `data-numeral-minutes`, which
  is how the click is resolved (`handleClick` in `TimerFace`) — the pointer's
  position cannot identify a numeral because it sits off the disc.
  `pointer-events: bounding-box` (see `TimerFace.module.css`) gives each numeral
  a solid hit area, and hovering one takes `--remaining` — the same interactive
  signal the preview arc and preview numeral use. Nothing asks for confirmation,
  even when a timer is already running.
- **The readout control is HTML, not SVG.** Pause/resume (and restart, while
  ringing) is a real `<button>` (`ReadoutControl`) overlaid on the readout disc as
  a *sibling* of the `<svg>` — a `<button>` is not valid in the SVG namespace, and
  a focusable button nested in the face's `role="slider"` would make the
  accessibility tree ambiguous. Its click surface is the whole disc: the size is
  `READOUT_DISC_DIAMETER_RATIO` (from `dial.ts`) times the face's rendered side,
  which is `cqmin` because the square viewBox is letterboxed (see `.stage`). It is
  revealed on hover or focus, and always under `@media (hover: none)`.
- **The corner controls overlay the face.** `TransportControls` is a sibling of the
  face inside `.faceSlot` (which is the size container, see
  `TimerApp.module.css`), so the dial is not shortened by a controls row. The
  overlay is sized to the *letterboxed square* rather than the slot — it offsets
  itself by half the letterbox margin (`calc(50cqw - 50cqmin)`) — so its corners
  are the corners of the dial's square, and the same file's CSS pins one control
  to each. It takes the pointer only on its buttons, so the dial underneath keeps
  the rest. The group fades out while the dial is previewed — keyed off the
  face's `data-pickable` attribute with `:has()`, the same signal that drives the
  cursor and the numeral swap — and fades back when the pointer leaves the disc.
  The sizes are `cqmin` tokens (`--size-corner-control`, `--size-corner-icon`),
  so the glyphs keep their weight against the dial instead of staying a fixed
  18px on a large fullscreen face; the icon is a percentage of the control,
  which is why the control resets the button's default padding.
- **Pointer maths uses `getScreenCTM()`**, so scaling or letterboxing of the
  element cannot skew the selected minute.
- **Two surfaces, one app.** `popup.html` and `fullscreen.html` mount the same
  `TimerApp`; only `data-surface` changes the sizing.
- **Icons are Lucide**, not hand-drawn SVG — conventional glyphs and one source
  of truth for stroke weight.
- **The creator mark is inlined art.** `CreatorMark` embeds the Alex Ewerlöf
  wordmark's paths (from the old `alexewerlof-logo.svg`, now deleted) and fills
  them with `--dial-mark`, so it recolours with the numerals and ticks. Filled,
  not stroked: the source is a hairline outline that would vanish on the popup.
  It is placed by `CREATOR_MARK_*` in `lib/dial.ts`, in the band between the
  readout disc and the 0 numeral.
- **Service worker logs** are prefixed `[1-click-timer:sw]`.

## Tests

- `app/lib/*.test.ts`, `app/runtime/*.test.ts` — node project (`npm test`).
- `app/TimerApp.visual.test.tsx` — browser project; baselines live in
  `app/__screenshots__/` (`npm run test:visual`, `test:visual:update` to rewrite).
  It also measures the rendered readout with `getBBox()` and asserts it fits
  inside the readout disc — the one place the real text box is knowable, and a
  bug that regressed twice.

## Build pipeline

`vite.config.ts` sets `root: src`, so dev URLs match the built extension. Vite
bundles `popup.html`, `fullscreen.html` and `background/index.ts`, then the
`extensionAssets` plugin copies `manifest.json`, `images/` and `audio/` into
`dist/`.
