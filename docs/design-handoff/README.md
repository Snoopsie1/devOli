# Handoff: N64-style Developer Portfolio ("DEV 64")

## Overview
A single-page portfolio front page styled as a late-90s console title screen. The centrepiece is a **low-poly 3D head** (a caricature of the site owner: mullet, moustache, dark hair) rendered with three.js. The user can **click-drag to sculpt the mesh** and **right-click (or two-finger tap) to reset it** with a springy overshoot wobble. Around the head sits a four-screen "menu system": Title screen → File select (project grid) → File detail → Player profile / Continue (contact).

## About the Design Files
The files in `reference/` are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. They run in a lightweight in-house component runtime (`support.js`, `.dc.html` files), which you should NOT port.

The task is to **recreate these designs in a Next.js / React / three.js codebase** using that project's established patterns (App Router, React Three Fiber or raw three.js, CSS Modules / Tailwind / styled-components — whatever the repo already uses).

**One important exception:** `reference/sculpt-face.js` is *real, working three.js code* — the head geometry, the sculpt deformation math and the reset spring. Port this file's logic more or less as-is (see "Porting the 3D head" below). Everything else is layout reference.

## Fidelity
**High-fidelity.** Colors, typography, spacing and interactions are final. Recreate pixel-accurately. The one deliberate looseness: the head's proportions are hand-tuned magic numbers — copy them verbatim rather than re-deriving.

---

## Screens / Views

All screens share one full-viewport stage. The 3D head is **always mounted** and never unmounts between screens — it only moves/resizes/fades. This is essential: the sculpted deformation must persist as the user navigates.

### Shared stage

- Root: `position:relative; width:100vw; height:100dvh; overflow:hidden`
- Background: `radial-gradient(120% 90% at 50% 45%, #22246b 0%, #101040 42%, #05050e 100%)`
- `user-select:none`, `-webkit-tap-highlight-color:transparent`
- Font: **Press Start 2P** (Google Fonts) for all chrome/labels; **JetBrains Mono** for body prose.

**Layer stack (z-index):**

| z | Layer |
|---|---|
| 0 | background gradient |
| 1 | watermark grid / dimmed head on File select |
| 3 | 3D head (normal screens) |
| 8 | UI chrome (brand, nav, screen content, status bar) |
| 9 | File detail sheet |
| 12 | mobile bottom nav |
| 20 | scanlines |
| 21 | vignette |

**Watermark grid** (behind everything, pointer-events none):
- `display:grid`, desktop `repeat(4,1fr)` / rows `22vh`, 16 cells; mobile `repeat(3,1fr)` / rows `18vh`, 12 cells
- Cells alternate the words `DEV` and `64`
- `font-size:30px` desktop / `18px` mobile, `color:#5b62d8`, `text-shadow:0 3px 0 #2a2e8a`
- Whole grid animates `swell`: opacity `.12 → .2 → .12` over `6s ease-in-out infinite`

**Scanlines** (z 20): `repeating-linear-gradient(to bottom, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)`, `mix-blend-mode:multiply`, pointer-events none.

**Vignette** (z 21): `box-shadow: inset 0 0 180px 60px rgba(0,0,0,.75)`, pointer-events none.

**Brand block**
- Desktop: `position:absolute; top:34px; left:44px`, column, `gap:11px`
  - Name `YOUR NAME` — 15px, `#ffd23f`, `text-shadow:0 3px 0 #4a3200`, cursor pointer → returns to Title
  - Subtitle `FRONT-END ENGINEER · COPENHAGEN` — 9px, `letter-spacing:2px`, `line-height:1.7`, `#9aa2e8`
- Mobile: centered at `top:20px`, `gap:9px`, name 13px, subtitle 7px

**Nav**
- Desktop: `top:34px; right:44px`, row, `gap:22px`, 9px, `letter-spacing:1px`
  - Item default `#9aa2e8`; hover **or** active `#ffd23f`; active adds `border-bottom:3px solid #ffd23f` (`padding-bottom:5px`; inactive uses a transparent 3px border so nothing shifts)
- Mobile: fixed bottom bar — `left:0;right:0;bottom:0`, `background:rgba(7,8,32,.94)`, `border-top:3px solid #3b45b8`. Each item `flex:1`, `min-height:52px`, centered, 10px. Active item inverts: `color:#05050e` on `background:#ffd23f`.
- Items: `WORK`, `ABOUT`, `CONTACT`.

**Status bar** (bottom-left telemetry, z 8)
- Desktop `left:44px; bottom:30px`, row, `gap:20px`, 8px, `#6e77c4`
- Content: screen label (`TITLE SCREEN` / `FILE SELECT` / `PROFILE` / `CONTINUE?`) + input hint
- Input hint: `DRAG = SCULPT · RIGHT-CLICK = RESET` on fine pointers, `DRAG = SCULPT` on coarse
- **Hidden** on the File-select screen (desktop and mobile) and on mobile About/Contact — the content needs the space.

---

### 1. Title screen (`boot`) — default

- **Head:** desktop `left:0;right:0;top:9vh;height:74vh`; mobile `top:14vh;height:50vh`
- **Prompt block:** absolute, `bottom:64px` desktop / `bottom: navHeight+24px` mobile; column, centered, `gap:20px` / `14px`
  - `PRESS` — 26px (mobile 20px), `#ff4d4d`, `text-shadow:0 4px 0 #3a0000`
  - `START` — 26px (mobile 20px), `#ffd23f`, `text-shadow:0 4px 0 #4a3200`
  - The two words sit in one flex row, `gap:12px`, `padding:10px 4px` (touch target), whole row is the click target and animates `blink`: `0%,60% {opacity:1} 61%,100% {opacity:.2}` over `1.4s steps(1,end) infinite`
  - Hint line below — 9px (mobile 7px), `letter-spacing:1px`, `line-height:1.8`, `#8f97dd`, centered.
    - Fine pointer: `DRAG MY FACE · RIGHT-CLICK RESETS · ENTER TO BEGIN`
    - Coarse pointer: `DRAG MY FACE · TWO-FINGER TAP RESETS`
- **Action:** click prompt or press `Enter` → File select.

### 2. File select (`work`)

- **Head:** dims into the background — desktop `top:6vh;height:52vh;opacity:.16;z-index:1;pointer-events:none`; mobile `top:12vh;height:40vh;opacity:.13`. (Not sculptable while dimmed — pointer-events off.)
- **Container:** absolute `top:106px` (mobile 96px), `bottom:56px` (mobile navHeight+8px), column, centered, `gap:18px` / `12px`, `padding:0 44px` / `0 16px`, `box-sizing:border-box`, enters with `fadein .28s ease-out` (`opacity 0 / translateY(14px)` → none)
- **Section title:** `SELECT A FILE` — 13px (mobile 11px), `letter-spacing:3px`, `#ffd23f`, `text-shadow:0 3px 0 #4a3200`
- **Grid:** `flex:1; min-height:0; width:100%; max-width:1000px; overflow:auto`, `grid-template-columns:repeat(3,minmax(0,1fr))` desktop / `repeat(1,...)` mobile, `grid-auto-rows:min-content`, `gap:16px` / `12px`, `padding:2px 4px 8px`
- **Card** (6 total), column, `gap:9px`, `padding:15px 17px` (mobile `16px`):
  - Idle: `background:rgba(12,14,58,.86)`, `border:3px solid #3b45b8`, `box-shadow:0 6px 0 #141a63`
  - Active (keyboard-selected **or** hovered): `background:rgba(48,56,190,.92)`, `border-color:#ffd23f`, `box-shadow:0 6px 0 #7a5f00`, `transform:translateY(-4px)`; `transition:transform .12s`
  - Row 1: `FILE {letter}` 9px `#ffd23f` `letter-spacing:1px` ⟷ year 9px `#8f97dd` (space-between)
  - Title: 12px, `line-height:1.55`, `#fff`
  - Blurb: JetBrains Mono 12px, `line-height:1.55`, `#a8b0ee`
  - Star row: 6 `★` at 13px — filled `#ffd23f`, empty `#2b3184`, `gap:6px`
  - Stack line: 8px, `#7b83c9`, `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`
- **Hint line:** 9px (mobile 7px), `#8f97dd`, centered
  - Fine: `↑ ↓ ← → TO MOVE · ENTER TO OPEN · ESC TO GO BACK`
  - Coarse: `TAP A FILE TO OPEN · SCROLL FOR MORE`

### 3. File detail (overlay on File select)

- **Wrapper:** z 9, `top:110px; bottom:60px` desktop / `top:12px; bottom:navHeight+12px` mobile, centered, `fadein .28s`
- **Panel:** `width:820px; max-width:88vw` desktop / `width:100%` with `padding:0 12px` wrapper on mobile; `padding:36px 40px` / `20px 18px`; `background:rgba(9,10,38,.96)`; `border:3px solid #3b45b8`; `box-shadow:0 0 0 3px #0a0b26, 0 24px 60px rgba(0,0,0,.6)`; column `gap:22px` / `16px`; `overflow:auto`
  - Header row: `FILE {letter} · {year}` 9px `letter-spacing:2px` `#ffd23f` ⟷ close control
  - **Close control:** 9px `#8f97dd`, inline-flex centered. Desktop label `[ESC] CLOSE`, no border. Mobile label `CLOSE ✕`, `min-height:48px; padding:0 16px; border:2px solid #3b45b8` (must clear the 44px touch minimum — it is the only dismiss affordance on a phone).
  - Title: 22px (mobile 14px), `line-height:1.5`, `#fff`, `text-shadow:0 3px 0 #1b1f6b`
  - Body: JetBrains Mono 15px (mobile 13px), `line-height:1.75`, `#c2c9f5`
  - Facts grid: `repeat(3,1fr)` desktop / `repeat(1,1fr)` mobile, `gap:18px` / `14px`, `padding-top:18px`, `border-top:2px solid #2a3090`. Each: key 8px `letter-spacing:2px` `#7b83c9` over value JetBrains Mono 14px `#eaeeff`.

### 4. Player profile (`about`)

- **Head:** desktop `right:-4vw; top:2vh; width:52vw; height:88vh` (bleeds off the right edge); mobile `top:8vh; height:34vh` centered above the text
- **Content:** desktop `left:7vw; top:150px; width:520px`, column `gap:24px`; mobile `top:44vh; bottom:navHeight+8px`, `padding:0 18px`, `overflow:auto`, `gap:16px`
  - Title `PLAYER PROFILE` (same section-title style)
  - Bio: JetBrains Mono 16px (mobile 13px), `line-height:1.8`, `#c8cff8`
  - **Skill meters** — one row per skill, `gap:14px` (mobile 10px):
    - Label: 9px (mobile 7px), `letter-spacing:1px`, `#9aa2e8`, fixed `width:120px` (mobile 88px), `flex:none`
    - Track: `flex:1; height:14px; background:#141860; border:2px solid #3b45b8`
    - Fill: `height:100%; width:{pct}; background:#ffd23f`

### 5. Continue / contact (`contact`)

- **Head:** desktop `top:-4vh; height:74vh`; mobile `top:10vh; height:40vh`
- **Content:** absolute `bottom:12vh` desktop / `bottom:navHeight+20px` mobile, centered column, `gap:22px` / `16px`
  - Title `CONTINUE?` (section-title style)
  - Button row: desktop row `gap:16px`; mobile column `gap:10px`, `width:100%; max-width:320px`
    - **Primary** (`EMAIL ME`, `mailto:`): `padding:16px 24px`, 11px, `letter-spacing:1px`, `color:#05050e`, `background:#ffd23f`, `box-shadow:0 5px 0 #7a5f00`; hover `background:#fff`; mobile `min-height:52px`
    - **Secondary** (`GITHUB`, `LINKEDIN`): same metrics, `color:#dfe3ff`, `background:#242a9e`, `box-shadow:0 5px 0 #10144f`; hover `background:#3b45b8`
  - Footnote: 9px, `#8f97dd`, `letter-spacing:1px`, centered — `AVAILABLE FOR FREELANCE FROM Q4`

---

## Porting the 3D head

`reference/sculpt-face.js` is a self-contained ES module: a `<sculpt-face>` custom element wrapping a three.js scene. In a React codebase, port it as a client component (`'use client'`) — either keep it as a custom element and mount it in a `useEffect`, or lift the same logic into a React Three Fiber component. **The geometry constants and the sculpt/reset math should be copied verbatim.**

### Scene setup
- `WebGLRenderer({ antialias:false, alpha:true, preserveDrawingBuffer:true })`, `setPixelRatio(1)`
- **Deliberate low-res render:** the drawing buffer is sized at `clientSize * pixelScale` (default `0.42`) while the canvas is CSS-stretched to 100% with `image-rendering: pixelated`. This is the N64 crunch — do not remove it.
- Camera: `PerspectiveCamera(30, aspect, 0.1, 100)` at `(0, 0.12, 5.4)`, `lookAt(0, 0.12, 0)`
- Lights: `AmbientLight(0xa9b6d0, 0.75)`; key `DirectionalLight(0xfff3e0, 1.1)` at `(1.1, 1.4, 2.2)`; rim `DirectionalLight(0x6f8bd6, 0.5)` at `(-1.6, 0.3, -1.4)`
- All materials `MeshLambertMaterial` with `flatShading: true` — faceted, no smooth normals. 41 meshes total.

### Head construction
- `shape(x,y,z)` squashes a unit sphere into a skull (narrower jaw, flattened back) — every part is baked through it so features sit on one consistent surface.
- Skull is a `SphereGeometry(1, 18, 14)` with **per-vertex colors** painting stubble on the jaw and cheeks (base skin lerped toward `#2b1f1a`-tinted shadow).
- Features are individually baked primitives: cone nose, sphere eyes/irises/pupils, box brows, torus+sphere ears (helix / bowl / lobe), sphere moustache halves with curled tips, half-torus smile with a box of teeth, box sideburns.
- Hair is four masses that overlap into one silhouette: crown cap (`SphereGeometry` phi 0→0.33π), **rear bridge patch** (theta π→2π, phi 0.15π→0.6π — this is what closes the crown-to-mullet gap; don't drop it), mullet mass, and chunky box "locks" along the hairline plus sphere tufts on top.
- Palette: skin `#e3ab7f` (prop-driven), hair `#17110f`, brows `#1d1512`, moustache `#241812`, ear inner `#c98a63`, eye white `#f4f1ea`, iris `#3a2a1c`, pupil `#0d0908`, mouth `#8a3a3a`, teeth `#f2efe6`, chin stubble `#3a2a20`.

### Sculpt interaction
Per mesh, three vertex arrays are kept: `rest` (original), `base` (accumulated permanent deformation), and the live `position` attribute.

1. **Pointer down on the head** — raycast; if it hits, build a plane through the hit point facing the camera, and store the hit point in *head-local* space as the brush center.
2. **Pointer down on empty space** — orbit mode instead (drag spins the head with inertia).
3. **Pointer move** — intersect the ray with that plane, take the world delta, rotate it into head-local space via the inverse of the head quaternion.
4. **Every frame** — for each vertex: `pos = rest + base + delta * w`, where the falloff is
   `w = (1 - d²/r²)²` for `d < r`, else `0`, with `d` = distance from the brush center to `rest+base` and `r` = brush radius (default `0.52`).
   Then `computeVertexNormals()` so the facets relight.
5. **Pointer up** — bake: `base += delta * w` per vertex, so the stretch is permanent.

### Reset (right-click / two-finger tap) — the wobble
Right-click (`contextmenu`, prevented) or `touchstart` with `>1` touches triggers reset. `base` decays toward zero with an exponential-per-frame factor and a spring overshoot, so the mesh springs past neutral and settles — the N64 jelly feel. Below ~0.002 it snaps to exactly zero. Reset is cancelled if the user grabs again mid-flight.

### Idle motion
`rotation.y = spin.y + sin(t*0.35)*0.12`, `rotation.x = spin.x + sin(t*0.5)*0.03`, `position.y = sin(t*0.8)*0.02`. Orbit velocity decays `*0.9` per frame; `spin.x` clamped to ±0.6.

### Cursor
`grab` idle → `grabbing` while sculpting → `move` while orbiting.

---

## Interactions & Behavior

| Trigger | Result |
|---|---|
| Click `PRESS START` / `Enter` on Title | → File select |
| `← →` on File select | move selection ±1 |
| `↑ ↓` on File select | move selection ±3 (desktop grid) / ±1 (mobile single column) — selection wraps |
| Hover a card | selects it (mouse and keyboard selection share one index) |
| Click a card / `Enter` | open File detail |
| `Esc` | close detail; if no detail open and not on Title → back to Title |
| Click close control | close detail |
| Click brand name | → Title |
| Nav item click | → that screen (clears any open detail) |
| Drag on head | sculpt |
| Drag on empty space | orbit with inertia |
| Right-click / two-finger tap | reset with wobble |

Screen transitions use the `fadein` keyframe (`.28s ease-out`) on enter.

> **Owner extension (2026-08-06, deviates from the original handoff):** screens
> now also animate OUT — the outgoing screen plays `fadeout` (`.22s ease-in`,
> sinks down + fades) while the incoming one plays `fadein`, giving a crossfade.
> The head no longer snaps between screen positions: its wrapper carries a
> `transition` on `left/top/width/height/opacity` (`.34s`/`.28s ease-out`) so it
> glides. Placements are normalised to `vw`/`vh` (no `auto`) so every edge
> interpolates; the glide uses real geometry, never `transform: scale`, so the
> pixel-crunch buffer stays correctly sized. The head still never unmounts and
> sculpt state still persists. `prefers-reduced-motion: reduce` zeroes all of it.

## State Management

```ts
{
  screen: 'boot' | 'work' | 'about' | 'contact',
  hover: string | null,      // nav key or `p${index}`
  sel: number,               // 0..5, selected project card
  detail: number | null,     // open project index
  w: number, h: number       // viewport, for the responsive branch
}
```

- Breakpoint: **`w < 720` = mobile.** Driven by a `resize` listener (in Next.js, prefer a `useMediaQuery`/`matchMedia` hook and guard for SSR — render the desktop branch on the server or defer to `useEffect`).
- Coarse-pointer detection: `matchMedia('(pointer: coarse)').matches || isMobile` — swaps hint copy and the close-button label.
- Keyboard handler is a `window` `keydown` listener; remove on unmount.
- No data fetching. Project content is a static array (see `PROJECTS` and `SKILLS` in `reference/Portfolio Prototype.dc.html`) — **all copy is placeholder and should be replaced with real projects.**

## Design Tokens

**Colors**

| Token | Hex | Use |
|---|---|---|
| bg deep | `#05050e` | page base, active-nav text |
| bg mid | `#101040` | gradient mid |
| bg blue | `#22246b` | gradient center |
| panel | `rgba(9,10,38,.96)` | detail sheet |
| card idle | `rgba(12,14,58,.86)` | project card |
| card active | `rgba(48,56,190,.92)` | selected card |
| nav bar (mobile) | `rgba(7,8,32,.94)` | bottom bar |
| border blue | `#3b45b8` | all borders |
| border shadow | `#141a63` | card drop shadow |
| accent yellow | `#ffd23f` | primary accent, active state, stars, meters |
| accent shadow | `#7a5f00` / `#4a3200` | yellow drop shadows |
| accent red | `#ff4d4d` | `PRESS` |
| red shadow | `#3a0000` | |
| button blue | `#242a9e` / shadow `#10144f` | secondary CTA |
| text primary | `#dfe3ff` | body chrome |
| text bright | `#fff` / `#eaeeff` | titles, fact values |
| text muted | `#9aa2e8` | nav, subtitles |
| text dim | `#8f97dd` | hints |
| text dimmer | `#7b83c9` / `#6e77c4` | stack line, status bar |
| prose | `#c2c9f5` / `#c8cff8` / `#a8b0ee` | body copy |
| watermark | `#5b62d8` / shadow `#2a2e8a` | DEV/64 grid |
| meter track | `#141860` | skill bar |
| star empty | `#2b3184` | |

**Typography**
- Display/UI: `'Press Start 2P'`, sizes 7 / 8 / 9 / 10 / 11 / 12 / 13 / 15 / 20 / 22 / 26 / 30px
- Prose: `'JetBrains Mono'` 400/700, sizes 12 / 13 / 14 / 15 / 16px, `line-height` 1.55–1.8
- `letter-spacing`: 1px (hints), 2px (subtitles/labels), 3px (section titles)
- Pixel text is never below 7px, and only at 7–9px for secondary hints; body prose never below 12px.

**Spacing** — 4 / 6 / 8 / 9 / 10 / 11 / 12 / 14 / 16 / 18 / 20 / 22 / 24 / 26 / 34 / 44 px

**Borders / shadows / radius**
- Borders: `2px` (meters, facts divider, mobile close) and `3px` (cards, panels, nav bar) solid
- **Radius is always `0`** — hard pixel edges everywhere. Do not soften.
- Hard offset shadows only: `0 6px 0 <color>` (cards), `0 5px 0 <color>` (buttons), `0 3px 0` / `0 4px 0` (text shadows). Plus one soft panel shadow `0 24px 60px rgba(0,0,0,.6)` and the vignette.

**Motion** — `blink 1.4s steps(1,end)`, `swell 6s ease-in-out`, `fadein .28s ease-out`, card `transform .12s`

**Touch targets** — mobile minimum 44px; nav items 52px, CTAs 52px, detail close 48px.

## Assets
None. No images, no icon fonts, no SVG — every visual is CSS or generated three.js geometry. The two Google Fonts (Press Start 2P, JetBrains Mono) are the only external dependency; self-host them via `next/font/google` in the target project.

## Files

In `reference/`:

| File | What it is |
|---|---|
| `sculpt-face.js` | **The real three.js source.** Head geometry + sculpt/reset math. Port this. |
| `Portfolio Prototype.dc.html` | The full responsive portfolio — layout, copy, state machine, all inline styles. Primary layout reference. |
| `Portfolio Mobile.dc.html` | The prototype inside a 390×844 phone frame, for checking the mobile branch. |
| `Face Sculptor.dc.html` | The standalone sculpt toy (head only, no portfolio chrome). Useful for isolating the 3D work first. |
| `ios-frame.jsx` | Device bezel used only by the mobile preview. Not part of the design. |
| `support.js` | In-house prototype runtime. **Do not port** — present only so the `.dc.html` files open in a browser. |

Open any `.dc.html` directly in a browser to interact with the live prototype.

## Suggested build order
1. Port `sculpt-face.js` into a client-only `<SculptFace>` component and get the head sculpting in isolation (dynamic import with `ssr:false` — it touches `window` and WebGL).
2. Build the shared stage: gradient, watermark grid, scanlines, vignette, brand, nav.
3. Add the screen state machine and the four screens.
4. Layer in keyboard nav and the mobile branch.
5. Replace all placeholder copy with real projects and links.
