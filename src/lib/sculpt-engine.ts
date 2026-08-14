import * as THREE from 'three';

/**
 * Raw three.js head engine, ported from
 * docs/design-handoff/reference/sculpt-face.js.
 *
 * The geometry constants and the sculpt/reset math are copied verbatim from
 * the reference (per the design contract). Structural changes: the
 * `<sculpt-face>` custom element is replaced by a `createSculptFace` factory so
 * a React component can own the DOM node, plus a real `dispose` that removes the
 * window-level pointer listeners the reference leaked. Deliberate deviation: the
 * camera sits further back than the reference (z 5.4) and is now device-dependent
 * — 7.2 on desktop, 9.5 on mobile — so the full-bleed head keeps vertical margin
 * to stretch into and, on narrow phones, is small enough that the ears clear the
 * screen edges. Distance is a live prop (`setCameraZ`); the head never remounts.
 *
 * Further deliberate deviations (owner-requested, do NOT "restore" from the
 * reference): `shape()` is rounder than the reference tear-drop — wider sides,
 * softer jaw taper, no crown elongation; the ear cluster x offsets are pushed
 * out to match the wider skull; and extra temple/behind-ear hair shells plus a
 * taller sideburn close the bald gap between the cap and the ear.
 */

const TAU = Math.PI * 2;

/* ---------- geometry helpers (verbatim) ---------- */

// Shared "head space" squash so every part sits on the same skull.
// Rounder than the reference: wider sides, gentler jaw taper, no crown stretch.
function shape(x: number, y: number, z: number, inflate = 1): [number, number, number] {
  x *= 0.93; z *= 0.92;
  const t = Math.max(0, (-0.1 - y) / 1.0);
  x *= 1 - 0.3 * t;
  z *= 1 - 0.12 * t;
  if (y < -0.4 && z > 0) z += 0.06;
  if (z < -0.35) z *= 0.92;
  if (z > 0.55) z -= 0.1 * (z - 0.55);
  return [x * inflate, y * inflate, z * inflate];
}

function applyShape(geo: THREE.BufferGeometry, inflate = 1): THREE.BufferGeometry {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = shape(p.getX(i), p.getY(i), p.getZ(i), inflate);
    p.setXYZ(i, x, y, z);
  }
  return geo;
}

interface BakeOpts {
  s?: [number, number, number];
  r?: [number, number, number];
  t?: [number, number, number];
}

function bake(geo: THREE.BufferGeometry, { s = [1, 1, 1], r = [0, 0, 0], t = [0, 0, 0] }: BakeOpts = {}): THREE.BufferGeometry {
  geo.scale(s[0], s[1], s[2]);
  if (r[0]) geo.rotateX(r[0]);
  if (r[1]) geo.rotateY(r[1]);
  if (r[2]) geo.rotateZ(r[2]);
  geo.translate(t[0], t[1], t[2]);
  return geo;
}

function part(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, opts?: BakeOpts): THREE.Mesh {
  const g = bake(geo, opts).toNonIndexed();
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return m;
}

/* ---------- the head (verbatim) ---------- */

function buildFaceHead(skin: string): { group: THREE.Group; pickable: THREE.Mesh[] } {
  const group = new THREE.Group();
  const pickable: THREE.Mesh[] = [];

  // skull + jaw, with painted-on stubble via vertex colors
  const hg = applyShape(new THREE.SphereGeometry(1, 18, 14)).toNonIndexed();
  hg.computeVertexNormals();
  const pos = hg.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const base = new THREE.Color(skin);
  const shadow = new THREE.Color(skin).multiplyScalar(0.72).lerp(new THREE.Color(0x2b1f1a), 0.28);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let stub = 0;
    if (z > -0.1) {
      const jaw = THREE.MathUtils.smoothstep(-y, 0.05, 0.55);
      const cheek = THREE.MathUtils.smoothstep(Math.abs(x) * 0.6 - y * 0.5, 0.1, 0.6);
      stub = Math.min(1, jaw * 0.9 + cheek * 0.45);
    }
    c.copy(base).lerp(shadow, stub * 0.85);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  hg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const head = new THREE.Mesh(hg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  group.add(head); pickable.push(head);

  const HAIR = 0x17110f, BROW = 0x1d1512, TASH = 0x241812;

  // nose — ball only, no cone bridge (owner call)
  const nose = part(new THREE.SphereGeometry(0.2, 8, 6), skin,
    { s: [1, 0.9, 0.95], t: [0, -0.08, 0.86] });
  group.add(nose); pickable.push(nose);

  // eyes
  for (const sx of [-1, 1]) {
    group.add(part(new THREE.SphereGeometry(0.155, 10, 8), 0xf4f1ea,
      { s: [1.05, 0.88, 0.65], t: [sx * 0.29, 0.15, 0.73] }));
    group.add(part(new THREE.SphereGeometry(0.075, 8, 6), 0x3a2a1c,
      { s: [1, 1, 0.7], t: [sx * 0.31, 0.12, 0.85] }));
    group.add(part(new THREE.SphereGeometry(0.035, 6, 5), 0x0d0908,
      { s: [1, 1, 0.7], t: [sx * 0.315, 0.12, 0.89] }));
    // thick brows
    group.add(part(new THREE.BoxGeometry(0.34, 0.1, 0.11), BROW,
      { r: [0, 0, sx * 0.17], t: [sx * 0.32, 0.36, 0.79] }));
    // ears: outer helix, inner bowl, lobe — pushed out to clear the wider skull
    group.add(part(new THREE.TorusGeometry(0.15, 0.055, 5, 9), skin,
      { s: [1, 1.25, 0.85], r: [0, Math.PI / 2, sx * 0.12], t: [sx * 0.9, 0.0, 0.05] }));
    group.add(part(new THREE.SphereGeometry(0.13, 7, 5), 0xc98a63,
      { s: [0.42, 1.1, 0.75], t: [sx * 0.87, -0.01, 0.05] }));
    group.add(part(new THREE.SphereGeometry(0.075, 6, 5), skin,
      { s: [0.55, 1, 0.8], t: [sx * 0.89, -0.19, 0.04] }));
    // sideburns — taller, reaching up to meet the temple hair
    group.add(part(new THREE.BoxGeometry(0.11, 0.62, 0.34), HAIR,
      { t: [sx * 0.79, 0.12, 0.16] }));
  }

  // moustache — handlebar
  for (const sx of [-1, 1]) {
    group.add(part(new THREE.SphereGeometry(0.19, 8, 6), TASH,
      { s: [1.5, 0.5, 0.55], r: [0, 0, sx * 0.1], t: [sx * 0.16, -0.3, 0.82] }));
    group.add(part(new THREE.SphereGeometry(0.1, 7, 5), TASH,
      { s: [0.9, 1.1, 0.7], r: [0, 0, sx * 0.4], t: [sx * 0.4, -0.24, 0.72] }));
  }

  // smile + teeth
  const mouth = part(new THREE.TorusGeometry(0.22, 0.055, 5, 12, Math.PI), 0x8a3a3a,
    { r: [0, 0, Math.PI], s: [1, 0.7, 0.6], t: [0, -0.4, 0.79] });
  group.add(mouth);
  group.add(part(new THREE.BoxGeometry(0.32, 0.09, 0.1), 0xf2efe6, { t: [0, -0.395, 0.79] }));
  // chin stubble tuft
  group.add(part(new THREE.SphereGeometry(0.16, 7, 5), 0x3a2a20,
    { s: [1, 0.55, 0.4], t: [0, -0.58, 0.7] }));

  // hair: cap (front stays short, only over the crown)
  const cap = applyShape(new THREE.SphereGeometry(1, 16, 12, 0, TAU, 0, Math.PI * 0.33), 1.07);
  const capMesh = part(cap, HAIR, { t: [0, -0.04, -0.04] });
  group.add(capMesh); pickable.push(capMesh);

  // hair: bridge patch over the back of the crown, closing the gap to the mullet
  const bridge = applyShape(new THREE.SphereGeometry(1, 14, 10, Math.PI, Math.PI, Math.PI * 0.15, Math.PI * 0.45), 1.08);
  const bridgeMesh = part(bridge, HAIR, { t: [0, -0.08, -0.08] });
  group.add(bridgeMesh); pickable.push(bridgeMesh);

  // hair: temple shells down each side, closing the bald gap between the cap
  // edge and the ear / sideburn. phi 0 is -x, phi PI is +x.
  for (const sx of [-1, 1]) {
    const phiC = sx < 0 ? 0 : Math.PI;
    const temple = applyShape(
      new THREE.SphereGeometry(1, 10, 8, phiC - Math.PI * 0.26, Math.PI * 0.52, Math.PI * 0.2, Math.PI * 0.22),
      1.06,
    );
    const templeMesh = part(temple, HAIR, { t: [0, -0.02, -0.06] });
    group.add(templeMesh); pickable.push(templeMesh);
    // filler behind the ear, tying the temple into the mullet
    group.add(part(new THREE.SphereGeometry(0.24, 7, 5), HAIR,
      { s: [0.5, 1.3, 1.0], t: [sx * 0.78, 0.02, -0.3] }));
  }

  // hair: mullet mass at the back, overlapping the bridge
  const back = applyShape(new THREE.SphereGeometry(1, 14, 10), 1.02);
  const backMesh = part(back, HAIR, { s: [0.82, 0.7, 0.68], t: [0, -0.32, -0.36] });
  group.add(backMesh); pickable.push(backMesh);
  group.add(part(new THREE.SphereGeometry(0.34, 9, 7), HAIR, { s: [1.1, 1.5, 0.8], t: [0, -0.85, -0.5] }));
  for (const sx of [-1, 1]) {
    group.add(part(new THREE.ConeGeometry(0.14, 0.5, 5), HAIR,
      { r: [0.25, 0, sx * 0.15], t: [sx * 0.42, -0.95, -0.4] }));
  }

  // hair: chunky messy fringe along the hairline
  const locks: BakeOpts[] = [
    { t: [-0.5, 0.5, 0.32], r: [0.3, 0.4, -0.55], s: [1, 0.9, 1] },
    { t: [-0.26, 0.62, 0.55], r: [0.35, 0.15, -0.28], s: [1.05, 1, 1] },
    { t: [0.02, 0.66, 0.62], r: [0.38, 0, 0.05], s: [1.1, 1, 1] },
    { t: [0.3, 0.62, 0.53], r: [0.35, -0.15, 0.3], s: [1, 1, 1] },
    { t: [0.52, 0.48, 0.3], r: [0.3, -0.4, 0.6], s: [0.95, 0.9, 1] },
  ];
  for (const l of locks) {
    group.add(part(new THREE.BoxGeometry(0.3, 0.2, 0.2), HAIR, l));
  }
  // messy volume on top
  const tufts: BakeOpts[] = [
    { t: [-0.34, 0.86, 0.12], s: [1.1, 0.8, 1.2] },
    { t: [0.06, 0.98, 0.1], s: [1.3, 0.85, 1.2] },
    { t: [0.42, 0.84, 0.06], s: [1.05, 0.8, 1.15] },
    { t: [-0.1, 0.82, -0.5], s: [1.4, 0.9, 1.2] },
  ];
  for (const tf of tufts) {
    group.add(part(new THREE.SphereGeometry(0.26, 7, 5), HAIR, tf));
  }

  return { group, pickable };
}

/* ---------- the avatar head (Konami secret) ---------- */

/**
 * Ported verbatim from `docs/design_handoff_avatar_head/reference/sculpt-avatar.js`
 * (`buildHead`, lines 47-71): the owner's Discord avatar as a round low-poly
 * skull with two dot eyes and an L-shaped nose. Four meshes, only the skull is
 * pickable.
 *
 * Same engine as the face — identical sculpt brush, spring reset, lights and
 * camera — so nothing outside `buildHead` was ported. The avatar reference's own
 * `shape()` is deliberately absent: its `buildHead` never calls `applyShape`, it
 * bakes a plain squashed sphere, so the site's owner-tuned `shape()` is untouched.
 *
 * Deviation: `skin`/`ink` are parameters rather than the handoff's fixed
 * `#d6d6d6` / `0x22252b`, because this head only ever appears in the Game Boy
 * secret mode and has to sit in that palette.
 */
function buildAvatarHead(skin: string, ink: string): { group: THREE.Group; pickable: THREE.Mesh[] } {
  const group = new THREE.Group();
  const pickable: THREE.Mesh[] = [];

  // round, faintly squashed skull
  const hg = bake(new THREE.SphereGeometry(1, 20, 16), { s: [1, 1, 0.9] }).toNonIndexed();
  hg.computeVertexNormals();
  const head = new THREE.Mesh(hg, new THREE.MeshLambertMaterial({ color: skin, flatShading: true }));
  group.add(head); pickable.push(head);

  // two small dot eyes, sitting just proud of the surface
  for (const sx of [-1, 1]) {
    group.add(part(new THREE.SphereGeometry(0.105, 9, 7), ink,
      { s: [1, 1, 0.5], t: [sx * 0.4, 0.04, 0.83] }));
  }

  // nose: an L — short foot bottom-left, long limb kicking up 45° to the right
  group.add(part(new THREE.CapsuleGeometry(0.045, 0.1, 3, 8), ink,
    { s: [1, 1, 0.5], r: [0, 0, Math.PI / 2], t: [-0.07, -0.09, 0.9] }));
  group.add(part(new THREE.CapsuleGeometry(0.045, 0.24, 3, 8), ink,
    { s: [1, 1, 0.5], r: [0, 0, Math.PI / 4], t: [-0.06, 0.01, 0.9] }));

  return { group, pickable };
}

/** The bare skull reads much smaller than the face's hair silhouette at the
 *  same camera distance, so it is scaled up to fill a comparable box rather
 *  than moving the (screen-layout-coupled) camera. */
const VARIANT_SCALE: Record<HeadVariant, number> = { face: 1, avatar: 1.1 };

/* ---------- factory ---------- */

/** Which head is on screen. `avatar` is the Konami secret mode's Discord head. */
export type HeadVariant = 'face' | 'avatar';

export interface SculptFaceOptions {
  skin?: string;
  brush?: number;
  pixel?: number;
  /** Camera distance on the z axis. Larger = head appears smaller. */
  cameraZ?: number;
}

export interface SculptFaceHandle {
  dispose(): void;
  /** Move the camera in/out live (head stays mounted, sculpt state persists). */
  setCameraZ(z: number): void;
  /**
   * Swap which head is rendered, in place. The renderer, scene, camera and
   * lights are untouched and the component never remounts, so this does not
   * break the never-unmount rule.
   *
   * Sculpt deformation DOES reset across a swap, by design: `rest`/`base` are
   * per-geometry vertex buffers and the two heads share no vertex count or
   * layout, so there is nothing to carry over. Orientation (`spin`) is kept so
   * the new head arrives facing the way the old one did.
   */
  setHead(variant: HeadVariant, colors?: { skin?: string; ink?: string }, opts?: { instant?: boolean }): void;
}

/* Mesh-scramble envelope for a head swap. The vertices blow apart into static,
   the geometry is exchanged at peak noise so the change itself is never seen,
   then the new head reassembles. Total duration matches the CSS `glitch`
   keyframes in globals.css (GLITCH_MS in Stage.tsx) — keep the three in sync. */
const SCRAMBLE_PEAK_MS = 140;   // fall apart
const SCRAMBLE_SETTLE_MS = 240; // reassemble
/** Peak displacement in head units. The skull has radius ~1. */
const SCRAMBLE_AMP = 0.42;

interface Part {
  mesh: THREE.Mesh;
  pos: THREE.BufferAttribute;
  rest: Float32Array;
  base: Float32Array;
  snap?: Float32Array;
  /** Fixed per-vertex random field, sampled at a rotating offset each frame so
   *  the scramble shimmers like static without calling Math.random() per
   *  vertex per frame (the face head is ~20k vertices). */
  noise: Float32Array;
}

interface Grab {
  start: THREE.Vector3;
  local: THREE.Vector3;
  out: number;
  dir?: THREE.Vector3;
}

export function createSculptFace(host: HTMLElement, options: SculptFaceOptions = {}): SculptFaceHandle {
  const skin = options.skin ?? '#e3ab7f';
  const brush = options.brush ?? 0.52;
  const pixelScale = options.pixel ?? 0.42;
  const cameraZ = options.cameraZ ?? 7.2;

  host.style.display = 'block';
  if (!host.style.position) host.style.position = 'relative';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;image-rendering:pixelated;cursor:grab;touch-action:none';
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  // Pulled back from the reference (5.4) so the full-bleed head has stretch
  // margin; distance is device-dependent (desktop 7.2 / mobile 9.5) and can
  // change live via setCameraZ. See faceByScreen: rect heights scale to match.
  camera.position.set(0, 0.12, cameraZ);
  camera.lookAt(0, 0.12, 0);

  scene.add(new THREE.AmbientLight(0xa9b6d0, 0.75));
  const key = new THREE.DirectionalLight(0xfff3e0, 1.1);
  key.position.set(1.1, 1.4, 2.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8bd6, 0.5);
  rim.position.set(-1.6, 0.3, -1.4);
  scene.add(rim);

  // Mutable: `setHead` swaps all three in place. Everything downstream reads
  // them through these bindings, never through a captured copy.
  let variant: HeadVariant = 'face';
  let headGroup: THREE.Group;
  let pickable: THREE.Mesh[] = [];
  const parts: Part[] = [];

  /** Snapshot every mesh's rest positions — the basis all sculpt math works in. */
  function capture(group: THREE.Group): void {
    parts.length = 0;
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const p = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const noise = new Float32Array(p.array.length);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      parts.push({
        mesh,
        pos: p,
        rest: Float32Array.from(p.array as ArrayLike<number>),
        base: new Float32Array(p.array.length),
        noise,
      });
    });
  }

  {
    const built = buildFaceHead(skin);
    headGroup = built.group;
    pickable = built.pickable;
    headGroup.scale.setScalar(VARIANT_SCALE.face);
    scene.add(headGroup);
    capture(headGroup);
  }

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const delta = new THREE.Vector3();
  let grab: Grab | null = null;
  const spin = { x: -0.05, y: 0, vx: 0, vy: 0 };
  let orbit: { x: number; y: number } | null = null;
  let resetT = 0;
  let springK = 1;
  let springV = 0;
  // Head-swap scramble. `scrambleT` is elapsed ms into the envelope, or -1 when
  // idle; `pending` is the head waiting to be swapped in at peak noise.
  let scrambleT = -1;
  let scramble = 0;
  let noiseOffset = 0;
  let pending: { next: HeadVariant; colors?: { skin?: string; ink?: string } } | null = null;
  const clock = new THREE.Clock();
  // Double-tap / double-click reset tracking (unified for mouse + touch).
  let downPt: { x: number; y: number; t: number } | null = null;
  let lastTapT = -Infinity;
  let lastTapX = 0;
  let lastTapY = 0;

  function ndc(e: { clientX: number; clientY: number }): THREE.Vector2 {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  function weight(dx: number, dy: number, dz: number, r: number): number {
    const d2 = (dx * dx + dy * dy + dz * dz) / (r * r);
    if (d2 >= 1) return 0;
    const k = 1 - d2;
    return k * k;
  }

  function onDown(e: PointerEvent): void {
    if (e.button === 2) return;
    resetT = 0;
    downPt = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    raycaster.setFromCamera(ndc(e), camera);
    const hits = raycaster.intersectObjects(pickable, false);
    if (hits.length) {
      const n = camera.getWorldDirection(new THREE.Vector3()).negate();
      plane.setFromNormalAndCoplanarPoint(n, hits[0].point);
      const local = headGroup.worldToLocal(hits[0].point.clone());
      grab = { start: hits[0].point.clone(), local, out: 0 };
      canvas.style.cursor = 'grabbing';
    } else {
      orbit = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'move';
    }
  }

  function onMove(e: PointerEvent): void {
    if (grab) {
      raycaster.setFromCamera(ndc(e), camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        delta.copy(hit).sub(grab.start);
        // world delta -> head local direction (rotation only)
        grab.dir = delta.clone().applyQuaternion(headGroup.quaternion.clone().invert());
      }
    } else if (orbit) {
      spin.vy += (e.clientX - orbit.x) * 0.004;
      spin.vx += (e.clientY - orbit.y) * 0.003;
      orbit = { x: e.clientX, y: e.clientY };
    }
  }

  function onUp(e: PointerEvent): void {
    const dragged = !!(grab && grab.dir);
    if (grab && grab.dir) {
      // bake the current stretch in
      const r = brush, d = grab.dir, g = grab.local;
      for (const p of parts) {
        const { rest, base } = p;
        for (let i = 0; i < rest.length; i += 3) {
          const w = weight(rest[i] + base[i] - g.x, rest[i + 1] + base[i + 1] - g.y, rest[i + 2] + base[i + 2] - g.z, r);
          if (w > 0) { base[i] += d.x * w; base[i + 1] += d.y * w; base[i + 2] += d.z * w; }
        }
      }
    }
    grab = null;
    orbit = null;
    canvas.style.cursor = 'grab';

    // Double-tap (touch) / double-click (mouse) resets. A "tap" is a quick
    // press that did NOT drag (no sculpt, negligible movement); two of them
    // within 350ms and close together fire the springy reset.
    const moved = downPt ? Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) : Infinity;
    const held = downPt ? e.timeStamp - downPt.t : Infinity;
    const isTap = !dragged && moved < 10 && held < 400;
    downPt = null;
    if (!isTap) { lastTapT = -Infinity; return; }
    if (e.timeStamp - lastTapT < 350 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 44) {
      reset();
      lastTapT = -Infinity; // consume, so a third tap doesn't reset again
    } else {
      lastTapT = e.timeStamp;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }
  }

  function onContext(e: MouseEvent): void {
    // Reset moved to double-click; still suppress the browser menu over the toy.
    e.preventDefault();
  }

  function reset(): void {
    grab = null;
    for (const p of parts) p.snap = Float32Array.from(p.base);
    springK = 1;      // multiplier on the frozen deformation
    springV = 0;
    resetT = 1;
  }

  function resize(): void {
    const w = host.clientWidth || 640, h = host.clientHeight || 480;
    renderer.setPixelRatio(1);
    renderer.setSize(Math.max(64, Math.round(w * pixelScale)), Math.max(64, Math.round(h * pixelScale)), false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // setSize reallocates (and clears) the drawing buffer. The ResizeObserver
    // fires after the rAF tick but before paint, so without re-rendering here
    // the head would be painted as an empty buffer for the whole duration of a
    // CSS size transition (i.e. it vanishes while the head glides). Redraw now.
    renderer.render(scene, camera);
  }

  function tick(): void {
    const dt = Math.min(0.05, clock.getDelta());

    // idle + inertial spin
    spin.y += spin.vy;
    spin.x = THREE.MathUtils.clamp(spin.x + spin.vx, -0.6, 0.6);
    spin.vy *= 0.9; spin.vx *= 0.9;
    const t = clock.elapsedTime;
    headGroup.rotation.y = spin.y + Math.sin(t * 0.35) * 0.12;
    headGroup.rotation.x = spin.x + Math.sin(t * 0.5) * 0.03;
    headGroup.position.y = Math.sin(t * 0.8) * 0.02;

    if (resetT > 0) {
      // damped spring back to rest — overshoots and wobbles like jelly
      const stiffness = 210, damping = 11;
      const steps = 3, h = dt / steps;
      for (let n = 0; n < steps; n++) {
        springV += (-stiffness * springK - damping * springV) * h;
        springK += springV * h;
      }
      for (const p of parts) {
        const snap = p.snap!;
        const { base } = p;
        for (let i = 0; i < base.length; i++) base[i] = snap[i] * springK;
      }
      if (Math.abs(springK) < 0.004 && Math.abs(springV) < 0.05) {
        resetT = 0;
        for (const p of parts) p.base.fill(0);
      }
    }

    // Head-swap scramble envelope: apart, exchange the geometry while it is
    // unrecognisable, back together.
    if (scrambleT >= 0) {
      scrambleT += dt * 1000;
      if (scrambleT < SCRAMBLE_PEAK_MS) {
        scramble = scrambleT / SCRAMBLE_PEAK_MS;
      } else {
        if (pending) { swapNow(pending.next, pending.colors); pending = null; }
        const x = (scrambleT - SCRAMBLE_PEAK_MS) / SCRAMBLE_SETTLE_MS;
        scramble = x >= 1 ? 0 : 1 - x;
        if (x >= 1) scrambleT = -1;
      }
      // Rotate where the static is sampled from so it churns frame to frame.
      // 3-aligned to keep each vertex's xyz reading consecutive noise.
      noiseOffset += 999;
    }

    const g = grab, d = g && g.dir, r = brush;
    const amp = scramble * SCRAMBLE_AMP;
    for (const p of parts) {
      const { rest, base, pos } = p;
      const arr = pos.array as unknown as number[];
      if (d && g) {
        for (let i = 0; i < rest.length; i += 3) {
          const bx = rest[i] + base[i], by = rest[i + 1] + base[i + 1], bz = rest[i + 2] + base[i + 2];
          const w = weight(bx - g.local.x, by - g.local.y, bz - g.local.z, r);
          arr[i] = bx + d.x * w;
          arr[i + 1] = by + d.y * w;
          arr[i + 2] = bz + d.z * w;
        }
      } else {
        for (let i = 0; i < rest.length; i++) arr[i] = rest[i] + base[i];
      }
      if (amp > 0) {
        const n = p.noise, nl = n.length, off = noiseOffset % nl;
        for (let i = 0; i < arr.length; i++) arr[i] += n[(i + off) % nl] * amp;
      }
      pos.needsUpdate = true;
      p.mesh.geometry.computeVertexNormals();
    }

    renderer.render(scene, camera);
  }

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('contextmenu', onContext);

  const ro = new ResizeObserver(() => resize());
  ro.observe(host);
  resize();

  renderer.setAnimationLoop(tick);

  function setCameraZ(z: number): void {
    camera.position.z = z;
    // Refresh the world matrix so a raycast in this same tick isn't stale
    // (setFromCamera reads camera.matrixWorld without updating it).
    camera.updateMatrixWorld();
  }

  /** Free a head group's GPU resources. Without this every toggle leaks. */
  function disposeGroup(group: THREE.Group): void {
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    });
  }

  function setHead(next: HeadVariant, colors?: { skin?: string; ink?: string }, opts?: { instant?: boolean }): void {
    if (next === variant || pending?.next === next) return;

    // Abandon any in-flight interaction: `grab.local` is a point in the old
    // head's space and the spring is mid-flight against buffers about to die.
    grab = null;
    orbit = null;
    resetT = 0;
    canvas.style.cursor = 'grab';

    if (opts?.instant) {
      swapNow(next, colors);
      return;
    }
    // Hand off to the render loop: it scrambles the current head apart, calls
    // swapNow at peak noise, then reassembles. See the SCRAMBLE_* constants.
    pending = { next, colors };
    scrambleT = 0;
  }

  function swapNow(next: HeadVariant, colors?: { skin?: string; ink?: string }): void {
    scene.remove(headGroup);
    disposeGroup(headGroup);

    const built = next === 'avatar'
      ? buildAvatarHead(colors?.skin ?? '#d6d6d6', colors?.ink ?? '#22252b')
      : buildFaceHead(skin);
    headGroup = built.group;
    pickable = built.pickable;
    headGroup.scale.setScalar(VARIANT_SCALE[next]);
    scene.add(headGroup);
    capture(headGroup); // sculpt state resets here — see setHead's doc comment
    variant = next;
  }

  function dispose(): void {
    renderer.setAnimationLoop(null);
    ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('contextmenu', onContext);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    if (canvas.parentNode === host) host.removeChild(canvas);
  }

  return { dispose, setCameraZ, setHead };
}
