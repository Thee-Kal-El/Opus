// THEE_KAL_EL reel (vertical) — the BLOCKCHAIN 101 pro-edition Three.js world, re-framed for 1080×1920, rendered as a pure function of t.
// A fogged network of ~560 nodes in 8 "districts" on a ring, a glass block-chain spine through the centre, packets in transit,
// drifting dust, a faint ground grid, a hub that can centralise the network (power section) and data towers that rise (careers).
// window.WORLD.render(t, st) → { canvas, spine:[[x,y,vis]], districts:[[x,y,vis]], hub:[x,y] }  (screen coords in 1920×1080 space)
//   st = { cam:{pos:[x,y,z], look:[x,y,z]}, offX, focusDistrict, spineHi, spineBad, central (0..1), towers (0..1), dim (0..1) }
import * as THREE from '../course/vendor/three.module.min.js';

const W = 1080, H = 1920, RW = 720, RH = 1280, TAU = Math.PI * 2; // vertical reel
const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
const gauss = (i, k) => { const u = Math.max(1e-6, hash(i, k)), v = hash(i, k + 1); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(RW, RH, false); renderer.setClearColor(0x05070a, 1);
const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x05070a, 0.0085);
const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 600);

const C_BASE = new THREE.Color('#7FA6B8'), C_HI = new THREE.Color('#5CE1E6'), C_AMB = new THREE.Color('#F5B544'), C_RED = new THREE.Color('#FF4D5E'), C_DIM = new THREE.Color('#2A3A46');
function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const DOT = dotTex();

// ---------- districts + nodes ----------
const ND = 8, RING = 58, PER = 62, FILL = 64;
const DIST = []; for (let d = 0; d < ND; d++) { const a = d / ND * TAU + 0.35; DIST.push(new THREE.Vector3(Math.cos(a) * RING, (hash(d, 3) - 0.5) * 10, Math.sin(a) * RING)); }
const NODES = [], NDIST = [];
for (let d = 0; d < ND; d++) for (let i = 0; i < PER; i++) { const k = d * 100 + i, r = 9; NODES.push(new THREE.Vector3(DIST[d].x + gauss(k, 1) * r, DIST[d].y + gauss(k, 3) * r * 0.55, DIST[d].z + gauss(k, 5) * r)); NDIST.push(d); }
for (let i = 0; i < FILL; i++) { const a = hash(i, 11) * TAU, r = 25 + hash(i, 12) * 70; NODES.push(new THREE.Vector3(Math.cos(a) * r, (hash(i, 13) - 0.5) * 30, Math.sin(a) * r)); NDIST.push(-1); }
const NN = NODES.length;
// links: 3 nearest within each district + backbone between neighbouring districts + filler
const LINKS = [];
for (let i = 0; i < NN; i++) { const ds = []; for (let j = 0; j < NN; j++) if (j !== i && (NDIST[i] === NDIST[j] || NDIST[i] < 0 || NDIST[j] < 0)) ds.push([NODES[i].distanceToSquared(NODES[j]), j]); ds.sort((a, b) => a[0] - b[0]); for (let k = 0; k < 3 && k < ds.length; k++) if (ds[k][0] < 200 && i < ds[k][1]) LINKS.push([i, ds[k][1]]); }
for (let d = 0; d < ND; d++) for (let k = 0; k < 3; k++) { const a = d * PER + ((k * 17) % PER), b = ((d + 1) % ND) * PER + ((k * 29 + 5) % PER); LINKS.push([a, b]); if (k === 0) LINKS.push([d * PER + 7, ((d + 3) % ND) * PER + 11]); }
const nodeGeo = new THREE.BufferGeometry(), nodePos = new Float32Array(NN * 3), nodeCol = new Float32Array(NN * 3), nodeSize = new Float32Array(NN);
NODES.forEach((v, i) => { nodePos.set([v.x, v.y, v.z], i * 3); nodeSize[i] = 1; });
nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3)); nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
const nodeMat = new THREE.PointsMaterial({ size: 1.45, map: DOT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
scene.add(new THREE.Points(nodeGeo, nodeMat));
const linkGeo = new THREE.BufferGeometry(), linkPos = new Float32Array(LINKS.length * 6), linkCol = new Float32Array(LINKS.length * 6);
LINKS.forEach(([a, b], k) => { linkPos.set([NODES[a].x, NODES[a].y, NODES[a].z, NODES[b].x, NODES[b].y, NODES[b].z], k * 6); });
linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3)); linkGeo.setAttribute('color', new THREE.BufferAttribute(linkCol, 3));
const linkMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
scene.add(new THREE.LineSegments(linkGeo, linkMat));
// packets
const NP = 160, pktGeo = new THREE.BufferGeometry(), pktPos = new Float32Array(NP * 3); pktGeo.setAttribute('position', new THREE.BufferAttribute(pktPos, 3));
scene.add(new THREE.Points(pktGeo, new THREE.PointsMaterial({ size: 0.7, map: DOT, color: 0xdffbff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
// hub (centralisation)
const hub = new THREE.Group(); scene.add(hub);
const hubCore = new THREE.Mesh(new THREE.OctahedronGeometry(3.2), new THREE.MeshBasicMaterial({ color: C_RED, wireframe: true, transparent: true })); hub.add(hubCore);
const hubGeo = new THREE.BufferGeometry(), HUBN = 120, hubPos = new Float32Array(HUBN * 6); for (let k = 0; k < HUBN; k++) { const v = NODES[(k * 37) % (ND * PER)]; hubPos.set([0, 0, 0, v.x, v.y, v.z], k * 6); }
hubGeo.setAttribute('position', new THREE.BufferAttribute(hubPos, 3)); const hubMat = new THREE.LineBasicMaterial({ color: C_RED, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
hub.add(new THREE.LineSegments(hubGeo, hubMat));

// ---------- chain spine ----------
const SPN = 26, SPINE = []; const spineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-70, 6, -120), new THREE.Vector3(-30, 2, -60), new THREE.Vector3(0, 0, 0), new THREE.Vector3(30, -2, 50), new THREE.Vector3(55, 3, 105)]);
const spineGroup = new THREE.Group(); scene.add(spineGroup);
for (let i = 0; i < SPN; i++) { const p = spineCurve.getPoint(i / (SPN - 1)), tan = spineCurve.getTangent(i / (SPN - 1)), g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(tan));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2), new THREE.MeshBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.2, 3.2, 3.2)), new THREE.LineBasicMaterial({ color: C_HI.clone(), transparent: true, opacity: 0.85 }));
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshBasicMaterial({ color: C_HI.clone(), transparent: true, opacity: 0.7 }));
  g.add(glass, edges, core); spineGroup.add(g); SPINE.push({ g, p, edges, core, glass }); }
const spLinkGeo = new THREE.BufferGeometry().setFromPoints(spineCurve.getPoints(300)); spineGroup.add(new THREE.Line(spLinkGeo, new THREE.LineBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.35 })));
const spPk = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.9, map: DOT, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const spPkPos = new Float32Array(24 * 3); spPk.geometry.setAttribute('position', new THREE.BufferAttribute(spPkPos, 3)); spineGroup.add(spPk);

// ---------- environment: dust, ground grid, towers ----------
const DUSTN = 2600, dustGeo = new THREE.BufferGeometry(), dustBase = new Float32Array(DUSTN * 3), dustPos = new Float32Array(DUSTN * 3);
for (let i = 0; i < DUSTN; i++) dustBase.set([(hash(i, 21) - 0.5) * 320, (hash(i, 22) - 0.5) * 120, (hash(i, 23) - 0.5) * 320], i * 3);
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3)); scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.28, map: DOT, color: 0x8fb4c8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })));
const grid = new THREE.GridHelper(700, 140, 0x1c3440, 0x0f1e26); grid.position.y = -26; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
const TWN = 180, towerGeo = new THREE.BoxGeometry(1, 1, 1); towerGeo.translate(0, 0.5, 0);
const towers = new THREE.InstancedMesh(towerGeo, new THREE.MeshBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }), TWN); scene.add(towers);
const towerEdge = new THREE.InstancedMesh(new THREE.BoxGeometry(1.06, 0.06, 1.06).translate(0, 0, 0), new THREE.MeshBasicMaterial({ color: 0xbff7ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }), TWN); scene.add(towerEdge);
const TW = []; for (let i = 0; i < TWN; i++) { const d = i % ND, a = hash(i, 31) * TAU, r = 4 + hash(i, 32) * 14; TW.push([DIST[d].x + Math.cos(a) * r, DIST[d].z + Math.sin(a) * r, 6 + Math.pow(hash(i, 33), 2) * 46, hash(i, 34)]); }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();

// ---------- per-frame ----------
const proj = (v) => { V.copy(v).project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, V.z < 1 ? 1 : 0]; };
function render(t, st = {}) {
  const c = st.cam || { pos: [0, 30, 140], look: [0, 0, 0] };
  cam.position.set(...c.pos); cam.lookAt(new THREE.Vector3(...c.look)); cam.clearViewOffset(); if (st.offX) cam.setViewOffset(W, H, st.offX, 0, W, H); cam.updateProjectionMatrix();
  const central = st.central || 0, dim = st.dim || 0, fd = st.focusDistrict ?? -1;
  // nodes pulled toward the hub when centralised
  for (let i = 0; i < NN; i++) { const v = NODES[i], k = central * (0.35 + 0.25 * hash(i, 41)); nodePos[i * 3] = v.x * (1 - k); nodePos[i * 3 + 1] = v.y * (1 - k) + Math.sin(t * 0.6 + i) * 0.25; nodePos[i * 3 + 2] = v.z * (1 - k);
    const on = fd >= 0 && NDIST[i] === fd, base = on ? C_HI : (fd >= 0 ? C_DIM : C_BASE), tw = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.7), col = central > 0.02 ? base.clone().lerp(C_RED, central * 0.55) : base, m = (1 - dim * 0.7) * tw * (on ? 1.6 : 1);
    nodeCol[i * 3] = col.r * m; nodeCol[i * 3 + 1] = col.g * m; nodeCol[i * 3 + 2] = col.b * m; }
  nodeGeo.attributes.position.needsUpdate = true; nodeGeo.attributes.color.needsUpdate = true;
  const meshK = 1 - central;
  LINKS.forEach(([a, b], k) => { linkPos.set([nodePos[a * 3], nodePos[a * 3 + 1], nodePos[a * 3 + 2], nodePos[b * 3], nodePos[b * 3 + 1], nodePos[b * 3 + 2]], k * 6); const on = fd >= 0 && NDIST[a] === fd && NDIST[b] === fd, base = on ? C_HI : C_BASE, m = (on ? 0.9 : fd >= 0 ? 0.18 : 0.35) * meshK * (1 - dim * 0.7);
    linkCol.set([base.r * m, base.g * m, base.b * m, base.r * m, base.g * m, base.b * m], k * 6); });
  linkGeo.attributes.position.needsUpdate = true; linkGeo.attributes.color.needsUpdate = true;
  for (let k = 0; k < NP; k++) { const [a, b] = LINKS[(k * 13) % LINKS.length], u = (t * (0.25 + hash(k, 51) * 0.35) + hash(k, 52)) % 1; pktPos.set([nodePos[a * 3] + (nodePos[b * 3] - nodePos[a * 3]) * u, nodePos[a * 3 + 1] + (nodePos[b * 3 + 1] - nodePos[a * 3 + 1]) * u, nodePos[a * 3 + 2] + (nodePos[b * 3 + 2] - nodePos[a * 3 + 2]) * u], k * 3); }
  pktGeo.attributes.position.needsUpdate = true; pktGeo.setDrawRange(0, Math.round(NP * meshK + 20 * central));
  // hub
  hub.visible = central > 0.01; hubMat.opacity = 0.5 * central; hubCore.material.opacity = central; hubCore.rotation.set(t * 0.7, t, 0); hubCore.scale.setScalar(0.6 + central * 0.6);
  for (let k = 0; k < HUBN; k++) { const n = (k * 37) % (ND * PER); hubPos.set([nodePos[n * 3], nodePos[n * 3 + 1], nodePos[n * 3 + 2]], k * 6 + 3); } hubGeo.attributes.position.needsUpdate = true;
  // spine
  SPINE.forEach((b, i) => { const hi = st.spineHi === i, bad = st.spineBad === i, col = bad ? C_RED : hi ? C_AMB : C_HI; b.edges.material.color.copy(col); b.core.material.color.copy(col); b.edges.material.opacity = hi || bad ? 1 : 0.7; b.core.scale.setScalar(hi || bad ? 1.4 + 0.1 * Math.sin(t * 6) : 1); b.glass.material.opacity = hi || bad ? 0.16 : 0.07; b.g.rotateZ(0); });
  for (let k = 0; k < 24; k++) { const p = spineCurve.getPoint(((t * 0.03 + k / 24) % 1)); spPkPos.set([p.x, p.y, p.z], k * 3); } spPk.geometry.attributes.position.needsUpdate = true;
  // dust drift
  for (let i = 0; i < DUSTN; i++) { dustPos[i * 3] = dustBase[i * 3] + Math.sin(t * 0.1 + i) * 2; dustPos[i * 3 + 1] = ((dustBase[i * 3 + 1] + t * (0.6 + hash(i, 24))) % 120 + 180) % 120 - 60; dustPos[i * 3 + 2] = dustBase[i * 3 + 2]; } dustGeo.attributes.position.needsUpdate = true;
  // towers
  const tg = st.towers || 0; towers.visible = towerEdge.visible = tg > 0.001;
  if (tg > 0.001) TW.forEach(([x, z, h, ph], i) => { const k = Math.max(0, Math.min(1, (tg * 1.4 - ph * 0.4))), hh = Math.max(0.01, h * (1 - Math.pow(1 - k, 3))); M4.compose(V.set(x, -26, z), Q.identity(), S.set(1.4, hh, 1.4)); towers.setMatrixAt(i, M4); M4.compose(V.set(x, -26 + hh, z), Q.identity(), S.set(1.4, 1, 1.4)); towerEdge.setMatrixAt(i, M4); });
  towers.instanceMatrix.needsUpdate = true; towerEdge.instanceMatrix.needsUpdate = true;
  renderer.render(scene, cam);
  return { canvas: renderer.domElement, spine: SPINE.map((b) => proj(b.p)), districts: DIST.map((d) => proj(d)), hub: proj(new THREE.Vector3()) };
}
const spinePoint = (i) => SPINE[i].p.toArray(), districtPoint = (d) => DIST[d].toArray(), spineTangent = (i) => spineCurve.getTangent(i / (SPN - 1)).toArray();
const curve = (u) => spineCurve.getPoint(Math.max(0, Math.min(1, u))).toArray();
window.WORLD = { render, spinePoint, districtPoint, spineTangent, curve, SPN, ND };
