// Three.js layer for BLOCKCHAIN 101 · EP01. Renders deterministic 3D passes (pure functions of t) into offscreen WebGL canvases
// that ep01.js composites into the 2D film (with a cheap blur-bloom). Exposes window.T3 once ready.
//   chain(t)        rotating ring of neon blocks linked by glowing hash links, inside a star field
//   tunnel(t)       wireframe hexagon tunnel fly-through (section openers)
//   globe(t, f)     sphere of nodes that assemble (f: 0→1) into a decentralized mesh with travelling packets
//   coin(key, t)    spinning 3D coin (btc | eth | sol) on a 512² canvas
import * as THREE from '../vendor/three.module.min.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const hash = (a, b = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 3));

const big = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
big.setPixelRatio(1); big.setSize(W, H, false); big.setClearColor(0x000000, 0);
const small = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
small.setPixelRatio(1); small.setSize(512, 512, false); small.setClearColor(0x000000, 0);

const CY = new THREE.Color('#00F0FF'), MG = new THREE.Color('#FF2BD6'), VIO = new THREE.Color('#9B6BFF');

function stars(n, r, size = 0.07) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = hash(i, 1) * 2 - 1, a = hash(i, 2) * TAU, rr = r * (0.4 + 0.6 * hash(i, 3)), s = Math.sqrt(1 - u * u); p[i * 3] = Math.cos(a) * s * rr; p[i * 3 + 1] = u * rr; p[i * 3 + 2] = Math.sin(a) * s * rr; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfd8ff, size, transparent: true, opacity: 0.75, depthWrite: false }));
}

// ---------- chain ring ----------
const chain = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(38, W / H, 0.1, 400), group: new THREE.Group(), pulses: [] };
{
  const { scene, group } = chain; scene.add(group); scene.add(stars(1600, 90, 0.12));
  const N = 12, R = 7.2, pos = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU, x = Math.cos(a) * R, z = Math.sin(a) * R, y = Math.sin(a * 2) * 0.9; pos.push(new THREE.Vector3(x, y, z));
    const col = i % 2 ? MG : CY, cube = new THREE.Group(); cube.position.set(x, y, z); cube.rotation.set(0.4, a, 0.2);
    cube.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, 1.7, 1.7)), new THREE.LineBasicMaterial({ color: 0xffffff })));
    cube.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })));
    group.add(cube);
  }
  for (let i = 0; i < N; i++) {
    const a = pos[i], b = pos[(i + 1) % N], g = new THREE.BufferGeometry().setFromPoints([a, b]);
    group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: VIO, transparent: true, opacity: 0.8 })));
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); group.add(p); chain.pulses.push([p, a, b, hash(i, 5)]);
  }
  chain.cam.position.set(0, 7.5, 24); chain.cam.lookAt(0, 0, 0);
}
function renderChain(t) {
  chain.group.rotation.y = t * 0.35; chain.group.rotation.x = 0.18 + Math.sin(t * 0.4) * 0.05;
  chain.group.children.forEach((o, i) => { if (o.type === 'Group') { o.rotation.y = t * 0.8 + i; o.rotation.x = 0.4 + t * 0.5; } });
  for (const [p, a, b, ph] of chain.pulses) p.position.lerpVectors(a, b, (t * 0.7 + ph) % 1);
  big.render(chain.scene, chain.cam); return big.domElement;
}

// ---------- tunnel ----------
const tun = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(70, W / H, 0.1, 300), rings: [] };
{
  const RINGS = 40, SP = 3;
  for (let i = 0; i < RINGS; i++) {
    const pts = []; for (let k = 0; k <= 6; k++) { const a = k / 6 * TAU + Math.PI / 6; pts.push(new THREE.Vector3(Math.cos(a) * 6, Math.sin(a) * 6, 0)); }
    const col = new THREE.Color().lerpColors(CY, MG, (i % 8) / 7), ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true }));
    ring.position.z = -i * SP; tun.scene.add(ring); tun.rings.push(ring);
    if (i % 2 === 0) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6, g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a) * 6, Math.sin(a) * 6, -i * SP), new THREE.Vector3(Math.cos(a) * 6, Math.sin(a) * 6, -(i + 1) * SP)]); tun.scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: VIO, transparent: true, opacity: 0.45 }))); }
  }
  const sg = new THREE.BufferGeometry(), sp = new Float32Array(600 * 3); for (let i = 0; i < 600; i++) { const a = hash(i, 8) * TAU, r = 1 + hash(i, 9) * 4.5; sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = Math.sin(a) * r; sp[i * 3 + 2] = -hash(i, 10) * RINGS * SP; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); tun.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.9 })));
}
function renderTunnel(t) {
  const z = -((t * 22) % 60); tun.cam.position.set(Math.sin(t * 1.3) * 0.6, Math.cos(t * 1.1) * 0.4, z); tun.cam.lookAt(Math.sin(t * 1.3) * 0.3, 0, z - 10); tun.cam.rotation.z = t * 0.5;
  for (const r of tun.rings) { const d = Math.abs(r.position.z - z); r.material.opacity = Math.max(0, 1 - d / 70); }
  big.render(tun.scene, tun.cam); return big.domElement;
}

// ---------- globe of nodes ----------
const glb = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(36, W / H, 0.1, 300), group: new THREE.Group(), nodes: [], links: [], pkts: [] };
{
  const { scene, group } = glb; scene.add(group); scene.add(stars(900, 80, 0.1));
  const NN = 84, R = 4.4;
  for (let i = 0; i < NN; i++) { const y = 1 - (i + 0.5) / NN * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; const v = new THREE.Vector3(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R);
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color: i % 7 === 0 ? MG : CY })); group.add(m); glb.nodes.push([m, v, hash(i, 3)]); }
  for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) { const a = glb.nodes[i][1], b = glb.nodes[j][1]; if (a.distanceTo(b) > 1.75) continue;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: CY, transparent: true, opacity: 0.5 })); group.add(l); glb.links.push([l, i, j]); }
  for (let k = 0; k < 40; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); group.add(p); glb.pkts.push([p, glb.links[(k * 7) % glb.links.length], hash(k, 4)]); }
  group.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 0.985, 2)), new THREE.LineBasicMaterial({ color: VIO, transparent: true, opacity: 0.12 })));
  glb.cam.position.set(0, 1.8, 21); glb.cam.lookAt(0, 0, 0);
}
function renderGlobe(t, f = 1) {
  glb.group.rotation.y = t * 0.3; glb.group.rotation.x = 0.25;
  const cur = glb.nodes.map(([m, v, ph]) => { const k = ease((f - ph * 0.35) / 0.65); m.position.copy(v).multiplyScalar(k); m.scale.setScalar(0.3 + 0.7 * k); m.rotation.set(t, t * 1.3, 0); return k; });
  for (const [l, i, j] of glb.links) { const a = glb.nodes[i][0].position, b = glb.nodes[j][0].position, k = Math.min(cur[i], cur[j]); const pa = l.geometry.attributes.position; pa.setXYZ(0, a.x, a.y, a.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true; l.material.opacity = 0.55 * Math.max(0, (k - 0.6) / 0.4); }
  for (const [p, [, i, j], ph] of glb.pkts) { const k = Math.min(cur[i], cur[j]); p.visible = k > 0.95; p.position.lerpVectors(glb.nodes[i][0].position, glb.nodes[j][0].position, (t * 0.9 + ph) % 1); }
  big.render(glb.scene, glb.cam); return big.domElement;
}

// ---------- spinning coin ----------
const coinScene = new THREE.Scene(), coinCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); coinCam.position.set(0, 0, 6.2);
coinScene.add(new THREE.AmbientLight(0xffffff, 0.9)); const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(2, 3, 4); coinScene.add(dl);
const rim = new THREE.PointLight(0xff2bd6, 30, 20); rim.position.set(-3, -1, 2); coinScene.add(rim);
const COINS = {};
function face(key) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'), r = 256;
  const col = { btc: '#F7931A', eth: '#627EEA', sol: '#111111' }[key]; c.fillStyle = col; c.fillRect(0, 0, 512, 512);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 22; c.beginPath(); c.arc(r, r, r - 26, 0, TAU); c.stroke(); c.translate(r, r);
  if (key === 'btc') { c.font = '900 300px Geist, "Inter Tight", sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₿', 0, 14); }
  if (key === 'eth') { const s = 230; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(s * 0.38, s * 0.02); c.lineTo(0, s * 0.22); c.lineTo(-s * 0.38, s * 0.02); c.closePath(); c.fill(); c.globalAlpha = 0.75; c.beginPath(); c.moveTo(0, s * 0.32); c.lineTo(s * 0.38, s * 0.1); c.lineTo(0, s * 0.62); c.lineTo(-s * 0.38, s * 0.1); c.closePath(); c.fill(); }
  if (key === 'sol') { const s = 230, g = c.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, '#9945FF'); g.addColorStop(1, '#14F195'); c.fillStyle = g; [-0.36, 0, 0.36].forEach((dy, i) => { c.save(); c.translate(0, dy * s); c.beginPath(); const w = s * 1.1, h = s * 0.2, sk = s * 0.18 * (i === 1 ? -1 : 1); c.moveTo(-w / 2 + sk, -h / 2); c.lineTo(w / 2 + sk, -h / 2); c.lineTo(w / 2 - sk, h / 2); c.lineTo(-w / 2 - sk, h / 2); c.closePath(); c.fill(); c.restore(); }); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.center.set(0.5, 0.5); tx.rotation = Math.PI / 2; /* cylinder cap UVs are quarter-turned */ return [tx, new THREE.Color(col)];
}
function renderCoin(key, t) {
  if (!COINS[key]) { const [tx, col] = face(key), edge = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.7), metalness: 0.8, roughness: 0.3 }), fm = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.35 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.22, 96), [edge, fm, fm]); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); COINS[key] = g; }
  coinScene.children.filter((o) => o.isGroup).forEach((o) => coinScene.remove(o)); const g = COINS[key]; coinScene.add(g);
  g.rotation.set(Math.sin(t * 1.3) * 0.22, Math.sin(t * 1.1) * 0.75, Math.sin(t * 0.9) * 0.08); // wobble, face stays readable
  small.render(coinScene, coinCam); return small.domElement;
}

window.T3 = { chain: renderChain, tunnel: renderTunnel, globe: renderGlobe, coin: renderCoin, REVISION: THREE.REVISION };
