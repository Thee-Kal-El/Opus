// ESCAPE VELOCITY · Episode 01 — Three.js scenes (custom GLSL), rendered as pure functions of t.
//   earth(t, o)   procedural Earth: fbm continents (drought-dry), ocean glint, night-side city lights, animated clouds, atmosphere rim
//   debris(t, o)  low orbit inside the debris belt: thousands of lit metal fragments streaming past, a satellite that shatters at o.hitT
//   city(t, o)    the megacity at night: lit elite towers behind a wall, dark slums, smog, sweeping searchlights, war flashes on the horizon
//   pad(t, o)     Launch Complex 39-X: MERIDIAN on the pad, gantry, floodlights, venting steam; o.ignite 0..1 adds plume + light
// Each returns { canvas, pts:{name:[x,y,vis]} } (screen coords in 1920×1080).
import * as THREE from '../course/vendor/three.module.min.js';

const W = 1920, H = 1080, RW = 1280, RH = 720, TAU = Math.PI * 2;
const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
const R = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(RW, RH, false); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;

const NOISE = `
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }`;
const VWORLD = `varying vec3 vObj; varying vec3 vWN; varying vec3 vWP; void main(){ vObj = position; vWN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;

function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const DOT = dotTex();
function stars(n, r, size) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = hash(i, 1) * 2 - 1, a = hash(i, 2) * TAU, s = Math.sqrt(1 - u * u); p.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); const b = 0.4 + 0.6 * Math.pow(hash(i, 3), 3), w = hash(i, 4); col.set([b * (0.85 + 0.15 * w), b * 0.92, b * (1.05 - 0.2 * w)], i * 3); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ size, map: DOT, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: false, blending: THREE.AdditiveBlending })); }

// ---------- shared Earth ----------
function makeEarth(radius, atmoK = 1.055) {
  const g = new THREE.Group(), U = { sunDir: { value: new THREE.Vector3(1, 0, 0) }, time: { value: 0 } };
  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, 160, 120), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VWORLD, fragmentShader: `${NOISE}
    uniform vec3 sunDir; uniform float time; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
    void main(){ vec3 p = normalize(vObj); float c = fbm(p * 1.7); float land = smoothstep(0.495, 0.515, c); float lat = abs(p.y);
      vec3 ocean = mix(vec3(0.006, 0.025, 0.07), vec3(0.015, 0.09, 0.19), smoothstep(0.36, 0.515, c));
      float m = fbm(p * 5.5 + 3.0); vec3 lc = mix(vec3(0.13, 0.17, 0.07), vec3(0.45, 0.34, 0.2), smoothstep(0.38, 0.62, m)); lc = mix(lc, vec3(0.52, 0.42, 0.3), smoothstep(0.55, 0.7, fbm3(p * 14.0)));
      vec3 col = mix(ocean, lc, land); float ice = smoothstep(0.84, 0.9, lat + (fbm3(p * 9.0) - 0.5) * 0.12); col = mix(col, vec3(0.8, 0.85, 0.9), ice);
      vec3 N = normalize(vWN), L = normalize(sunDir), V = normalize(cameraPosition - vWP); float ndl = dot(N, L); float day = smoothstep(-0.12, 0.22, ndl);
      vec3 lit = col * (0.015 + 1.25 * max(ndl, 0.0)); lit *= mix(vec3(1.0), vec3(1.0, 0.55, 0.32), smoothstep(0.35, 0.0, ndl) * day);
      vec3 Hh = normalize(L + V); lit += vec3(1.0, 0.86, 0.68) * pow(max(dot(N, Hh), 0.0), 90.0) * (1.0 - land) * (1.0 - ice) * 1.4 * day;
      float cityMask = land * (1.0 - ice) * smoothstep(0.5, 0.66, fbm3(p * 8.0 + 7.0)); float pin = pow(vnoise(p * 340.0), 9.0) * 6.0 + pow(vnoise(p * 120.0), 7.0) * 2.0; float lights = cityMask * pin + cityMask * 0.015;
      lit += vec3(1.0, 0.62, 0.3) * lights * (1.0 - day) * 1.1;
      float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0); lit += vec3(0.25, 0.5, 1.0) * fr * day * 0.55;
      gl_FragColor = vec4(lit, 1.0); }` }));
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 140, 100), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, vertexShader: VWORLD, fragmentShader: `${NOISE}
    uniform vec3 sunDir; uniform float time; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
    void main(){ vec3 p = normalize(vObj); float cl = fbm(p * 3.2 + vec3(time * 0.012, 0.0, time * 0.006)); float a = smoothstep(0.5, 0.74, cl);
      vec3 N = normalize(vWN), L = normalize(sunDir); float ndl = dot(N, L); float light = smoothstep(-0.1, 0.35, ndl);
      vec3 col = vec3(1.0) * (0.02 + 1.05 * light); col *= mix(vec3(1.0), vec3(1.0, 0.55, 0.35), smoothstep(0.3, 0.0, ndl) * light);
      gl_FragColor = vec4(col, a * 0.92); }` }));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(radius * atmoK, 96, 72), new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vNv; varying vec3 vWN; void main(){ vNv = normalize(normalMatrix * normal); vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 sunDir; varying vec3 vNv; varying vec3 vWN; void main(){ float i = pow(max(0.0, 0.72 - dot(vNv, vec3(0.0, 0.0, 1.0))), 5.0) * 1.6; float lit = smoothstep(-0.35, 0.45, dot(normalize(vWN), normalize(sunDir)));
      vec3 c = mix(vec3(1.0, 0.45, 0.2), vec3(0.3, 0.6, 1.0), lit); gl_FragColor = vec4(c * i * (0.15 + 2.2 * lit), 1.0); }` }));
  g.add(earth, clouds, atmo); return { g, U, clouds };
}

// ---------- 1. EARTH ----------
const E = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(30, W / H, 0.1, 5000) };
const EE = makeEarth(60, 1.016); E.scene.add(EE.g); E.scene.add(stars(5000, 2000, 1.6));
const SUN = new THREE.Vector3(0.12, 0.2, -1).normalize();
function earth(t, o = {}) {
  const sun = SUN.clone(); sun.y = 0.2 + 0.1 * (o.k ?? 0); sun.normalize(); EE.U.sunDir.value.copy(sun); EE.U.time.value = t; EE.g.rotation.y = 0.9 + t * 0.012; EE.clouds.rotation.y = t * 0.004;
  const k = o.k ?? 0; // 0..1 shot progress: slow push from the night side toward the sunrise limb
  E.cam.position.set(-6 + 10 * k, 46 + 4 * k, 86 - 14 * k); E.cam.lookAt(3, 64 - 2 * k, -40); E.cam.rotateZ(-0.12 + 0.05 * k);
  R.toneMappingExposure = 1.05; R.setClearColor(0x000000, 1); R.render(E.scene, E.cam);
  // horizon point on the centre column: binary-search the screen row where view rays start hitting the planet
  E.cam.updateMatrixWorld(); const ray = new THREE.Raycaster(), sph = new THREE.Sphere(new THREE.Vector3(), 60.2); let lo = -1, hi = 1; for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; ray.setFromCamera(new THREE.Vector2(0.12, m), E.cam); if (ray.ray.intersectsSphere(sph)) lo = m; else hi = m; }
  const s = { x: 0.12, y: (lo + hi) / 2, z: 0 }; return { canvas: R.domElement, pts: { sun: [(s.x + 1) / 2 * W, (1 - s.y) / 2 * H, s.z < 1 ? 1 : 0] } };
}

// ---------- 2. DEBRIS ----------
const D = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(48, W / H, 0.05, 3000) };
const DE = makeEarth(600, 1.0035); DE.g.position.set(0, -603.5, -150); D.scene.add(DE.g); D.scene.add(stars(3000, 1500, 1.4));
const dSun = new THREE.DirectionalLight(0xfff1dd, 3.2); dSun.position.set(-1, 0.07, -0.55); D.scene.add(dSun); D.scene.add(new THREE.HemisphereLight(0x6a8ac0, 0x223040, 1.1));
const DGEO = [new THREE.TetrahedronGeometry(0.22), new THREE.BoxGeometry(0.5, 0.03, 0.28), new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), new THREE.DodecahedronGeometry(0.14)];
const DMAT = [new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.25, roughness: 0.45, flatShading: true }), new THREE.MeshStandardMaterial({ color: 0x1c2a4a, metalness: 0.5, roughness: 0.3, emissive: 0x050a18, flatShading: true }), new THREE.MeshStandardMaterial({ color: 0xd8b060, metalness: 0.3, roughness: 0.35, flatShading: true, emissive: 0x1a1206 }), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.2, roughness: 0.7, flatShading: true })];
const DN = 900, DEB = DGEO.map((g, k) => { const m = new THREE.InstancedMesh(g, DMAT[k], DN); D.scene.add(m); return m; });
const DSEED = []; for (let k = 0; k < 4; k++) for (let i = 0; i < DN; i++) DSEED.push([(hash(i, k, 1) - 0.5) * 90, (hash(i, k, 2) - 0.45) * 14, hash(i, k, 3), 0.6 + hash(i, k, 4) * 2.2, hash(i, k, 5) * TAU, 0.6 + hash(i, k, 6) * 2.6]);
const sat = new THREE.Group(); { const bus = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 2.2), new THREE.MeshStandardMaterial({ color: 0xd6b26a, metalness: 0.3, roughness: 0.3, emissive: 0x1a1206 })); sat.add(bus);
  const pm = new THREE.MeshStandardMaterial({ color: 0x14244a, metalness: 0.4, roughness: 0.25, emissive: 0x040a1c }); [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 1.6), pm); p.position.x = s * 3.4; sat.add(p); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), DMAT[0]); arm.rotation.z = Math.PI / 2; arm.position.x = s * 0.9; sat.add(arm); });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 10, 0, TAU, 0, 1.0), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide })); dish.position.set(0, 0.9, 0.6); dish.rotation.x = -0.8; sat.add(dish); }
D.scene.add(sat);
const SH = 160, shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.16), DMAT[2], SH), shardsB = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.03, 0.3), DMAT[1], SH); D.scene.add(shards, shardsB);
const proj = (v, cam) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 ? 1 : 0]; };
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
function debris(t, o = {}) {
  const k = o.k ?? 0, hitT = o.hitT ?? 1e9; DE.U.sunDir.value.copy(dSun.position).normalize(); DE.U.time.value = t;
  D.cam.position.set(Math.sin(k * 0.6) * 3, 1.2 + k * 0.6, 14 - k * 6); D.cam.lookAt(0, 0.2, -30);
  const pts = {};
  DEB.forEach((m, kind) => { for (let i = 0; i < DN; i++) { const [x, y, z0, sp, r0, sc] = DSEED[kind * DN + i]; const z = -220 + ((z0 * 260 + t * sp * 6) % 260); EU.set(r0 + t * sp, r0 * 1.3 + t * sp * 0.7, 0); Q.setFromEuler(EU); M4.compose(V3.set(x, y, z), Q, S3.setScalar(sc)); m.setMatrixAt(i, M4); if (kind === 0 && i < 7) pts['d' + i] = proj(V3.clone(), D.cam); } m.instanceMatrix.needsUpdate = true; });
  // satellite: drifts, then is struck at hitT and breaks apart
  const sp = new THREE.Vector3(1.5, 0.6, -26 + t * 0.15); sat.position.copy(sp); sat.rotation.set(0.2, t * 0.12, 0.1); sat.visible = t < hitT; pts.sat = proj(sp, D.cam);
  const dtt = t - hitT; shards.visible = shardsB.visible = dtt >= 0;
  if (dtt >= 0) [shards, shardsB].forEach((m, kk) => { for (let i = 0; i < SH; i++) { const a = hash(i, kk, 7) * TAU, b = Math.acos(hash(i, kk, 8) * 2 - 1), v = 2 + hash(i, kk, 9) * 9; const dir = new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)); EU.set(dtt * 6 * hash(i, 1), dtt * 5 * hash(i, 2), 0); Q.setFromEuler(EU); M4.compose(V3.copy(sp).addScaledVector(dir, v * dtt * (1 - 0.15 * Math.min(dtt, 3))), Q, S3.setScalar(0.7 + hash(i, kk) * 1.6)); m.setMatrixAt(i, M4); } m.instanceMatrix.needsUpdate = true; });
  // the projectile
  if (dtt < 0 && dtt > -0.6) { /* drawn as a streak in 2D */ pts.proj = proj(new THREE.Vector3().copy(sp).add(new THREE.Vector3(-40 * (-dtt), 6 * (-dtt), 25 * (-dtt))), D.cam); }
  R.toneMappingExposure = 0.95; R.setClearColor(0x000000, 1); R.render(D.scene, D.cam); return { canvas: R.domElement, pts };
}

// ---------- 3. CITY ----------
const C = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(40, W / H, 0.5, 4000) };
const FOGC = new THREE.Color(0x1d120c), FOGD = 0.0016;
const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { time: { value: 0 } }, vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `${NOISE} uniform float time; varying vec3 vD; void main(){ float h = vD.y; vec3 top = vec3(0.012, 0.014, 0.025), hz = vec3(0.16, 0.085, 0.045);
    vec3 c = mix(hz, top, smoothstep(-0.02, 0.35, h)); float az = atan(vD.x, vD.z); float fire = pow(max(0.0, sin(az * 3.0 + 1.2)), 6.0) * smoothstep(0.18, 0.0, h) * (0.7 + 0.3 * vnoise(vec3(az * 4.0, time * 0.8, 0.0)));
    c += vec3(0.55, 0.18, 0.04) * fire * 0.6; float smog = fbm3(vec3(vD.x * 3.0 + time * 0.01, h * 6.0, vD.z * 3.0)); c += vec3(0.08, 0.05, 0.03) * smog * smoothstep(0.4, 0.0, h); gl_FragColor = vec4(c, 1.0); }` }));
C.scene.add(sky);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshBasicMaterial({ color: 0x07050a })); ground.rotation.x = -Math.PI / 2; C.scene.add(ground);
const TOWER = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, fogC: { value: FOGC }, fogD: { value: FOGD } },
  vertexShader: `attribute float aClass; attribute float aSeed; varying vec3 vWP; varying vec3 vN; varying float vC; varying float vS; void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vWP = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vC = aClass; vS = aSeed; gl_Position = projectionMatrix * viewMatrix * wp; }`,
  fragmentShader: `uniform float time; uniform vec3 fogC; uniform float fogD; varying vec3 vWP; varying vec3 vN; varying float vC; varying float vS;
    float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){ vec3 wall = vC > 0.5 ? vec3(0.03, 0.035, 0.05) : vec3(0.025, 0.02, 0.018); vec3 col = wall;
      if (abs(vN.y) < 0.5) { float u = abs(vN.x) > 0.5 ? vWP.z : vWP.x; vec2 g = vC > 0.5 ? vec2(u * 0.3, vWP.y * 0.22) : vec2(u * 0.45, vWP.y * 0.42); vec2 f = fract(g), id = floor(g);
        float win = step(0.18, f.x) * step(f.x, 0.78) * step(0.22, f.y) * step(f.y, 0.78); float r = hh(id + vS * 17.0);
        if (vC > 0.5) { float on = step(0.66, r) * step(0.35, fract(id.y * 0.137 + vS)); col += win * on * mix(vec3(1.0, 0.86, 0.62), vec3(0.75, 0.88, 1.0), step(0.7, hh(id * 1.7))) * (0.9 + 0.6 * r); col += vec3(0.6, 0.75, 1.0) * 0.05 * step(0.92, f.y); }
        else { float on = step(0.86, r) * (0.7 + 0.3 * sin(time * (2.0 + r * 6.0) + r * 40.0)); col += win * on * vec3(1.0, 0.5, 0.18) * 0.55; } }
      float d = length(cameraPosition - vWP); float fg = 1.0 - exp(-fogD * fogD * d * d); gl_FragColor = vec4(mix(col, fogC, fg), 1.0); }` });
function towers(list) { const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0); const m = new THREE.InstancedMesh(geo, TOWER, list.length), cls = new Float32Array(list.length), sd = new Float32Array(list.length);
  list.forEach(([x, z, w, d, h, c], i) => { M4.compose(V3.set(x, 0, z), Q.identity(), S3.set(w, h, d)); m.setMatrixAt(i, M4); cls[i] = c; sd[i] = hash(i, 77); });
  m.geometry.setAttribute('aClass', new THREE.InstancedBufferAttribute(cls, 1)); m.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1)); return m; }
const TL = [];
for (let i = 0; i < 38; i++) { const x = (i - 18.5) * 62 + (hash(i, 1) - 0.5) * 30, z = -560 - hash(i, 2) * 320; TL.push([x, z, 22 + hash(i, 3) * 18, 22 + hash(i, 4) * 18, 110 + Math.pow(hash(i, 5), 1.4) * 300, 1]); }
for (let i = 0; i < 1500; i++) { const x = (hash(i, 11) - 0.5) * 1100, z = 120 - hash(i, 12) * 470; if (Math.abs(x) < 7 && z > -40) continue; TL.push([x, z, 6 + hash(i, 13) * 12, 6 + hash(i, 14) * 12, 3 + Math.pow(hash(i, 15), 2) * 16, 0]); }
C.scene.add(towers(TL));
const wallM = new THREE.Mesh(new THREE.BoxGeometry(1400, 34, 6), new THREE.MeshBasicMaterial({ color: 0x0b0a0c })); wallM.position.set(0, 17, -380); C.scene.add(wallM);
const wallLights = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 70 }, (_, i) => new THREE.Vector3(-690 + i * 20, 35, -376))), new THREE.PointsMaterial({ size: 9, map: DOT, color: 0xffe2b0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); C.scene.add(wallLights);
const beacons = new THREE.Points(new THREE.BufferGeometry().setFromPoints(TL.filter((x) => x[5] === 1).map(([x, z, w, d, h]) => new THREE.Vector3(x, h + 3, z))), new THREE.PointsMaterial({ size: 7, map: DOT, color: 0xff3030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); C.scene.add(beacons);
const BEAM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: `varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: `varying float vY; void main(){ gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * pow(vY, 3.0) * 0.09, 1.0); }` });
const beams = []; for (let i = 0; i < 5; i++) { const g = new THREE.CylinderGeometry(1.5, 34, 900, 24, 1, true); g.translate(0, -450, 0); const b = new THREE.Mesh(g, BEAM); const src = TL[i * 9]; b.position.set(src[0], src[4] + 2, src[1]); C.scene.add(b); beams.push([b, hash(i, 91)]); }
const BURSTS = Array.from({ length: 10 }, (_, i) => ({ T: 26.2 + i * 0.68 + hash(i, 3) * 0.3, pos: new THREE.Vector3((hash(i, 1) - 0.5) * 1800, 8 + hash(i, 2) * 30, -900 - hash(i, 4) * 600), m: null }));
BURSTS.forEach((b) => { b.m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); b.m.position.copy(b.pos); C.scene.add(b.m); });
const drones = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 5, map: DOT, color: 0xff2a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const drP = new Float32Array(30 * 3); drones.geometry.setAttribute('position', new THREE.BufferAttribute(drP, 3)); C.scene.add(drones);
function city(t, o = {}) {
  const k = o.k ?? 0; TOWER.uniforms.time.value = t; sky.material.uniforms.time.value = t;
  C.cam.position.set(-10 + k * 25, 26 + k * 10, 150 - k * 110); C.cam.lookAt(10 + k * 10, 70 + k * 25, -600);
  beams.forEach(([b, ph], i) => { b.rotation.set(0.35 + 0.2 * Math.sin(t * 0.4 + ph * 9), 0, Math.sin(t * 0.3 + ph * 7) * 0.6); });
  BURSTS.forEach((b) => { const d = t - b.T; b.m.visible = d > 0 && d < 1.6; if (b.m.visible) { const s = 12 + d * 60; b.m.scale.setScalar(s); b.m.material.opacity = Math.max(0, 1 - d / 1.6) * (d < 0.15 ? 1 : 0.6); } });
  for (let i = 0; i < 30; i++) { const a = t * 0.05 * (1 + hash(i, 5)) + hash(i, 6) * TAU; drP.set([Math.cos(a) * (200 + hash(i, 7) * 400), 60 + hash(i, 8) * 120, -300 + Math.sin(a) * 300], i * 3); } drones.geometry.attributes.position.needsUpdate = true; drones.material.opacity = (Math.floor(t * 2) % 2) ? 1 : 0.3;
  R.toneMappingExposure = 1.25; R.render(C.scene, C.cam);
  const pts = {}; BURSTS.forEach((b, i) => { pts['b' + i] = proj(b.pos, C.cam); }); return { canvas: R.domElement, pts };
}

// ---------- 4. PAD ----------
const P = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(34, W / H, 0.5, 5000) };
P.scene.fog = new THREE.FogExp2(0x0a0c12, 0.0022);
const psky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec3 vD; void main(){ float h = vD.y; vec3 c = mix(vec3(0.07, 0.06, 0.07), vec3(0.008, 0.01, 0.022), smoothstep(-0.02, 0.4, h)); float az = atan(vD.x, vD.z); c += vec3(0.35, 0.16, 0.06) * pow(max(0.0, cos(az - 2.6)), 8.0) * smoothstep(0.12, 0.0, h) * 0.6; gl_FragColor = vec4(c, 1.0); }` }));
P.scene.add(psky); P.scene.add(stars(2500, 2000, 1.3));
const pground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.95 })); pground.rotation.x = -Math.PI / 2; P.scene.add(pground);
const padB = new THREE.Mesh(new THREE.BoxGeometry(70, 6, 70), new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.9 })); padB.position.y = 3; P.scene.add(padB);
function hullTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#e8eaee'; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 1024; i += 64) { g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, i, 256, 2); } for (let i = 0; i < 256; i += 32) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(i, 0, 1, 1024); }
  g.fillStyle = '#1a1c22'; g.fillRect(0, 760, 256, 40); g.fillRect(0, 300, 256, 18); g.fillStyle = '#c4462c'; g.fillRect(0, 820, 256, 6);
  g.save(); g.translate(40, 560); g.rotate(-Math.PI / 2); g.fillStyle = '#1a1c22'; g.font = '700 46px "Inter Tight", sans-serif'; g.fillText('MERIDIAN', 0, 0); g.restore(); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; }
const prof = [[0, 0], [4.2, 0], [4.6, 3], [4.6, 58], [4.4, 66], [3.6, 74], [2.2, 80], [0.6, 84], [0, 85]].map(([r, y]) => new THREE.Vector2(r, y));
const ship = new THREE.Group(); P.scene.add(ship); ship.position.y = 6;
const hullMat = new THREE.MeshStandardMaterial({ map: null, color: 0xb9bec6, metalness: 0.3, roughness: 0.6 });
const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), hullMat); ship.add(hull);
[0, 1, 2, 3].forEach((i) => { const a = i * TAU / 4 + 0.4; const b = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.8, 0], [1.9, 2], [1.9, 34], [1.2, 40], [0, 42]].map(([r, y]) => new THREE.Vector2(r, y)), 32), hullMat); b.position.set(Math.cos(a) * 6.3, 0, Math.sin(a) * 6.3); ship.add(b); });
const bells = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 4, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide })); bells.position.y = -1; ship.add(bells);
// gantry tower
const beamM = new THREE.MeshStandardMaterial({ color: 0x2b2e35, metalness: 0.6, roughness: 0.6 }), BEAMS = [];
for (let y = 0; y < 96; y += 6) { [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => BEAMS.push([x, y + 3, z, 0.5, 6, 0.5])); BEAMS.push([0, y, -4, 8.5, 0.4, 0.4], [0, y, 4, 8.5, 0.4, 0.4], [-4, y, 0, 0.4, 0.4, 8.5], [4, y, 0, 0.4, 0.4, 8.5]); }
BEAMS.push([-8, 74, 0, 8, 1.2, 2.4], [-8, 48, 0, 8, 1.2, 2.4]);
const gant = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), beamM, BEAMS.length); BEAMS.forEach(([x, y, z, sx, sy, sz], i) => { M4.compose(V3.set(x, y, z), Q.identity(), S3.set(sx, sy, sz)); gant.setMatrixAt(i, M4); }); gant.position.set(20, 6, 0); P.scene.add(gant);
const glow = new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-60, 40, 50), new THREE.Vector3(70, 42, 40), new THREE.Vector3(-55, 40, -60), new THREE.Vector3(65, 44, -55), new THREE.Vector3(24, 100, 0), new THREE.Vector3(16, 60, 4)]), new THREE.PointsMaterial({ size: 26, map: DOT, color: 0xfff0d6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false, fog: false })); P.scene.add(glow);
const s1 = new THREE.SpotLight(0xfff0d6, 520, 600, 0.5, 0.75, 1.3); s1.position.set(-60, 40, 50); s1.target.position.set(0, 40, 0); P.scene.add(s1, s1.target);
const s2 = new THREE.SpotLight(0x9fb8ff, 420, 600, 0.5, 0.75, 1.3); s2.position.set(70, 42, 40); s2.target.position.set(0, 35, 0); P.scene.add(s2, s2.target);
P.scene.add(new THREE.HemisphereLight(0x3a4a6a, 0x0a0a0a, 0.9)); const ignL = new THREE.PointLight(0xff8a3a, 0, 900, 1.2); ignL.position.set(0, 4, 0); P.scene.add(ignL);
const STN = 700, steamG = new THREE.BufferGeometry(), stP = new Float32Array(STN * 3), stS = new Float32Array(STN); steamG.setAttribute('position', new THREE.BufferAttribute(stP, 3));
const steam = new THREE.Points(steamG, new THREE.PointsMaterial({ size: 20, map: DOT, color: 0xb8bec8, transparent: true, opacity: 0.07, depthWrite: false })); P.scene.add(steam);
const PLN = 700, plG = new THREE.BufferGeometry(), plP = new Float32Array(PLN * 3); plG.setAttribute('position', new THREE.BufferAttribute(plP, 3));
const plume = new THREE.Points(plG, new THREE.PointsMaterial({ size: 10, map: DOT, color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); P.scene.add(plume);
const SMN = 500, smG = new THREE.BufferGeometry(), smP = new Float32Array(SMN * 3); smG.setAttribute('position', new THREE.BufferAttribute(smP, 3));
const smoke = new THREE.Points(smG, new THREE.PointsMaterial({ size: 34, map: DOT, color: 0x8a6a58, transparent: true, opacity: 0.35, depthWrite: false })); P.scene.add(smoke);
const breach = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); breach.position.set(-330, 10, -220); P.scene.add(breach);
let hullReady = false;
function pad(t, o = {}) {
  if (!hullReady) { hullMat.map = hullTex(); hullMat.needsUpdate = true; hullReady = true; }
  const k = o.k ?? 0, ig = o.ignite ?? 0, bT = o.breachT ?? 1e9;
  const shake = ig > 0 ? (hash(Math.floor(t * 60), 1) - 0.5) * 1.6 * ig : 0;
  P.cam.position.set(-110 + k * 30 + shake, 8 + k * 12, 175 - k * 40); P.cam.lookAt(0, 44 + k * 3 + shake * 0.5, 0);
  for (let i = 0; i < STN; i++) { const life = (t * 0.25 + hash(i, 1)) % 1, a = hash(i, 2) * TAU, r = 3 + life * (14 + hash(i, 3) * 20); stP.set([Math.cos(a) * r * 1.4 + (i % 2 ? 14 : -10), 4 + life * (10 + hash(i, 4) * 16), Math.sin(a) * r * 1.4], i * 3); } steamG.attributes.position.needsUpdate = true; steam.material.opacity = 0.07 * (1 - ig * 0.6);
  plume.visible = smoke.visible = ig > 0; ignL.intensity = ig * 260000;
  if (ig > 0) { for (let i = 0; i < PLN; i++) { const l = (t * 3 + hash(i, 5)) % 1, a = hash(i, 6) * TAU, r = l * (2 + 10 * hash(i, 7)) * ig; plP.set([Math.cos(a) * r, 5 - l * 22 * ig, Math.sin(a) * r], i * 3); } plG.attributes.position.needsUpdate = true; plume.material.size = 8 + 10 * ig;
    for (let i = 0; i < SMN; i++) { const l = (t * 0.6 + hash(i, 8)) % 1, a = hash(i, 9) * TAU, r = 8 + l * 90 * ig; smP.set([Math.cos(a) * r, 2 + l * 18 + hash(i, 10) * 10, Math.sin(a) * r], i * 3); } smG.attributes.position.needsUpdate = true; smoke.material.color.setRGB(0.55 + 0.45 * ig, 0.42 + 0.2 * ig, 0.34); }
  const bd = t - bT; breach.visible = bd > 0 && bd < 2; if (breach.visible) { breach.scale.setScalar(4 + bd * 40); breach.material.opacity = Math.max(0, 1 - bd / 2); }
  R.toneMappingExposure = 0.85 + ig * 0.5; R.render(P.scene, P.cam);
  return { canvas: R.domElement, pts: { breach: proj(breach.position, P.cam), nose: proj(new THREE.Vector3(0, 90, 0), P.cam), base: proj(new THREE.Vector3(0, 6, 0), P.cam) } };
}
window.ESC = { earth, debris, city, pad };
