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
  const INK = 0x22252b;

  // round, faintly squashed skull
  const hg = bake(new THREE.SphereGeometry(1, 20, 16), { s: [1, 1, 0.9] }).toNonIndexed();
  hg.computeVertexNormals();
  const head = new THREE.Mesh(hg, new THREE.MeshLambertMaterial({ color: skin, flatShading: true }));
  group.add(head); pickable.push(head);

  // two small dot eyes, sitting just proud of the surface
  for (const sx of [-1, 1]) {
    group.add(part(new THREE.SphereGeometry(0.105, 9, 7), INK,
      { s: [1, 1, 0.5], t: [sx * 0.4, 0.04, 0.83] }));
  }

  // nose: an L — short foot at the bottom left, long limb kicking up 45deg to the right
  group.add(part(new THREE.CapsuleGeometry(0.045, 0.1, 3, 8), INK,
    { s: [1, 1, 0.5], r: [0, 0, Math.PI / 2], t: [-0.07, -0.09, 0.9] }));
  group.add(part(new THREE.CapsuleGeometry(0.045, 0.24, 3, 8), INK,
    { s: [1, 1, 0.5], r: [0, 0, Math.PI / 4], t: [-0.06, 0.01, 0.9] }));

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
    if (!skin || skin.indexOf('{') >= 0) skin = '#d6d6d6';
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

customElements.define('sculpt-avatar', SculptFace);
