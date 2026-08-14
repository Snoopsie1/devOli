# Handoff: Sculptable Discord Avatar Head (low-poly 3D)

## Overview
A live, deformable low-poly 3D head modeled on the user's Discord avatar: a round
light-grey skull with two small dark dot eyes and an L-shaped nose. The head floats,
idles with a slow sway, and can be **physically sculpted** by dragging on it — vertices
near the grab point follow the pointer with a falloff brush, and right-click (or a
second finger on touch) springs the mesh back to rest with a jelly wobble.

Deliberately excluded: the green online-status circle from the source avatar.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working
prototype of the intended look and behavior, not production code to ship as-is.
The task is to **recreate this in the target codebase's environment** (React/Next.js,
Vue, Svelte, etc.) using its established patterns. If no environment exists yet,
pick the framework that fits the project and implement there.

That said, `sculpt-avatar.js` is the exception worth porting nearly verbatim: it is
real three.js geometry + deformation + spring math with no framework coupling. Wrap it
in a client-only component rather than rewriting it.

## Fidelity
**High-fidelity.** Final colors, geometry proportions, lighting, camera, physics
constants, and interaction model. Recreate faithfully; the numbers in this document
are the design.

---

## The 3D model

Everything lives in a single `THREE.Group` ("headGroup"). All meshes use
`MeshLambertMaterial` with `flatShading: true` and non-indexed geometry — this is what
produces the hard-faceted N64 look. Every geometry is baked (scaled/rotated/translated
into its vertices) at build time so deformation math can operate in one flat local space.

### Skull
- `SphereGeometry(1, 20, 16)`, scaled `(1, 1, 0.9)` — a sphere flattened slightly
  front-to-back. 20×16 segments is the sweet spot: readable facets, enough vertices for
  smooth sculpting.
- Color: skin prop, default `#d6d6d6`.
- This is the **only pickable mesh** — sculpting raycasts hit the skull; features ride along.

### Eyes (×2)
- `SphereGeometry(0.105, 9, 7)`, scaled `(1, 1, 0.5)` (squashed into the face).
- Positions: `(±0.4, 0.04, 0.83)`.
- Color `#22252b` (INK).

### Nose — an "L"
Two capsules, both `scale (1, 1, 0.5)`, color INK, at `z = 0.9`:
1. **Foot** (short, horizontal): `CapsuleGeometry(0.045, 0.1, 3, 8)`,
   `rotateZ(π/2)`, translate `(-0.07, -0.09, 0.9)`.
2. **Long limb** (rises up-left at 45°): `CapsuleGeometry(0.045, 0.24, 3, 8)`,
   `rotateZ(π/4)`, translate `(-0.06, 0.01, 0.9)`.

The nose reads as vertically centered between the eyes. These offsets were tuned by eye —
treat them as exact.

### Camera & lighting
- `PerspectiveCamera(30, aspect, 0.1, 100)` at `(0, 0.12, 5.4)`, looking at `(0, 0.12, 0)`.
  The narrow 30° FOV keeps the head from distorting.
- `AmbientLight(0xa9b6d0, 0.75)` — cool fill.
- `DirectionalLight(0xfff3e0, 1.1)` at `(1.1, 1.4, 2.2)` — warm key.
- `DirectionalLight(0x6f8bd6, 0.5)` at `(-1.6, 0.3, -1.4)` — blue rim.

### Deliberate low-res rendering
`renderer.setPixelRatio(1)` and the drawing buffer is set to `clientSize × pixel`
(default `0.42`), then CSS-stretched to 100%/100% with `image-rendering: pixelated`.
This is the chunky-pixel effect — do not replace it with a full-res canvas.
`antialias: false`, `alpha: true`.

---

## Interactions & Behavior

| Input | Result |
|---|---|
| Left-drag **on the head** | Sculpt: pull vertices toward the pointer |
| Left-drag **off the head** | Orbit: inertial spin of the head group |
| Right-click | Reset with spring wobble |
| Two-finger touch | Reset (touch equivalent of right-click) |
| Idle | Continuous slow sway + bob |

### Sculpt brush
On pointer-down, raycast the skull. Build a drag plane through the hit point facing the
camera; track the pointer against it to get a world-space delta, then rotate that delta
into head-local space via the inverse of `headGroup.quaternion`.

Falloff weight for a vertex at local distance `d` from the grab point, brush radius `r`:

```js
const d2 = (dx*dx + dy*dy + dz*dz) / (r*r);
const w  = d2 >= 1 ? 0 : (1 - d2) * (1 - d2);   // smooth quadratic falloff
```

Each frame, every vertex renders at `rest + base + delta * w`, where `rest` is the
original geometry and `base` is accumulated deformation. On pointer-up the current
stretch is **baked into `base`**, so edits stack across strokes. Normals are recomputed
per mesh per frame (`computeVertexNormals()`) — required, or the facets don't relight.

### Reset spring
Snapshot `base` into `snap`, then run a damped spring on a scalar multiplier
`springK: 1 → 0` with **stiffness 210, damping 11**, integrated at **3 substeps per
frame**. Each frame `base[i] = snap[i] * springK`. Because it's underdamped, `springK`
overshoots negative and oscillates — that's the jelly bounce. Settle when
`|springK| < 0.004 && |springV| < 0.05`, then zero `base`.

### Idle & orbit motion
```js
spin.y += spin.vy;  spin.x = clamp(spin.x + spin.vx, -0.6, 0.6);
spin.vy *= 0.9;     spin.vx *= 0.9;              // friction
rotation.y = spin.y + sin(t * 0.35) * 0.12;
rotation.x = spin.x + sin(t * 0.5)  * 0.03;
position.y =          sin(t * 0.8)  * 0.02;
```
Orbit drag adds `dx * 0.004` to `spin.vy` and `dy * 0.003` to `spin.vx`.
Initial `spin.x = -0.05` (a slight chin-down tilt).

### Cursor
`grab` at rest → `grabbing` while sculpting → `move` while orbiting.
Canvas needs `touch-action: none`.

---

## Props / tweakable parameters

| Prop | Type | Default | Range | Effect |
|---|---|---|---|---|
| `skin` | color | `#d6d6d6` | `#d6d6d6`, `#eceff2`, `#b3b8bf`, `#8b9199` | Skull color. Changing it rebuilds the mesh (resets sculpting) |
| `brush` | range | `0.52` | 0.25 – 1.4 | Sculpt falloff radius in head units |
| `crunch` → `pixel` | range | `0.42` | 0.12 – 1 | Render-buffer scale; lower = chunkier pixels |

---

## The showcase screen (`Avatar Sculptor.dc.html`)

Full-viewport stage, `min-height: 100vh`, the canvas absolutely positioned to fill it.

- **Background**: `radial-gradient(120% 90% at 50% 45%, #2b2f36 0%, #1d2025 45%, #101215 100%)`
- **Scanlines** (z 3, `pointer-events: none`):
  `repeating-linear-gradient(to bottom, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)`,
  `mix-blend-mode: multiply`
- **Vignette** (z 4): `box-shadow: inset 0 0 180px 60px rgba(0,0,0,.7)`
- **Canvas**: z 2, `inset: 0`
- **Caption block**: z 5, `bottom: 34px`, centered column, `gap: 14px`, non-interactive
  - "DRAG TO SCULPT" — 26px Press Start 2P; DRAG/SCULPT `#e8ebef` with
    `text-shadow: 0 4px 0 #3a3f47`, "TO" `#9aa1ab` with `0 4px 0 #2b2f36`.
    Animated `blink 1.4s steps(1,end) infinite` (opacity 1 → .25 at 60%).
  - Sub-line — 11px, `letter-spacing: 1px`, `#7d848e`:
    "RIGHT-CLICK RESETS · DRAG THE VOID TO TURN THE HEAD"

### Design tokens
| Token | Value |
|---|---|
| Skull grey | `#d6d6d6` |
| Ink (eyes, nose) | `#22252b` |
| Backdrop mid / deep | `#2b2f36` / `#1d2025` / `#101215` |
| Text bright / mid / dim | `#e8ebef` / `#9aa1ab` / `#7d848e` |
| Body background | `#1b1d21` |
| Link / link hover | `#d6d6d6` / `#ffffff` |
| Display font | Press Start 2P (Google Fonts), 26px / 11px |

---

## Implementation notes

1. **three.js r169**, loaded as ES modules. In a bundler, `npm i three@0.169.0` and
   `import * as THREE from 'three'`.
2. **Client-only.** No SSR — in Next.js use `'use client'` and mount inside `useEffect`,
   or `dynamic(..., { ssr: false })`.
3. **Port `sculpt-avatar.js` as-is.** Move `buildHead` and the helpers
   (`bake`, `part`, `weight`) out unchanged; replace only the custom-element shell
   (`connectedCallback` → `useEffect` setup, `attributeChangedCallback` → prop effects,
   `disconnectedCallback` → cleanup).
4. **Cleanup matters**: `renderer.setAnimationLoop(null)`, disconnect the
   `ResizeObserver`, remove the window-level `pointermove`/`pointerup` listeners, and
   dispose geometries/materials/renderer.
5. `pointermove`/`pointerup` are on **window**, not the canvas — drags must survive the
   pointer leaving the element.
6. Sizing is driven by a `ResizeObserver` on the host element, not window resize.
7. `preserveDrawingBuffer: true` is set so the canvas can be screenshotted; drop it if
   you don't need that (small perf win).

## Assets
None. No images, no textures, no models — all geometry is generated in code. Only
external dependency is the Press Start 2P webfont and three.js.

## Files
| File | Role |
|---|---|
| `reference/sculpt-avatar.js` | **The model.** Geometry, sculpt brush, spring reset, render loop. Port this. |
| `reference/Avatar Sculptor.dc.html` | The showcase screen: layout, background treatment, captions, prop wiring. |
| `reference/Face Sculptor.dc.html` | Sibling prototype — the earlier photoreal-ish head (mullet/moustache) on the same engine, for comparison. |
| `reference/sculpt-face.js` | Engine variant behind that sibling; identical physics, different `buildHead`. |
| `reference/support.js` | Prototype runtime only — **do not port.** |
