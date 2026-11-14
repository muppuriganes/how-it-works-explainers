// train3d.js — a real 3D bullet train world (three.js), driven as a pure function of time.
// usage (module): import { trainWorld } from "../../../lib/train3d.js";
//   const W3 = trainWorld(canvas, { cars: 6 });  W3.frame({ x, cam:[x,y,z], look:[x,y,z], fov })
// The train runs along +x on track A (z = 0) of a twin-track viaduct. Rail top is y = 0.
import * as THREE from "./vendor/three/three.module.js";

const C = (h) => new THREE.Color(h);
const CAR_L = 25, HALF_W = 1.7, H = 3.6, NOSE_L = 16, BOT = 0.3;
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

// nose profile, s: 0 at the tip .. 1 where the nose meets the full body (kingfisher "beak" + raised cab canopy)
function profile(s) {
  const e = Math.min(1, Math.max(0, s));
  const w = HALF_W * Math.sqrt(1 - Math.pow(1 - e, 2.6));
  const f = e < 0.55 ? 0.42 * sm(e / 0.55) : 0.42 + 0.58 * sm((e - 0.55) / 0.42);
  const top = 0.95 + (H - 0.95) * f;
  const bot = BOT + 0.45 * Math.pow(1 - e, 4);
  return { w: Math.max(0.03, w), top: Math.max(bot + 0.06, top), bot };
}
function ring(w, top, bot, n) {
  const pts = [], cy = (top + bot) / 2, hh = (top - bot) / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const ex = 2 / 3.4, ey = 2 / (s > 0 ? 2.4 : 6); // near-vertical sides, round roof, flat floor
    pts.push([Math.sign(c) * Math.pow(Math.abs(c), ex) * w, cy + Math.sign(s) * Math.pow(Math.abs(s), ey) * hh, (s * 0.5 + 0.5)]);
  }
  return pts;
}
function loft(stations, n = 64) {
  const pos = [], nose = [], rel = [], idx = [];
  stations.forEach((st) => ring(st.w, st.top, st.bot, n).forEach(([z, y]) => { pos.push(st.x, y, z); nose.push(st.nose); rel.push((y - st.bot) / (st.top - st.bot)); }));
  for (let k = 0; k < stations.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + ((i + 1) % n), c2 = (k + 1) * n + i, d = (k + 1) * n + ((i + 1) % n);
    idx.push(a, b, c2, b, d, c2);
  }
  const L = stations.length - 1;
  const capA = pos.length / 3; pos.push(stations[0].x + 0.05, (stations[0].top + stations[0].bot) / 2, 0); nose.push(0); rel.push(0.5);
  const capB = pos.length / 3; pos.push(stations[L].x - 0.05, (stations[L].top + stations[L].bot) / 2, 0); nose.push(0); rel.push(0.5);
  for (let i = 0; i < n; i++) { idx.push(capA, (i + 1) % n, i); idx.push(capB, L * n + i, L * n + ((i + 1) % n)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aNose", new THREE.Float32BufferAttribute(nose, 1));
  g.setAttribute("aRel", new THREE.Float32BufferAttribute(rel, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function liveryMaterial({ body = "#FBFCFE", stripe = "#2F6FE0", accent = "#F5A524", glass = "#1B2742", skirt = "#C9D0DC" } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.0, emissive: 0x3a3f4a });
  m.onBeforeCompile = (sh) => {
    m.userData.shader = sh;
    Object.assign(sh.uniforms, { uGlow: { value: 0 }, uBody: { value: C(body) }, uStripe: { value: C(stripe) }, uAccent: { value: C(accent) }, uGlass: { value: C(glass) }, uSkirt: { value: C(skirt) } });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aNose; attribute float aRel; varying float vNose; varying float vRel; varying vec3 vP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNose = aNose; vRel = aRel; vP = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
      uniform vec3 uBody,uStripe,uAccent,uGlass,uSkirt; uniform float uGlow; varying float vNose; varying float vRel; varying vec3 vP;
      float sdRB(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r; }`)
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );", `
        vec3 col = uBody; float y = vP.y; float gl = 0.0;
        float lx = mod(vP.x, ${CAR_L.toFixed(1)});
        bool body = vNose < 0.0;
        if (y < 0.8) col = uSkirt;
        if (y > 1.02 && y < 1.3) col = uStripe;
        if (y > 1.36 && y < 1.44) col = uAccent;
        if (body || vNose > 0.9) {
          if (y < 0.72 && ((lx > 2.8 && lx < 6.4) || (lx > 18.6 && lx < 22.2))) col = vec3(0.17,0.2,0.28);   // bogie wells
          if (lx < 0.2 || lx > ${(CAR_L - 0.2).toFixed(2)}) col = vec3(0.17,0.2,0.28);                          // gangway
        }
        if (body) {
          float wx = mod(lx, 1.6) - 0.8;
          if (lx > 3.0 && lx < ${(CAR_L - 3.0).toFixed(1)} && sdRB(vec2(wx, y - 2.36), vec2(0.5, 0.3), 0.13) < 0.0) { col = mix(uGlass, vec3(1.0,0.86,0.52), uGlow); gl = 1.0; }
          float d1 = sdRB(vec2(lx - 1.45, y - 1.95), vec2(0.5, 1.0), 0.12), d2 = sdRB(vec2(lx - ${(CAR_L - 1.45).toFixed(2)}, y - 1.95), vec2(0.5, 1.0), 0.12);
          if (abs(d1) < 0.035 || abs(d2) < 0.035) col = vec3(0.62,0.66,0.74);                                 // door outlines
        } else {
          if (vNose > 0.5 && vNose < 0.8 && vRel > 0.66) col = uGlass;                                          // cab windscreen
          if (vNose > 0.12 && vNose < 0.2 && vRel > 0.3 && vRel < 0.46) { col = vec3(1.0,0.96,0.82); gl = 2.0; }             // headlights
        }
        vec4 diffuseColor = vec4( col, opacity );`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance += gl * uGlow * vec3(1.0,0.8,0.45);");
  };
  return m;
}
function buildTrain(cars, mat) {
  const g = new THREE.Group(), stations = [];
  const total = CAR_L * cars, step = 0.2;
  for (let d = 0; d <= total + 1e-6; d += step) {
    const back = total - d;
    if (d < NOSE_L) stations.push({ x: -d, ...profile(d / NOSE_L), nose: d / NOSE_L });
    else if (back < NOSE_L) stations.push({ x: -d, ...profile(back / NOSE_L), nose: back / NOSE_L });
    else stations.push({ x: -d, w: HALF_W, top: H, bot: BOT, nose: -1 });
  }
  const bodyMesh = new THREE.Mesh(loft(stations), mat); bodyMesh.castShadow = true; bodyMesh.receiveShadow = true; g.add(bodyMesh);
  // wheels peeking in the wells
  const dark = new THREE.MeshStandardMaterial({ color: 0x262c3c, roughness: 0.7 });
  const wheelG = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 16); wheelG.rotateX(Math.PI / 2);
  for (let k = 0; k < cars; k++) [3.6, 5.6, 19.4, 21.4].forEach((o) => { if ((k === 0 && o < 17) || (k === cars - 1 && o > 8)) return; [-HALF_W + 0.18, HALF_W - 0.18].forEach((z) => { const wh = new THREE.Mesh(wheelG, dark); wh.position.set(-(k * CAR_L) - o, 0.4, z); g.add(wh); }); });
  // single-arm pantograph on car 3
  const pg = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0x7d879c, metalness: 0.6, roughness: 0.35 });
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.35, 1.6), new THREE.MeshStandardMaterial({ color: 0xe9edf3, roughness: 0.4 })); shroud.position.y = 0.12; pg.add(shroud);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.1), steel); lower.position.set(0.55, 0.62, 0); lower.rotation.z = 0.62; pg.add(lower);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.08), steel); upper.position.set(0.5, 1.48, 0); upper.rotation.z = -0.68; pg.add(upper);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 1.9), steel); head.position.set(-0.02, 1.95, 0); pg.add(head);
  pg.position.set(-(CAR_L * 2.5), H - 0.02, 0); g.add(pg);
  g.userData = { length: total, pantograph: pg };
  return g;
}
function fieldsTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d"), cols = ["#CFE9C9", "#BFE0B8", "#D9EDC4", "#C6E4CF", "#E3EEC2", "#B8DCC0"];
  x.fillStyle = "#CDE8C8"; x.fillRect(0, 0, 512, 512);
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(r() * 512, r() * 512, 60 + r() * 140, 40 + r() * 120); }
  x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, r() * 512); x.lineTo(512, r() * 512); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 40); return t;
}

// ---------------------------------------------------------------- the world
export function trainWorld(canvas, o = {}) {
  const { cars = 6, w = 1920, h = 1080, skyTop = "#8FCBF0", skyBot = "#E6F4FC", fogNear = 160, fogFar = 1100, livery = {} } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const sky = document.createElement("canvas"); sky.width = 4; sky.height = 256;
  const sg = sky.getContext("2d"), gr = sg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, skyTop); gr.addColorStop(1, skyBot); sg.fillStyle = gr; sg.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace; scene.background = skyTex;
  const mkSky = (a, b) => { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gg = g.createLinearGradient(0, 0, 0, 256); gg.addColorStop(0, a); gg.addColorStop(1, b); g.fillStyle = gg; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const MOODS = {
    day: { sky: skyTex, fog: skyBot, hemi: [0xffffff, 0xe2e6ee, 1.7], sun: [0xfff6ea, 2.3], sunPos: [80, 140, 110], glow: 0 },
    sunset: { sky: mkSky("#F7A07E", "#FFE0B0"), fog: "#FFD9B0", hemi: [0xffe0c8, 0xc8b4a4, 1.35], sun: [0xffa860, 2.4], sunPos: [-160, 40, 60], glow: 0.35 },
    night: { sky: mkSky("#0B1530", "#2A3B70"), fog: "#22305C", hemi: [0x7a8cc8, 0x2a3354, 0.75], sun: [0xa8baff, 0.7], sunPos: [60, 120, -80], glow: 1 },
  };
  const starG = new THREE.BufferGeometry(), sp = [];
  let sd = 9; const sr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 600; i++) { const a = sr() * Math.PI * 2, e = 0.08 + sr() * 1.2; sp.push(Math.cos(a) * Math.cos(e) * 2600, Math.sin(e) * 2600, Math.sin(a) * Math.cos(e) * 2600); }
  starG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false })); stars.visible = false; scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), new THREE.MeshBasicMaterial({ color: 0xF6F1DC, fog: false })); moon.visible = false; scene.add(moon);
  scene.fog = new THREE.Fog(C(skyBot), fogNear, fogFar);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe2e6ee, 1.7));
  const sun = new THREE.DirectionalLight(0xfff6ea, 2.3); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 70, bottom: -70, near: 1, far: 500 }); sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  const DECK = 13, TB = -4.7, LEN = 8000, X0 = -LEN / 2 + 1500;
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(LEN * 1.5, LEN * 1.5), new THREE.MeshStandardMaterial({ map: fieldsTexture(), roughness: 1 }));
  gnd.rotation.x = -Math.PI / 2; gnd.position.set(X0, -DECK, 0); gnd.receiveShadow = true; scene.add(gnd);
  const concrete = new THREE.MeshStandardMaterial({ color: 0xe2e6ed, roughness: 0.85 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(LEN, 2.4, 11.8), concrete); deck.position.set(X0, -1.62, TB / 2); deck.receiveShadow = true; deck.castShadow = true; scene.add(deck);
  const parM = new THREE.MeshStandardMaterial({ color: 0xd3d9e2, roughness: 0.85 });
  [3.35, TB - 3.35].forEach((z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(LEN, 1.3, 0.3), parM); p.position.set(X0, 0.2, z); p.castShadow = true; scene.add(p); });
  const slabM = new THREE.MeshStandardMaterial({ color: 0xb6bdc9, roughness: 0.95 }), railM = new THREE.MeshStandardMaterial({ color: 0x9aa3b4, metalness: 0.7, roughness: 0.3 });
  [0, TB].forEach((z) => {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.3, 2.6), slabM); sl.position.set(X0, -0.27, z); sl.receiveShadow = true; scene.add(sl);
    [-0.72, 0.72].forEach((dz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.16, 0.08), railM); r.position.set(X0, 0.0, z + dz); scene.add(r); });
  });
  // overhead line: contact + messenger wires over each track
  const wireM = new THREE.MeshBasicMaterial({ color: 0x3a4566 });
  const CW = H + 1.98, MW = H + 3.1;
  [0, TB].forEach((z) => [CW, MW].forEach((y) => { const wi = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.05, 0.05), wireM); wi.position.set(X0, y, z); scene.add(wi); }));
  // repeating things, instanced and placed around the camera each frame
  const PIER = 40, MAST = 50, DROP = 8;
  const piers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, DECK - 2.8, 4.6), concrete, 70); piers.castShadow = true; scene.add(piers);
  const mastM = new THREE.MeshStandardMaterial({ color: 0x6c778d, metalness: 0.4, roughness: 0.5 });
  const masts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 7.4, 0.32), mastM, 120); masts.castShadow = true; scene.add(masts);
  const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 4.7), mastM, 120); scene.add(arms);
  const drops = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, MW - CW, 0.03), wireM, 400); scene.add(drops);
  const treeM = new THREE.MeshStandardMaterial({ color: 0x55b878, roughness: 0.9 }), trunkM = new THREE.MeshStandardMaterial({ color: 0x8a5a3b });
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(4, 1), treeM, 260), trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.6, 5, 6), trunkM, 260);
  trees.castShadow = true; scene.add(trees, trunks);
  const hills = new THREE.Group(); scene.add(hills);
  const hemiL = scene.children.find((c) => c.isHemisphereLight);
  const hillM = new THREE.MeshStandardMaterial({ color: 0xa9d8b8, roughness: 1 });
  for (let i = 0; i < 16; i++) { const hl = new THREE.Mesh(new THREE.SphereGeometry(90 + (i % 4) * 30, 18, 10), hillM); hl.scale.y = 0.32; hl.position.set(-1700 + i * 230, -DECK - 12, -620 - (i % 3) * 100); hills.add(hl); }

  const train = buildTrain(cars, liveryMaterial(livery)); scene.add(train);
  const camera = new THREE.PerspectiveCamera(32, w / h, 0.5, 4000);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), SC = new THREE.Vector3();
  const hash = (k) => { const s = Math.sin(k * 127.1 + 0.37) * 43758.5453; return s - Math.floor(s); };

  function placeRepeating(cx) {
    const p0 = Math.floor((cx - 900) / PIER);
    for (let i = 0; i < 70; i++) { P.set((p0 + i) * PIER, -DECK + (DECK - 2.8) / 2, TB / 2); M.compose(P, Q, S1); piers.setMatrixAt(i, M); }
    const m0 = Math.floor((cx - 900) / MAST);
    for (let i = 0; i < 60; i++) {
      const x = (m0 + i) * MAST;
      P.set(x, 0.4 + 3.7, 4.0); M.compose(P, Q, S1); masts.setMatrixAt(i * 2, M);
      P.set(x, 0.4 + 3.7, TB - 4.0); M.compose(P, Q, S1); masts.setMatrixAt(i * 2 + 1, M);
      P.set(x, MW + 0.15, 4.0 - 2.15); M.compose(P, Q, S1); arms.setMatrixAt(i * 2, M);
      P.set(x, MW + 0.15, TB - 4.0 + 2.15); M.compose(P, Q, S1); arms.setMatrixAt(i * 2 + 1, M);
    }
    const d0 = Math.floor((cx - 800) / DROP);
    for (let i = 0; i < 200; i++) { [0, TB].forEach((z, j) => { P.set((d0 + i) * DROP, (CW + MW) / 2, z); M.compose(P, Q, S1); drops.setMatrixAt(i * 2 + j, M); }); }
    const t0 = Math.floor((cx - 1100) / 18);
    for (let i = 0; i < 260; i++) {
      const k = t0 + i, side = hash(k) > 0.45 ? 1 : -1, z = side > 0 ? 18 + hash(k + 3) * 220 : TB - 18 - hash(k + 3) * 220, sc = 0.7 + hash(k + 7) * 0.9;
      const tx = k * 18 + hash(k + 1) * 12;
      P.set(tx, -DECK + 6.5 * sc, z); SC.set(sc, sc * 1.15, sc); M.compose(P, Q, SC); trees.setMatrixAt(i, M);
      P.set(tx, -DECK + 2.5, z); M.compose(P, Q, S1); trunks.setMatrixAt(i, M);
    }
    [piers, masts, arms, drops, trees, trunks].forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }

  // ---------------------------------------------------------------- undersea tunnel set (env "tunnel")
  const tunnel = new THREE.Group(); tunnel.visible = false; scene.add(tunnel);
  const tubeG = new THREE.CylinderGeometry(8.2, 8.2, LEN, 40, 1, true); tubeG.rotateZ(Math.PI / 2);
  const tube = new THREE.Mesh(tubeG, new THREE.MeshStandardMaterial({ color: 0x8794ab, roughness: 0.9, side: THREE.BackSide }));
  tube.position.set(X0, 3.4, TB / 2); tunnel.add(tube);
  const ringG = new THREE.TorusGeometry(8.0, 0.12, 6, 48); ringG.rotateY(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringG, new THREE.MeshBasicMaterial({ color: 0x8e9bb0 }), 80); tunnel.add(rings);
  const lampG = new THREE.BoxGeometry(2.2, 0.18, 0.35);
  const lamps = new THREE.InstancedMesh(lampG, new THREE.MeshBasicMaterial({ color: 0xfff1c4 }), 160); tunnel.add(lamps);
  const tLight = new THREE.PointLight(0xfff1d0, 60, 60, 1.6); tunnel.add(tLight);
  // ---------------------------------------------------------------- station set (env "station"): platform + canopy + signs around x = STX
  const STX = 0, station = new THREE.Group(); station.visible = false; scene.add(station);
  const platM = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.8 });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(420, 1.2, 7), platM); plat.position.set(STX - 200, 0.6, 6.8); plat.receiveShadow = true; station.add(plat);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(420, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: 0xf5c33b })); edge.position.set(STX - 200, 1.23, 3.6); station.add(edge);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(420, 0.6, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })); roof.position.set(STX - 200, 9.6, 1.5); roof.castShadow = true; station.add(roof);
  const roofU = new THREE.Mesh(new THREE.BoxGeometry(420, 0.2, 18), new THREE.MeshStandardMaterial({ color: 0xa8c6f2, roughness: 0.6 })); roofU.position.set(STX - 200, 9.25, 1.5); station.add(roofU);
  const colM = new THREE.MeshStandardMaterial({ color: 0x8995ab, metalness: 0.3, roughness: 0.5 });
  for (let i = 0; i < 22; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8.4, 10), colM); c.position.set(STX - 10 - i * 19, 5.4, 9.4); c.castShadow = true; station.add(c); }
  const signTex = (txt) => { const c = document.createElement("canvas"); c.width = 1024; c.height = 192; const g2 = c.getContext("2d"); g2.fillStyle = "#1B2340"; g2.fillRect(0, 0, 1024, 192); g2.fillStyle = "#FFB547"; g2.font = "bold 104px Arial Black, Arial"; g2.textAlign = "center"; g2.textBaseline = "middle"; g2.fillText(txt, 512, 100); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const signM = new THREE.MeshBasicMaterial({ map: signTex("AHMEDABAD") });
  const lampM = new THREE.MeshBasicMaterial({ color: 0xfff0c0 });
  for (let i = 0; i < 40; i++) { const lp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 0.5), lampM); lp.position.set(STX - 8 - i * 10, 9.12, 4.5); station.add(lp); }
  const stLight = new THREE.PointLight(0xffe6b0, 0, 90, 1.2); stLight.position.set(STX - 60, 8, 5); station.add(stLight);
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.2), signM); s.position.set(STX - 40 - i * 65, 7.6, 6.8); s.rotation.y = Math.PI / 2; station.add(s); const s2 = s.clone(); s2.rotation.y = -Math.PI / 2; s2.position.x -= 0.05; station.add(s2); }

  // x = nose position along +x; cam/look world coords; panto 0..1 raised; env: "viaduct" | "tunnel" | "station"
  const outdoor = [gnd, hills, trees, trunks, piers];
  function frame({ x = 0, cam = [20, 4, 30], look = [0, 2, 0], fov = 32, panto = 1, roll = 0, env = "viaduct", mood = "day" } = {}) {
    const inT = env === "tunnel", M0 = MOODS[mood] || MOODS.day;
    hemiL.color.set(M0.hemi[0]); hemiL.groundColor.set(M0.hemi[1]); hemiL.intensity = M0.hemi[2];
    sun.color.set(M0.sun[0]);
    const shd = train.children[0].material.userData.shader; if (shd) shd.uniforms.uGlow.value = inT ? 0.8 : M0.glow;
    stars.visible = moon.visible = !inT && mood === "night"; stars.position.set(cam[0], 0, cam[2]); moon.position.set(cam[0] - 900, 700, -1800);
    stLight.intensity = mood === "day" ? 0 : 40;
    tunnel.visible = inT; station.visible = env === "station";
    outdoor.forEach((o) => (o.visible = !inT));
    masts.visible = arms.visible = !inT;
    scene.background = inT ? C("#1d2a3f") : M0.sky;
    scene.fog.color.set(inT ? "#22314a" : M0.fog); scene.fog.near = inT ? 30 : fogNear; scene.fog.far = inT ? 420 : fogFar;
    sun.intensity = inT ? 0.2 : M0.sun[1];
    if (inT) {
      const r0 = Math.floor((cam[0] - 600) / 20);
      for (let i = 0; i < 80; i++) { P.set((r0 + i) * 20, 3.4, TB / 2); M.compose(P, Q, S1); rings.setMatrixAt(i, M); }
      const l0 = Math.floor((cam[0] - 600) / 12);
      for (let i = 0; i < 80; i++) { [3.6, TB - 3.6].forEach((z, j) => { P.set((l0 + i) * 12, 9.6, z); M.compose(P, Q, S1); lamps.setMatrixAt(i * 2 + j, M); }); }
      rings.instanceMatrix.needsUpdate = lamps.instanceMatrix.needsUpdate = true;
      tLight.position.set(cam[0] - 10, 8, 0);
    }
    train.position.x = x;
    const pg = train.userData.pantograph; pg.scale.y = 0.12 + 0.88 * panto;
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(...cam); camera.lookAt(...look); camera.rotation.z += roll;
    placeRepeating(cam[0]);
    sun.position.set(cam[0] + M0.sunPos[0], M0.sunPos[1], M0.sunPos[2]); sun.target.position.set(cam[0], 0, 0);
    hills.position.x = cam[0] * 0.9;
    renderer.render(scene, camera);
  }
  return { THREE, scene, camera, renderer, train, frame, DECK, CAR_L, NOSE_L, H };
}
