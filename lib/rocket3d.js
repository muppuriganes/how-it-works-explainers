// rocket3d.js (v2) — a detailed 3D launch world (three.js + bloom), driven as a pure function of time.
// Generic, unbranded two-stage launcher (≈72 m, 3.7 m wide) + crew capsule, a coastal launch complex, the sea, the sky, and Earth from orbit.
// Units: metres. The rocket stands along +y. Pad centre = origin, ground y = 0, the launch mount deck is at y = 9.
// usage (module): import { rocketWorld } from "../../../lib/rocket3d.js";
//   const W = rocketWorld(canvas, { w, h });  W.frame({ t, cam, look, fov, mood, mood2, k, booster, upper, capsule, station, smoke, ... })
import * as THREE from "./vendor/three/three.module.js";
import { EffectComposer } from "./vendor/three/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/three/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./vendor/three/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./vendor/three/postprocessing/OutputPass.js";
import { ShaderPass } from "./vendor/three/postprocessing/ShaderPass.js";

const C = (h) => new THREE.Color(h);
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const lerp = (a, b, k) => a + (b - a) * k;
const R_EARTH = 6371000;
// Gerstner waves: [dirX, dirZ, wavelength, amplitude, steepness]
const WAVES = [[1, 0.3, 64, 0.62, 0.5], [0.7, -0.7, 33, 0.32, 0.55], [-0.25, 1, 18, 0.17, 0.6], [0.9, 0.45, 9.5, 0.08, 0.6], [-0.6, 0.8, 5.4, 0.04, 0.5], [0.3, -0.95, 3.1, 0.02, 0.4]].map(([x, z, L, A, Q]) => { const l = Math.hypot(x, z), k = (2 * Math.PI) / L; return { dx: x / l, dz: z / l, k, A, Q, w: Math.sqrt(9.8 * k) }; });
export function waveAt(x, z, t, amp = 1) { let y = 0, nx = 0, nz = 0; for (const W of WAVES) { const ph = W.k * (W.dx * x + W.dz * z) - W.w * t, A = W.A * amp; y += A * Math.sin(ph); nx -= W.dx * W.k * A * Math.cos(ph); nz -= W.dz * W.k * A * Math.cos(ph); } return { y, nx, nz }; }
const WAVE_GLSL = `uniform float wT; uniform float wAmp; uniform vec3 wCam;
  const int NW = ${WAVES.length};
  vec4 WV[NW]; vec4 WP[NW];
  void initW(){ ${WAVES.map((W, i) => `WV[${i}] = vec4(${W.dx.toFixed(4)}, ${W.dz.toFixed(4)}, ${W.k.toFixed(5)}, ${W.w.toFixed(5)}); WP[${i}] = vec4(${W.A.toFixed(4)}, ${W.Q.toFixed(3)}, 0.0, 0.0);`).join(" ")} }
  vec3 gerst(vec2 p, out vec3 nrm, out float hgt){ initW(); vec3 o = vec3(0.0); vec3 n = vec3(0.0, 1.0, 0.0); float fade = wAmp * (1.0 - smoothstep(900.0, 2300.0, length(p - wCam.xz)));
    for (int i = 0; i < NW; i++){ float ph = WV[i].z * dot(WV[i].xy, p) - WV[i].w * wT; float A = WP[i].x * fade, Q = WP[i].y; float c = cos(ph), s = sin(ph);
      o.x += Q * A * WV[i].x * c; o.z += Q * A * WV[i].y * c; o.y += A * s; n.x -= WV[i].x * WV[i].z * A * c; n.z -= WV[i].y * WV[i].z * A * c; n.y -= Q * WV[i].z * A * s; }
    nrm = normalize(n); hgt = o.y; return o; }`;

// ---------------------------------------------------------------- canvas textures
function canvasTex(w, h, draw, { rep = null, srgb = true } = {}) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const speckle = (g, w, h, n, seed, cols, sz = 2) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, sz + r() * sz, sz + r() * sz); } };
function skinMaps(kind) {
  const W2 = 1024, H2 = 2048;
  const color = canvasTex(W2, H2, (g, w, h) => {
    g.fillStyle = "#F1F3F7"; g.fillRect(0, 0, w, h);
    const r = rng(kind === "s1" ? 21 : 22);
    for (let i = 0; i < 140; i++) { const x = r() * w, l = 120 + r() * 700, y = r() * h; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, "rgba(120,124,135,0)"); gr.addColorStop(0.5, `rgba(120,124,135,${0.03 + r() * 0.06})`); gr.addColorStop(1, "rgba(120,124,135,0)"); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 6, l); }
    for (let y = 0; y < h; y += 128) { g.fillStyle = "rgba(150,156,170,.35)"; g.fillRect(0, y, w, 3); }
    for (let x = 0; x < w; x += 256) { g.fillStyle = "rgba(150,156,170,.22)"; g.fillRect(x, 0, 2, h); }
    if (kind === "s1") {
      [["#FF9933", 0.07], ["#FFFFFF", 0.082], ["#138808", 0.094]].forEach(([c, y]) => { g.fillStyle = c; g.fillRect(0, h * y, w, h * 0.012); });
      g.fillStyle = "#1B2340"; g.fillRect(0, h * 0.03, w, h * 0.025);
      g.fillStyle = "#12A4C4"; g.fillRect(0, h * 0.42, w, 64); g.fillStyle = "#F2553D"; g.fillRect(0, h * 0.42 + 64, w, 16);
      [0.25, 0.75].forEach((cx) => { g.save(); g.translate(w * cx, h * 0.66); g.rotate(-Math.PI / 2); g.font = "italic 900 150px Arial"; g.textAlign = "center"; g.fillStyle = "#12A4C4"; g.fillText("hx", -330, 52); g.fillStyle = "#1B2340"; g.fillText("launch", 60, 52); g.restore(); });
      const sg = g.createLinearGradient(0, h * 0.84, 0, h); sg.addColorStop(0, "rgba(40,36,34,0)"); sg.addColorStop(0.45, "rgba(40,36,34,.45)"); sg.addColorStop(1, "rgba(28,26,26,.95)"); g.fillStyle = sg; g.fillRect(0, h * 0.84, w, h * 0.16);
      for (let i = 0; i < 90; i++) { const x = r() * w, l = 40 + r() * 260; g.fillStyle = `rgba(30,28,28,${0.15 + r() * 0.35})`; g.fillRect(x, h - l, 2 + r() * 6, l); }
      g.fillStyle = "#1B2340"; g.font = "bold 46px Arial"; g.fillText("HX-1  ·  B1047", w * 0.56, h * 0.36);
    } else {
      g.fillStyle = "#12A4C4"; g.fillRect(0, h * 0.86, w, 48); g.fillStyle = "#1B2340"; g.fillRect(0, h * 0.96, w, h * 0.04);
      g.save(); g.translate(w * 0.25, h * 0.45); g.rotate(-Math.PI / 2); g.font = "italic 900 120px Arial"; g.textAlign = "center"; g.fillStyle = "#1B2340"; g.fillText("STAGE 2", 0, 40); g.restore();
    }
  });
  const bump = canvasTex(W2, H2, (g, w, h) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); speckle(g, w, h, 9000, 7, ["#7A7A7A", "#868686"], 2);
    for (let y = 0; y < h; y += 128) { g.fillStyle = "#3C3C3C"; g.fillRect(0, y, w, 4); for (let x = 8; x < w; x += 24) { g.fillStyle = "#D8D8D8"; g.fillRect(x, y + 10, 4, 4); g.fillRect(x, y - 12, 4, 4); } }
    for (let x = 0; x < w; x += 256) { g.fillStyle = "#4A4A4A"; g.fillRect(x, 0, 3, h); }
    for (let x = 64; x < w; x += 64) { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, 0, 6, h); }
  }, { srgb: false });
  const rough = canvasTex(W2, H2, (g, w, h) => { g.fillStyle = "#5A5A5A"; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 9, ["#505050", "#6A6A6A"], 3); if (kind === "s1") { const sg = g.createLinearGradient(0, h * 0.84, 0, h); sg.addColorStop(0, "#5A5A5A"); sg.addColorStop(1, "#D0D0D0"); g.fillStyle = sg; g.fillRect(0, h * 0.84, w, h * 0.16); } }, { srgb: false });
  return { color, bump, rough };
}
const concreteTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#B9BCC3"; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, 3, ["rgba(255,255,255,.08)", "rgba(0,0,0,.08)", "rgba(80,70,60,.08)"], 2); const r = rng(4); for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h, rr = 20 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(60,58,56,.18)"); gr.addColorStop(1, "rgba(60,58,56,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } g.fillStyle = "rgba(60,60,70,.35)"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 128, 0, 2, h); g.fillRect(0, i * 128, w, 2); } }, { rep: [16, 16] });
const grassTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#7FA45E"; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 60; i++) { g.fillStyle = ["#7A9E58", "#8DB06A", "#6E944F", "#9AB873", "#A7B57A"][Math.floor(r() * 5)]; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 90, 10 + r() * 50, r() * 3, 0, 6.28); g.fill(); } speckle(g, w, h, 9000, 6, ["rgba(40,70,30,.25)", "rgba(200,220,150,.15)"], 1.5); }, { rep: [120, 120] });
const sandTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#D9C9A0"; g.fillRect(0, 0, w, h); speckle(g, w, h, 12000, 8, ["rgba(120,100,70,.15)", "rgba(255,255,255,.18)"], 1.5); }, { rep: [80, 80] });
const tarmacTex = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#4D5059"; g.fillRect(0, 0, w, h); speckle(g, w, h, 4000, 2, ["rgba(255,255,255,.06)", "rgba(0,0,0,.1)"], 2); }, { rep: [60, 4] });
const smokeTex = () => canvasTex(256, 256, (g, w, h) => { const r = rng(17); g.clearRect(0, 0, w, h); for (let i = 0; i < 46; i++) { const a = r() * 6.28, d = Math.pow(r(), 0.8) * 70, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.85, rr = 22 + r() * 46, gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.35, rr * 0.1, x, y, rr), lum = Math.floor(170 + 85 * (1 - (y - 50) / 160) * (0.7 + 0.3 * r())); gr.addColorStop(0, `rgba(${lum},${lum},${lum},${0.5 + r() * 0.3})`); gr.addColorStop(0.7, `rgba(${lum - 40},${lum - 40},${lum - 40},${0.25 + r() * 0.2})`); gr.addColorStop(1, `rgba(${lum - 60},${lum - 60},${lum - 60},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 6.28); g.fill(); } const im = g.getImageData(0, 0, w, h), d2 = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = Math.hypot(x - 128, y - 128) / 128, f = Math.max(0, 1 - k * k * k); d2[(y * w + x) * 4 + 3] *= f; } g.putImageData(im, 0, 0); });
const glowTex = () => canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, "rgba(255,255,255,.75)"); gr.addColorStop(0.5, "rgba(255,255,255,.18)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const waveNormal = () => { const N = 256, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"), im = g.createImageData(N, N), H = (x, y) => Math.sin((x * 6.28) / N * 3 + Math.sin((y * 6.28) / N * 2) * 1.5) * 0.6 + Math.sin(((x + y) * 6.28) / N * 5) * 0.3 + Math.sin(((x * 2 - y) * 6.28) / N * 4) * 0.25 + Math.sin((y * 6.28) / N * 9 + x * 0.05) * 0.15;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), nx = -dx * 2, ny = -dy * 2, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * N + x) * 4; im.data[i] = ((nx / l) * 0.5 + 0.5) * 255; im.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255; im.data[i + 2] = ((nz / l) * 0.5 + 0.5) * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(400, 400); return t; };
const earthMaps = () => {
  const r = rng(11), W2 = 4096, H2 = 2048, land = document.createElement("canvas"); land.width = W2; land.height = H2; const lg = land.getContext("2d");
  lg.fillStyle = "#000"; lg.fillRect(0, 0, W2, H2);
  const cont = [[1100, 700, 380], [1500, 1260, 260], [2360, 720, 420], [2480, 1120, 330], [3120, 640, 480], [3400, 1420, 220], [760, 600, 300], [2000, 940, 180], [3600, 900, 200], [600, 1350, 170]];
  cont.forEach(([x, y, rad]) => { for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = Math.pow(r(), 0.7) * rad, rr = rad * (0.08 + r() * 0.3); lg.fillStyle = "#fff"; lg.beginPath(); lg.ellipse(x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.8, rr * 1.4, rr, r() * 3, 0, 6.28); lg.fill(); } });
  const lmask = lg.getImageData(0, 0, W2, H2).data;
  const color = canvasTex(W2, H2, (g, w, h) => {
    const og = g.createLinearGradient(0, 0, 0, h); og.addColorStop(0, "#0A2F5E"); og.addColorStop(0.5, "#0E4C8C"); og.addColorStop(1, "#0A2F5E"); g.fillStyle = og; g.fillRect(0, 0, w, h);
    const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h; const tg = tmp.getContext("2d");
    tg.drawImage(land, 0, 0); tg.globalCompositeOperation = "source-in"; const lgr = tg.createLinearGradient(0, 0, 0, h); lgr.addColorStop(0, "#C9D6C6"); lgr.addColorStop(0.18, "#5E8A44"); lgr.addColorStop(0.36, "#7A8E46"); lgr.addColorStop(0.46, "#C4A666"); lgr.addColorStop(0.54, "#4E7F3A"); lgr.addColorStop(0.7, "#8A8A4E"); lgr.addColorStop(0.86, "#5E8A44"); lgr.addColorStop(1, "#C9D6C6"); tg.fillStyle = lgr; tg.fillRect(0, 0, w, h);
    g.filter = "blur(2px)"; g.drawImage(tmp, 0, 0); g.filter = "none";
    speckle(g, w, h, 30000, 12, ["rgba(0,0,0,.06)", "rgba(255,255,255,.05)"], 3);
    g.fillStyle = "#F4F8FB"; g.fillRect(0, 0, w, 90); g.fillRect(0, h - 110, w, 110);
  });
  const rough = canvasTex(W2 / 4, H2 / 4, (g, w, h) => { g.fillStyle = "#3A3A3A"; g.fillRect(0, 0, w, h); g.filter = "blur(1px)"; g.drawImage(land, 0, 0, w, h); g.filter = "none"; }, { srgb: false });
  const night = canvasTex(W2, H2, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { const x = Math.floor(r() * w), y = Math.floor(r() * h); if (lmask[(y * W2 + x) * 4] > 128 && r() < 0.6) { g.fillStyle = `rgba(255,${190 + Math.floor(r() * 50)},120,${0.4 + r() * 0.6})`; g.fillRect(x, y, 2, 2); } } });
  const clouds = canvasTex(W2, H2, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 420; i++) { const x = r() * w, y = 80 + r() * (h - 160), rad = 10 + r() * 55, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(255,255,255,${0.35 + r() * 0.4})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rad * 2.2, rad * 0.7, (r() - 0.5) * 0.5, 0, 6.28); g.fill(); } });
  return { color, rough, night, clouds };
};
const chuteTex = () => canvasTex(512, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#F2553D" : "#FFFFFF"; g.fillRect((i * w) / 16, 0, w / 16 + 1, h); } g.fillStyle = "rgba(0,0,0,.08)"; for (let i = 0; i < 16; i++) g.fillRect((i * w) / 16, 0, 2, h); });
const tileTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#3A2C24"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) { g.fillStyle = `rgb(${50 + ((x * 7 + y) % 30)},${40 + ((x + y * 3) % 20)},${34})`; g.fillRect(x + 1, y + 1, 30, 30); } });
const panelTex = () => canvasTex(256, 512, (g, w, h) => { g.fillStyle = "#1B3A8A"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = "#24479E"; g.fillRect(x + 2, y + 2, 28, 28); g.fillStyle = "rgba(160,200,255,.18)"; g.fillRect(x + 2, y + 2, 28, 6); } });
const hangarTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#E8EBF0"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(x, 0, 2, h); } g.fillStyle = "#12A4C4"; g.fillRect(0, h * 0.82, w, 22); g.fillStyle = "#C6CBD4"; g.fillRect(w * 0.25, h * 0.2, w * 0.5, h * 0.8); for (let y = h * 0.2; y < h; y += 26) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(w * 0.25, y, w * 0.5, 3); } g.fillStyle = "#1B2340"; g.font = "bold 40px Arial"; g.textAlign = "center"; g.fillText("HX LAUNCH · VEHICLE ASSEMBLY", w / 2, h * 0.12); });

function merge(parts) { const pos = [], nor = [], col = []; parts.forEach(([geo, color]) => { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); const p = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); } const c = new THREE.Color(color); for (let i = 0; i < p.length / 3; i++) col.push(c.r, c.g, c.b); }); const out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); return out; }

// ---------------------------------------------------------------- sky + moods
const SKYV = `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKYF = `uniform vec3 top, mid, bot, sunCol, sunDir; uniform float glow; varying vec3 vD;
  void main(){ vec3 d = normalize(vD); float h = d.y;
    vec3 c = mix(bot, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.85, h));
    if (h < 0.0) c = mix(bot, bot * 0.75, smoothstep(0.0, 0.1, -h));
    float s = max(dot(d, normalize(sunDir)), 0.0);
    c += sunCol * (pow(s, 1400.0) * 8.0 + pow(s, 60.0) * 0.6 * glow + pow(s, 7.0) * 0.22 * glow);
    gl_FragColor = vec4(c, 1.0);
  }`;
const MOODS = {
  night: { top: "#03071A", mid: "#0B1640", bot: "#22305E", sunCol: "#9FB4FF", glow: 0.2, hemi: [0x7F90D0, 0x2A2F48, 0.55], sun: [0xB8C8FF, 0.7], sunPos: [400, 700, -300], fogNear: 900, fogFar: 14000, stars: 1, night: 1 },
  day: { top: "#2A76D2", mid: "#86BEEE", bot: "#D8EEFB", sunCol: "#FFF2D6", glow: 0.35, hemi: [0xEAF4FF, 0x8FA06A, 0.9], sun: [0xfff2dc, 3.2], sunPos: [-500, 700, 420], fogNear: 1800, fogFar: 26000, stars: 0, night: 0 },
  dusk: { top: "#1F2D66", mid: "#E07E6E", bot: "#FFC98C", sunCol: "#FFAA55", glow: 1.0, hemi: [0xFFD8BF, 0x7A6A88, 0.9], sun: [0xffa050, 3.4], sunPos: [-900, 130, -340], fogNear: 2400, fogFar: 26000, stars: 0.1, night: 0.25 },
  high: { top: "#010309", mid: "#08163C", bot: "#3F78C0", sunCol: "#FFF2D6", glow: 0.3, hemi: [0xBFD6FF, 0x405070, 0.8], sun: [0xfff4e0, 3.6], sunPos: [-500, 700, 420], fogNear: 80000, fogFar: 500000, stars: 0.7, night: 0 },
  space: { top: "#000002", mid: "#000004", bot: "#010208", sunCol: "#FFFFFF", glow: 0.45, hemi: [0x55638A, 0x05070F, 0.35], sun: [0xffffff, 2.8], sunPos: [-600, 220, 500], fogNear: 1e8, fogFar: 2e8, stars: 1, night: 0 },
};
const mixMood = (a, b, k) => { const A = MOODS[a] || MOODS.day, B = MOODS[b || a] || A, col = (x, y) => C(x).lerp(C(y), k); return { top: col(A.top, B.top), mid: col(A.mid, B.mid), bot: col(A.bot, B.bot), sunCol: col(A.sunCol, B.sunCol), glow: lerp(A.glow, B.glow, k), hemiC: C(A.hemi[0]).lerp(C(B.hemi[0]), k), hemiG: C(A.hemi[1]).lerp(C(B.hemi[1]), k), hemiI: lerp(A.hemi[2], B.hemi[2], k), sunC: C(A.sun[0]).lerp(C(B.sun[0]), k), sunI: lerp(A.sun[1], B.sun[1], k), sunPos: A.sunPos.map((v, i) => lerp(v, B.sunPos[i], k)), fogNear: lerp(A.fogNear, B.fogNear, k), fogFar: lerp(A.fogFar, B.fogFar, k), stars: lerp(A.stars, B.stars, k), night: lerp(A.night, B.night, k) }; };

const partMat = (map, additive) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map }, scale: { value: 500 } },
  vertexShader: `attribute float size; attribute float alpha; attribute vec3 tint; attribute float rot; varying float vA; varying vec3 vT; varying float vR;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    uniform float scale; void main(){ vA = alpha; vT = tint; vR = rot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(size * scale / max(0.1, -mv.z), 0.0, 2048.0); gl_Position = projectionMatrix * mv;
    #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vT; varying float vR;
    #include <logdepthbuf_pars_fragment>
    void main(){
    #include <logdepthbuf_fragment>
    vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5; vec4 tx = texture2D(map, p); float a = tx.a * vA; if (a < 0.003) discard; float sh = mix(1.12, 0.68, gl_PointCoord.y) * (0.72 + 0.4 * tx.r); gl_FragColor = vec4(vT * sh, a); }`,
  transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
});

export function rocketWorld(canvas, o = {}) {
  const { w = 1920, h = 1080, bloom = true } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(C("#D6ECFA"), 900, 9000);
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.3, 2e8);
  let composer = null, bloomPass = null;
  if (bloom) { const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(w, h); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0); gl_FragColor = clamp(c, 0.0, 40.0); }` })); bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.55, 0.92); composer.addPass(bloomPass); composer.addPass(new OutputPass()); }

  const mkSkyMat = () => new THREE.ShaderMaterial({ uniforms: { top: { value: C("#fff") }, mid: { value: C("#fff") }, bot: { value: C("#fff") }, sunCol: { value: C("#fff") }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glow: { value: 0.5 } }, vertexShader: SKYV, fragmentShader: SKYF, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
  const setSky = (m, M) => { const u = m.uniforms; u.top.value.copy(M.top); u.mid.value.copy(M.mid); u.bot.value.copy(M.bot); u.sunCol.value.copy(M.sunCol); u.sunDir.value.set(...M.sunPos).normalize(); u.glow.value = M.glow; };
  const skyMat = mkSkyMat(), sky = new THREE.Mesh(new THREE.SphereGeometry(1e8, 48, 24), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), envMat = mkSkyMat(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), envMat));
  const ENV = {}; Object.keys(MOODS).forEach((k) => { setSky(envMat, mixMood(k, k, 0)); envMat.uniforms.sunCol.value.multiplyScalar(0.35); ENV[k] = pm.fromScene(envScene, 0.02).texture; });
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9fb07a, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 5000 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0x9FC4FF, 0.0); scene.add(rim, rim.target);
  const starLayer = (n, size, seed) => { const g = new THREE.BufferGeometry(), p = [], r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, e = Math.asin(r() * 2 - 1); p.push(Math.cos(a) * Math.cos(e) * 5e7, Math.sin(e) * 5e7, Math.sin(a) * Math.cos(e) * 5e7); } g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false })); m.frustumCulled = false; scene.add(m); return m; };
  const stars = [starLayer(2600, 1.6, 9), starLayer(500, 2.8, 10), starLayer(80, 4.2, 12)];
  const gTex = glowTex(), sTex = smokeTex();
  const sunFlare = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xFFE8C0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false })); sunFlare.renderOrder = 5; scene.add(sunFlare);

  // ------------------------------------------------ the launch complex
  const world = new THREE.Group(); scene.add(world);
  const flat = (w2, d2, mat, x, y, z, rotZ = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w2, d2), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = rotZ; m.position.set(x, y, z); m.receiveShadow = true; world.add(m); return m; };
  const box = (sx, sy, sz, mat, x, y, z, par = world, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };
  const cyl = (r1, r2, hh, mat, x, y, z, par = world, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, hh, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
  const wn = waveNormal();
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x14507F, roughness: 0.08, metalness: 0.0, normalMap: wn, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 1.25 });
  const seaU = { wT: { value: 0 }, wAmp: { value: 1 }, wCam: { value: new THREE.Vector3() }, foamC: { value: new THREE.Vector2(0, 0) }, foamR: { value: 0 }, foamK: { value: 0 }, churn: { value: 0 } };
  const seaNM = wn.clone(); seaNM.repeat.set(1, 1); seaNM.needsUpdate = true;
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x08385A, roughness: 0.06, metalness: 0.0, normalMap: seaNM, normalScale: new THREE.Vector2(0.4, 0.4), envMapIntensity: 1.1 });
  seaMat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, seaU);
    sh.vertexShader = WAVE_GLSL + "\nvarying vec3 vWp; varying float vH;\n" + sh.vertexShader
      .replace("#include <beginnormal_vertex>", "vec3 wpos0 = (modelMatrix * vec4(position, 1.0)).xyz; vec3 gN; float gH; vec3 gO = gerst(wpos0.xz, gN, gH); vec3 objectNormal = gN;\n#ifdef USE_TANGENT\n vec3 objectTangent = vec3( tangent.xyz );\n#endif")
      .replace("#include <begin_vertex>", "vec3 transformed = position + gO; vWp = wpos0 + gO; vH = gH;");
    sh.fragmentShader = `uniform vec2 foamC; uniform float foamR; uniform float foamK; uniform float churn; uniform float wAmp; varying vec3 vWp; varying float vH;
      float fh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float fn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(fh(i), fh(i + vec2(1, 0)), f.x), mix(fh(i + vec2(0, 1)), fh(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ return fn(p) * 0.55 + fn(p * 2.3 + 7.1) * 0.3 + fn(p * 5.1 + 3.3) * 0.15; }\n` + sh.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
        float crest = smoothstep(0.42, 0.95, vH / max(0.05, wAmp)) * smoothstep(0.45, 0.75, fbm(vWp.xz * 0.35));
        float dC = length(vWp.xz - foamC); float nz = fbm(vWp.xz * 0.9 + 3.0);
        float ring = foamK * smoothstep(3.6, 0.0, abs(dC - foamR) + nz * 1.4) * smoothstep(0.18, 0.5, fbm(vWp.xz * 1.7));
        float inner = churn * smoothstep(9.0, 2.2, dC + nz * 2.5) * smoothstep(0.22, 0.5, fbm(vWp.xz * 2.2 + 1.7));
        float trail = churn * 0.75 * smoothstep(20.0, 5.0, dC + nz * 6.0) * smoothstep(0.42, 0.7, fbm(vWp.xz * 1.3));
        float foam = clamp(crest * 0.55 + ring + inner + trail, 0.0, 1.0);
        vec3 deep = diffuseColor.rgb, shallow = vec3(0.05, 0.36, 0.44);
        diffuseColor.rgb = mix(deep, shallow, smoothstep(-0.2, 0.7, vH / max(0.05, wAmp)) * 0.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 0.98), foam);`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.85, foam);");
  };
  const seaGeo = (() => { const N = 420, pos = [], uv = [], idx = []; for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const u = (i / N) * 2 - 1, v = (j / N) * 2 - 1, x = Math.sign(u) * (Math.abs(u) * 0.12 + u * u * 0.88) * 2500, z = Math.sign(v) * (Math.abs(v) * 0.12 + v * v * 0.88) * 2500; pos.push(x, 0, z); uv.push(x / 24, z / 24); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; })();
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.receiveShadow = true; sea.frustumCulled = false; sea.visible = false; scene.add(sea);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(600000, 600000), oceanMat); ocean.rotation.x = -Math.PI / 2; ocean.position.y = -1.2; ocean.receiveShadow = true; scene.add(ocean);
  flat(5200, 4200, new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }), -1300, -0.5, 0);
  flat(240, 4200, new THREE.MeshStandardMaterial({ map: sandTex(), roughness: 1 }), 1360, -0.45, 0);
  flat(260, 4200, new THREE.MeshBasicMaterial({ color: 0x5FC9D8, transparent: true, opacity: 0.45, depthWrite: false }), 1600, -1.0, 0);
  flat(26, 4200, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.55, depthWrite: false }), 1488, -0.9, 0);
  const concMat = new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: 0.92 });
  flat(220, 220, concMat, 0, 0.02, 0);
  const tarmac = new THREE.MeshStandardMaterial({ map: tarmacTex(), roughness: 0.95 });
  flat(1500, 14, tarmac, -700, 0.01, 60); flat(14, 900, tarmac, -360, 0.012, -380); flat(600, 10, tarmac, 400, 0.011, -150);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xF2C230 }); for (let x = -1400; x < 0; x += 30) flat(14, 0.4, lineM, x, 0.03, 60);
  flat(26, 140, new THREE.MeshStandardMaterial({ color: 0x24262C, roughness: 1 }), 0, 0.06, 40);
  const steel = new THREE.MeshStandardMaterial({ color: 0xB8C0CC, roughness: 0.45, metalness: 0.6 }), dkSteel = new THREE.MeshStandardMaterial({ color: 0x4A5266, roughness: 0.5, metalness: 0.6 }), redM = new THREE.MeshStandardMaterial({ color: 0xD9432C, roughness: 0.55, metalness: 0.2 }), whiteM = new THREE.MeshStandardMaterial({ color: 0xEDEFF3, roughness: 0.55 }), conc2 = new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: 0.9, color: 0xD4D7DD });
  [[-11, 0, 8, 30], [11, 0, 8, 30], [0, -11, 30, 8], [0, 11, 30, 8]].forEach(([x, z, sx, sz]) => box(sx, 3, sz, conc2, x, 7.5, z));
  [[-12, -12], [12, -12], [-12, 12], [12, 12]].forEach(([x, z]) => box(4, 6, 4, conc2, x, 3, z));
  const deflector = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 9, 6, 4, 1), dkSteel); deflector.rotation.y = Math.PI / 4; deflector.position.set(0, 3, 0); world.add(deflector);
  [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * 6.28 + 0.78; const hd = box(1.2, 2.6, 1.2, dkSteel, Math.cos(a) * 2.6, 10.2, Math.sin(a) * 2.6); hd.rotation.y = -a; });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; cyl(0.25, 0.25, 1.4, steel, Math.cos(a) * 6.5, 9.6, Math.sin(a) * 6.5, world, 8); }
  // tower
  const tower = new THREE.Group(); tower.position.set(-22, 0, 0); world.add(tower);
  const TH = 96;
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => box(1.1, TH, 1.1, redM, x, TH / 2, z, tower));
  for (let y = 0; y < TH; y += 6) { [-4, 4].forEach((z) => box(8.8, 0.45, 0.45, steel, 0, y + 0.3, z, tower, false)); [-4, 4].forEach((x) => box(0.45, 0.45, 8.8, steel, x, y + 0.3, 0, tower, false));
    [[-4, 0.79], [4, -0.79]].forEach(([z, a]) => { const d = box(0.3, 10.6, 0.3, steel, 0, y + 3, z, tower, false); d.rotation.z = a; }); [[-4, 0.79], [4, -0.79]].forEach(([x, a]) => { const d = box(0.3, 10.6, 0.3, steel, x, y + 3, 0, tower, false); d.rotation.x = a; }); }
  for (let y = 18; y < TH; y += 18) box(10, 0.6, 10, dkSteel, 0, y, 0, tower);
  box(14, 1.2, 1.2, redM, 3, TH + 2, 0, tower); box(1, 6, 1, redM, -3, TH + 4, 0, tower); cyl(0.12, 0.25, 22, steel, 0, TH + 13, 0, tower, 6);
  const arms = [36, 54, 72].map((y) => { const g = new THREE.Group(); g.position.set(4, y, -2); tower.add(g); box(16, 0.5, 0.5, steel, 8, 1.3, 0, g); box(16, 0.5, 0.5, steel, 8, -1.3, 0, g); for (let x = 0; x < 16; x += 2) { const d = box(0.3, 2.9, 0.3, steel, x + 1, 0, 0, g, false); d.rotation.z = (x / 2) % 2 ? 0.6 : -0.6; } box(16, 2.4, 0.2, steel, 8, 0, 1.8, g, false); box(3.2, 3, 3.6, whiteM, 15.5, 0, 0.9, g); cyl(0.25, 0.25, 4, new THREE.MeshStandardMaterial({ color: 0x1A1A1E, roughness: 0.8 }), 17, -2.4, 0.9, g, 8); return g; });
  const obLights = [[0, TH + 24, 0], [-3, TH + 7.5, 0], [10, TH + 2.8, 0]].map((p) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xFF3030, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(5, 5, 1); s.position.set(...p); tower.add(s); return s; });
  const mastPos = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
  mastPos.forEach(([x, z]) => { cyl(0.5, 1.1, 130, steel, x, 65, z, world, 10); cyl(0.08, 0.08, 18, steel, x, 139, z, world, 6); });
  { const pts = []; for (let i = 0; i < 4; i++) { const [x1, z1] = mastPos[i], [x2, z2] = mastPos[(i + 1) % 4]; for (let k = 0; k < 20; k++) { const u0 = k / 20, u1 = (k + 1) / 20; const sag = (u) => 148 - 18 * Math.sin(u * Math.PI); pts.push(new THREE.Vector3(lerp(x1, x2, u0), sag(u0), lerp(z1, z2, u0)), new THREE.Vector3(lerp(x1, x2, u1), sag(u1), lerp(z1, z2, u1))); } } world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5A6070 }))); }
  const floods = [[-85, 70], [85, 70], [85, -80], [-90, -70]].map(([x, z]) => { cyl(0.4, 0.7, 34, dkSteel, x, 17, z, world, 8); box(5, 2.4, 1.2, dkSteel, x, 34.5, z); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xFFF2D0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(9, 9, 1); s.position.set(x, 35, z); world.add(s); const sp = new THREE.SpotLight(0xFFF0D8, 0, 900, 0.32, 0.8, 1.6); sp.position.set(x, 35, z); sp.target.position.set(0, 40, 0); world.add(sp, sp.target);
    const beamGeo = new THREE.ConeGeometry(1, 1, 32, 1, true); beamGeo.translate(0, -0.5, 0); beamGeo.rotateX(-Math.PI / 2); const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xFFF2D8, transparent: true, opacity: 0.018, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); const len = Math.hypot(x, 40 - 35, z); beam.scale.set(14, 14, len); beam.position.set(x, 35, z); beam.lookAt(0, 40, 0); world.add(beam); return { s, sp, beam }; });
  [[110, -90], [128, -64]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 20), whiteM); s.position.set(x, 13, z); s.castShadow = true; world.add(s); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; cyl(0.4, 0.4, 9, steel, x + Math.cos(a) * 7, 4.5, z + Math.sin(a) * 7, world, 6); } });
  [[150, -100], [150, -78]].forEach(([x, z]) => { const c = cyl(4, 4, 22, steel, x, 0, z, world, 24); c.rotation.z = Math.PI / 2; c.position.y = 6; });
  cyl(6, 6, 36, whiteM, 120, 18, 90, world, 28); { const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 28, 12, 0, 6.28, 0, 1.57), whiteM); cap.position.set(120, 36, 90); world.add(cap); }
  [[-60, 110, -80], [40, 120, 90]].forEach(([z0, x1, z1]) => { const len = Math.hypot(x1, z1 - z0); const p = cyl(0.7, 0.7, len, steel, x1 / 2, 2, (z0 + z1) / 2, world, 10); p.rotation.z = Math.PI / 2; p.rotation.y = -Math.atan2(z1 - z0, x1); });
  const hTex = hangarTex(); const hangar = new THREE.Mesh(new THREE.BoxGeometry(110, 85, 80), [new THREE.MeshStandardMaterial({ color: 0xE3E6EB, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0xE3E6EB, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0xCCD1D9, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0xCCD1D9 }), new THREE.MeshStandardMaterial({ map: hTex, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: hTex, roughness: 0.8 })]); hangar.position.set(-430, 42.5, -380); hangar.castShadow = true; hangar.receiveShadow = true; world.add(hangar);
  box(70, 12, 36, conc2, -560, 6, 140); const winMat = new THREE.MeshStandardMaterial({ color: 0x14203F, emissive: 0x000000, roughness: 0.15, metalness: 0.5 }); for (let i = 0; i < 6; i++) { const win = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), winMat); win.position.set(-585 + i * 10, 7, 158.1); world.add(win); }
  { const dish = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 12, 0, 6.28, 0, 0.9), new THREE.MeshStandardMaterial({ color: 0xF2F4F7, roughness: 0.4, side: THREE.DoubleSide })); dish.position.set(-520, 22, 210); dish.rotation.x = -2.2; world.add(dish); cyl(0.8, 1.2, 16, whiteM, -520, 8, 214, world, 10); }
  const truck = (x, z, a, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = a; world.add(g); box(9, 3.2, 2.6, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }), 0, 2.4, 0, g); box(2.8, 2.6, 2.6, whiteM, 5.6, 2.2, 0, g); [-3, 0, 4.8].forEach((xx) => [-1.3, 1.3].forEach((zz) => { const wh = cyl(0.6, 0.6, 0.4, new THREE.MeshStandardMaterial({ color: 0x1A1C22 }), xx, 0.6, zz, g, 12); wh.rotation.x = Math.PI / 2; })); };
  truck(-160, 52, 0.1, 0xD9432C); truck(-190, 48, 0.0, 0xF2F4F7); truck(-360, -120, 1.57, 0xFFC93D);
  const palmGeo = (() => { const parts = []; const tr = new THREE.CylinderGeometry(0.28, 0.5, 11, 7, 6); tr.translate(0, 5.5, 0); const pa = tr.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setX(i, pa.getX(i) + (y * y) * 0.01); } parts.push([tr, "#8A6A48"]); for (let i = 0; i < 9; i++) { const f = new THREE.PlaneGeometry(1.4, 7.5, 1, 6); f.translate(0, 3.75, 0); const fp = f.attributes.position; for (let k = 0; k < fp.count; k++) { const y = fp.getY(k); fp.setZ(k, -y * y * 0.07); fp.setX(k, fp.getX(k) * (1 - y / 9)); } f.rotateX(-1.1); f.rotateY((i / 9) * 6.28); f.translate(1.21, 11, 0); parts.push([f, i % 2 ? "#3F7A3A" : "#4E8E44"]); } return merge(parts); })();
  const PR = rng(51); const palms = new THREE.InstancedMesh(palmGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), 700); { const d = new THREE.Object3D(); let n = 0; for (let i = 0; i < 2000 && n < 700; i++) { const x = -2400 + PR() * 3800, z = (PR() - 0.5) * 3600; if (Math.hypot(x, z) < 180) continue; if (x > -500 && x < -360 && z > -440 && z < -320) continue; if (x > 1300) continue; d.position.set(x, -0.4, z); d.rotation.set(0, PR() * 6.28, 0); const s = 0.8 + PR() * 0.6; d.scale.set(s, s, s); d.updateMatrix(); palms.setMatrixAt(n++, d.matrix); } palms.count = n; palms.castShadow = true; world.add(palms); }
  const bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), 1600); { const d = new THREE.Object3D(), c = new THREE.Color(); let n = 0; for (let i = 0; i < 4000 && n < 1600; i++) { const x = -2400 + PR() * 3700, z = (PR() - 0.5) * 3600; if (Math.hypot(x, z) < 150) continue; const s = 1.5 + PR() * 3; d.position.set(x, s * 0.4, z); d.scale.set(s * 1.3, s * 0.7, s); d.updateMatrix(); bushes.setMatrixAt(n, d.matrix); c.set(["#4C7A3C", "#5E8C46", "#6E9A52", "#3F6A34"][Math.floor(PR() * 4)]); bushes.setColorAt(n, c); n++; } bushes.count = n; world.add(bushes); }
  for (let i = 0; i < 30; i++) { const a = PR() * Math.PI - Math.PI * 1.5, d = 9000 + PR() * 12000, hh = 400 + PR() * 1200; const hl = new THREE.Mesh(new THREE.ConeGeometry(hh * 3.4, hh, 10), new THREE.MeshStandardMaterial({ color: 0x7E9C78, roughness: 1, flatShading: true })); hl.position.set(Math.cos(a) * d, hh / 2 - 30, Math.sin(a) * d); world.add(hl); }
  const cloudBank = (() => { const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, emissive: 0x2A3346, emissiveIntensity: 0.55 }), 1700); const d = new THREE.Object3D(), r = rng(61); let n = 0;
    const near = [[200, 1500, -760], [-200, 1700, -950], [520, 1300, -640], [360, 2000, -1150], [-460, 1250, -560], [720, 1800, -820], [80, 1150, -1300]];
    for (let c = 0; c < 97; c++) { const nc = near[c - 90], a = r() * 6.28, dist = 3500 + r() * 24000, cx = nc ? nc[0] : Math.cos(a) * dist, cz = nc ? nc[2] : Math.sin(a) * dist, cy = nc ? nc[1] : 1100 + r() * 900, big = 0.6 + r() * 1.2, puffs = 8 + Math.floor(r() * 9);
      for (let k = 0; k < puffs && n < 1400; k++) { const s2 = (90 + r() * 170) * big, ox = (r() - 0.5) * 520 * big, oz = (r() - 0.5) * 380 * big, oy = Math.max(0, 1 - Math.hypot(ox, oz) / (330 * big)) * 120 * big * r(); d.position.set(cx + ox, cy + oy, cz + oz); d.scale.set(s2 * 1.25, s2 * 0.72, s2); d.rotation.set(0, r() * 6, 0); d.updateMatrix(); im.setMatrixAt(n++, d.matrix); } }
    im.count = n; im.frustumCulled = false; scene.add(im); return im; })();
  const cloudMat = cloudBank.material;

  // ------------------------------------------------ Earth from orbit
  const EM = earthMaps();
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R_EARTH, 256, 128), new THREE.MeshStandardMaterial({ map: EM.color, roughnessMap: EM.rough, roughness: 1, metalness: 0, emissiveMap: EM.night, emissive: 0xFFFFFF, emissiveIntensity: 0.0, envMapIntensity: 0.15 }));
  const sunV = { value: new THREE.Vector3(1, 0, 0) };
  earth.material.onBeforeCompile = (sh) => { sh.uniforms.sunV = sunV; sh.fragmentShader = `uniform vec3 sunV;
` + sh.fragmentShader.replace("#include <emissivemap_fragment>", `#ifdef USE_EMISSIVEMAP
 vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv ); totalEmissiveRadiance *= emissiveColor.rgb * smoothstep(0.12, -0.25, dot(normal, sunV));
#endif`).replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness; vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv ); roughnessFactor = mix(0.32, 0.95, texelRoughness.r);"); };
  earth.visible = false; scene.add(earth);
  const cloudsE = new THREE.Mesh(new THREE.SphereGeometry(R_EARTH * 1.0025, 256, 128), new THREE.MeshStandardMaterial({ map: EM.clouds, transparent: true, depthWrite: false, roughness: 1 })); cloudsE.visible = false; scene.add(cloudsE);
  const atmMat = new THREE.ShaderMaterial({ uniforms: { col: { value: C("#5BA8FF") }, sunDir: { value: new THREE.Vector3(1, 0, 0) } }, vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      #include <common>
    #include <logdepthbuf_pars_vertex>
      void main(){ vN = normalize(normalMatrix * normal); vW = normalize((modelMatrix * vec4(normal,0.0)).xyz); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
      }`, fragmentShader: `uniform vec3 col; uniform vec3 sunDir; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      #include <logdepthbuf_pars_fragment>
      void main(){
      #include <logdepthbuf_fragment>
      float rimI = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 2.6); float lit = clamp(dot(vW, normalize(sunDir)) * 0.8 + 0.45, 0.0, 1.0); gl_FragColor = vec4(col * 1.1, rimI * lit * 0.85); }`, side: THREE.FrontSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R_EARTH * 1.012, 192, 96), atmMat); atm.visible = false; scene.add(atm);

  // ------------------------------------------------ the rocket
  const S1 = skinMaps("s1"), S2 = skinMaps("s2");
  const bodyM = (m) => new THREE.MeshStandardMaterial({ map: m.color, bumpMap: m.bump, bumpScale: 1.6, roughnessMap: m.rough, roughness: 1, metalness: 0.35, envMapIntensity: 0.9 });
  const blackM = new THREE.MeshStandardMaterial({ color: 0x1A1D28, roughness: 0.55, metalness: 0.5 }), engM = new THREE.MeshStandardMaterial({ color: 0x3A3F4E, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }), copperM = new THREE.MeshStandardMaterial({ color: 0xB06A3A, roughness: 0.4, metalness: 0.9 }), tealM = new THREE.MeshStandardMaterial({ color: 0x12A4C4, roughness: 0.4, metalness: 0.3 });
  const bellProf = (r0, r1, hgt) => Array.from({ length: 12 }, (_, i) => { const u = i / 11; return new THREE.Vector2(r0 + (r1 - r0) * Math.pow(u, 0.62), -u * hgt); });
  const PLUMEV = `varying vec2 vU;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    #include <logdepthbuf_vertex>
    }`;
  const NOISE = `float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }`;
  const plumeMat = (inner, outer, additive, diamonds) => new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, inn: { value: C(inner) }, outc: { value: C(outer) }, k: { value: 1 } }, vertexShader: PLUMEV,
    fragmentShader: `uniform float t; uniform vec3 inn; uniform vec3 outc; uniform float k; varying vec2 vU;
      #include <logdepthbuf_pars_fragment>
      ${NOISE}
      void main(){
      #include <logdepthbuf_fragment>
      float v = vU.y; float along = 1.0 - v;
      float n = noise(vec2(vU.x * 18.0, along * 9.0 - t * 22.0)) * 0.6 + noise(vec2(vU.x * 40.0, along * 20.0 - t * 40.0)) * 0.4;
      float body = pow(clamp(v,0.0,1.0), 1.15) * (0.75 + 0.5 * n);
      float dia = ${diamonds ? "0.55 * pow(max(0.0, sin(along * 34.0)), 6.0) * pow(v, 0.6)" : "0.0"};
      vec3 c = mix(outc, inn, clamp(pow(v, 2.6) + dia, 0.0, 1.0));
      gl_FragColor = vec4(c * (1.0 + dia * 1.5), clamp(body * k + dia * k, 0.0, 1.0)); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const mkPlume = (parent, y, r, len, inner, outer, diamonds = true) => {
    const g = new THREE.Group(); g.position.y = y; parent.add(g);
    const cone = (rTop, rBot, ll, mat) => { const geo = new THREE.CylinderGeometry(rTop, rBot, ll, 40, 24, true); geo.translate(0, -ll / 2, 0); const m = new THREE.Mesh(geo, mat); g.add(m); return m; };
    const outerM = cone(r * 0.62, r * 1.25, len, plumeMat(inner, outer, false, false)), coreM = cone(r * 0.5, r * 0.25, len * 0.62, plumeMat("#FFFFFF", inner, true, diamonds));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xFFB060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(r * 9, r * 9, 1); glow.position.y = -len * 0.06; g.add(glow);
    const light = new THREE.PointLight(0xFF9A50, 0, 600, 2); light.position.y = -len * 0.15; g.add(light);
    return { g, outerM, coreM, glow, light };
  };
  const booster = new THREE.Group(); scene.add(booster);
  { const s1 = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 42, 72, 1, true), bodyM(S1)); s1.position.y = 21; s1.castShadow = true; s1.receiveShadow = true; booster.add(s1);
    [4.5, 18, 30, 41.6].forEach((y) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.045, 6, 72), steel); ring.rotation.x = Math.PI / 2; ring.position.y = y; booster.add(ring); });
    box(0.28, 38, 0.35, new THREE.MeshStandardMaterial({ color: 0xE6E9EF, roughness: 0.5 }), 0, 22, 1.95, booster);
    const inter = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 3.6, 72, 1, true), blackM); inter.position.y = 43.8; booster.add(inter);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.28; const st = box(0.18, 3.4, 0.12, dkSteel, Math.cos(a) * 1.9, 43.8, Math.sin(a) * 1.9, booster, false); st.rotation.y = -a; }
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 2.05, 1.6, 72), blackM); skirt.position.y = 0.8; booster.add(skirt);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.25, 48), new THREE.MeshStandardMaterial({ color: 0x2B2622, roughness: 0.9, metalness: 0.3 })); booster.add(plate);
    const pos = [[0, 0], ...Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * 6.28) * 1.25, Math.sin((i / 8) * 6.28) * 1.25])];
    pos.forEach(([x, z]) => { const bell = new THREE.Mesh(new THREE.LatheGeometry(bellProf(0.22, 0.48, 1.6), 28), engM); bell.position.set(x, -0.15, z); booster.add(bell); const thr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 14), copperM); thr.position.set(x, 0.05, z); booster.add(thr); });
    [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * 6.28 + 0.78; const gf = new THREE.Group(); gf.position.set(Math.cos(a) * 2.05, 40.4, Math.sin(a) * 2.05); gf.rotation.y = -a; booster.add(gf); box(0.12, 1.4, 1.6, blackM, 0.6, 0, 0, gf); for (let k = -3; k <= 3; k++) { box(1.2, 0.06, 0.06, blackM, 0.6, k * 0.2, 0, gf, false); box(1.2, 1.4, 0.05, blackM, 0.6, 0, k * 0.22, gf, false); } });
    [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * 6.28 + 1.17; const th = box(0.5, 0.8, 0.5, blackM, Math.cos(a) * 1.9, 39, Math.sin(a) * 1.9, booster); th.rotation.y = -a; });
    booster.userData.legs = [0, 1, 2, 3].map((i) => { const az = (i / 4) * 6.28 + 0.78, grp = new THREE.Group(); grp.position.set(Math.cos(az) * 1.9, 9, Math.sin(az) * 1.9); grp.rotation.y = -az; booster.add(grp); const pv = new THREE.Group(); grp.add(pv); const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.5, 0.9), new THREE.MeshStandardMaterial({ color: 0x23293A, roughness: 0.4, metalness: 0.6 })); leg.position.y = -4.6; leg.castShadow = true; pv.add(leg); const strut = cyl(0.14, 0.14, 5, steel, 0.3, -3.6, 0, pv, 8); strut.rotation.z = 0.4; const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.35, 16), steel); foot.position.y = -9.3; pv.add(foot); return pv; });
    booster.userData.p = mkPlume(booster, -1.7, 2.3, 42, "#FFE9B0", "#FF7A2A", true);
  }
  const upper = new THREE.Group(); scene.add(upper);
  { const s2 = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 14, 72, 1, true), bodyM(S2)); s2.position.y = 7; s2.castShadow = true; upper.add(s2);
    const noz = new THREE.Mesh(new THREE.LatheGeometry(bellProf(0.4, 1.25, 3.2), 40), new THREE.MeshStandardMaterial({ color: 0x5A4A3E, roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide })); noz.position.y = 0.4; upper.add(noz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.05, 6, 72), steel); ring.rotation.x = Math.PI / 2; ring.position.y = 13.9; upper.add(ring);
    const prof = [[1.86, 0], [1.86, 1.6], [1.76, 3.6], [1.55, 5.8], [1.22, 8.0], [0.8, 10.0], [0.36, 11.4], [0.0, 11.9]].map(([r, y]) => new THREE.Vector2(r, y));
    const fairM = new THREE.MeshStandardMaterial({ color: 0xF4F6FA, roughness: 0.28, metalness: 0.25, side: THREE.DoubleSide, bumpMap: S2.bump, bumpScale: 0.6 });
    const half = (phi0, dir) => { const geo = new THREE.LatheGeometry(prof, 48, phi0, Math.PI); geo.translate(-dir * 1.86, 0, 0); const m = new THREE.Mesh(geo, fairM); m.castShadow = true; const g = new THREE.Group(); g.position.set(dir * 1.86, 14, 0); g.add(m); upper.add(g); return g; };
    upper.userData.fa = half(0, 1); upper.userData.fb = half(Math.PI, -1);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.87, 1.87, 0.5, 72, 1, true), tealM); stripe.position.y = 15.2; upper.add(stripe);
    upper.userData.p = mkPlume(upper, -2.8, 1.25, 26, "#E8F2FF", "#7FA8FF", false);
    const capIn = new THREE.Group(); capIn.position.y = 14.6; upper.add(capIn); upper.userData.capIn = capIn;
  }
  const mkCapsule = (par) => {
    const prof = [[0.0, 0], [1.95, 0.02], [2.02, 0.28], [1.92, 0.6], [1.62, 1.6], [1.25, 2.6], [0.92, 3.35], [0.78, 3.6], [0.0, 3.65]].map(([r, y]) => new THREE.Vector2(r, y));
    const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ color: 0xF2F4F8, roughness: 0.3, metalness: 0.35, bumpMap: S2.bump, bumpScale: 0.8 })); shell.castShadow = true; par.add(shell);
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.85, 0.32, 64), new THREE.MeshStandardMaterial({ map: tileTex(), roughness: 0.95 })); shield.position.y = -0.05; par.add(shield);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.79, 1.85, 0.35, 64, 1, true), tealM); band.position.y = 1.05; par.add(band);
    [-0.5, 0, 0.5].forEach((a) => { const r = 1.32; const fr = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24), steel); fr.position.set(Math.sin(a) * r, 2.2, Math.cos(a) * r); fr.lookAt(Math.sin(a) * r * 2, 2.95, Math.cos(a) * r * 2); par.add(fr); const wnd = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshStandardMaterial({ color: 0x0C1530, roughness: 0.05, metalness: 0.8 })); wnd.position.copy(fr.position); wnd.quaternion.copy(fr.quaternion); wnd.translateZ(0.01); par.add(wnd); });
    [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * 6.28 + 0.4, r = 1.7; const pod = box(0.36, 0.5, 0.3, blackM, Math.sin(a) * r, 1.0, Math.cos(a) * r, par); pod.rotation.y = a; });
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.72, 0.42, 32), steel); port.position.y = 3.8; par.add(port); const prt = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 32), dkSteel); prt.rotation.x = Math.PI / 2; prt.position.y = 4.02; par.add(prt);
  };
  const capsule = new THREE.Group(); scene.add(capsule); mkCapsule(capsule);
  mkCapsule(upper.userData.capIn); upper.userData.capIn.scale.setScalar(0.92);
  const plasma = new THREE.Group(); capsule.add(plasma);
  const plM = (k0) => new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 1 } }, vertexShader: PLUMEV, fragmentShader: `uniform float t; uniform float k; varying vec2 vU;
      #include <logdepthbuf_pars_fragment>
      ${NOISE}
      void main(){
      #include <logdepthbuf_fragment>
      float v = vU.y; float n = noise(vec2(vU.x * 24.0, v * 10.0 - t * 18.0)); float a = pow(clamp(1.0 - v,0.0,1.0), 1.4) * (0.6 + 0.6 * n);
      vec3 c = mix(vec3(1.0, 0.28, 0.08), vec3(1.0, 0.85, 0.55), pow(clamp(1.0 - v,0.0,1.0), 3.0)); gl_FragColor = vec4(c * ${k0.toFixed(2)}, a * k); }`, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const pl1 = new THREE.Mesh((() => { const g = new THREE.CylinderGeometry(6, 2.15, 36, 40, 12, true); g.translate(0, 18, 0); return g; })(), plM(1.0)), pl2 = new THREE.Mesh((() => { const g = new THREE.CylinderGeometry(3.6, 2.05, 22, 40, 12, true); g.translate(0, 11, 0); return g; })(), plM(1.2)); plasma.add(pl1, pl2);
  const shock = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 16, 0, 6.28, Math.PI * 0.55, Math.PI * 0.45), new THREE.MeshBasicMaterial({ color: 0xFF9A50, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); shock.position.y = 0.9; plasma.add(shock);
  const plGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: 0xFF7A3A, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); plGlow.scale.set(16, 16, 1); plasma.add(plGlow);
  const chuteG = new THREE.Group(); capsule.add(chuteG);
  const chuteM = new THREE.MeshStandardMaterial({ map: chuteTex(), roughness: 0.85, side: THREE.DoubleSide });
  const mkChute = (R, hgt, y0, dx = 0) => { const g = new THREE.Group(); const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2.3), chuteM); dome.scale.y = hgt / R; dome.position.set(dx, y0, 0); dome.castShadow = true; g.add(dome); const pts = []; const ry = R * Math.sin(Math.PI / 2.3); for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; pts.push(new THREE.Vector3(dx + Math.cos(a) * ry, y0 + hgt * Math.cos(Math.PI / 2.3), Math.sin(a) * ry), new THREE.Vector3(Math.cos(a) * 0.5, 3.8, Math.sin(a) * 0.5)); } g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xDADADA }))); return g; };
  const drogue = new THREE.Group(); drogue.add(mkChute(3.2, 2.6, 22, -2.5), mkChute(3.2, 2.6, 22, 2.5)); const mainC = new THREE.Group(); mainC.add(mkChute(13, 8, 36, -9), mkChute(13, 8, 38, 0), mkChute(13, 8, 36, 9)); chuteG.add(drogue, mainC);
  const boat = new THREE.Group(); { const hullM = new THREE.MeshStandardMaterial({ color: 0xD9432C, roughness: 0.5 }); box(34, 4, 9, hullM, 0, 1, 0, boat); const bow = new THREE.Mesh(new THREE.ConeGeometry(4.5, 8, 4), hullM); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.set(20.5, 1, 0); boat.add(bow); box(34.2, 0.6, 9.2, whiteM, 0, 3.0, 0, boat); box(12, 6, 7, whiteM, -4, 6, 0, boat); box(0.2, 1.8, 5.6, new THREE.MeshStandardMaterial({ color: 0x14203F, roughness: 0.1 }), 2.1, 6.8, 0, boat); const crane = box(1, 14, 1, steel, -14, 9, 0, boat); crane.rotation.z = 0.5; box(2, 1.2, 2, steel, 6, 9.6, 0, boat); }
  boat.visible = false; scene.add(boat);
  const station = new THREE.Group(); { const pT = panelTex(); const modM = new THREE.MeshStandardMaterial({ color: 0xE6E9EE, roughness: 0.4, metalness: 0.4 }), foilM = new THREE.MeshStandardMaterial({ color: 0xD7B56A, roughness: 0.3, metalness: 0.9 }); box(60, 1.6, 1.6, dkSteel, 0, 0, 0, station); [-12, 0, 12].forEach((x) => { const m = cyl(2.2, 2.2, 14, modM, x, 0, 6, station, 28); m.rotation.x = Math.PI / 2; }); const n = cyl(2.2, 2.2, 10, foilM, 0, 0, 16, station, 28); n.rotation.x = Math.PI / 2;
    const pM = new THREE.MeshStandardMaterial({ map: pT, roughness: 0.25, metalness: 0.6 }); [-27, -20, 20, 27].forEach((x) => [1, -1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 30), pM); p.position.set(x, 0, s * 17); station.add(p); })); [-6, 6].forEach((x) => box(4, 0.2, 12, whiteM, x, 4, -8, station)); }
  station.visible = false; scene.add(station);

  // ------------------------------------------------ particles
  const mkParts = (n, map, additive) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute("size", new THREE.Float32BufferAttribute(new Float32Array(n), 1)); g.setAttribute("alpha", new THREE.Float32BufferAttribute(new Float32Array(n), 1)); g.setAttribute("tint", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute("rot", new THREE.Float32BufferAttribute(new Float32Array(n), 1)); const m = new THREE.Points(g, partMat(map, additive)); m.frustumCulled = false; scene.add(m); return { m, g, n }; };
  const SMK = mkParts(4000, sTex, false), FIR = mkParts(1500, sTex, true);
  const fillParts = (P2, list) => { const a = P2.g.attributes, cnt = Math.min(P2.n, list.length); for (let i = 0; i < cnt; i++) { const q = list[i]; a.position.array[i * 3] = q[0]; a.position.array[i * 3 + 1] = q[1]; a.position.array[i * 3 + 2] = q[2]; a.size.array[i] = q[3]; a.alpha.array[i] = q[4]; a.tint.array[i * 3] = q[5]; a.tint.array[i * 3 + 1] = q[6]; a.tint.array[i * 3 + 2] = q[7]; a.rot.array[i] = q[8]; } P2.g.setDrawRange(0, cnt); ["position", "size", "alpha", "tint", "rot"].forEach((k) => (a[k].needsUpdate = true)); P2.m.visible = cnt > 0; };
  const smoke = (opts, t, M) => {
    const S = [], F = [], night = M.night;
    const shade = (y, warm, top) => { const b = (0.62 + 0.36 * top) * (1 - 0.55 * night) + 0.06; const w2 = warm || 0; return [Math.min(1.4, b + w2 * 0.9), Math.min(1.2, b * 0.97 + w2 * 0.42), b * 0.95 + w2 * 0.08]; };
    if (opts.liftoff != null) { const age = opts.liftoff, r = rng(77), fl = opts.fire == null ? Math.max(0, 1 - age / 6) : opts.fire;
      for (let i = 0; i < 1100; i++) { const side = r() < 0.75, dir = side ? (r() < 0.5 ? 1 : -1) : 0, a = side ? (dir > 0 ? 1.5708 : -1.5708) + (r() - 0.5) * 0.9 : r() * 6.28, sp = 30 + r() * 170, lag = r() * 1.2, ag = age - lag; if (ag <= 0) continue;
        const dist = 12 + sp * (1 - Math.exp(-ag * 0.5)), grow = Math.min(1, 0.25 + ag * 0.22), s = (9 + r() * 22) * grow * (0.7 + dist / 220), y = s * 0.3 + ag * (0.6 + r() * 3.2) + r() * 6, top = Math.min(1, (y - s * 0.3) / 30 + r() * 0.4), warm = fl * Math.max(0, 1 - dist / 70) * 0.8;
        S.push([Math.cos(a) * dist, y, Math.sin(a) * dist, s, (0.34 + 0.3 * r()) * Math.min(1, ag * 2), ...shade(y, warm, top), r() * 6.28]); }
      if (opts.rocketY != null && opts.rocketY > 16) { const ry = opts.rocketY; for (let i = 0; i < 320; i++) { const u = r(), y = 9 + u * (ry - 12), below = ry - y, s = 3 + below * 0.09 + r() * 4; S.push([(r() - 0.5) * (2 + below * 0.06), y, (r() - 0.5) * (2 + below * 0.06), s, (0.3 + 0.25 * r()) * Math.min(1, below / 6), ...shade(y, fl * Math.max(0, 1 - below / 40), 0.8), r() * 6.28]); } }
      for (let i = 0; i < 220 && fl > 0.01; i++) { const a = r() * 6.28, d = r() * 26, s = 5 + r() * 12; F.push([Math.cos(a) * d * 0.6, 8 + r() * 6, Math.sin(a) * d, s, 0.1 * fl * (0.4 + r()), 1.0, 0.55, 0.2, r() * 6.28]); } }
    if (opts.steam != null) { const age = opts.steam, r = rng(55); for (let i = 0; i < 260; i++) { const a = r() * 6.28, ph = (age * 0.12 + r()) % 1, d = 5 + r() * 24 + ph * 10, s = 3 + ph * 12 + r() * 4; S.push([Math.cos(a) * d, 4 + ph * 14 + r() * 3, Math.sin(a) * d, s, 0.22 * Math.sin(ph * 3.14) * (0.5 + r() * 0.5), ...shade(0, 0, 0.8), r() * 6.28]); } }
    if (opts.vent) { const [vx, vy, vz] = opts.vent, r = rng(91); for (let i = 0; i < 160; i++) { const ph = (t * 0.35 + r()) % 1, y0 = vy - r() * 34, side = r() < 0.5 ? 1 : -1; S.push([vx + side * (1.9 + ph * 7 + r()), y0 - ph * ph * 10, vz + (r() - 0.5) * 3, 0.8 + ph * 5, 0.32 * (1 - ph) * Math.min(1, ph * 6), ...shade(0, 0, 1), r() * 6.28]); } }
    if (opts.deluge != null) { const age = opts.deluge, r = rng(33); for (let i = 0; i < 600; i++) { const a = r() * 6.28, ph = (age * 0.9 + r()) % 1, sp = 8 + r() * 8; S.push([Math.cos(a) * (6.5 + ph * sp), 9.6 + ph * 6 - ph * ph * 8, Math.sin(a) * (6.5 + ph * sp), 0.5 + ph * 2.5, 0.35 * (1 - ph), ...shade(0, 0, 1), r() * 6.28]); } }
    if (opts.trail) { const { y0, y1, x0 = 0, x1 = 0, n: nn = 500 } = opts.trail, r = rng(33); for (let i = 0; i < nn; i++) { const u = Math.pow(i / (nn - 1), 0.6), y = lerp(y0, y1, u), x = lerp(x0, x1, u), below = Math.hypot(y1 - y, x1 - x), s = 3 + below * 0.03 + r() * 3; S.push([x + (r() - 0.5) * (3 + below * 0.05), y + (r() - 0.5) * 4, (r() - 0.5) * (3 + below * 0.05), s, Math.max(0.04, 0.5 - below * 0.00014) * (0.6 + r() * 0.5), ...shade(y, 0, 0.9), r() * 6.28]); } }
    if (opts.splash) { const [sx, sy, sz, age] = opts.splash, r = rng(71); if (age > 0) {
      for (let i = 0; i < 900; i++) { const an = r() * 6.28, ring = r() < 0.7, sp = ring ? 3 + r() * 4 : 1 + r() * 7, up = ring ? 5 + r() * 4 : 6 + r() * 7, ag = age - r() * 0.15; if (ag <= 0 || ag > 2.2) continue; const d = 2.1 + sp * ag, y = up * ag - 9.8 * ag * ag * 0.5; if (y < -0.4) continue; const sz2 = ring ? 0.25 + r() * 0.35 : 0.12 + r() * 0.2; S.push([sx + Math.cos(an) * d, sy + y, sz + Math.sin(an) * d, sz2, 0.85, 1.15, 1.18, 1.2, r() * 6.28]); }
      for (let i = 0; i < 260; i++) { const an = r() * 6.28, ag = age * (0.5 + r() * 0.7), d = 2 + ag * (3 + r() * 5), fade = Math.max(0, 1 - ag / 2.6); if (fade <= 0) continue; S.push([sx + Math.cos(an) * d, sy + 0.4 + ag * (0.6 + r() * 1.2), sz + Math.sin(an) * d, 1.0 + ag * 1.8, 0.26 * fade, ...shade(0, 0, 1), r() * 6.28]); } } }
    if (opts.sparks != null) { const age = opts.sparks, r = rng(13); for (let i = 0; i < 160; i++) { const ph = (age * 1.4 + r()) % 1, a = r() * 6.28, sp = 20 + r() * 50; F.push([Math.cos(a) * ph * sp, 9 + ph * 8 - ph * ph * 14, Math.sin(a) * ph * sp, 0.4 + r() * 0.5, 0.9 * (1 - ph), 1, 0.7, 0.3, 0]); } }
    fillParts(SMK, S); fillParts(FIR, F);
  };
  const vapor = new THREE.Mesh(new THREE.LatheGeometry([[1.9, 0], [3.4, 2.0], [4.8, 3.4], [5.4, 4.6], [4.2, 6.6], [2.0, 8.0]].map(([r, y]) => new THREE.Vector2(r, y)), 48), new THREE.ShaderMaterial({ uniforms: { k: { value: 1 } }, vertexShader: `varying vec2 vU; varying vec3 vN; varying vec3 vV;
      #include <common>
    #include <logdepthbuf_pars_vertex>
      void main(){ vU = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
      }`, fragmentShader: `uniform float k; varying vec2 vU; varying vec3 vN; varying vec3 vV;
      #include <logdepthbuf_pars_fragment>
      void main(){
      #include <logdepthbuf_fragment>
      float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 2.4); float a = f * pow(sin(vU.y * 3.14159), 2.0) * 0.42 * k; gl_FragColor = vec4(vec3(1.0), a); }`, transparent: true, depthWrite: false, side: THREE.DoubleSide })); vapor.visible = false; scene.add(vapor);

  function setStage(g, st = {}, t, M) {
    const { p = [0, 0, 0], rot = [0, 0, 0], vis = true, flame = 0 } = st;
    g.visible = vis; g.position.set(...p); g.rotation.set(rot[0], rot[1], rot[2], "YXZ");
    const P2 = g.userData.p; if (!P2) return;
    const k = flame, flick = 0.93 + 0.07 * Math.sin(t * 57) + 0.04 * Math.sin(t * 131), len = Math.max(0.02, k * flick * (st.plumeLen || 1)), vac = st.vac || 0;
    P2.g.visible = vis && k > 0.01; P2.g.scale.set(1 + vac * 1.8, len, 1 + vac * 1.8);
    [P2.outerM, P2.coreM].forEach((m) => { m.material.uniforms.t.value = t; m.material.uniforms.k.value = k * (vac ? 0.75 : 1); });
    P2.glow.material.opacity = Math.min(0.6, k * (0.22 + 0.3 * M.night)); P2.glow.visible = k > 0.02;
    P2.light.intensity = (st.light != null ? st.light : 1) * k * (160 + 520 * M.night);
  }

  const tmpV = new THREE.Vector3();
  function frame(P = {}) {
    const t = P.t || 0;
    const M = mixMood(P.mood || "day", P.mood2, P.k || 0);
    setSky(skyMat, M); sun.color.copy(M.sunC); sun.intensity = M.sunI; hemi.color.copy(M.hemiC); hemi.groundColor.copy(M.hemiG); hemi.intensity = M.hemiI;
    const key = (P.k || 0) < 0.5 ? (P.mood || "day") : (P.mood2 || P.mood || "day"); scene.environment = ENV[key] || ENV.day; scene.environmentIntensity = 0.55 + 0.45 * (1 - M.night);
    scene.fog.color.copy(M.bot); scene.fog.near = M.fogNear; scene.fog.far = M.fogFar;
    const cam = P.cam || [0, 20, 100], space = P.earthAlt != null;
    world.visible = !space && cam[1] < 60000; ocean.visible = !space && cam[1] < 60000; cloudBank.visible = !space && M.stars < 0.6;
    stars.forEach((s) => { s.visible = M.stars > 0.02; s.material.opacity = Math.min(1, M.stars); });
    earth.visible = atm.visible = cloudsE.visible = space;
    const sunDir = new THREE.Vector3(...M.sunPos).normalize();
    if (space) { const er = P.earthRot || [0, 0, 0]; earth.position.set(0, -(R_EARTH + P.earthAlt), 0); atm.position.copy(earth.position); cloudsE.position.copy(earth.position); earth.rotation.set(er[0], er[1], er[2]); cloudsE.rotation.set(er[0], er[1] + t * 0.0004, er[2]); atmMat.uniforms.sunDir.value.copy(sunDir); earth.material.emissiveIntensity = P.cityLights != null ? P.cityLights : 1.4; }
    oceanMat.normalMap.offset.set(t * 0.004, t * 0.0025); ocean.position.set(cam[0], -3.0, cam[2]);
    const SEA = P.sea; sea.visible = !!SEA && !space; if (sea.visible) { const amp = SEA.amp == null ? 1 : SEA.amp, gx = Math.round(cam[0] / 20) * 20, gz = Math.round(cam[2] / 20) * 20; sea.position.set(gx, 0, gz); seaU.wT.value = t; seaU.wAmp.value = amp; seaU.wCam.value.set(cam[0], cam[1], cam[2]); seaNM.offset.set(gx / 24 + t * 0.03, gz / 24 + t * 0.02); const fm = SEA.foam || {}; seaU.foamC.value.set(...(fm.c || [0, 0])); seaU.foamR.value = fm.r || 0; seaU.foamK.value = fm.k || 0; seaU.churn.value = fm.churn || 0; ocean.position.y = -2.5; }
    const floatOn = (obj, x, z, sink, roll = 1) => { const wv = waveAt(x, z, t, (SEA && SEA.amp != null) ? SEA.amp : 1); obj.position.y = wv.y - sink; obj.rotation.x += Math.atan(wv.nz) * 0.7 * roll; obj.rotation.z += -Math.atan(wv.nx) * 0.7 * roll; };
    const night = M.night > 0.5;
    floods.forEach((f) => { f.s.visible = night; f.sp.intensity = night ? 2600 : 0; f.beam.visible = night && P.beams !== false; });
    obLights.forEach((s, i) => (s.visible = night && Math.floor(t * 1.2 + i * 0.3) % 2 === 0));
    winMat.emissive.set(night ? 0x8A6A30 : 0x000000); cloudMat.emissive.copy(M.bot).lerp(M.mid, 0.3);
    const sa = P.sunAt || [0, 40, 0]; sun.position.set(sa[0] + M.sunPos[0], sa[1] + M.sunPos[1], sa[2] + M.sunPos[2]); sun.target.position.set(...sa);
    rim.intensity = P.rim || 0; rim.position.set(sa[0] - M.sunPos[0], sa[1] + 200, sa[2] - M.sunPos[2]); rim.target.position.set(...sa);
    sunFlare.position.copy(tmpV.copy(sunDir).multiplyScalar(4e7).add(new THREE.Vector3(...cam))); sunFlare.scale.setScalar(4e6 * (0.6 + M.glow)); sunFlare.material.opacity = (1 - M.night) * 0.9;
    arms.forEach((a) => { a.rotation.y = sm(P.arm == null ? 0 : P.arm) * 1.4; });
    tower.visible = P.pad !== false;
    setStage(booster, P.booster || { vis: false }, t, M); setStage(upper, P.upper || { vis: false }, t, M);
    const bl = (P.booster || {}).legs || 0; booster.userData.legs.forEach((pv) => (pv.rotation.z = bl * 0.68));
    const ub = P.upper || {}, op = (ub.fairing || 0) * 1.0, dr = ub.fairingDrift || 0; upper.userData.fa.rotation.z = -op; upper.userData.fb.rotation.z = op; upper.userData.fa.position.x = 1.86 + dr; upper.userData.fb.position.x = -1.86 - dr; upper.userData.capIn.visible = (ub.fairing || 0) > 0.05 && ub.payload !== false;
    const cp = P.capsule; capsule.visible = !!cp && cp.vis !== false; if (cp) { capsule.position.set(...(cp.p || [0, 0, 0])); capsule.rotation.set(...(cp.rot || [0, 0, 0]), "YXZ"); if (cp.float != null && SEA) { const k = cp.float, base = capsule.position.y; floatOn(capsule, capsule.position.x, capsule.position.z, 1.35, k); capsule.position.y = lerp(base, capsule.position.y, k); } }
    const gl = cp ? cp.glow || 0 : 0; plasma.visible = gl > 0.02; [pl1, pl2].forEach((m, i) => { m.material.uniforms.t.value = t; m.material.uniforms.k.value = gl * (i ? 0.9 : 0.8); }); shock.material.opacity = 0.5 * gl; plGlow.material.opacity = Math.min(0.7, gl * 0.7);
    const ch = cp ? cp.chute || 0 : 0; chuteG.visible = ch > 0; drogue.visible = ch === 1; mainC.visible = ch === 2; chuteG.scale.setScalar(Math.max(0.01, cp && cp.deploy != null ? cp.deploy : 1));
    boat.visible = !!P.boat; if (P.boat) { boat.position.set(...P.boat.p); boat.rotation.set(0, P.boat.yaw || 0, 0); if (SEA) { floatOn(boat, boat.position.x, boat.position.z, 0.6, 0.45); } else { boat.position.y += Math.sin(t * 1.3) * 0.3; boat.rotation.z = Math.sin(t * 0.9) * 0.02; } }
    station.visible = !!P.station; if (P.station) { station.position.set(...P.station.p); station.rotation.set(...(P.station.rot || [0, 0, 0])); }
    const vp = P.vapor || 0; vapor.visible = vp > 0.02 && !!P.vaporAt; if (P.vaporAt) { vapor.position.set(...P.vaporAt); vapor.rotation.set(...(P.vaporRot || [0, 0, 0])); vapor.material.uniforms.k.value = vp; }
    smoke(Object.assign({}, P.smoke || {}, P.steam != null && (P.smoke || {}).steam == null ? { steam: P.steam } : {}), t, M);
    camera.fov = P.fov || 35; camera.updateProjectionMatrix();
    const shk = P.shake || 0; camera.position.set(cam[0] + Math.sin(t * 47) * shk, cam[1] + Math.sin(t * 59 + 1) * shk, cam[2] + Math.sin(t * 41 + 2) * shk); camera.lookAt(...(P.look || [0, 30, 0])); if (P.roll) camera.rotateZ(P.roll);
    camera.updateMatrixWorld(); sunV.value.copy(sunDir).transformDirection(camera.matrixWorldInverse);
    sky.position.copy(camera.position); stars.forEach((s) => s.position.copy(camera.position));
    const pscale = h / (2 * Math.tan(((camera.fov / 2) * Math.PI) / 180));
    [SMK, FIR].forEach((p2) => (p2.m.material.uniforms.scale.value = pscale)); 
    if (bloomPass) { bloomPass.strength = 0.35 + 0.45 * M.night + (P.bloom || 0); }
    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  const _pv = new THREE.Vector3();
  function project(v) { _pv.set(v[0], v[1], v[2]).project(camera); return [((_pv.x + 1) / 2) * w, ((1 - _pv.y) / 2) * h, _pv.z]; }
  return { frame, project, THREE };
}
