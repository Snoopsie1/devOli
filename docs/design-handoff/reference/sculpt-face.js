import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ---------- geometry helpers ---------- */

// Shared "head space" squash so every part sits on the same skull.
function shape(x, y, z, inflate = 1) {
  x *= 0.86; z *= 0.92;
  const t = Math.max(0, (-0.1 - y) / 1.0);
  x *= 1 - 0.5 * t;
  z *= 1 - 0.18 * t;
  if (y < -0.4 && z > 0) z += 0.06;
  if (z < -0.35) z *= 0.92;
  if (z > 0.55) z -= 0.1 * (z - 0.55);
  if (y > 0.55) y += 0.04;
  return [x * inflate, y * inflate, z * inflate];
}

function applyShape(geo, inflate = 1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = shape(p.getX(i), p.getY(i), p.getZ(i), inflate);
    p.setXYZ(i, x, y, z);
  }
  return geo;
}

function bake(geo, { s = [1, 1, 1], r = [0, 0, 0], t = [0, 0, 0] } = {}) {
  geo.scale(s[0], s[1], s[2]);
  if (r[0]) geo.rotateX(r[0]);
  if (r[1]) geo.rotateY(r[1]);
  if (r[2]) geo.rotateZ(r[2]);
  geo.translate(t[0], t[1], t[2]);
  return geo;
}

function part(geo, color, opts) {
  const g = bake(geo, opts).toNonIndexed();
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return m;
}

/* ---------- the head ---------- */

function buildHead(skin) {
  const group = new THREE.Group();
  const pickable = [];

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

  // nose
  const nose = part(new THREE.ConeGeometry(0.2, 0.46, 6), skin,
    { r: [Math.PI / 2, 0, 0], s: [1, 1, 1], t: [0, -0.02, 0.86] });
  group.add(nose); pickable.push(nose);
  group.add(part(new THREE.SphereGeometry(0.13, 7, 5), skin, { s: [1, 0.85, 0.9], t: [0, -0.1, 0.98] }));

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
    // ears: outer helix, inner bowl, lobe
    group.add(part(new THREE.TorusGeometry(0.15, 0.055, 5, 9), skin,
      { s: [1, 1.25, 0.85], r: [0, Math.PI / 2, sx * 0.12], t: [sx * 0.83, 0.0, 0.05] }));
    group.add(part(new THREE.SphereGeometry(0.13, 7, 5), 0xc98a63,
      { s: [0.42, 1.1, 0.75], t: [sx * 0.8, -0.01, 0.05] }));
    group.add(part(new THREE.SphereGeometry(0.075, 6, 5), skin,
      { s: [0.55, 1, 0.8], t: [sx * 0.82, -0.19, 0.04] }));
    // sideburns
    group.add(part(new THREE.BoxGeometry(0.09, 0.4, 0.3), HAIR,
      { t: [sx * 0.72, 0.02, 0.18] }));
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
  const locks = [
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
  const tufts = [
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

/* ---------- web component ---------- */

class SculptFace extends HTMLElement {
  static get observedAttributes() { return ['skin', 'brush', 'pixel']; }

  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.style.display = 'block';
    this.style.position = this.style.position || 'relative';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;image-rendering:pixelated;cursor:grab;touch-action:none';
    this.appendChild(canvas);
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0.12, 5.4);
    this.camera.lookAt(0, 0.12, 0);

    this.scene.add(new THREE.AmbientLight(0xa9b6d0, 0.75));
    const key = new THREE.DirectionalLight(0xfff3e0, 1.1);
    key.position.set(1.1, 1.4, 2.2);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f8bd6, 0.5);
    rim.position.set(-1.6, 0.3, -1.4);
    this.scene.add(rim);

    this.build();

    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane();
    this.hit = new THREE.Vector3();
    this.delta = new THREE.Vector3();
    this.grab = null;
    this.spin = { x: -0.05, y: 0, vx: 0, vy: 0 };
    this.orbit = null;
    this.resetT = 0;

    canvas.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('pointerup', () => this.onUp());
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.reset(); });
    // touch: a second finger down resets (right-click has no touch equivalent)
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length > 1) this.reset(); }, { passive: true });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this);
    this.resize();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  disconnectedCallback() {
    this.renderer && this.renderer.setAnimationLoop(null);
    this.ro && this.ro.disconnect();
  }

  attributeChangedCallback(name) {
    if (!this._init) return;
    if (name === 'skin') this.build();
    if (name === 'pixel') this.resize();
  }

  get brush() { return parseFloat(this.getAttribute('brush')) || 0.52; }
  get pixelScale() { return parseFloat(this.getAttribute('pixel')) || 0.42; }

  build() {
    if (this.headGroup) this.scene.remove(this.headGroup);
    let skin = this.getAttribute('skin');
    if (!skin || skin.indexOf('{') >= 0) skin = '#e3ab7f';
    const { group, pickable } = buildHead(skin);
    this.headGroup = group;
    this.pickable = pickable;
    this.scene.add(group);
    this.parts = [];
    group.traverse((o) => {
      if (!o.isMesh) return;
      const p = o.geometry.attributes.position;
      this.parts.push({
        mesh: o,
        pos: p,
        rest: Float32Array.from(p.array),
        base: new Float32Array(p.array.length),
      });
    });
  }

  resize() {
    const w = this.clientWidth || 640, h = this.clientHeight || 480;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(Math.max(64, Math.round(w * this.pixelScale)), Math.max(64, Math.round(h * this.pixelScale)), false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  ndc(e) {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  onDown(e) {
    if (e.button === 2) return;
    this.resetT = 0;
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const hits = this.raycaster.intersectObjects(this.pickable, false);
    if (hits.length) {
      const n = this.camera.getWorldDirection(new THREE.Vector3()).negate();
      this.plane.setFromNormalAndCoplanarPoint(n, hits[0].point);
      const local = this.headGroup.worldToLocal(hits[0].point.clone());
      this.grab = { start: hits[0].point.clone(), local, out: 0 };
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.orbit = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'move';
    }
  }

  onMove(e) {
    if (this.grab) {
      this.raycaster.setFromCamera(this.ndc(e), this.camera);
      if (this.raycaster.ray.intersectPlane(this.plane, this.hit)) {
        this.delta.copy(this.hit).sub(this.grab.start);
        // world delta -> head local direction (rotation only)
        this.grab.dir = this.delta.clone().applyQuaternion(this.headGroup.quaternion.clone().invert());
      }
    } else if (this.orbit) {
      this.spin.vy += (e.clientX - this.orbit.x) * 0.004;
      this.spin.vx += (e.clientY - this.orbit.y) * 0.003;
      this.orbit = { x: e.clientX, y: e.clientY };
    }
  }

  onUp() {
    if (this.grab && this.grab.dir) {
      // bake the current stretch in
      const r = this.brush, d = this.grab.dir, g = this.grab.local;
      for (const p of this.parts) {
        const { rest, base } = p;
        for (let i = 0; i < rest.length; i += 3) {
          const w = this.weight(rest[i] + base[i] - g.x, rest[i + 1] + base[i + 1] - g.y, rest[i + 2] + base[i + 2] - g.z, r);
          if (w > 0) { base[i] += d.x * w; base[i + 1] += d.y * w; base[i + 2] += d.z * w; }
        }
      }
    }
    this.grab = null;
    this.orbit = null;
    this.canvas.style.cursor = 'grab';
  }

  weight(dx, dy, dz, r) {
    const d2 = (dx * dx + dy * dy + dz * dz) / (r * r);
    if (d2 >= 1) return 0;
    const k = 1 - d2;
    return k * k;
  }

  reset() {
    this.grab = null;
    for (const p of this.parts) p.snap = Float32Array.from(p.base);
    this.springK = 1;      // multiplier on the frozen deformation
    this.springV = 0;
    this.resetT = 1;
  }

  tick() {
    const dt = Math.min(0.05, this.clock.getDelta());

    // idle + inertial spin
    this.spin.y += this.spin.vy;
    this.spin.x = THREE.MathUtils.clamp(this.spin.x + this.spin.vx, -0.6, 0.6);
    this.spin.vy *= 0.9; this.spin.vx *= 0.9;
    const t = this.clock.elapsedTime;
    this.headGroup.rotation.y = this.spin.y + Math.sin(t * 0.35) * 0.12;
    this.headGroup.rotation.x = this.spin.x + Math.sin(t * 0.5) * 0.03;
    this.headGroup.position.y = Math.sin(t * 0.8) * 0.02;

    if (this.resetT > 0) {
      // damped spring back to rest — overshoots and wobbles like jelly
      const stiffness = 210, damping = 11;
      const steps = 3, h = dt / steps;
      for (let n = 0; n < steps; n++) {
        this.springV += (-stiffness * this.springK - damping * this.springV) * h;
        this.springK += this.springV * h;
      }
      for (const p of this.parts) {
        const { snap, base } = p;
        for (let i = 0; i < base.length; i++) base[i] = snap[i] * this.springK;
      }
      if (Math.abs(this.springK) < 0.004 && Math.abs(this.springV) < 0.05) {
        this.resetT = 0;
        for (const p of this.parts) p.base.fill(0);
      }
    }

    const g = this.grab, d = g && g.dir, r = this.brush;
    for (const p of this.parts) {
      const { rest, base, pos } = p;
      const arr = pos.array;
      if (d) {
        for (let i = 0; i < rest.length; i += 3) {
          const bx = rest[i] + base[i], by = rest[i + 1] + base[i + 1], bz = rest[i + 2] + base[i + 2];
          const w = this.weight(bx - g.local.x, by - g.local.y, bz - g.local.z, r);
          arr[i] = bx + d.x * w;
          arr[i + 1] = by + d.y * w;
          arr[i + 2] = bz + d.z * w;
        }
      } else {
        for (let i = 0; i < rest.length; i++) arr[i] = rest[i] + base[i];
      }
      pos.needsUpdate = true;
      p.mesh.geometry.computeVertexNormals();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

customElements.define('sculpt-face', SculptFace);
