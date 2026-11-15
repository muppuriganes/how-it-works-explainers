// plane3d.js — a real 3D airliner world (three.js), driven as a pure function of time.
// A generic, unbranded A320-class twin-jet (≈37.6 m long, 35.8 m span). Units: metres. Nose points +x.
// usage (module): import { planeWorld } from "../../../lib/plane3d.js";
//   const W = planeWorld(canvas);  W.frame({ p:[x,y,z], pitch, roll, gear, flaps, spoil, fan, cam:[x,y,z], look:[x,y,z], fov, mood, clouds })
// The runway runs along +x from x = 0 (threshold) to x = 3000, centreline z = 0, surface y = 0.
import * as THREE from "./vendor/three/three.module.js";

const C = (h) => new THREE.Color(h);
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const GROUND = 3.77; // plane origin height above the runway with the gear down

// ---------------------------------------------------------------- fuselage: lofted rings with per-station radius + centre height
function fuselage() {
  const n = 56, st = [];
  for (let k = 0; k <= 90; k++) {
    const x = -19 + (37.6 * k) / 90; let r, c;
    if (x > 12) { const u = (18.6 - x) / 6.6; r = 1.98 * Math.pow(Math.max(0, 1 - Math.pow(1 - u, 2)), 0.62); c = -0.32 * Math.pow(1 - u, 1.6); }
    else if (x < -8) { const u = (x + 19) / 11; r = 0.28 + 1.7 * Math.pow(sm(u), 0.75); c = 1.98 - r - 0.05 * (1 - u); }
    else { r = 1.98; c = 0; }
    st.push({ x, r: Math.max(0.02, r), c });
  }
  const pos = [], col = [], idx = [];
  const white = C("#F7F8FB"), belly = C("#C9D0DC"), teal = C("#12A4C4"), red = C("#F2553D");
  st.forEach(({ x, r, c }) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, sa = Math.sin(a);
      pos.push(x, c + r * sa, r * Math.cos(a));
      const cc = sa < -0.42 ? belly : sa > -0.16 && sa < -0.06 ? teal : sa > -0.26 && sa < -0.2 ? red : white;
      col.push(cc.r, cc.g, cc.b);
    }
  });
  for (let k = 0; k < st.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + ((i + 1) % n), c2 = (k + 1) * n + i, d = (k + 1) * n + ((i + 1) % n);
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, st };
}

// ---------------------------------------------------------------- lifting surface: airfoil sections lofted along the span
// map(s, xc, yc) -> [x,y,z] for span fraction s (0 root..1 tip), chord fraction xc (0 LE..1 TE), thickness coord yc (in chords)
function surface(map, chordAt, thick = 0.12, ns = 14, nc = 22, cFrom = 0, cTo = 1) {
  const pos = [], idx = [], ring = [];
  for (let i = 0; i <= nc; i++) { const t = cFrom + (cTo - cFrom) * (0.5 - 0.5 * Math.cos((i / nc) * Math.PI)); ring.push(t); }
  const yt = (x) => 5 * thick * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
  const pts = [...ring.map((x) => [x, yt(x) + 0.02 * Math.sin(Math.PI * x)]), ...ring.slice(1, -1).reverse().map((x) => [x, -yt(x) * 0.8 + 0.02 * Math.sin(Math.PI * x)])];
  const m = pts.length;
  for (let k = 0; k <= ns; k++) { const s = k / ns, ch = chordAt(s); pts.forEach(([xc, yc]) => pos.push(...map(s, xc, yc * ch / 1, ch))); }
  for (let k = 0; k < ns; k++) for (let i = 0; i < m; i++) { const a = k * m + i, b = k * m + ((i + 1) % m), c2 = (k + 1) * m + i, d = (k + 1) * m + ((i + 1) % m); idx.push(a, b, c2, b, d, c2); }
  // tip cap
  const base = ns * m, cen = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let i = 0; i < m; i++) { cx += pos[(base + i) * 3]; cy += pos[(base + i) * 3 + 1]; cz += pos[(base + i) * 3 + 2]; } pos.push(cx / m, cy / m, cz / m);
  for (let i = 0; i < m; i++) idx.push(cen, base + ((i + 1) % m), base + i);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- canvas textures
function tex(w, h, draw, rep = null) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const fieldsTex = () => tex(512, 512, (g) => { const r = rng(7); g.fillStyle = "#9CC98A"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 70; i++) { g.fillStyle = ["#8FBF7C", "#B5D69A", "#C9DDA0", "#A7CB8F", "#D8CFA0"][Math.floor(r() * 5)]; g.fillRect(r() * 512, r() * 512, 40 + r() * 120, 30 + r() * 100); } }, [60, 60]);
const asphaltTex = () => tex(256, 256, (g) => { const r = rng(3); g.fillStyle = "#4B505C"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2200; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.08)"; g.fillRect(r() * 256, r() * 256, 2, 2); } }, [60, 2]);
const cloudTex = () => tex(256, 256, (g) => { const r = rng(11); for (let i = 0; i < 26; i++) { const x = 50 + r() * 156, y = 90 + r() * 80, rr = 30 + r() * 50, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } });
const glowTex = () => tex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,.85)"); gr.addColorStop(0.45, "rgba(255,255,255,.22)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const skidTex = () => tex(1024, 64, (g) => { const r = rng(17); g.clearRect(0, 0, 1024, 64); for (let i = 0; i < 260; i++) { const y = (r() < 0.5 ? 14 : 50) + (r() - 0.5) * 12, x = r() * 1024, l = 40 + r() * 260; g.strokeStyle = `rgba(20,20,24,${0.08 + r() * 0.22})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 3); g.stroke(); } });
const titleTex = () => tex(512, 96, (g) => { g.clearRect(0, 0, 512, 96); g.font = "italic 900 78px Arial"; g.fillStyle = "#12A4C4"; g.fillText("hx", 20, 76); g.fillStyle = "#1B2340"; g.fillText("air", 130, 76); g.fillStyle = "#F2553D"; g.beginPath(); g.arc(262, 30, 9, 0, Math.PI * 2); g.fill(); });
const windowTex = () => tex(64, 64, (g) => { g.fillStyle = "#1B2340"; g.beginPath(); g.ellipse(32, 32, 20, 28, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(140,200,255,.45)"; g.beginPath(); g.ellipse(26, 24, 7, 11, 0, 0, Math.PI * 2); g.fill(); });
const tailTex = () => tex(256, 256, (g) => { g.fillStyle = "#12A4C4"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#F2553D"; g.beginPath(); g.moveTo(0, 256); g.quadraticCurveTo(140, 150, 256, 40); g.lineTo(256, 110); g.quadraticCurveTo(150, 200, 60, 256); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(150, 120, 34, 0, Math.PI * 2); g.fill(); g.fillStyle = "#12A4C4"; g.font = "bold 44px Arial"; g.textAlign = "center"; g.fillText("✈", 150, 136); });

export function planeWorld(canvas, o = {}) {
  const { w = 1920, h = 1080 } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const MOODS = {
    day: { top: "#2F7FD8", mid: "#8EC4F0", bot: "#DCEFFB", ground: "#8FA27A", sunCol: "#FFF2D6", glow: 0.35, hemi: [0xffffff, 0x9fb07a, 1.15], sun: [0xfff4e0, 2.9], sunPos: [-300, 500, 250], fogNear: 900, fogFar: 9000, env: 0.9 },
    sunset: { top: "#25336F", mid: "#E98A78", bot: "#FFD39A", ground: "#8E7E92", sunCol: "#FFB060", glow: 1.0, hemi: [0xffe2cc, 0x9a8aa8, 1.3], sun: [0xffa860, 3.2], sunPos: [-900, 120, -300], fogNear: 2600, fogFar: 12000, env: 1.0 },
    night: { top: "#040817", mid: "#101A40", bot: "#26346A", ground: "#141A30", sunCol: "#8FA8FF", glow: 0.25, hemi: [0x9aaae0, 0x323a5a, 1.0], sun: [0xb8c8ff, 0.9], sunPos: [300, 600, -200], fogNear: 700, fogFar: 7000, env: 0.6 },
  };
  const SKYV = `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const SKYF = `uniform vec3 top, mid, bot, gnd, sunCol, sunDir; uniform float glow, useG; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float h = d.y;
      vec3 c = mix(bot, mid, smoothstep(0.0, 0.2, h)); c = mix(c, top, smoothstep(0.2, 0.8, h));
      if (h < 0.0) c = mix(bot, gnd, useG * smoothstep(0.0, 0.08, -h));
      float s = max(dot(d, normalize(sunDir)), 0.0);
      c += sunCol * (pow(s, 900.0) * 4.0 + pow(s, 40.0) * 0.55 * glow + pow(s, 6.0) * 0.22 * glow);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const mkSkyMat = () => new THREE.ShaderMaterial({ uniforms: { top: { value: C("#fff") }, mid: { value: C("#fff") }, bot: { value: C("#fff") }, gnd: { value: C("#888") }, sunCol: { value: C("#fff") }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glow: { value: 0.5 }, useG: { value: 0 } }, vertexShader: SKYV, fragmentShader: SKYF, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
  const setSky = (m, M) => { const u = m.uniforms; u.top.value.set(M.top); u.mid.value.set(M.mid); u.bot.value.set(M.bot); u.gnd.value.set(M.ground); u.sunCol.value.set(M.sunCol); u.sunDir.value.set(...M.sunPos).normalize(); u.glow.value = M.glow; };
  const skyMat = mkSkyMat(), sky = new THREE.Mesh(new THREE.SphereGeometry(40000, 48, 24), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), envMat = mkSkyMat(); envMat.uniforms.useG.value = 1; envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), envMat));
  const ENV = {}; Object.entries(MOODS).forEach(([k, M]) => { setSky(envMat, M); envMat.uniforms.sunCol.value.multiplyScalar(0.45); ENV[k] = pmrem.fromScene(envScene, 0.02).texture; });
  scene.fog = new THREE.Fog(C("#D6ECFA"), 900, 9000);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9fb07a, 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 1500 }); sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  // stars
  const sg = new THREE.BufferGeometry(), sp = [], sr = rng(9);
  for (let i = 0; i < 900; i++) { const a = sr() * Math.PI * 2, e = 0.05 + sr() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 20000, Math.sin(e) * 20000, Math.sin(a) * Math.cos(e) * 20000); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false })); scene.add(stars);

  // ------------------------------------------------ ground, runway, airport
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ map: fieldsTex(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; ground.receiveShadow = true; scene.add(ground);
  const flat = (w2, d2, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w2, d2), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  flat(3800, 300, new THREE.MeshStandardMaterial({ color: 0x8DBB6E, roughness: 1 }), 1500, -0.3, 0);              // mown grass around the runway
  flat(3040, 78, new THREE.MeshStandardMaterial({ color: 0x8C9098, roughness: 1 }), 1500, -0.1, 0);              // paved shoulders
  const taxi = new THREE.MeshStandardMaterial({ map: asphaltTex(), roughness: 0.95 }), yellow = new THREE.MeshStandardMaterial({ color: 0xF2C230, roughness: 0.8 });
  flat(2700, 23, taxi, 1500, -0.05, 100); [400, 1100, 1800, 2600].forEach((x) => flat(23, 70, taxi, x, -0.08, 64));
  flat(800, 70, new THREE.MeshStandardMaterial({ color: 0xB9BCC2, roughness: 0.95 }), 1300, -0.05, 158);           // apron
  flat(2700, 0.5, yellow, 1500, 0.0, 100); [400, 1100, 1800, 2600].forEach((x) => flat(0.5, 70, yellow, x, 0.0, 64));
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(3000, 60), new THREE.MeshStandardMaterial({ map: asphaltTex(), roughness: 0.95 }));
  rw.rotation.x = -Math.PI / 2; rw.position.set(1500, 0, 0); rw.receiveShadow = true; scene.add(rw);
  const skid = flat(900, 16, new THREE.MeshStandardMaterial({ map: skidTex(), transparent: true, depthWrite: false, roughness: 1 }), 700, 0.015, 0);
  const paint = new THREE.MeshStandardMaterial({ color: 0xF4F4F0, roughness: 0.8 });
  const addInst = (geo, mat, list) => { const m = new THREE.InstancedMesh(geo, mat, list.length), d = new THREE.Object3D(); list.forEach((p, i) => { d.position.set(...p); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.receiveShadow = true; scene.add(m); return m; };
  addInst(new THREE.BoxGeometry(30, 0.04, 0.9), paint, Array.from({ length: 48 }, (_, i) => [140 + i * 60, 0.02, 0]));          // centreline dashes
  addInst(new THREE.BoxGeometry(3000, 0.04, 0.9), paint, [[1500, 0.02, -28], [1500, 0.02, 28]]);                                     // edge lines
  addInst(new THREE.BoxGeometry(40, 0.04, 1.8), paint, Array.from({ length: 12 }, (_, i) => [24, 0.02, (i < 6 ? -25 : 4.5) + (i % 6) * 3.6])); // threshold piano keys
  addInst(new THREE.BoxGeometry(22, 0.04, 3), paint, [300, 450, 600].flatMap((x) => [[x, 0.02, -10], [x, 0.02, 10]]));             // touchdown zone
  const num = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), new THREE.MeshStandardMaterial({ map: tex(256, 160, (g) => { g.fillStyle = "#4B505C"; g.fillRect(0, 0, 256, 160); g.fillStyle = "#F4F4F0"; g.font = "bold 140px Arial"; g.textAlign = "center"; g.fillText("09", 128, 140); }), roughness: 0.9 }));
  num.rotation.x = -Math.PI / 2; num.rotation.z = -Math.PI / 2; num.position.set(85, 0.03, 0); scene.add(num);
  // edge + approach lights (glow at dusk/night)
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFE9A8 });
  const rLights = addInst(new THREE.SphereGeometry(0.45, 8, 6), lightMat, [...Array.from({ length: 51 }, (_, i) => [i * 60, 0.4, -31]), ...Array.from({ length: 51 }, (_, i) => [i * 60, 0.4, 31]), ...Array.from({ length: 15 }, (_, i) => [-30 - i * 30, 0.6, 0])]);
  // terminal + ATC tower + hangars
  const glass = new THREE.MeshStandardMaterial({ color: 0x9FC7E8, roughness: 0.2, metalness: 0.4 }), concrete = new THREE.MeshStandardMaterial({ color: 0xE6E1D6, roughness: 0.9 });
  const term = new THREE.Mesh(new THREE.BoxGeometry(700, 22, 70), concrete); term.position.set(1300, 11, 230); term.castShadow = true; scene.add(term);
  const termG = new THREE.Mesh(new THREE.BoxGeometry(690, 12, 2), glass); termG.position.set(1300, 13, 194); scene.add(termG);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 700, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xC9D0DC, roughness: 0.5, metalness: 0.3 })); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.4); roof.position.set(1300, 22, 230); scene.add(roof);
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 60, 16), concrete); tw.position.set(1900, 30, 200); scene.add(tw);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(10, 8, 9, 10), glass); cab.position.set(1900, 64, 200); scene.add(cab);
  const cabR = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 2, 10), new THREE.MeshStandardMaterial({ color: 0x3E4A6A })); cabR.position.set(1900, 69.5, 200); scene.add(cabR);
  [1000, 1150, 1300, 1450, 1600].forEach((x) => { const jb = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 30), concrete); jb.position.set(x, 5.5, 182); jb.castShadow = true; scene.add(jb); });
  [400, 520].forEach((x) => { const hg = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 90, 20, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xD4D9E2, roughness: 0.6 })); hg.rotation.x = Math.PI / 2; hg.rotation.z = Math.PI / 2; hg.position.set(x, 0, -220); scene.add(hg); });
  // a distant city (boxes with lit windows at night)
  const cityR = rng(21), cityMat = new THREE.MeshStandardMaterial({ color: 0xB8C2D6, roughness: 0.8, emissive: 0x000000 });
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityMat, 380), cd = new THREE.Object3D();
  for (let i = 0; i < 380; i++) { const hh = 20 + cityR() * 110; cd.position.set(3600 + cityR() * 3000, hh / 2, -2600 + cityR() * 5200); cd.scale.set(30 + cityR() * 50, hh, 30 + cityR() * 50); cd.updateMatrix(); city.setMatrixAt(i, cd.matrix); }
  scene.add(city);
  const cityLights = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(Array.from({ length: 4000 }, () => [3500 + cityR() * 3400, 2 + cityR() * 60, -2700 + cityR() * 5400]).flat(), 3)), new THREE.PointsMaterial({ color: 0xFFD58A, size: 2.2, sizeAttenuation: false })); scene.add(cityLights);
  // trees, in groves (keeps clear of the runway, taxiway, terminal and hangars)
  const TR = rng(31), trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), 3200);
  let ti = 0; const td = new THREE.Object3D(), tcol = new THREE.Color();
  for (let g = 0; g < 120 && ti < 3200; g++) {
    const gx = -1800 + TR() * 6600, gz = (TR() < 0.5 ? -1 : 1) * (190 + TR() * 2200);
    if (gz > 120 && gz < 380 && gx > 800 && gx < 2100) continue; if (gz < -120 && gz > -330 && gx > 250 && gx < 700) continue;
    const cnt = 12 + Math.floor(TR() * 26);
    for (let k = 0; k < cnt && ti < 3200; k++) { const sz = 4 + TR() * 5; td.position.set(gx + (TR() - 0.5) * 180, sz * 0.95, gz + (TR() - 0.5) * 130); td.scale.set(sz, sz * 1.2, sz); td.rotation.set(0, TR() * 6, 0); td.updateMatrix(); trees.setMatrixAt(ti, td.matrix); tcol.set(["#4E7D45", "#5E8F4E", "#3F6B3C", "#6B9A55", "#557F3F"][Math.floor(TR() * 5)]); trees.setColorAt(ti, tcol); ti++; }
  }
  trees.count = ti; scene.add(trees);
  // hills
  const hillR = rng(5);
  for (let i = 0; i < 40; i++) { const a = hillR() * Math.PI * 2, d = 9000 + hillR() * 9000, hh = 300 + hillR() * 900; const hl = new THREE.Mesh(new THREE.ConeGeometry(hh * 3.2, hh, 9), new THREE.MeshStandardMaterial({ color: [0x8FAF8A, 0x7FA383, 0x9AB58E][i % 3], roughness: 1, flatShading: true })); hl.position.set(1500 + Math.cos(a) * d, hh / 2 - 20, Math.sin(a) * d); scene.add(hl); }

  // ------------------------------------------------ clouds: real 3D cumulus puffs (instanced). A cloud sea that tiles around the camera + a few day-sky clouds
  const puffG = new THREE.IcosahedronGeometry(1, 2), cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, envMapIntensity: 0.5 });
  const mkClump = (r, s0) => { const n = 4 + Math.floor(r() * 4), out = []; for (let j = 0; j < n; j++) { const u = n > 1 ? j / (n - 1) : 0.5, rad = s0 * (0.5 + 0.5 * Math.sin(Math.PI * u)) * (0.75 + r() * 0.4); out.push([(u - 0.5) * s0 * 1.7 + (r() - 0.5) * s0 * 0.3, rad * 0.35 + r() * s0 * 0.15, (r() - 0.5) * s0 * 0.7, rad]); } return out; };
  const CR = rng(13), SEA = Array.from({ length: 1100 }, () => ({ x: CR() * 7000, z: CR() * 7000 - 3500, y: CR() * 50, puffs: mkClump(CR, 90 + CR() * 120) }));
  const seaN = SEA.reduce((t, c) => t + c.puffs.length, 0), sea = new THREE.InstancedMesh(puffG, cloudM, seaN); sea.frustumCulled = false; scene.add(sea);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: 0xF4F4F6, roughness: 1 })); deck.rotation.x = -Math.PI / 2; scene.add(deck);
  const SR = rng(41), SKYC = Array.from({ length: 55 }, () => { const a = SR() * Math.PI * 2, d = 3500 + SR() * 6000; return { x: 1500 + Math.cos(a) * d, z: Math.sin(a) * d, y: 1100 + SR() * 700, puffs: mkClump(SR, 140 + SR() * 160) }; });
  const skyCl = new THREE.InstancedMesh(puffG, cloudM, SKYC.reduce((t, c) => t + c.puffs.length, 0)); scene.add(skyCl);
  { const d = new THREE.Object3D(); let i = 0; SKYC.forEach((c) => c.puffs.forEach(([dx, dy, dz, r]) => { d.position.set(c.x + dx, c.y + dy, c.z + dz); d.scale.set(r, r * 0.58, r); d.updateMatrix(); skyCl.setMatrixAt(i++, d.matrix); })); }
  const placeSea = (cam, cy) => { const d = new THREE.Object3D(); let i = 0; SEA.forEach((c) => { const x = cam[0] + ((((c.x - cam[0]) % 7000) + 10500) % 7000) - 3500, z = cam[2] + ((((c.z - cam[2]) % 7000) + 10500) % 7000) - 3500; c.puffs.forEach(([dx, dy, dz, r]) => { d.position.set(x + dx, cy + c.y + dy, z + dz); d.scale.set(r, r * 0.7, r); d.updateMatrix(); sea.setMatrixAt(i++, d.matrix); }); }); sea.instanceMatrix.needsUpdate = true; deck.position.set(cam[0], cy + 8, cam[2]); };

  // ------------------------------------------------ night glows (runway + approach lights)
  const gTex = glowTex(), glowPts = (list, color, size) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(list.flat(), 3)); const m = new THREE.Points(g, new THREE.PointsMaterial({ map: gTex, color, size, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); scene.add(m); return m; };
  const glows = [glowPts([...Array.from({ length: 51 }, (_, i) => [i * 60, 0.6, -31]), ...Array.from({ length: 51 }, (_, i) => [i * 60, 0.6, 31])], 0xFFD98A, 9), glowPts(Array.from({ length: 15 }, (_, i) => [-30 - i * 30, 0.8, 0]), 0xFFF2C8, 14), glowPts(Array.from({ length: 14 }, (_, i) => [-1, 0.5, -26 + i * 4]), 0x44FF88, 8), glowPts(Array.from({ length: 14 }, (_, i) => [2999, 0.5, -26 + i * 4]), 0xFF4455, 8)];

  // ------------------------------------------------ the aircraft
  const plane = new THREE.Group(); scene.add(plane);
  const skin = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.22, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0xDDE2EA, roughness: 0.32, metalness: 0.45, side: THREE.DoubleSide });
  const grey = new THREE.MeshStandardMaterial({ color: 0xCDD3DD, roughness: 0.4, metalness: 0.45, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1B2340, roughness: 0.6, metalness: 0.2 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x14203F, roughness: 0.1, metalness: 0.6 });
  const { geo: fGeo, st } = fuselage();
  const fus = new THREE.Mesh(fGeo, skin); fus.castShadow = true; plane.add(fus);
  const atX = (x) => st.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
  // cabin windows (both sides) + doors
  const wGeo = new THREE.PlaneGeometry(0.3, 0.42), wMat = new THREE.MeshBasicMaterial({ map: windowTex(), transparent: true });
  const winList = []; for (let x = -11.5; x <= 10.2; x += 0.53) if (Math.abs(x - 0.6) > 0.35 && Math.abs(x + 0.4) > 0.35) winList.push(x);
  const wins = new THREE.InstancedMesh(wGeo, wMat, winList.length * 2), wd = new THREE.Object3D();
  winList.forEach((x, i) => [1, -1].forEach((sd, j) => { const s = atX(x), a = 0.3; wd.position.set(x, s.c + s.r * Math.sin(a), sd * (s.r * Math.cos(a) + 0.02)); wd.rotation.set(0, sd > 0 ? 0 : Math.PI, 0); wd.updateMatrix(); wins.setMatrixAt(i * 2 + j, wd.matrix); }));
  plane.add(wins);
  [[11.3, 1], [11.3, -1], [-12.6, 1], [-12.6, -1]].forEach(([x, sd]) => { const s = atX(x); const dr = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.85), new THREE.MeshBasicMaterial({ color: 0xA9B3C6, transparent: true, opacity: 0.6 })); dr.position.set(x, s.c + 0.1, sd * (s.r + 0.025)); dr.rotation.y = sd > 0 ? 0 : Math.PI; plane.add(dr); });
  // belly fairing + titles
  const bf = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.MeshStandardMaterial({ color: 0xC9D0DC, roughness: 0.35, metalness: 0.3 })); bf.scale.set(7.2, 0.95, 2.05); bf.position.set(0.2, -1.5, 0); bf.castShadow = true; plane.add(bf);
  const ttl = new THREE.MeshStandardMaterial({ map: titleTex(), transparent: true, roughness: 0.3, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -4 });
  [1, -1].forEach((sd) => { const a = 0.6, t = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.86), ttl); t.position.set(6.4, 1.98 * Math.sin(a), sd * (1.98 * Math.cos(a) + 0.03)); t.rotation.set(-a * sd, sd > 0 ? 0 : Math.PI, 0, "YXZ"); plane.add(t); });
  // cockpit windscreen: dark panels around the nose
  for (let i = -2; i <= 2; i++) { const a = (i / 2) * 0.95, x = 16.0 - Math.abs(i) * 0.5, s = atX(x); const pn = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.55), glassM); const rr = s.r + 0.02; pn.position.set(x, s.c + rr * 0.62, Math.sin(a) * rr * 0.78); pn.lookAt(x + 3, s.c + rr * 0.62 + 2.6, Math.sin(a) * rr * 3); plane.add(pn); }
  // wings (with dihedral + sweep + taper) and winglets
  const SW = Math.tan(THREE.MathUtils.degToRad(25)), DI = Math.tan(THREE.MathUtils.degToRad(5.5)), WY = -1.15, RLE = 3.2;
  const wingMap = (sd) => (s, xc, yc, ch) => { const z = 1.9 + s * 16.0; return [RLE - (z - 1.9) * SW - xc * ch, WY + (z - 1.9) * DI + yc, sd * z]; };
  const chordW = (s) => 6.2 - 4.6 * s;
  const wingGroup = { flaps: [], spoilers: [] };
  [1, -1].forEach((sd) => {
    const wg = new THREE.Mesh(surface(wingMap(sd), chordW, 0.12, 16, 24, 0, 0.8), metal); wg.castShadow = true; plane.add(wg);
    if (sd < 0) wg.geometry.scale(1, 1, 1);
    // winglet
    const tip = wingMap(sd)(1, 0, 0, chordW(1));
    const wl = new THREE.Mesh(surface((s, xc, yc, ch) => [tip[0] - 0.25 - s * 0.9 - xc * ch, tip[1] + s * 2.2, sd * (17.9 + 0.1 * s) + yc * sd], (s) => 1.4 - 0.8 * s, 0.1, 6, 14), new THREE.MeshStandardMaterial({ color: 0x12A4C4, roughness: 0.4 }));
    wl.material.side = THREE.DoubleSide; plane.add(wl);
    // flaps + spoilers: built in right-wing coordinates, mirrored for the left wing (scale.z = -1) so hinges behave the same
    const side = new THREE.Group(); side.scale.z = sd; plane.add(side);
    const wR = wingMap(1), z0 = 2.4, z1 = 11.5, te0 = wR((z0 - 1.9) / 16, 0.8, 0, chordW((z0 - 1.9) / 16)), te1 = wR((z1 - 1.9) / 16, 0.8, 0, chordW((z1 - 1.9) / 16));
    const len = Math.hypot(te1[0] - te0[0], te1[2] - te0[2]);
    const piv = new THREE.Object3D(); piv.position.set(...te0); piv.rotation.order = "YXZ"; piv.rotation.y = Math.atan2(te1[0] - te0[0], te1[2] - te0[2]); piv.rotation.x = -Math.atan2(te1[1] - te0[1], len); side.add(piv);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, len), metal); flap.position.set(-0.65, 0, len / 2); flap.castShadow = true;
    const fp = new THREE.Object3D(); fp.add(flap); piv.add(fp); wingGroup.flaps.push(fp);
    const sp0 = wR((6 - 1.9) / 16, 0.6, 0.07, chordW((6 - 1.9) / 16)), sp1 = wR((12 - 1.9) / 16, 0.6, 0.07, chordW((12 - 1.9) / 16));
    const sl = Math.hypot(sp1[0] - sp0[0], sp1[2] - sp0[2]);
    const spv = new THREE.Object3D(); spv.position.set(...sp0); spv.rotation.order = "YXZ"; spv.rotation.y = Math.atan2(sp1[0] - sp0[0], sp1[2] - sp0[2]); spv.rotation.x = -Math.atan2(sp1[1] - sp0[1], sl); side.add(spv);
    const spl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, sl), new THREE.MeshStandardMaterial({ color: 0xDDE2EA, roughness: 0.4, side: THREE.DoubleSide })); spl.position.set(-0.45, 0, sl / 2);
    const spp = new THREE.Object3D(); spp.add(spl); spv.add(spp); wingGroup.spoilers.push(spp);
  });
  // flap-track fairings (canoes under the trailing edge)
  [1, -1].forEach((sd) => [4.6, 8.6, 11.6].forEach((z) => { const sF = (z - 1.9) / 16, pp = wingMap(sd)(sF, 0.78, -0.2, chordW(sF)); const cn = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), metal); cn.scale.set(1.7, 0.3, 0.22); cn.position.set(pp[0] - 0.3, pp[1] - 0.12, pp[2]); cn.castShadow = true; plane.add(cn); }));
  // engines: lathe nacelle + fan + spinner + pylon
  const fans = [];
  const nacProf = [[0.98, 0], [1.08, 0.12], [1.16, 0.6], [1.14, 1.6], [1.02, 3.0], [0.78, 3.9], [0.7, 4.2]].map(([r, y]) => new THREE.Vector2(r, y));
  [1, -1].forEach((sd) => {
    const z = 5.75, le = RLE - (z - 1.9) * SW, ey = WY + (z - 1.9) * DI - 1.75, ex = le + 2.0;
    const eng = new THREE.Group(); eng.position.set(ex, ey, sd * z); plane.add(eng);
    const nac = new THREE.Mesh(new THREE.LatheGeometry(nacProf, 40), new THREE.MeshStandardMaterial({ color: 0xF2F4F8, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide })); nac.rotation.z = Math.PI / 2; nac.castShadow = true; eng.add(nac);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.07, 10, 40), new THREE.MeshStandardMaterial({ color: 0xC9D0DC, metalness: 0.7, roughness: 0.25 })); lip.rotation.y = Math.PI / 2; lip.position.x = -0.02; eng.add(lip);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.17, 0.5, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x12A4C4, roughness: 0.4 })); band.rotation.z = Math.PI / 2; band.position.x = -1.3; eng.add(band);
    const fanG = new THREE.Group(); fanG.position.x = -0.45; eng.add(fanG);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.97, 40), dark); disc.rotation.y = Math.PI / 2; fanG.add(disc);
    const bladeM = new THREE.MeshStandardMaterial({ color: 0xB8C0CC, metalness: 0.9, roughness: 0.22 }); for (let i = 0; i < 24; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.84, 0.3), bladeM); const a = (i / 24) * Math.PI * 2; bl.position.set(0.04, Math.cos(a) * 0.52, Math.sin(a) * 0.52); bl.rotation.set(a, 0.62, 0); fanG.add(bl); }
    const spin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x9AA3B4, metalness: 0.7, roughness: 0.3 })); spin.rotation.z = Math.PI / 2; spin.position.x = 0.32; fanG.add(spin);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff })); swirl.rotation.y = Math.PI / 2; swirl.position.x = 0.36; fanG.add(swirl);
    fans.push(fanG);
    const plug = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 24), dark); plug.rotation.z = Math.PI / 2; plug.position.x = -4.6; eng.add(plug);
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 0.35), metal); pyl.position.set(-2.2, 1.2, 0); eng.add(pyl);
  });
  // tail fin + horizontal stabilisers
  const finMat = new THREE.MeshStandardMaterial({ map: tailTex(), roughness: 0.4, side: THREE.DoubleSide });
  const finGeo = surface((s, xc, yc, ch) => [-11.2 - s * 6.0 * Math.tan(THREE.MathUtils.degToRad(34)) * 1.3 - xc * ch, 1.85 + s * 6.0, yc], (s) => 6.6 - 4.4 * s, 0.1, 10, 20);
  // planar UVs for the tail texture
  const fp = finGeo.attributes.position, uv = []; for (let i = 0; i < fp.count; i++) uv.push((fp.getX(i) + 21) / 10, (fp.getY(i) - 1.8) / 6.2); finGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const fin = new THREE.Mesh(finGeo, finMat); fin.castShadow = true; plane.add(fin);
  [1, -1].forEach((sd) => { const hs = new THREE.Mesh(surface((s, xc, yc, ch) => { const z = 0.9 + s * 6.1; return [-14.6 - (z - 0.9) * Math.tan(THREE.MathUtils.degToRad(30)) - xc * ch, 0.9 + (z - 0.9) * 0.1 + yc, sd * z]; }, (s) => 3.6 - 2.2 * s, 0.1, 8, 16), metal); hs.castShadow = true; plane.add(hs); });
  // landing gear (retractable): nose + 2 mains
  const tyre = new THREE.MeshStandardMaterial({ color: 0x1B1D24, roughness: 0.9 }), hub = new THREE.MeshStandardMaterial({ color: 0xC9D0DC, metalness: 0.6 });
  const gears = [];
  const mkGear = (x, z, len, r) => { const gpv = new THREE.Group(); gpv.position.set(x, -1.6, z); plane.add(gpv); const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 10), hub); strut.position.y = -len / 2; gpv.add(strut);
    [-0.32, 0.32].forEach((dz) => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.36, 24), tyre); wh.rotation.x = Math.PI / 2; wh.position.set(0, -len, dz); wh.castShadow = true; gpv.add(wh); const hb = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.38, 16), hub); hb.rotation.x = Math.PI / 2; hb.position.set(0, -len, dz); gpv.add(hb); });
    gears.push(gpv); };
  mkGear(14.0, 0, 1.75, 0.42); mkGear(-0.6, 3.8, 1.6, 0.57); mkGear(-0.6, -3.8, 1.6, 0.57);
  // nav lights + beacon
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3344 })), navG = navR.clone(); navG.material = new THREE.MeshBasicMaterial({ color: 0x33ff88 });
  navR.position.set(...wingMap(-1)(1, 0.1, 0.05, chordW(1))); navG.position.set(...wingMap(1)(1, 0.1, 0.05, chordW(1))); plane.add(navR, navG);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2030 })); beacon.position.set(-2, 2.05, 0); plane.add(beacon);
  const land = new THREE.SpotLight(0xfff2d0, 0, 900, 0.32, 0.4, 1.2); land.position.set(8, -1.4, 0); land.target.position.set(80, -12, 0); plane.add(land, land.target);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(7, 70, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF0C8, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.rotation.z = Math.PI / 2 + 0.16; beam.position.set(44, -6.5, 0); plane.add(beam);
  const navGl = [[navR, 0xff4455], [navG, 0x44ff88], [beacon, 0xff3040]].map(([o, c]) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.set(2.4, 2.4, 1); sp.position.copy(o.position); plane.add(sp); return sp; });
  // parked aircraft at the gates (static copies, no lights)
  const parked = [1060, 1390].map((x) => { const c = plane.clone(); c.traverse((o) => { if (o.isLight || o.isSprite || o === beam) o.visible = false; }); c.children.forEach((o) => { if (o.material === beam.material) o.visible = false; }); c.position.set(x, GROUND, 148); c.rotation.y = -Math.PI / 2; scene.add(c); return c; });
  // vignette pass
  const ovScene = new THREE.Scene(), ovCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  ovScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader: `varying vec2 vU; void main(){ float d = length((vU - 0.5) * vec2(1.25, 1.0)); gl_FragColor = vec4(0.05, 0.06, 0.12, smoothstep(0.42, 0.95, d) * 0.42); }` })));
  renderer.autoClear = false;

  const camera = new THREE.PerspectiveCamera(35, w / h, 0.3, 80000);

  function frame({ p = [0, GROUND, 0], pitch = 0, roll = 0, yaw = 0, gear = 1, flaps = 0, spoil = 0, fan = 0, cam = [-30, 6, 40], look = null, fov = 35, mood = "day", clouds: cl = false, cloudY = 1200, beaconOn = 0 } = {}) {
    const M = MOODS[mood] || MOODS.day;
    setSky(skyMat, M); scene.environment = ENV[mood] || ENV.day; scene.environmentIntensity = M.env; scene.fog.color.set(M.bot); scene.fog.near = M.fogNear; scene.fog.far = M.fogFar;
    hemi.color.set(M.hemi[0]); hemi.groundColor.set(M.hemi[1]); hemi.intensity = M.hemi[2];
    sun.color.set(M.sun[0]); sun.intensity = M.sun[1];
    sun.position.set(p[0] + M.sunPos[0], p[1] + M.sunPos[1], p[2] + M.sunPos[2]); sun.target.position.set(...p);
    const night = mood === "night", dusk = mood !== "day";
    stars.visible = night; stars.position.set(...cam);
    lightMat.color.set(dusk ? 0xFFE9A8 : 0xF2F2EA); rLights.visible = dusk;
    cityLights.visible = dusk; cityMat.emissive.set(night ? 0x1a2240 : 0x000000);
    glows.forEach((g) => (g.visible = dusk)); navGl.forEach((g, i) => (g.visible = dusk && (i < 2 || beacon.visible))); beam.visible = false;
    glass.emissive.set(night ? 0x8a6a30 : 0x000000);
    land.intensity = night ? 900 : 0;
    // plane pose
    plane.position.set(...p); plane.rotation.set(roll, yaw, pitch, "YXZ");
    gears.forEach((g, i) => { g.visible = gear > 0.02; g.scale.y = Math.max(0.02, gear); g.rotation.x = 0; g.rotation.z = (1 - gear) * (i === 0 ? -1.4 : 1.4); });
    wingGroup.flaps.forEach((f) => { f.position.x = -0.75 * flaps; f.position.y = -0.22 * flaps; f.rotation.z = 0.55 * flaps; });
    wingGroup.spoilers.forEach((s) => (s.rotation.z = -0.85 * spoil));
    fans.forEach((f) => (f.rotation.x = fan));
    beacon.visible = beaconOn ? Math.floor(beaconOn * 1.5) % 2 === 0 : false; navGl[2].visible = dusk && beacon.visible;
    // clouds band follows the camera (tiled 8000 m)
    sea.visible = deck.visible = !!cl; skyCl.visible = !cl && !night; if (cl) placeSea(cam, cloudY);
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(...cam); camera.lookAt(...(look || p)); sky.position.set(...cam);
    renderer.clear(); renderer.render(scene, camera); renderer.render(ovScene, ovCam);
  }
  return { frame, GROUND, THREE };
}
