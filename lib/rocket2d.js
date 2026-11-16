// rocket2d.js (v2) — picture-style 2D scenes for the rocket journey video.
// Each card is a tiny illustrated scene (own sky/space background, shaded 3D-looking objects, soft shadows).
// Cards are 600 x 420 units, shown in a .pic frame. Animated parts carry ids prefixed with the card id.
(function () {
  const INK = "#1B2340", ORG = "#FF8A2A", RED = "#F2553D", GRN = "#22C77A", YEL = "#FFC93D", TEAL = "#12A4C4", SKY = "#9FD7FF";
  const D = {};
  const svg = (vb, w, h, s) => `<svg viewBox="${vb}" width="${w}" height="${h}" style="overflow:visible;display:block">${s}</svg>`;
  const stops = (s) => s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("");
  const lg = (id, s, x2 = 0, y2 = 1, x1 = 0, y1 = 0) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
  const rg = (id, s, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;
  const cyl = (id, c1, c2, c3) => lg(id, [[0, c3], [0.28, c1], [0.55, c2], [1, c3]], 1, 0);
  const T = (x, y, t, { fs = 30, c = "#fff", a = "middle", w = 900, sh = true } = {}) => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="Archivo, sans-serif" font-weight="${w}" font-size="${fs}" fill="${c}" ${sh ? `style="paint-order:stroke" stroke="rgba(8,12,34,.55)" stroke-width="${Math.max(4, fs * 0.2)}" stroke-linejoin="round"` : ""}>${t}</text>`;
  const cap = (t, { y = 386, c = "#fff", bg = "rgba(8,12,34,.62)" } = {}) => { const w2 = Math.round(t.length * 17 + 56); return `<g><rect x="${300 - w2 / 2}" y="${y - 34}" width="${w2}" height="48" rx="24" fill="${bg}"/>${T(300, y, t, { fs: 28, c, sh: false })}</g>`; };
  const stars = (n, seed, w = 600, h = 420) => { let s = seed, o = ""; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < n; i++) o += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; return o; };
  const cloud = (x, y, s = 1, o = 1, c = "#fff") => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="14" rx="70" ry="14" fill="#000" opacity=".06"/><circle cx="-36" cy="0" r="24" fill="${c}"/><circle cx="-6" cy="-14" r="32" fill="${c}"/><circle cx="30" cy="-2" r="24" fill="${c}"/><rect x="-60" y="0" width="114" height="22" rx="11" fill="${c}"/></g>`;
  // shaded mini rocket (nose up), origin = base centre, height ~ 220*s
  const rocket = (id, x, y, s = 1, { flame = 0, tilt = 0 } = {}) => `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${s})">
    ${flame ? `<path d="M-16 0 Q -24 ${60 * flame} 0 ${110 * flame} Q 24 ${60 * flame} 16 0 Z" fill="url(#${id}fl)"/><path d="M-8 0 Q -10 ${36 * flame} 0 ${64 * flame} Q 10 ${36 * flame} 8 0 Z" fill="#FFF4D0"/>` : ""}
    <path d="M-22 -40 L -42 4 L -22 -6 Z M22 -40 L 42 4 L 22 -6 Z" fill="${RED}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M0 -222 Q 24 -190 24 -150 L 24 -6 L -24 -6 L -24 -150 Q -24 -190 0 -222 Z" fill="url(#${id}b)" stroke="${INK}" stroke-width="4.5"/>
    <rect x="-24" y="-100" width="48" height="10" fill="${TEAL}"/><rect x="-24" y="-118" width="48" height="5" fill="${INK}" opacity=".5"/>
    <circle cx="0" cy="-160" r="9" fill="url(#${id}g)" stroke="${INK}" stroke-width="3.5"/>
    <path d="M-14 -6 L -18 6 L 18 6 L 14 -6 Z" fill="#4A5266" stroke="${INK}" stroke-width="3.5"/></g>`;
  const rdefs = (id) => `${cyl(id + "b", "#FFFFFF", "#E6ECF4", "#AEB9CB")}${rg(id + "g", [[0, "#BFF3FF"], [1, TEAL]], 0.35, 0.35)}${lg(id + "fl", [[0, "#FFE7A0"], [0.4, ORG], [1, "#FF3A1A", 0]])}`;
  // astronaut (front), origin = body centre
  const astro = (id, x, y, s = 1, extra = "") => `<g ${id ? `id="${id}"` : ""} transform="translate(${x} ${y}) scale(${s})" ${extra}>
    <path d="M-30 6 L -52 34" stroke="#E9EEF5" stroke-width="16" stroke-linecap="round"/><path d="M30 6 L 52 34" stroke="#E9EEF5" stroke-width="16" stroke-linecap="round"/>
    <path d="M-30 6 L -52 34 M30 6 L 52 34" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
    <path d="M-30 58 Q -32 -4 0 -6 Q 32 -4 30 58 Z" fill="#F4F7FB" stroke="${INK}" stroke-width="4.5"/><rect x="-14" y="10" width="28" height="18" rx="4" fill="#3E4A6A"/><circle cx="-6" cy="19" r="3" fill="${RED}"/><circle cx="5" cy="19" r="3" fill="${GRN}"/>
    <circle cx="0" cy="-34" r="26" fill="#F4F7FB" stroke="${INK}" stroke-width="4.5"/><path d="M-18 -38 Q 0 -54 18 -38 L 18 -26 Q 0 -16 -18 -26 Z" fill="#2B3A70"/><path d="M-10 -44 Q -2 -48 6 -44" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/></g>`;
  const kettle = (x, y, s = 1, txt = "") => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 -40 Q -22 -62 0 -62 Q 22 -62 22 -40" fill="none" stroke="#3E4A6A" stroke-width="10"/><path d="M-36 -6 Q -40 -44 0 -44 Q 40 -44 36 -6 Q 32 14 0 14 Q -32 14 -36 -6 Z" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/><ellipse cx="-14" cy="-26" rx="8" ry="5" fill="#fff" opacity=".25"/>${txt ? T(0, -6, txt, { fs: 20, sh: false }) : ""}</g>`;

  // ---------------------------------------------------------------- X-RAY cutaway (no background — floats over the 3D). 240 x 900
  // fluid rects: #{id}LoxB #{id}FuelB #{id}LoxU #{id}FuelU (+ "S" ellipse surfaces), bubbles group #{id}Bub
  D.xray = ({ w = 240, id = "xr" } = {}) => svg("0 0 240 900", w, w * 3.75, `
    <defs>${lg(id + "F", [[0, "#FFC56A"], [0.45, "#FFE09A"], [1, "#E8781A"]], 1, 0)}${lg(id + "O", [[0, "#4D93FF"], [0.45, "#A8D2FF"], [1, "#2558C9"]], 1, 0)}
      ${lg(id + "H", [[0, "rgba(159,227,242,.38)"], [0.5, "rgba(159,227,242,.08)"], [1, "rgba(159,227,242,.30)"]], 1, 0)}
      <pattern id="${id}Gr" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0 L 0 0 0 24" fill="none" stroke="rgba(159,227,242,.22)" stroke-width="1.5"/></pattern>
      <clipPath id="${id}C"><path d="M120 6 Q 176 70 178 170 L 178 830 L 62 830 L 62 170 Q 64 70 120 6 Z"/></clipPath></defs>
    <path d="M120 6 Q 176 70 178 170 L 178 830 L 62 830 L 62 170 Q 64 70 120 6 Z" fill="url(#${id}H)"/>
    <path d="M120 6 Q 176 70 178 170 L 178 830 L 62 830 L 62 170 Q 64 70 120 6 Z" fill="url(#${id}Gr)"/>
    <g clip-path="url(#${id}C)">
      ${[["LoxU", 250, 66, "O"], ["FuelU", 328, 70, "F"], ["LoxB", 472, 146, "O"], ["FuelB", 630, 164, "F"]].map(([n, y, h, g]) => `<rect x="70" y="${y - 2}" width="100" height="${h + 4}" rx="14" fill="rgba(10,20,50,.35)" stroke="#BDEFFB" stroke-width="3"/><rect id="${id}${n}" x="72" y="${y}" width="96" height="${h}" rx="12" fill="url(#${id}${g})"/><ellipse id="${id}${n}S" cx="120" cy="${y}" rx="47" ry="7" fill="${g === "F" ? "#FFF0C0" : "#D6EBFF"}" opacity=".9"/>`).join("")}
      <g id="${id}Bub">${Array.from({ length: 14 }, (_, i) => `<circle cx="${82 + (i * 37) % 76}" cy="${500 + (i * 53) % 290}" r="${2 + (i % 3)}" fill="#fff" opacity=".55"/>`).join("")}</g>
    </g>
    <path d="M120 6 Q 176 70 178 170 L 178 830 L 62 830 L 62 170 Q 64 70 120 6 Z" fill="none" stroke="#BDEFFB" stroke-width="5"/>
    <line x1="62" y1="430" x2="178" y2="430" stroke="#BDEFFB" stroke-width="4" stroke-dasharray="10 7"/>
    <g id="${id}Cap"><path d="M120 54 Q 154 92 156 152 L 84 152 Q 86 92 120 54 Z" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M84 152 L 156 152 L 152 162 L 88 162 Z" fill="#7A4A30" stroke="${INK}" stroke-width="3"/><circle cx="120" cy="116" r="12" fill="${TEAL}" stroke="${INK}" stroke-width="3.5"/></g>
    <path d="M62 760 L 34 830 L 62 812 Z M178 760 L 206 830 L 178 812 Z" fill="${RED}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <g>${[90, 120, 150].map((x) => `<path d="M${x - 10} 830 L ${x - 18} 878 L ${x + 18} 878 L ${x + 10} 830 Z" fill="#5A6075" stroke="${INK}" stroke-width="3.5"/><path d="M${x - 6} 834 L ${x - 10} 874" stroke="#fff" stroke-width="3" opacity=".35"/>`).join("")}</g>`);

  // the leftover-10% parts as shaded stickers (w x w)
  D.part = (k, { w = 150, id = "pp" + k } = {}) => {
    const art = {
      engine: `${lg(id + "m", [[0, "#3A4054"], [0.35, "#C9D0DC"], [0.6, "#7A8296"], [1, "#2B3040"]], 1, 0)}<rect x="46" y="22" width="28" height="16" rx="4" fill="#B06A3A" stroke="${INK}" stroke-width="3.5"/><path d="M44 38 L 76 38 L 86 66 L 98 98 L 22 98 L 34 66 Z" fill="url(#${id}m)" stroke="${INK}" stroke-width="4"/><path d="M36 98 Q 60 128 84 98" fill="${ORG}"/><path d="M48 98 Q 60 114 72 98" fill="#FFE7A0"/>`,
      tank: `${cyl(id + "t", "#FFFFFF", "#E2E8F0", "#A9B4C6")}<rect x="34" y="16" width="52" height="92" rx="24" fill="url(#${id}t)" stroke="${INK}" stroke-width="4"/><path d="M34 48 L 86 48 M34 78 L 86 78" stroke="${INK}" stroke-width="3" opacity=".3"/><rect x="44" y="60" width="32" height="10" rx="3" fill="${TEAL}"/>`,
      capsule: `${cyl(id + "c", "#FFFFFF", "#E6ECF4", "#A9B4C6")}<path d="M60 18 Q 90 50 96 98 L 24 98 Q 30 50 60 18 Z" fill="url(#${id}c)" stroke="${INK}" stroke-width="4"/><path d="M22 96 L 98 96 L 94 108 L 26 108 Z" fill="#7A4A30" stroke="${INK}" stroke-width="3.5"/><circle cx="60" cy="62" r="11" fill="${TEAL}" stroke="${INK}" stroke-width="3.5"/><rect x="24" y="74" width="72" height="6" fill="${TEAL}"/>`,
      crew: astro("", 60, 68, 0.95),
    }[k];
    return svg("0 0 120 120", w, w, `<defs>${art.startsWith("<linear") ? "" : ""}</defs><circle cx="60" cy="64" r="58" fill="rgba(8,12,34,.25)"/><circle cx="60" cy="60" r="58" fill="#fff"/><circle cx="60" cy="60" r="58" fill="none" stroke="${INK}" stroke-width="4"/><defs>${art.match(/<(linear|radial)Gradient[\s\S]*?<\/(linear|radial)Gradient>/g)?.join("") || ""}</defs>${art.replace(/<(linear|radial)Gradient[\s\S]*?<\/(linear|radial)Gradient>/g, "")}`);
  };

  // noise arcs over the pad (no background) — #idR0..3
  D.rings = ({ w = 560, id = "sr" } = {}) => svg("0 0 560 280", w, w / 2, `<defs>${lg(id + "g", [[0, "#FF6A4A"], [1, YEL]], 1, 0)}</defs>${[0, 1, 2, 3].map((i) => `<g id="${id}R${i}"><path d="M${280 - 80 - i * 56} 270 A ${80 + i * 56} ${80 + i * 56} 0 0 1 ${280 + 80 + i * 56} 270" fill="none" stroke="rgba(255,120,80,.25)" stroke-width="${26 - i * 4}" stroke-linecap="round"/><path d="M${280 - 80 - i * 56} 270 A ${80 + i * 56} ${80 + i * 56} 0 0 1 ${280 + 80 + i * 56} 270" fill="none" stroke="url(#${id}g)" stroke-width="${11 - i * 1.8}" stroke-linecap="round"/></g>`).join("")}`);

  // forces: extruded weight arrow (with a 500 t kettlebell) + push arrow (flame). #idTh grows (scaleY from base y=600)
  const arrow3 = (x, y1, y2, c, c2, up) => { const h = 34, d = up ? -1 : 1, tip = y2, base = y1, hy = tip - d * 56; return `<path d="M${x - h / 2 + 8} ${base + 8} L ${x + h / 2 + 8} ${base + 8} L ${x + h / 2 + 8} ${hy + 8} L ${x + 34 + 8} ${hy + 8} L ${x + 8} ${tip + 8} L ${x - 34 + 8} ${hy + 8} L ${x - h / 2 + 8} ${hy + 8} Z" fill="${c2}"/><path d="M${x - h / 2} ${base} L ${x + h / 2} ${base} L ${x + h / 2} ${hy} L ${x + 34} ${hy} L ${x} ${tip} L ${x - 34} ${hy} L ${x - h / 2} ${hy} Z" fill="${c}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M${x - h / 2 + 6} ${base - d * 6} L ${x - h / 2 + 6} ${hy}" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`; };
  D.forces = ({ w = 400, id = "fo" } = {}) => svg("0 0 400 640", w, w * 1.6, `<defs>${lg(id + "fl", [[0, "#FFE7A0"], [0.5, ORG], [1, "#FF3A1A", 0]])}</defs>
    <g id="${id}Wt">${kettle(90, 150, 1.6)}${T(90, 136, "500 t", { fs: 30 })}${arrow3(90, 170, 520, RED, "#9A2416", false)}${T(90, 580, "WEIGHT", { fs: 30, c: "#FFD6CF" })}</g>
    <g id="${id}Th">${arrow3(300, 600, 150, GRN, "#137A4A", true)}<path d="M282 606 Q 300 660 318 606 Z" fill="url(#${id}fl)"/>${T(300, 120, "PUSH", { fs: 32, c: "#C9FFE2" })}</g>`);

  // ---------------------------------------------------------------- picture cards (600 x 420 scenes)
  const card = (id, bg, body) => svg("0 0 600 420", 600, 420, `<defs><clipPath id="${id}K"><rect width="600" height="420" rx="34"/></clipPath>${bg[0]}</defs><g clip-path="url(#${id}K)">${bg[1]}${body}</g>`);
  const skyBG = (id, a, b, extra = "") => [lg(id + "sky", [[0, a], [1, b]]), `<rect width="600" height="420" fill="url(#${id}sky)"/>${extra}`];
  const spaceBG = (id, seed) => [rg(id + "sp", [[0, "#1C2A6A"], [1, "#060A22"]], 0.3, 0.2, 0.9), `<rect width="600" height="420" fill="url(#${id}sp)"/>${stars(70, seed)}`];
  const earthDefs = (id) => `${rg(id + "e", [[0, "#5FB4F0"], [0.55, "#2A78D0"], [1, "#123E86"]], 0.35, 0.3, 0.75)}${rg(id + "at", [[0.82, "#7FD0FF", 0], [0.9, "#7FD0FF", 0.7], [1, "#7FD0FF", 0]])}`;
  const earth = (id, cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r * 1.12}" fill="url(#${id}at)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}e)"/><g opacity=".9" fill="#4FA35A"><path d="M${cx - r * 0.55} ${cy - r * 0.35} q ${r * 0.25} -${r * 0.25} ${r * 0.5} -${r * 0.05} q ${r * 0.1} ${r * 0.25} -${r * 0.2} ${r * 0.35} q -${r * 0.3} ${r * 0.05} -${r * 0.3} -${r * 0.3} Z"/><path d="M${cx + r * 0.15} ${cy + r * 0.1} q ${r * 0.3} -${r * 0.1} ${r * 0.45} ${r * 0.15} q -${r * 0.05} ${r * 0.35} -${r * 0.35} ${r * 0.3} q -${r * 0.2} -${r * 0.2} -${r * 0.1} -${r * 0.45} Z"/></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/><path d="M${cx + r * 0.2} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.1}" stroke="#fff" stroke-width="5" fill="none" opacity=".25"/>`;

  // balloon trick: the balloon zips left as air rushes out; a mini rocket does the same thing upward. #idB #idA #idR
  D.balloon = ({ id = "bl" } = {}) => card(id, skyBG(id, "#7CC4F4", "#D9F0FF", `${cloud(120, 90, 1, 0.9)}${cloud(470, 70, 0.8, 0.8)}`), `
    <defs>${rg(id + "bb", [[0, "#FF9C88"], [0.5, RED], [1, "#B5281A"]], 0.35, 0.3, 0.75)}${rdefs(id)}</defs>
    <g id="${id}A">${[0, 1, 2, 3, 4].map((i) => `<path d="M${330 + i * 6} ${210 + (i - 2) * 22} q 50 ${(i - 2) * 6} 120 ${(i - 2) * 20}" stroke="#fff" stroke-width="${9 - i}" stroke-linecap="round" fill="none" stroke-dasharray="28 20" opacity=".9"/>`).join("")}</g>
    <g id="${id}B"><ellipse cx="236" cy="290" rx="80" ry="12" fill="#000" opacity=".08"/><ellipse cx="236" cy="200" rx="92" ry="78" fill="url(#${id}bb)" stroke="${INK}" stroke-width="5"/><ellipse cx="204" cy="166" rx="24" ry="13" fill="#fff" opacity=".55" transform="rotate(-20 204 166)"/><path d="M326 200 L 348 186 L 348 214 Z" fill="${RED}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      ${[0, 1, 2].map((i) => `<path d="M${140 - i * 26} ${170 + i * 30} L ${100 - i * 26} ${170 + i * 30}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`).join("")}</g>
    <g id="${id}R">${rocket(id, 520, 330, 0.55, { flame: 0.9 })}</g>
    ${cap("gas out one way → you go the other")}`);

  // gravity turn: from straight up to sideways over the curve of the Earth. #idP path, #idR mini rocket
  D.turn = ({ id = "gt" } = {}) => card(id, skyBG(id, "#0B1440", "#E48A6E", stars(30, 7, 600, 160)), `
    <defs>${rdefs(id)}${lg(id + "gl", [[0, "#9FD7FF", 0], [1, "#9FD7FF", 0.7]])}</defs>
    <path d="M-40 470 Q 300 270 640 470" fill="none" stroke="url(#${id}gl)" stroke-width="40"/><path d="M-40 480 Q 300 300 640 480 L 640 520 L -40 520 Z" fill="#2E6FC2"/><path d="M-40 480 Q 300 300 640 480" fill="none" stroke="#9FD7FF" stroke-width="5"/>
    <path id="${id}P" d="M90 372 C 92 270 130 180 230 128 C 320 84 430 72 560 74" fill="none" stroke="${YEL}" stroke-width="8" stroke-linecap="round" stroke-dasharray="20 14"/>
    <path d="M560 74 l -26 -14 l 0 28 Z" fill="${YEL}"/>
    <g id="${id}R">${rocket(id, 0, 0, 0.28, { flame: 1 })}</g>
    ${T(64, 320, "up", { fs: 34, a: "end" })}${T(470, 52, "sideways!", { fs: 34 })}${cap("tip over, then sprint sideways")}`);

  // Max-Q: air bands squeeze the nose; engine dial needle #idN eases back
  D.squeeze = ({ id = "mq" } = {}) => card(id, skyBG(id, "#2F7FD0", "#A8D6F8", `${cloud(90, 330, 1.2, 0.85)}${cloud(520, 310, 1, 0.8)}`), `
    <defs>${rdefs(id)}${lg(id + "air", [[0, "#fff", 0], [0.5, "#fff", 0.95], [1, "#fff", 0]], 1, 0)}</defs>
    <g id="${id}Air">${[0, 1, 2, 3].map((i) => `<path d="M${120 - i * 22} ${60 + i * 34} Q 230 ${150 + i * 20} ${232} ${240 + i * 12}" fill="none" stroke="url(#${id}air)" stroke-width="${10 - i * 1.5}" stroke-linecap="round"/><path d="M${360 + i * 22} ${60 + i * 34} Q 250 ${150 + i * 20} ${248} ${240 + i * 12}" fill="none" stroke="url(#${id}air)" stroke-width="${10 - i * 1.5}" stroke-linecap="round"/>`).join("")}</g>
    ${rocket(id, 240, 360, 1.15, { flame: 0.8 })}
    <g transform="translate(480 230)"><circle r="78" fill="rgba(8,12,34,.62)"/><path d="M-58 20 A 62 62 0 1 1 58 20" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="14" stroke-linecap="round"/><path d="M-58 20 A 62 62 0 0 1 30 -54" fill="none" stroke="${GRN}" stroke-width="14" stroke-linecap="round"/><path d="M30 -54 A 62 62 0 0 1 58 20" fill="none" stroke="${ORG}" stroke-width="14" stroke-linecap="round"/><line id="${id}N" x1="0" y1="0" x2="0" y2="-52" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle r="10" fill="#fff"/>${T(0, 50, "ENGINES", { fs: 18, sh: false })}</g>
    <g transform="translate(110 110)"><rect x="-70" y="-26" width="140" height="52" rx="26" fill="${RED}" stroke="${INK}" stroke-width="4"/>${T(0, 12, "MAX-Q", { fs: 30, sh: false })}</g>
    ${cap("the air pushes back hardest")}`);

  // g-force: three kettlebells sit on the astronaut's chest; she sinks into the seat. #idBody #idKb
  D.gseat = ({ id = "gs" } = {}) => card(id, [lg(id + "cab", [[0, "#2B3A70"], [1, "#141B3E"]]), `<rect width="600" height="420" fill="url(#${id}cab)"/><rect x="380" y="40" width="180" height="120" rx="20" fill="#0B1030" stroke="#5C6E9E" stroke-width="5"/><rect x="390" y="50" width="160" height="100" rx="14" fill="#1C2A6A"/>${stars(14, 4, 160, 100).replace(/cx="(\d+)" cy="(\d+)"/g, (m, x, y) => `cx="${+x + 390}" cy="${+y + 50}"`)}<path d="M390 130 Q 470 104 550 130 L 550 150 L 390 150 Z" fill="#3F8CD8"/><rect x="40" y="40" width="140" height="70" rx="12" fill="#0B1030"/><path d="M52 92 l 20 -16 l 18 10 l 20 -22 l 20 14 l 20 -8 l 18 12" stroke="#5CF0A6" stroke-width="4" fill="none"/>`], `
    <path d="M150 380 L 150 190 Q 150 156 184 156 L 214 156 L 214 300 L 440 300 Q 464 300 464 326 L 464 380 Z" fill="#4A5680" stroke="${INK}" stroke-width="5"/><path d="M160 196 L 160 370" stroke="#fff" stroke-width="5" opacity=".15"/>
    <g id="${id}Body">${astro("", 290, 252, 1.25)}</g>
    <g id="${id}Kb">${kettle(250, 300, 0.7)}${kettle(300, 288, 0.7)}${kettle(350, 300, 0.7)}</g>
    ${T(500, 260, "×3", { fs: 70, c: YEL })}${cap("you feel 3× heavier")}`);

  // dead weight: the empty lower stage (with a luggage tag) lets go and tumbles away. #idTank
  D.deadweight = ({ id = "dw" } = {}) => card(id, spaceBG(id, 21), `
    <defs>${earthDefs(id)}${cyl(id + "s", "#FFFFFF", "#E6ECF4", "#A9B4C6")}${cyl(id + "e", "#E2E8F0", "#C9D0DC", "#8A95AA")}</defs>
    ${earth(id, 300, 900, 560)}
    <g transform="translate(250 0)"><path d="M0 40 Q 30 76 30 120 L 30 196 L -30 196 L -30 120 Q -30 76 0 40 Z" fill="url(#${id}s)" stroke="${INK}" stroke-width="4.5"/><circle cx="0" cy="100" r="9" fill="${TEAL}" stroke="${INK}" stroke-width="3"/><path d="M-12 196 L -16 208 L 16 208 L 12 196 Z" fill="#4A5266" stroke="${INK}" stroke-width="3"/><path d="M-10 208 Q 0 250 10 208 Z" fill="${ORG}" id="${id}Fl"/></g>
    <g id="${id}Tank"><rect x="216" y="214" width="68" height="160" rx="12" fill="url(#${id}e)" stroke="${INK}" stroke-width="4.5"/><rect x="226" y="226" width="48" height="136" rx="8" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="8 6" opacity=".45"/><path d="M216 330 L 194 380 L 216 366 Z M284 330 L 306 380 L 284 366 Z" fill="${RED}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M284 250 Q 320 240 344 262" fill="none" stroke="${INK}" stroke-width="3"/><g transform="translate(344 262) rotate(12)"><path d="M0 -26 L 110 -26 L 126 0 L 110 26 L 0 26 Z" fill="#FFE36E" stroke="${INK}" stroke-width="4"/><circle cx="14" cy="0" r="6" fill="${INK}"/>${T(68, -2, "DEAD", { fs: 20, c: INK, sh: false })}${T(68, 18, "WEIGHT", { fs: 18, c: INK, sh: false })}</g>
      ${T(250, 300, "EMPTY", { fs: 18, c: INK, sh: false })}</g>
    ${cap("empty tank = just dead weight")}`);

  // booster comes back: flips, legs out, lands on a ship at sea. #idB moved by JS, #idLeg, #idF flame, #idPuff
  D.landing = ({ id = "ld" } = {}) => card(id, skyBG(id, "#F7B07A", "#FDE3C2", `<circle cx="470" cy="250" r="56" fill="#FFF0C8" opacity=".8"/>${cloud(120, 80, 0.9, 0.85)}`), `
    <defs>${cyl(id + "b", "#FFFFFF", "#E6ECF4", "#A9B4C6")}${lg(id + "sea", [[0, "#3C8FD8"], [1, "#1B4E96"]])}${lg(id + "fl", [[0, "#FFE7A0"], [0.5, ORG], [1, "#FF3A1A", 0]])}</defs>
    <rect x="0" y="300" width="600" height="120" fill="url(#${id}sea)"/>${[0, 1, 2, 3].map((i) => `<path d="M${-20 + i * 160} ${320 + i % 2 * 30} q 30 -8 60 0 t 60 0" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`).join("")}
    <g transform="translate(400 306)"><path d="M-110 0 L 110 0 L 92 26 L -92 26 Z" fill="#5C677E" stroke="${INK}" stroke-width="4.5"/><rect x="-110" y="-8" width="220" height="10" fill="#9AA3B4" stroke="${INK}" stroke-width="3"/><path d="M-20 -6 L 20 -6 M0 -6 L 0 -6" stroke="${YEL}" stroke-width="5"/><circle cx="0" cy="-3" r="16" fill="none" stroke="${YEL}" stroke-width="4"/>${[-96, -70, 70, 96].map((x) => `<rect x="${x - 4}" y="-30" width="8" height="24" fill="#3E4A6A"/>`).join("")}</g>
    <g id="${id}Puff" opacity="0">${cloud(400, 296, 0.9, 0.9, "#EEF2F7")}</g>
    <g id="${id}B"><g transform="translate(-16 -130)"><path id="${id}F" d="M4 130 Q 16 196 28 130 Z" fill="url(#${id}fl)"/><rect x="0" y="0" width="32" height="130" rx="8" fill="url(#${id}b)" stroke="${INK}" stroke-width="4.5"/><rect x="0" y="44" width="32" height="10" fill="${TEAL}"/>${[0, 1].map((k) => `<rect x="${k ? 30 : -8}" y="8" width="10" height="12" rx="2" fill="#2B3040"/>`).join("")}<g id="${id}Leg"><path d="M4 112 L -18 138 M28 112 L 50 138" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g></g></g>
    ${cap("flies back · lands on a ship · flies again")}`);

  // Newton's cannon: three shots from a mountain; the third circles the world. #idP0..2 #idBall
  D.cannon = ({ id = "nc" } = {}) => card(id, spaceBG(id, 33), `
    <defs>${earthDefs(id)}</defs>
    ${earth(id, 300, 236, 120)}
    <path d="M262 124 L 300 64 L 338 124 Z" fill="#9A8A78" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M290 80 L 300 64 L 310 80 L 300 86 Z" fill="#fff"/>
    <g transform="translate(300 62) rotate(-8)"><rect x="-6" y="-12" width="44" height="18" rx="7" fill="#3E4A6A" stroke="${INK}" stroke-width="3.5"/><circle cx="2" cy="6" r="9" fill="#5C677E" stroke="${INK}" stroke-width="3"/></g>
    <path id="${id}P0" d="M338 56 Q 392 56 404 140" fill="none" stroke="${YEL}" stroke-width="6" stroke-dasharray="12 9" stroke-linecap="round"/>
    <path id="${id}P1" d="M338 56 Q 462 62 446 252" fill="none" stroke="${ORG}" stroke-width="6" stroke-dasharray="12 9" stroke-linecap="round"/>
    <path id="${id}P2" d="M338 56 A 178 176 0 1 1 330 56" fill="none" stroke="${GRN}" stroke-width="7" stroke-dasharray="12 9" stroke-linecap="round"/>
    <circle id="${id}Ball" r="10" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    ${cap("falling… and always missing")}`);

  // one lap in ~90 min at 28,000 km/h: capsule circles the Earth. #idDot #idSpd
  D.lap = ({ id = "lp" } = {}) => card(id, spaceBG(id, 44), `
    <defs>${earthDefs(id)}</defs>
    <ellipse cx="300" cy="200" rx="230" ry="80" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-dasharray="10 10"/>
    ${earth(id, 300, 200, 110)}
    <path d="M70 200 A 230 80 0 0 0 530 200" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-dasharray="10 10"/>
    <g id="${id}Dot"><circle r="12" fill="${YEL}" stroke="${INK}" stroke-width="4"/></g>
    <g transform="translate(108 70)"><circle r="34" fill="rgba(8,12,34,.6)" stroke="#fff" stroke-width="3"/><path d="M0 -18 L 0 0 L 14 8" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>${T(0, 58, "90 MIN", { fs: 20 })}</g>
    <text id="${id}Spd" x="300" y="352" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="46" fill="${YEL}" style="paint-order:stroke" stroke="rgba(8,12,34,.6)" stroke-width="8">28,000 km/h</text>`);

  // 16 sunrises: the sun pops over the Earth's edge again and again; counter #idN, sun #idSun
  D.suns = ({ id = "sn" } = {}) => card(id, spaceBG(id, 55), `
    <defs>${rg(id + "s", [[0, "#FFFBE0"], [0.25, "#FFE27A"], [0.6, "#FFB040", 0.5], [1, "#FF8A2A", 0]])}${lg(id + "lm", [[0, "#7FD0FF"], [0.2, "#2A78D0"], [1, "#0E2E6A"]])}</defs>
    <g id="${id}Sun"><circle cx="300" cy="300" r="120" fill="url(#${id}s)"/></g>
    <path d="M-40 420 Q 300 240 640 420 L 640 440 L -40 440 Z" fill="url(#${id}lm)"/><path d="M-40 420 Q 300 240 640 420" fill="none" stroke="#BFF3FF" stroke-width="6" opacity=".8"/>
    <text id="${id}N" x="300" y="150" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="110" fill="#fff" style="paint-order:stroke" stroke="rgba(8,12,34,.55)" stroke-width="10">1</text>
    ${cap("sunrises every single day")}`);

  // floating: inside the capsule, astronaut + pen + chai cup float; Earth in the window. #idAst #idPen #idCup
  D.floaty = ({ id = "fl" } = {}) => card(id, [lg(id + "in", [[0, "#3A4A86"], [1, "#1A2250"]]), `<rect width="600" height="420" fill="url(#${id}in)"/>`], `
    <defs>${earthDefs(id)}<clipPath id="${id}W"><circle cx="470" cy="120" r="70"/></clipPath></defs>
    <path d="M0 360 Q 300 300 600 360 L 600 420 L 0 420 Z" fill="#2B3566"/><path d="M0 60 Q 300 0 600 60 L 600 0 L 0 0 Z" fill="#2B3566"/>
    <circle cx="470" cy="120" r="80" fill="#5C6E9E" stroke="${INK}" stroke-width="5"/><g clip-path="url(#${id}W)"><rect x="390" y="40" width="160" height="160" fill="#060A22"/>${earth(id, 470, 230, 110)}</g><circle cx="470" cy="120" r="70" fill="none" stroke="#9FD7FF" stroke-width="4" opacity=".6"/>
    ${astro(id + "Ast", 230, 200, 1.35)}
    <g id="${id}Pen"><rect x="-30" y="-5" width="60" height="10" rx="5" fill="${YEL}" stroke="${INK}" stroke-width="3"/></g>
    <g id="${id}Cup"><path d="M-18 -16 L 18 -16 L 14 18 L -14 18 Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M-15 -8 L 15 -8 L 12 14 L -12 14 Z" fill="#C88A4E"/><path d="M18 -8 Q 30 -6 26 6 Q 22 12 14 10" fill="none" stroke="${INK}" stroke-width="3.5"/></g>
    ${cap("falling together = floating")}`);

  // re-entry: air piles up and glows in front of the heat shield; thermometer #idTh fills, #idT text, shield layers #idL0..2
  D.heat = ({ id = "ht" } = {}) => card(id, [rg(id + "bg", [[0, "#5A1E1A"], [1, "#120814"]], 0.25, 0.5, 0.9), `<rect width="600" height="420" fill="url(#${id}bg)"/>${stars(25, 66)}`], `
    <defs>${rg(id + "G", [[0, "#FFF4C8"], [0.35, "#FFB040", 0.9], [0.7, "#FF5A1A", 0.5], [1, "#FF2A0A", 0]], 0.75, 0.5, 0.75)}${cyl(id + "c", "#FFFFFF", "#E6ECF4", "#A9B4C6")}${lg(id + "th", [[0, "#FFE27A"], [0.6, ORG], [1, "#E8361A"]], 0, 0, 0, 1)}</defs>
    <ellipse id="${id}Glow" cx="190" cy="200" rx="150" ry="180" fill="url(#${id}G)"/>
    <g id="${id}Air">${Array.from({ length: 30 }, (_, i) => `<circle class="${id}d" cx="${30 + (i % 6) * 22}" cy="${60 + Math.floor(i / 6) * 64}" r="6" fill="${SKY}"/>`).join("")}</g>
    <g transform="translate(320 200) rotate(-90)"><path d="M0 -150 Q 72 -60 86 50 L -86 50 Q -72 -60 0 -150 Z" fill="url(#${id}c)" stroke="${INK}" stroke-width="5"/><rect x="-86" y="10" width="172" height="10" fill="${TEAL}"/><circle cx="0" cy="-50" r="14" fill="${TEAL}" stroke="${INK}" stroke-width="4"/>${[0, 1, 2].map((k) => `<rect id="${id}L${k}" x="${-96 + k * 3}" y="${50 + k * 13}" width="${192 - k * 6}" height="13" rx="5" fill="${["#8A5236", "#6A3C26", "#4A2818"][k]}" stroke="${INK}" stroke-width="3"/>`).join("")}</g>
    <g transform="translate(520 60)"><rect x="-18" y="0" width="36" height="230" rx="18" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="4"/><rect id="${id}Th" x="-12" y="6" width="24" height="218" rx="12" fill="url(#${id}th)"/><circle cx="0" cy="246" r="30" fill="#E8361A" stroke="#fff" stroke-width="4"/></g>
    <text id="${id}T" x="300" y="380" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="46" fill="#FFD27A" style="paint-order:stroke" stroke="rgba(8,12,34,.6)" stroke-width="8">0 °C</text>`);

  // chai cup (steam #idSt)
  D.chai = ({ w = 140, id = "ch" } = {}) => svg("0 0 140 170", w, w * 1.21, `<defs>${cyl(id + "c", "#FFFFFF", "#EEF2F7", "#B9C3D3")}</defs><g id="${id}St">${[46, 70, 94].map((x) => `<path d="M${x} 52 q 12 -14 0 -26 t 0 -24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>`).join("")}</g><ellipse cx="70" cy="162" rx="50" ry="7" fill="#000" opacity=".2"/><path d="M22 62 L 118 62 L 108 156 L 32 156 Z" fill="url(#${id}c)" stroke="${INK}" stroke-width="6"/><ellipse cx="70" cy="64" rx="46" ry="8" fill="#B5763C" stroke="${INK}" stroke-width="4"/><path d="M116 82 Q 144 86 136 114 Q 130 128 110 126" fill="none" stroke="${INK}" stroke-width="7"/><rect x="40" y="96" width="60" height="22" rx="6" fill="${RED}"/>${T(70, 113, "CHAI", { fs: 15, sh: false })}`);

  // recap arc of 5 medallions (#idI0..4)
  D.recap = ({ w = 1400, id = "rc" } = {}) => {
    const IC = [["⏱", "countdown"], ["🔥", "liftoff"], ["✂️", "staging"], ["🌍", "orbit"], ["🪂", "home"]];
    return svg("0 0 1400 360", w, w * 0.257, `<path d="M80 300 Q 700 -40 1320 300" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="7" stroke-dasharray="18 14"/>${IC.map(([e, n], i) => { const u = i / 4, x = 80 + 1240 * u, y = 300 - 680 * u * (1 - u); return `<g id="${id}I${i}" transform="translate(${x.toFixed(0)} ${(y - 40).toFixed(0)})"><circle r="58" fill="rgba(0,0,0,.18)" cy="6"/><circle r="56" fill="#fff" stroke="${INK}" stroke-width="5"/><circle r="44" fill="${["#FFF1C9", "#FFE3D3", "#DDF7EA", "#DCEFFF", "#ECE6FF"][i]}"/><text y="18" text-anchor="middle" font-size="50">${e}</text>${T(0, 100, n, { fs: 30 })}</g>`; }).join("")}`);
  };
  window.R2D = D;
})();
