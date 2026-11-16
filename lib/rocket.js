// rocket.js — picture-style (3D-looking 2D) diagrams + characters for the "how a rocket reaches space" explainer. Load after iso.js.
// Every builder returns an SVG/HTML string; animated parts carry ids/classes noted per builder.
(function () {
  const { box, shadow, extrude, shade } = ISO;
  const INK = "#1B2340", TEAL = "#12A4C4", RED = "#F2553D", ORG = "#FF8A2A", YEL = "#FFC93D";
  const svg = (vb, w, h, s) => `<svg viewBox="${vb}" width="${w}" height="${h}" style="overflow:visible">${s}</svg>`;
  const R = {};
  const stp = (s) => s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("");
  const lin = (id, s, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stp(s)}</linearGradient>`;
  const rad = (id, s, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stp(s)}</radialGradient>`;
  const T = (x, y, t, { fs = 22, c = INK, a = "middle", o = 1, f = "JetBrains Mono", w = 800 } = {}) => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="${f}" font-weight="${w}" font-size="${fs}" fill="${c}" opacity="${o}">${t}</text>`;
  const chip = (x, y, t, c, { fs = 22, tc = "#fff", a = "start" } = {}) => { const w = Math.round(t.length * fs * 0.62 + 30), h = Math.round(fs * 1.8), x0 = a === "middle" ? x - w / 2 : a === "end" ? x - w : x; return `<g><rect x="${x0}" y="${y + 5}" width="${w}" height="${h}" rx="${h / 2}" fill="${INK}"/><rect x="${x0}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c}" stroke="${INK}" stroke-width="3"/>${T(x0 + w / 2, y + h * 0.67, t, { fs, c: tc })}</g>`; };
  const arrow3 = (x1, y1, x2, y2, c, w = 22, id = "", cls = "") => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1), hl = Math.min(w * 1.9, L * 0.5), hw = w * 1.2;
    const at = (u, v) => [x1 + Math.cos(a) * u - Math.sin(a) * v, y1 + Math.sin(a) * u + Math.cos(a) * v].map((n) => n.toFixed(1)).join(",");
    const pts = [[0, -w / 2], [L - hl, -w / 2], [L - hl, -hw], [L, 0], [L - hl, hw], [L - hl, w / 2], [0, w / 2]].map(([u, v]) => at(u, v)).join(" ");
    return `<g ${id ? `id="${id}"` : ""} ${cls ? `class="${cls}"` : ""}><polygon points="${pts}" transform="translate(4 6)" fill="${shade(c, -0.5)}"/><polygon points="${pts}" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${at(w * 0.35, -w * 0.18)} L ${at(L - hl - 4, -w * 0.18)}" stroke="#fff" stroke-width="${Math.max(2, w * 0.16)}" stroke-linecap="round" opacity=".45"/></g>`;
  };
  const cloud = (x, y, s = 1, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="10" rx="72" ry="15" fill="#C9DCEC"/><circle cx="-36" cy="-2" r="26" fill="#fff"/><circle cx="2" cy="-18" r="34" fill="#fff"/><circle cx="38" cy="0" r="24" fill="#fff"/><rect x="-62" y="-4" width="124" height="16" rx="8" fill="#fff"/></g>`;
  const bg = (x, y, w, h, c1, c2, id, rx = 30) => `<defs>${lin(id, [[0, c1], [1, c2]])}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id})"/>`;
  const stars = (n, w, h, seed = 3) => { let s = seed, o = ""; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < n; i++) o += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(1 + r() * 2).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; return o; };
  const flame = (cx, y, w, len, id = "") => `<g ${id ? `id="${id}"` : ""}><path d="M${cx - w / 2} ${y} Q ${cx - w * 0.7} ${y + len * 0.5} ${cx} ${y + len} Q ${cx + w * 0.7} ${y + len * 0.5} ${cx + w / 2} ${y} Z" fill="${ORG}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${cx - w / 4} ${y} Q ${cx - w * 0.35} ${y + len * 0.4} ${cx} ${y + len * 0.7} Q ${cx + w * 0.35} ${y + len * 0.4} ${cx + w / 4} ${y} Z" fill="${YEL}"/><path d="M${cx - w / 8} ${y} Q ${cx} ${y + len * 0.35} ${cx + w / 8} ${y}" fill="#fff"/></g>`;

  // ---------------------------------------------------------------- the rocket (side view, nose up), reused everywhere. 200 x 760 units
  // opts: fairing (bool), s1 (bool), legs (bool), flame (bool), flameLen, id
  R.rocket = ({ w = 200, id = "rk", s1 = true, s2 = true, fairing = true, flameOn = false, flameLen = 160, legs = false } = {}) => svg("0 0 200 780", w, w * 3.9, `<defs>${lin(id + "B", [[0, "#FFFFFF"], [0.45, "#E4E9F1"], [1, "#A8B2C5"]], 1, 0)}${lin(id + "N", [[0, "#FFFFFF"], [0.5, "#DDE3EE"], [1, "#9AA6BC"]], 1, 0)}${lin(id + "D", [[0, "#4A5578"], [1, "#1B2340"]], 1, 0)}</defs>
    ${s1 ? `<rect x="64" y="340" width="72" height="330" rx="6" fill="url(#${id}B)" stroke="${INK}" stroke-width="5"/><rect x="64" y="460" width="72" height="26" fill="${TEAL}" stroke="${INK}" stroke-width="4"/><rect x="64" y="486" width="72" height="8" fill="${RED}"/><rect x="64" y="318" width="72" height="26" fill="url(#${id}D)" stroke="${INK}" stroke-width="4"/>
      <path d="M72 670 L 60 700 L 140 700 L 128 670 Z" fill="url(#${id}D)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${[78, 100, 122].map((x) => `<path d="M${x - 11} 700 L ${x - 17} 722 L ${x + 17} 722 L ${x + 11} 700 Z" fill="#30384F" stroke="${INK}" stroke-width="3"/>`).join("")}
      ${legs ? `<path d="M66 640 L 20 740 M134 640 L 180 740" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M12 744 L 38 744 M162 744 L 188 744" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` : ""}
      <path d="M64 350 L 36 372 L 64 380 Z M136 350 L 164 372 L 136 380 Z" fill="${INK}"/>` : ""}
    ${s2 ? `<rect x="64" y="196" width="72" height="124" rx="6" fill="url(#${id}B)" stroke="${INK}" stroke-width="5"/><rect x="64" y="228" width="72" height="14" fill="${TEAL}" stroke="${INK}" stroke-width="3"/><path d="M82 320 L 76 336 L 124 336 L 118 320 Z" fill="#30384F" stroke="${INK}" stroke-width="3"/>` : ""}
    ${fairing ? `<path d="M64 196 L 64 150 Q 64 70 100 20 Q 136 70 136 150 L 136 196 Z" fill="url(#${id}N)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M78 160 Q 80 90 100 44" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/><line x1="100" y1="30" x2="100" y2="196" stroke="${INK}" stroke-width="2" opacity=".25"/>` : ""}
    ${flameOn ? flame(100, s1 ? 722 : 336, 70, flameLen, id + "Fl") : ""}`);

  // ---------------------------------------------------------------- anatomy cutaway (stages, tanks, payload, engines) with labels
  // ids: ${id}Fl (flame)
  R.anatomy = ({ w = 800, id = "an" } = {}) => svg("0 0 1000 800", w, w * 0.8, `<defs>${lin(id + "B", [[0, "#FFFFFF"], [0.45, "#E4E9F1"], [1, "#A8B2C5"]], 1, 0)}${lin(id + "Lx", [[0, "#8FD0FF"], [1, "#3E7BFA"]])}${lin(id + "Fu", [[0, "#FFD27A"], [1, "#F28C1E"]])}${lin(id + "D", [[0, "#4A5678"], [1, "#1B2340"]], 1, 0)}</defs>
    ${bg(0, 0, 1000, 800, "#EAF3FB", "#FFFFFF", id + "Bg", 26)}
    <g transform="translate(390 20)">
      <path d="M64 196 L 64 150 Q 64 70 100 20 Q 136 70 136 150 L 136 196 Z" fill="url(#${id}B)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <g id="${id}Cap"><path d="M80 190 L 84 130 L 116 130 L 120 190 Z" fill="#FFF" stroke="${INK}" stroke-width="4"/><rect x="92" y="146" width="16" height="14" rx="3" fill="#14203F"/><circle cx="100" cy="176" r="6" fill="${TEAL}"/></g>
      <rect x="64" y="196" width="72" height="124" rx="6" fill="url(#${id}B)" stroke="${INK}" stroke-width="5"/><rect x="72" y="206" width="56" height="48" rx="6" fill="url(#${id}Lx)" stroke="${INK}" stroke-width="3"/><rect x="72" y="262" width="56" height="48" rx="6" fill="url(#${id}Fu)" stroke="${INK}" stroke-width="3"/>
      <rect x="64" y="318" width="72" height="26" fill="url(#${id}D)" stroke="${INK}" stroke-width="4"/><path d="M82 344 L 76 362 L 124 362 L 118 344 Z" fill="#30384F" stroke="${INK}" stroke-width="3"/>
      <rect x="64" y="344" width="72" height="326" rx="6" fill="url(#${id}B)" stroke="${INK}" stroke-width="5"/><rect x="72" y="356" width="56" height="134" rx="6" fill="url(#${id}Lx)" stroke="${INK}" stroke-width="3"/><rect x="72" y="498" width="56" height="162" rx="6" fill="url(#${id}Fu)" stroke="${INK}" stroke-width="3"/>
      <path d="M72 670 L 60 700 L 140 700 L 128 670 Z" fill="url(#${id}D)" stroke="${INK}" stroke-width="4"/>${[78, 100, 122].map((x) => `<path d="M${x - 11} 700 L ${x - 17} 722 L ${x + 17} 722 L ${x + 11} 700 Z" fill="#30384F" stroke="${INK}" stroke-width="3"/>`).join("")}
      ${flame(100, 722, 80, 60, id + "Fl")}
    </g>
    ${[["PAYLOAD · CREW CAPSULE", 150, "#F2553D", 462], ["2ND STAGE · SMALL, FOR SPACE", 300, "#3E7BFA", 462], ["1ST STAGE · THE BIG ONE", 520, "#22B573", 462], ["ENGINES", 700, ORG, 478]].map(([t, y, c, tx]) => { const w2 = Math.round(t.length * 21 * 0.62 + 30); return `<path d="M${30 + w2} ${y + 19} L ${tx} ${y + 19}" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6"/>${chip(30, y, t, c, { fs: 21 })}`; }).join("")}
    ${chip(620, 330, "OXIDISER (BLUE)", "#3E7BFA", { fs: 21 })}${chip(620, 410, "FUEL (ORANGE)", "#E8930C", { fs: 21 })}
    <path d="M620 354 L 530 400" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6"/><path d="M620 434 L 530 590" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6"/>
    ${chip(600, 560, "≈ 90% IS FUEL", INK, { fs: 26, tc: YEL })}${chip(600, 40, "CUTAWAY · NOT TO SCALE", "#5C677E", { fs: 18 })}`);

  // ---------------------------------------------------------------- 90% fuel: a stacked column + percent bar
  // ids: ${id}Fuel (fuel portion, scale to animate), ${id}P
  R.fuelbar = ({ w = 700, id = "fb" } = {}) => svg("0 0 900 620", w, w * 0.689, `${bg(0, 0, 900, 620, "#FFF1C9", "#FFE3A8", id + "Bg", 26)}
    <defs>${lin(id + "F", [[0, "#FFD27A"], [1, "#F28C1E"]])}</defs>
    ${T(450, 70, "WHAT'S IN A ROCKET?", { fs: 34, f: "Archivo", w: 900 })}
    <rect x="60" y="130" width="780" height="96" rx="20" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <g id="${id}Fuel"><rect x="60" y="130" width="702" height="96" rx="20" fill="url(#${id}F)" stroke="${INK}" stroke-width="5"/>${T(410, 192, "FUEL + OXIDISER · 90%", { fs: 38, f: "Archivo", w: 900 })}</g>
    <rect x="762" y="130" width="78" height="96" rx="20" fill="#C9D0DC" stroke="${INK}" stroke-width="5"/>${T(801, 190, "10%", { fs: 28 })}
    <g transform="translate(40 290)">${[["🔩", "STRUCTURE + TANKS"], ["⚙️", "ENGINES"], ["📡", "ELECTRONICS"], ["👩‍🚀", "CAPSULE + CREW"]].map(([ic, t], i) => `<g transform="translate(${(i % 2) * 410} ${Math.floor(i / 2) * 120})"><rect width="380" height="96" rx="20" fill="#fff" stroke="${INK}" stroke-width="4"/><text x="26" y="64" font-size="50">${ic}</text>${T(100, 60, t, { fs: 24, a: "start" })}</g>`).join("")}</g>
    ${chip(450, 540, "A FLYING PETROL TANK WITH A VERY BRAVE SEAT ON TOP", INK, { fs: 18, tc: YEL, a: "middle" })}`);

  // ---------------------------------------------------------------- thrust vs weight (balance) + rocket still on the pad
  // ids: ${id}T (thrust arrow), ${id}W (weight arrow), ${id}R (rocket group)
  R.thrust = ({ w = 800, id = "tw" } = {}) => svg("0 0 1000 620", w, w * 0.62, `${bg(0, 0, 1000, 620, "#D9ECFB", "#FFFFFF", id + "Bg", 26)}
    <rect x="0" y="540" width="1000" height="80" fill="#8E98AC"/><rect x="330" y="530" width="340" height="24" rx="8" fill="#5C677E" stroke="${INK}" stroke-width="4"/>
    <g id="${id}R" transform="translate(500 40) scale(.7)"><g transform="translate(-100 0)">${strip(R.rocket({ w: 200, id: id + "k", flameOn: true, flameLen: 120 }))}</g></g>
    ${arrow3(740, 520, 740, 150, "#22B573", 36, id + "T")}${arrow3(260, 160, 260, 500, RED, 36, id + "W")}
    ${chip(640, 90, "THRUST ↑", "#22B573", { fs: 28 })}${chip(110, 90, "WEIGHT ↓", RED, { fs: 28 })}
    ${chip(500, 18, "THRUST > WEIGHT → UP SHE GOES", INK, { fs: 22, tc: YEL, a: "middle" })}
    <g transform="translate(80 270)"><rect width="150" height="60" rx="14" fill="#fff" stroke="${INK}" stroke-width="4"/>${T(75, 40, "500+ TONNES", { fs: 20 })}</g>`);
  const strip = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

  // ---------------------------------------------------------------- the balloon trick (Newton's third law)
  // ids: ${id}Bal (balloon group — move/rotate), class .air (escaping air dashes)
  R.balloon = ({ w = 800, id = "bl" } = {}) => svg("0 0 1000 560", w, w * 0.56, `${bg(0, 0, 1000, 560, "#FFE9DA", "#FFFFFF", id + "Bg", 26)}
    <g id="${id}Bal" transform="translate(600 260) rotate(-8)"><ellipse cx="0" cy="0" rx="140" ry="108" fill="${RED}" stroke="${INK}" stroke-width="6"/><ellipse cx="-44" cy="-36" rx="36" ry="22" fill="#fff" opacity=".45"/><path d="M-140 4 L -176 -14 L -176 22 Z" fill="${shade(RED, -0.25)}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>
    ${[0, 1, 2, 3].map((i) => `<path class="air" d="M${420 - i * 30} ${250 + (i - 1.5) * 30} L ${180 - i * 30} ${250 + (i - 1.5) * 52}" stroke="#3E7BFA" stroke-width="14" stroke-linecap="round" stroke-dasharray="40 26" opacity=".85"/>`).join("")}
    ${arrow3(760, 410, 900, 330, "#22B573", 30)}${arrow3(380, 130, 170, 130, "#3E7BFA", 26)}
    ${chip(40, 40, "LET GO OF A BALLOON…", INK, { fs: 26, tc: YEL })}
    ${chip(40, 440, "AIR OUT ←  ROCKET UP ↑", "#3E7BFA", { fs: 24 })}${chip(560, 470, "SAME TRICK. 500 TONNES.", RED, { fs: 22 })}`);

  // ---------------------------------------------------------------- rocket engine cutaway: tanks → pumps → chamber → nozzle
  // class .fl (flow dashes), id ${id}Fire (flame in chamber), ${id}Ex (exhaust)
  R.engine = ({ w = 900, id = "re" } = {}) => svg("0 0 1100 600", w, w * 0.545, `<defs>${lin(id + "Lx", [[0, "#8FD0FF"], [1, "#3E7BFA"]])}${lin(id + "Fu", [[0, "#FFD27A"], [1, "#F28C1E"]])}${lin(id + "M", [[0, "#F2F5F9"], [0.5, "#9AA3B4"], [1, "#5C677E"]])}${rad(id + "Fl", [[0, "#FFF6C8"], [0.4, "#FFC93D"], [0.75, "#F2553D"], [1, "#F2553D", 0]])}</defs>
    ${bg(0, 0, 1100, 600, "#EEF3FA", "#E1EAF6", id + "Bg", 26)}
    <rect x="40" y="90" width="230" height="170" rx="40" fill="url(#${id}Lx)" stroke="${INK}" stroke-width="6"/>${T(155, 185, "OXIDISER", { fs: 26, c: "#fff" })}
    <rect x="40" y="320" width="230" height="170" rx="40" fill="url(#${id}Fu)" stroke="${INK}" stroke-width="6"/>${T(155, 415, "FUEL", { fs: 30, c: INK })}
    ${[[270, 175, 400, 250], [270, 405, 400, 330]].map(([x1, y1, x2, y2], i) => `<path d="M${x1} ${y1} L ${x2 - 60} ${y1} L ${x2 - 60} ${y2}" stroke="${i ? "#E8930C" : "#3E7BFA"}" stroke-width="22" fill="none" stroke-linejoin="round"/><path class="fl" d="M${x1} ${y1} L ${x2 - 60} ${y1} L ${x2 - 60} ${y2}" stroke="#fff" stroke-width="6" fill="none" stroke-dasharray="14 22" stroke-linejoin="round" opacity=".8"/>`).join("")}
    <circle cx="340" cy="290" r="52" fill="url(#${id}M)" stroke="${INK}" stroke-width="6"/><g id="${id}Pump"><path d="M340 250 L 340 330 M300 290 L 380 290 M312 262 L 368 318 M368 262 L 312 318" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>${chip(250, 354, "PUMPS", "#5C677E", { fs: 20 })}
    <path d="M430 270 L 540 210 L 760 210 Q 800 210 830 150 L 1060 90 L 1060 510 L 830 450 Q 800 390 760 390 L 540 390 L 430 330 Z" fill="url(#${id}M)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M440 276 L 545 224 L 755 224 Q 810 224 838 170 L 1040 110 L 1040 490 L 838 430 Q 810 376 755 376 L 545 376 L 440 324 Z" fill="#EAF3FB"/>
    <g id="${id}Fire"><ellipse cx="640" cy="300" rx="120" ry="64" fill="url(#${id}Fl)"/><ellipse cx="640" cy="300" rx="66" ry="34" fill="#FFF6C8" opacity=".9"/></g>
    ${[0, 1, 2, 3, 4].map((i) => `<path class="fl" d="M${780 + i * 4} ${240 + i * 30} L ${1080} ${180 + i * 60}" stroke="${ORG}" stroke-width="12" stroke-linecap="round" stroke-dasharray="30 22" opacity=".9"/>`).join("")}
    ${chip(540, 440, "COMBUSTION CHAMBER · 3,000 °C", RED, { fs: 20, a: "middle" }).replace("<g>", `<g transform="translate(0 40)">`)}${chip(940, 40, "NOZZLE ▸ PUSHES THE GAS OUT FAST", INK, { fs: 20, tc: YEL, a: "end" })}
    ${arrow3(1040, 540, 1040, 590, "#22B573", 0.1).replace(/.*/s, "")}`);

  // ---------------------------------------------------------------- max-Q: dynamic pressure curve
  // ids: ${id}Cv (curve path), ${id}Dot (marker — move along), ${id}Cur (progress)
  R.maxq = ({ w = 900, id = "mq" } = {}) => svg("0 0 1100 640", w, w * 0.582, `<defs>${lin(id + "F", [[0, "#F2553D", 0.55], [1, "#F2553D", 0.05]])}</defs>
    ${bg(0, 0, 1100, 640, "#EEF3FA", "#FFFFFF", id + "Bg", 26)}
    <line x1="110" y1="520" x2="1040" y2="520" stroke="${INK}" stroke-width="5"/><line x1="110" y1="90" x2="110" y2="520" stroke="${INK}" stroke-width="5"/>
    ${T(575, 590, "TIME AFTER LIFTOFF →", { fs: 22 })}<text transform="translate(52 310) rotate(-90)" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="22" fill="${INK}">AIR PRESSURE ON ROCKET →</text>
    ${[0, 30, 60, 90, 120, 150].map((s, i) => `<line x1="${110 + i * 186}" y1="520" x2="${110 + i * 186}" y2="534" stroke="${INK}" stroke-width="4"/>${T(110 + i * 186, 560, s + "s", { fs: 18 })}`).join("")}
    <path d="M110 520 C 260 500, 380 200, 470 160 C 560 120, 640 260, 760 380 C 860 470, 960 505, 1040 515 L 1040 520 L 110 520 Z" fill="url(#${id}F)"/>
    <path id="${id}Cv" d="M110 520 C 260 500, 380 200, 470 160 C 560 120, 640 260, 760 380 C 860 470, 960 505, 1040 515" stroke="${RED}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <g id="${id}Dot" transform="translate(470 160)"><circle r="20" fill="${YEL}" stroke="${INK}" stroke-width="5"/></g>
    <path d="M470 180 L 470 520" stroke="${INK}" stroke-width="3" stroke-dasharray="8 8"/>
    ${chip(470, 50, "MAX-Q · ~1 MINUTE IN", RED, { fs: 26, a: "middle" })}${chip(640, 210, "ENGINES EASE OFF ↓", "#22B573", { fs: 20 })}
    <path d="M300 372 L 440 372" stroke="#3E7BFA" stroke-width="0"/>${chip(150, 130, "AIR PUSHES BACK HARDEST", INK, { fs: 18, tc: YEL })}`);

  // ---------------------------------------------------------------- staging: before / separation / after, with a shrinking weight bar
  // ids: ${id}S1 (the dropped stage group), ${id}Wt (weight bar fill)
  R.staging = ({ w = 1000, id = "sg" } = {}) => svg("0 0 1400 700", w, w * 0.5, `${bg(0, 0, 1400, 700, "#1E2A55", "#2F3F7E", id + "Bg", 26)}${stars(70, 1400, 700, 4)}
    ${[["1 · FULL STACK", 60, "#3E7BFA"], ["2 · DROP THE EMPTY ONE", 520, RED], ["3 · LIGHTER, FASTER", 980, "#22B573"]].map(([t, x, c]) => `<rect x="${x}" y="30" width="360" height="650" rx="26" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.25)" stroke-width="3"/>${chip(x + 20, 44, t, c, { fs: 20 })}`).join("")}
    <g transform="translate(190 100) scale(.5)">${strip(R.rocket({ w: 200, id: id + "a", flameOn: true, flameLen: 110 }))}</g>
    <g transform="translate(600 100) scale(.5)">${strip(R.rocket({ w: 200, id: id + "c", s1: false, flameOn: true, flameLen: 130 }))}</g>
    <g id="${id}S1" transform="translate(640 330) rotate(18 100 400)"><g transform="scale(.42)">${strip(R.rocket({ w: 200, id: id + "b", s2: false, fairing: false, flameOn: false, legs: false }))}</g></g>
    <g transform="translate(1060 100) scale(.5)">${strip(R.rocket({ w: 200, id: id + "d", s1: false, flameOn: true, flameLen: 150 }))}</g>
    <path d="M690 280 L 740 330" stroke="#fff" stroke-width="5" stroke-dasharray="10 10" opacity=".6"/>
    ${[["HEAVY", 130, "#F2553D", 100], ["−85% WEIGHT", 590, "#F2553D", 100], ["LIGHT", 1050, "#22B573", 16]].map(([t, x, c, p]) => `<g transform="translate(${x} 590)"><rect width="240" height="34" rx="12" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="3"/><rect class="${id}Wt" width="${p * 2.4}" height="34" rx="12" fill="${c}"/></g>${T(x + 120, 660, t, { fs: 22, c: "#fff" })}`).join("")}`);

  // ---------------------------------------------------------------- gravity turn: a path from vertical to horizontal around the Earth
  // ids: ${id}Pth (path), ${id}Ro (rocket marker group)
  R.gturn = ({ w = 1000, id = "gt" } = {}) => svg("0 0 1300 700", w, w * 0.538, `<defs>${lin(id + "A", [[0, "#02030A"], [0.7, "#0B2A6B"], [1, "#4F9BE8"]])}${rad(id + "E", [[0, "#2D7BE0"], [0.7, "#1B5FB8"], [1, "#0F3F8A"]], 0.5, 0.5, 0.5)}</defs>
    <rect width="1300" height="700" rx="26" fill="url(#${id}A)"/>${stars(80, 1300, 520, 6)}
    <ellipse cx="650" cy="1040" rx="1050" ry="520" fill="url(#${id}E)" stroke="#8FD0FF" stroke-width="6"/><ellipse cx="650" cy="1040" rx="1050" ry="520" fill="none" stroke="#BDE9F5" stroke-width="2" opacity=".6"/>
    <path id="${id}Pth" d="M200 540 C 220 400, 260 260, 470 150 C 640 66, 900 60, 1180 78" stroke="#fff" stroke-width="9" fill="none" stroke-dasharray="22 14" stroke-linecap="round"/>
    ${[[200, 540, 0, "T+0 · STRAIGHT UP"], [262, 330, 24, "LEANS OVER, GENTLY"], [520, 130, 62, "MORE & MORE SIDEWAYS"], [1010, 62, 88, "NOW IT'S ALL SIDEWAYS"]].map(([x, y, a, t], i) => `<g transform="translate(${x} ${y}) rotate(${a})"><g transform="translate(-20 -80) scale(.2)">${strip(R.rocket({ w: 200, id: id + "r" + i, flameOn: i < 3, flameLen: 110 }))}</g></g>${chip(Math.min(x + 40, 1020), y + (i === 3 ? 40 : -4), t, [RED, "#F5A524", "#3E7BFA", "#22B573"][i], { fs: 17 })}`).join("")}
    ${chip(40, 40, "TO REACH ORBIT: GO SIDEWAYS, NOT JUST UP", INK, { fs: 22, tc: YEL })}${chip(40, 640, "THE GRAVITY TURN", "#7B61FF", { fs: 22 })}`);

  // ---------------------------------------------------------------- Newton's cannon: orbit = falling and missing the Earth
  // ids: ${id}Ball (ball group), classes .tr (trajectories)
  R.cannon = ({ w = 1000, id = "nc" } = {}) => svg("0 0 1300 760", w, w * 0.585, `<defs>${lin(id + "A", [[0, "#02030A"], [1, "#0B2A6B"]])}${rad(id + "E", [[0, "#58B0FF"], [0.6, "#1F6FD0"], [1, "#0F3F8A"]], 0.4, 0.3, 0.8)}</defs>
    <rect width="1300" height="760" rx="26" fill="url(#${id}A)"/>${stars(90, 1300, 760, 9)}
    <circle cx="650" cy="1100" r="900" fill="url(#${id}E)" stroke="#8FD0FF" stroke-width="5"/><circle cx="650" cy="1100" r="1000" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="12 14" opacity=".7"/>
    <path d="M620 210 L 650 150 L 690 192 L 720 170 L 740 230 Z" fill="#9AA3B4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M650 150 L 664 170 L 646 180 Z" fill="#fff"/>
    <g transform="translate(722 150) rotate(-14)"><rect width="74" height="30" rx="10" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/><circle cx="6" cy="15" r="16" fill="#22252E" stroke="${INK}" stroke-width="3"/></g>
    <path class="tr" d="M800 136 C 860 120, 920 160, 980 260" stroke="#FFC93D" stroke-width="7" fill="none" stroke-dasharray="14 12" stroke-linecap="round"/>
    <path class="tr" d="M800 136 C 980 100, 1140 190, 1230 360" stroke="#FF8A2A" stroke-width="7" fill="none" stroke-dasharray="14 12" stroke-linecap="round"/>
    <path class="tr" id="${id}Orb" d="M800 136 C 1250 100, 1500 700, 650 1100" stroke="#fff" stroke-width="0" fill="none"/>
    <circle cx="650" cy="1100" r="1010" fill="none" stroke="#22D07A" stroke-width="8" stroke-dasharray="26 16" opacity=".9"/>
    <g id="${id}Ball"><circle cx="1100" cy="260" r="16" fill="#E9ECF2" stroke="${INK}" stroke-width="4"/></g>
    ${chip(980, 270, "TOO SLOW → LANDS", "#F5A524", { fs: 17 })}${chip(1040, 380, "FASTER → LANDS FARTHER", RED, { fs: 17 })}${chip(60, 400, "28,000 KM/H → KEEPS FALLING… AND MISSING", "#22B573", { fs: 20 })}${chip(60, 40, "NEWTON'S CANNONBALL", INK, { fs: 26, tc: YEL })}`);

  // ---------------------------------------------------------------- orbit speed + lap clock + sunrise counter
  // ids: ${id}N (needle), ${id}H (clock hand)
  R.orbitStats = ({ w = 900, id = "os" } = {}) => svg("0 0 1100 520", w, w * 0.473, `${bg(0, 0, 1100, 520, "#16204A", "#0E1530", id + "Bg", 26)}
    <g transform="translate(60 40)"><circle cx="200" cy="200" r="190" fill="#0B0F20" stroke="#5C677E" stroke-width="8"/>${Array.from({ length: 29 }, (_, i) => { const v = i * 1000, a = 210 - (240 * v) / 28000, x0 = 200 + 172 * Math.cos((a * Math.PI) / 180), y0 = 200 - 172 * Math.sin((a * Math.PI) / 180), x1 = 200 + (i % 4 ? 156 : 146) * Math.cos((a * Math.PI) / 180), y1 = 200 - (i % 4 ? 156 : 146) * Math.sin((a * Math.PI) / 180); return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#C9D0DC" stroke-width="${i % 4 ? 3 : 5}"/>`; }).join("")}
      <path d="M200 200 L 200 52" id="${id}N" stroke="${RED}" stroke-width="10" stroke-linecap="round" transform="rotate(118 200 200)"/><circle cx="200" cy="200" r="16" fill="#fff" stroke="${INK}" stroke-width="4"/>
      ${T(200, 300, "28,000", { fs: 50, c: "#fff", f: "Archivo", w: 900 })}${T(200, 336, "KM/H", { fs: 24, c: "#8FA0D6" })}${T(200, 128, "ORBIT SPEED", { fs: 20, c: "#8FA0D6" })}</g>
    <g transform="translate(520 40)"><rect width="500" height="220" rx="24" fill="#1E2A55" stroke="#5C677E" stroke-width="5"/><circle cx="120" cy="110" r="84" fill="#fff" stroke="${INK}" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => `<line x1="${120 + 70 * Math.sin((i * Math.PI) / 6)}" y1="${110 - 70 * Math.cos((i * Math.PI) / 6)}" x2="${120 + 80 * Math.sin((i * Math.PI) / 6)}" y2="${110 - 80 * Math.cos((i * Math.PI) / 6)}" stroke="${INK}" stroke-width="4"/>`).join("")}<line id="${id}H" x1="120" y1="110" x2="120" y2="48" stroke="${RED}" stroke-width="8" stroke-linecap="round"/><circle cx="120" cy="110" r="8" fill="${INK}"/>
      ${T(300, 80, "ONE LAP", { fs: 22, c: "#8FA0D6", a: "start" })}${T(300, 150, "90", { fs: 80, c: "#fff", f: "Archivo", w: 900, a: "start" })}${T(300, 190, "MINUTES", { fs: 22, c: "#8FA0D6", a: "start" })}</g>
    <g transform="translate(520 290)"><rect width="500" height="190" rx="24" fill="#FFF1C9" stroke="${INK}" stroke-width="5"/>${T(30, 56, "SUNRISES PER DAY", { fs: 22, a: "start" })}${Array.from({ length: 16 }, (_, i) => `<text x="${30 + (i % 8) * 56}" y="${112 + Math.floor(i / 8) * 54}" font-size="44">🌅</text>`).join("")}${T(470, 56, "×16", { fs: 34, a: "end", c: RED, f: "Archivo", w: 900 })}</g>`);

  // ---------------------------------------------------------------- astronaut (helmet, suit) floating with a pickle jar
  // ids: ${id}Ast (astronaut group), ${id}Jar
  R.astronaut = ({ w = 360, id = "as" } = {}) => svg("0 0 360 480", w, w * 1.333, `<defs>${rad(id + "V", [[0, "#2B4B8A"], [1, "#0E1A3A"]], 0.35, 0.3, 0.8)}${lin(id + "S", [[0, "#FFFFFF"], [1, "#C9D0DC"]], 1, 0)}</defs>
    <g id="${id}Ast"><path d="M110 250 Q 80 330 130 410 L 160 400 L 150 330 Z M250 250 Q 280 320 230 400 L 200 390 L 214 330 Z" fill="url(#${id}S)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M130 190 Q 130 160 180 160 Q 230 160 230 190 L 240 330 Q 180 350 120 330 Z" fill="url(#${id}S)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="150" y="214" width="60" height="44" rx="10" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="166" cy="236" r="7" fill="${RED}"/><circle cx="190" cy="236" r="7" fill="${TEAL}"/>
      <path d="M120 200 Q 70 230 70 290 M240 200 Q 290 220 300 160" stroke="#fff" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M120 200 Q 70 230 70 290 M240 200 Q 290 220 300 160" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>
      <circle cx="180" cy="110" r="64" fill="url(#${id}S)" stroke="${INK}" stroke-width="6"/><ellipse cx="180" cy="112" rx="46" ry="40" fill="url(#${id}V)" stroke="${INK}" stroke-width="4"/><ellipse cx="164" cy="98" rx="14" ry="9" fill="#fff" opacity=".5"/><circle cx="178" cy="122" r="12" fill="#C98B5E" opacity=".85"/>
      <path d="M130 345 Q 100 420 120 450 M230 345 Q 260 420 240 450" stroke="#fff" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M130 345 Q 100 420 120 450 M230 345 Q 260 420 240 450" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/></g>
    <g id="${id}Jar" transform="translate(300 40) rotate(14)"><rect x="-26" y="-20" width="52" height="70" rx="14" fill="#E8A317" stroke="${INK}" stroke-width="4"/><rect x="-30" y="-34" width="60" height="18" rx="6" fill="#C8361F" stroke="${INK}" stroke-width="4"/><rect x="-18" y="2" width="36" height="28" rx="6" fill="#FFF1C9"/>${T(0, 22, "ACHAAR", { fs: 10 })}</g>
    <g transform="translate(40 60)"><path d="M0 0 l12 -12 M0 -12 l12 12" stroke="#fff" stroke-width="3"/></g>`);

  // ---------------------------------------------------------------- weightless = free fall: elevator panel
  // ids: ${id}Ast (astronaut), ${id}Pen
  R.freefall = ({ w = 800, id = "ff" } = {}) => svg("0 0 1000 560", w, w * 0.56, `${bg(0, 0, 1000, 560, "#EDE6FF", "#FFFFFF", id + "Bg", 26)}
    <g transform="translate(40 40)"><rect width="360" height="440" rx="20" fill="#fff" stroke="${INK}" stroke-width="6"/><rect x="20" y="20" width="320" height="400" rx="10" fill="#EAF3FB" stroke="${INK}" stroke-width="3"/>
      <g transform="translate(140 140) scale(.36)">${strip(R.astronaut({ w: 360, id: id + "q" }))}</g><path d="M170 20 L 170 -30" stroke="${INK}" stroke-width="6"/>
      <g transform="translate(180 -50)"><path d="M0 0 l-14 -24 l28 0 Z" fill="${RED}" stroke="${INK}" stroke-width="3"/></g></g>
    ${arrow3(220, 500, 220, 540, RED, 22).replace(/.*/s, "")}
    <g transform="translate(470 60)">${chip(0, 0, "CABLE CUT. FALLING TOGETHER.", RED, { fs: 22 })}
      <g transform="translate(0 110)"><circle cx="150" cy="150" r="130" fill="#58B0FF" stroke="${INK}" stroke-width="6"/><path d="M60 110 Q 100 80 140 120 Q 160 170 110 190 Q 70 170 60 110 Z" fill="#6FA84B"/><path d="M180 200 Q 230 180 250 230 Q 220 270 170 250 Z" fill="#6FA84B"/>
        <ellipse cx="150" cy="150" rx="230" ry="80" fill="none" stroke="#22D07A" stroke-width="6" stroke-dasharray="14 12" transform="rotate(-20 150 150)"/><g transform="translate(320 70)"><rect width="46" height="22" rx="5" fill="#E9ECF2" stroke="${INK}" stroke-width="3"/><rect x="-26" y="2" width="22" height="18" fill="#3E7BFA" stroke="${INK}" stroke-width="2"/><rect x="50" y="2" width="22" height="18" fill="#3E7BFA" stroke="${INK}" stroke-width="2"/></g></g>
      ${chip(0, 410, "GRAVITY IS STILL THERE. NOTHING HOLDS YOU UP.", INK, { fs: 18, tc: YEL })}</g>`);

  // ---------------------------------------------------------------- re-entry: capsule cross-section with heat shield, plasma, temperatures
  // ids: ${id}Plasma (glow group), ${id}Shield
  R.reentry = ({ w = 900, id = "rn" } = {}) => svg("0 0 1100 640", w, w * 0.582, `<defs>${lin(id + "A", [[0, "#02030A"], [1, "#0B2A6B"]])}${lin(id + "P", [[0, "#FFF3C4", 0.95], [0.4, "#FF8A2A", 0.85], [1, "#F2553D", 0]], 1, 0)}${lin(id + "H", [[0, "#7A4A2E"], [1, "#3A2A22"]])}</defs>
    <rect width="1100" height="640" rx="26" fill="url(#${id}A)"/>${stars(60, 1100, 640, 12)}
    <g id="${id}Plasma"><path d="M410 160 Q 270 320 410 480 Q 250 320 410 160 Z" fill="url(#${id}P)" opacity="0"/><path d="M420 120 Q 640 320 420 520 L 900 560 L 900 80 Z" fill="url(#${id}P)" transform="scale(-1 1) translate(-1100 0)" opacity="0"/>
      <path d="M470 150 Q 250 320 470 490" stroke="${ORG}" stroke-width="40" fill="none" opacity=".35"/><path d="M470 190 Q 300 320 470 450" stroke="${YEL}" stroke-width="22" fill="none" opacity=".55"/><path d="M470 240 Q 360 320 470 400" stroke="#fff" stroke-width="10" fill="none" opacity=".8"/>
      <path d="M600 190 L 1060 90 M600 260 L 1060 220 M600 320 L 1060 320 M600 380 L 1060 420 M600 450 L 1060 550" stroke="${ORG}" stroke-width="14" stroke-linecap="round" stroke-dasharray="40 24" opacity=".6"/></g>
    <g transform="translate(470 320)"><path d="M0 -160 Q -30 -90 -30 0 Q -30 90 0 160 L 120 110 L 120 -110 Z" fill="#EEF2F8" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path id="${id}Shield" d="M0 -160 Q -30 -90 -30 0 Q -30 90 0 160 L 12 150 Q -10 86 -10 0 Q -10 -86 12 -150 Z" fill="url(#${id}H)" stroke="${INK}" stroke-width="5"/>
      <rect x="40" y="-60" width="64" height="120" rx="14" fill="#C8E1F5" stroke="${INK}" stroke-width="4"/><g transform="translate(72 -2) scale(.3)">${strip(R.astronaut({ w: 360, id: id + "q" }))}</g></g>
    ${chip(40, 40, "RE-ENTRY · AIR GETS SQUASHED, SO IT GLOWS", INK, { fs: 22, tc: YEL })}${chip(40, 560, "NOT FRICTION → COMPRESSION", RED, { fs: 22 })}
    ${chip(560, 560, "≈ 1,500 °C", ORG, { fs: 34 })}${chip(700, 40, "HEAT SHIELD BURNS AWAY ON PURPOSE", "#7A4A2E", { fs: 18 })}${chip(100, 330, "PLASMA", RED, { fs: 22 })}`);

  // ---------------------------------------------------------------- parachute sequence: drogue → main → splashdown
  // ids: ${id}Cp (capsule groups)
  R.splash = ({ w = 900, id = "sp" } = {}) => svg("0 0 1100 640", w, w * 0.582, `<defs>${lin(id + "S", [[0, "#7FC4F2"], [0.7, "#DDF0FB"], [0.7, "#2F7FD8"], [1, "#1B5FB8"]])}</defs>
    <rect width="1100" height="640" rx="26" fill="url(#${id}S)"/>${cloud(200, 120, 1)}${cloud(860, 90, 1.2)}
    ${[["1 · SMALL PARACHUTES", 90, 120, 0.7, "#F5A524"], ["2 · BIG PARACHUTES", 400, 160, 1, "#22B573"], ["3 · SPLASH", 760, 360, 0, "#3E7BFA"]].map(([t, x, y, k, c], i) => `<g transform="translate(${x} ${y})">${i < 2 ? `<g><path d="M${-20 - 60 * (i + k * 0.4)} 80 A ${70 + 70 * i} ${60 + 60 * i} 0 0 1 ${160 + 60 * (i + k * 0.4)} 80 Z" fill="#fff" stroke="${INK}" stroke-width="5" transform="translate(0 ${-40 - 40 * i})"/><path d="M${-20 - 60 * (i + k * 0.4)} ${40 - 40 * i} L 70 ${230 - 30 * i} M${160 + 60 * (i + k * 0.4)} ${40 - 40 * i} L 70 ${230 - 30 * i}" stroke="${INK}" stroke-width="3"/></g>` : ""}<g transform="translate(${i < 2 ? 36 : 20} ${i < 2 ? 220 - 30 * i : 20})"><path d="M0 0 Q -4 40 22 70 L 100 70 Q 126 40 122 0 Z" fill="#EEF2F8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><rect x="16" y="64" width="90" height="12" rx="4" fill="#3A2A22"/><circle cx="60" cy="30" r="8" fill="#14203F"/></g></g>${chip(x - 10, i === 2 ? 540 : 30, t, c, { fs: 17 })}`).join("")}
    <g transform="translate(700 410)"><path d="M0 40 Q 60 20 120 40 T 240 40" stroke="#fff" stroke-width="6" fill="none" opacity=".7"/><ellipse cx="120" cy="64" rx="120" ry="10" fill="#fff" opacity=".4"/></g>
    <g transform="translate(900 310)"><rect width="150" height="44" rx="10" fill="${RED}" stroke="${INK}" stroke-width="4"/><rect x="80" y="-24" width="46" height="26" fill="#fff" stroke="${INK}" stroke-width="3"/></g>`);

  // ---------------------------------------------------------------- mission control room (big illustration)
  // ids: ${id}Btn (the red button), ${id}Clk (wall clock text), ${id}Wall (wall screen), ${id}Chai (steam)
  R.mission = ({ w = 1200, id = "mc" } = {}) => svg("0 0 1400 700", w, w * 0.5, `<defs>${lin(id + "W", [[0, "#2B3A70"], [1, "#1B2340"]])}${lin(id + "F", [[0, "#3B4468"], [1, "#232B4A"]])}${lin(id + "D", [[0, "#5C677E"], [1, "#3E4A6A"]])}</defs>
    <rect width="1400" height="700" rx="26" fill="url(#${id}W)"/><rect y="520" width="1400" height="180" fill="url(#${id}F)"/>
    <g id="${id}Wall"><rect x="170" y="40" width="1060" height="300" rx="20" fill="#0B0F20" stroke="#5C677E" stroke-width="8"/>
      <path d="M200 280 Q 400 120 600 180 T 1000 90" stroke="#22D07A" stroke-width="5" fill="none" stroke-dasharray="12 10"/><circle cx="620" cy="190" r="12" fill="${YEL}"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${220 + i * 110}" y="62" width="86" height="8" rx="4" fill="${["#22D07A", "#FFC93D", "#3E7BFA"][i % 3]}" opacity=".8"/>`).join("")}
      <g transform="translate(940 130)"><rect width="260" height="180" rx="14" fill="#16204A" stroke="#5C677E" stroke-width="4"/><circle cx="130" cy="96" r="62" fill="#2D7BE0"/><path d="M92 80 Q 120 60 140 90 Q 120 124 96 110 Z" fill="#6FA84B"/><ellipse cx="130" cy="96" rx="104" ry="30" fill="none" stroke="#22D07A" stroke-width="3" transform="rotate(-18 130 96)"/></g>
      <text id="${id}Clk" x="260" y="150" font-family="JetBrains Mono" font-weight="800" font-size="80" fill="${YEL}">T-00:10</text><text x="262" y="196" font-family="JetBrains Mono" font-weight="800" font-size="22" fill="#8FA0D6">ALL SYSTEMS GO</text>
      ${[0, 1, 2].map((i) => `<g transform="translate(${230 + i * 190} 258)"><rect width="170" height="64" rx="10" fill="#16204A"/><text x="85" y="42" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="${["#22D07A", "#22D07A", "#FFC93D"][i]}">${["FUEL ✓", "ENGINES ✓", "WIND ~"][i]}</text></g>`).join("")}</g>
    ${[[60, 400], [1060, 400]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M0 120 L 280 120 L 250 40 L 30 40 Z" fill="url(#${id}D)" stroke="${INK}" stroke-width="5"/>${box(40, 10, 0, 200, 52, 20, "#14203F")}<rect x="56" y="22" width="168" height="34" rx="6" fill="#16204A"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${64 + i * 20}" y="${32 + (i % 3) * 5}" width="12" height="${14 - (i % 3) * 4}" fill="#22D07A"/>`).join("")}</g>`).join("")}
    <g transform="translate(430 440)"><path d="M0 170 L 540 170 L 500 40 L 40 40 Z" fill="url(#${id}D)" stroke="${INK}" stroke-width="6"/><path d="M40 40 L 500 40" stroke="#8A93AB" stroke-width="8"/>
      <g transform="translate(270 12)"><ellipse cx="0" cy="52" rx="62" ry="16" fill="#8E1B10" stroke="${INK}" stroke-width="4"/><g id="${id}Btn"><path d="M-54 50 Q -54 -4 0 -4 Q 54 -4 54 50 Z" fill="${RED}" stroke="${INK}" stroke-width="5"/><ellipse cx="-16" cy="16" rx="16" ry="9" fill="#fff" opacity=".5"/></g></g>
      <g transform="translate(60 78)"><rect width="46" height="54" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="46" y="12" width="14" height="26" rx="7" fill="none" stroke="${INK}" stroke-width="4"/><rect x="4" y="22" width="38" height="28" fill="#C98B5E"/>${T(23, 14, "CHAI", { fs: 11 })}<path id="${id}Chai" d="M12 -6 q 8 -12 0 -24 t 0 -24 M30 -6 q 8 -12 0 -24 t 0 -24" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></g></g>
    <g transform="translate(236 340)"><circle cx="130" cy="130" r="0"/></g>
    <g transform="translate(395 330)"><path d="M0 120 Q 0 60 70 60 Q 140 60 140 120 L 140 190 L 0 190 Z" fill="#3E7BFA" stroke="${INK}" stroke-width="5"/><circle cx="70" cy="30" r="40" fill="#C98B5E" stroke="${INK}" stroke-width="4"/><path d="M28 18 Q 30 -14 70 -14 Q 110 -14 112 18 Q 90 4 70 6 Q 50 4 28 18 Z" fill="#B9BFCC"/><path d="M44 26 Q 52 22 60 26 M80 26 Q 88 22 96 26" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M52 52 Q 70 60 88 52" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 40 Q 40 60 56 66" stroke="#2B2118" stroke-width="0"/><ellipse cx="44" cy="44" rx="10" ry="6" fill="#7A6A8A" opacity=".5"/><ellipse cx="96" cy="44" rx="10" ry="6" fill="#7A6A8A" opacity=".5"/></g>
    ${chip(40, 640, "MISSION CONTROL · NO PRESSURE", INK, { fs: 20, tc: YEL })}${chip(1010, 640, "TIRED FLIGHT DIRECTOR ☕", RED, { fs: 20 })}`);

  // ---------------------------------------------------------------- first-stage landing: coming down on its tail, legs out, onto a ship / pad
  // ids: ${id}Bst (booster group), ${id}Fl
  R.landing = ({ w = 700, id = "ld" } = {}) => svg("0 0 700 760", w, w * 1.086, `<defs>${lin(id + "S", [[0, "#4F9BE8"], [1, "#DDF0FB"]])}${lin(id + "O", [[0, "#1B5FB8"], [1, "#0F3F8A"]])}</defs>
    <rect width="700" height="760" rx="26" fill="url(#${id}S)"/>${cloud(120, 110, 1)}${cloud(560, 190, 0.8)}
    <rect y="620" width="700" height="140" fill="url(#${id}O)"/><path d="M0 660 Q 90 640 180 660 T 360 660 T 540 660 T 720 660" stroke="#fff" stroke-width="5" fill="none" opacity=".5"/>
    <g transform="translate(170 590)"><rect width="360" height="46" rx="10" fill="#5C677E" stroke="${INK}" stroke-width="5"/><rect x="20" y="-26" width="320" height="26" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/>${T(180, 32, "BARGE · X", { fs: 22, c: "#fff" })}<circle cx="180" cy="-13" r="9" fill="${YEL}"/></g>
    <g id="${id}Bst" transform="translate(238 30) scale(.62)">${strip(R.rocket({ w: 200, id: id + "b", s2: false, fairing: false, flameOn: true, flameLen: 150, legs: true }))}</g>
    ${chip(30, 40, "LEGS OUT · ENGINE RELIT", INK, { fs: 20, tc: YEL })}${chip(30, 120, "TAIL FIRST ↓", "#22B573", { fs: 20 })}${chip(400, 540, "LAND ON A BOAT", TEAL, { fs: 20 })}`);

  // ---------------------------------------------------------------- the host + the flight director characters are drawn in HTML scenes; these are the chrome pieces
  R.PHASES = ["Countdown", "Liftoff", "Staging", "Orbit", "Return"];
  R.patch = (n, { w = 150 } = {}) => `<div style="width:${w}px;height:${w}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2F4A9E,#16204A);border:5px solid ${YEL};box-shadow:0 0 0 4px ${INK},0 8px 0 4px ${INK};position:relative;font-family:'JetBrains Mono';font-weight:800;color:#fff;text-align:center;overflow:hidden"><div style="position:absolute;left:0;right:0;top:${w * 0.1}px;font-size:${w * 0.1}px;letter-spacing:.14em;color:${YEL}">HX LAUNCH</div><div style="position:absolute;left:${w * 0.3}px;top:${w * 0.24}px;width:${w * 0.4}px;height:${w * 0.5}px">${R.rocket({ w: w * 0.4, id: "pt" + n, flameOn: true, flameLen: 70, s1: true })}</div><div style="position:absolute;left:0;right:0;bottom:${w * 0.07}px;font-size:${w * 0.09}px;color:#7CFFB2">PHASE ${n}/5</div></div>`;
  R.clock = ({ t = "T-00:10", w = 360, label = "MISSION CLOCK" } = {}) => `<div style="width:${w}px;padding:12px 18px;border-radius:20px;background:#0E1530;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};font-family:'JetBrains Mono';font-weight:800"><div style="font-size:${w * 0.045}px;color:#8FA0D6;letter-spacing:.16em">${label}</div><div class="ck" style="font-size:${w * 0.19}px;color:${YEL};line-height:1.1">${t}</div></div>`;
  R.telem = ({ alt = "0 km", spd = "0 km/h", g = "1.0 g", w = 640 } = {}) => `<div style="width:${w}px;display:flex;gap:10px;padding:12px;border-radius:20px;background:#0E1530;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};font-family:'JetBrains Mono';font-weight:800">${[["ALT", alt, "#22D07A"], ["SPEED", spd, YEL], ["G-FORCE", g, "#FF8A8A"]].map(([k, v, c]) => `<div style="flex:1;background:#151E3E;border-radius:12px;padding:8px 12px"><div style="font-size:13px;color:#8FA0D6;letter-spacing:.12em">${k}</div><div class="fv" style="font-size:26px;color:${c}">${v}</div></div>`).join("")}</div>`;
  R.tbar = ({ n = 1, w = 520 } = {}) => `<div style="width:${w}px;display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:18px;background:#fff;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};font-family:'JetBrains Mono';font-weight:800;color:${INK}">${R.PHASES.map((p, i) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:3px solid ${INK};background:${i + 1 < n ? "#22B573" : i + 1 === n ? YEL : "#fff"};color:${i + 1 < n ? "#fff" : INK};font-size:16px">${i + 1 < n ? "✓" : i + 1}</span>${i < 4 ? `<span style="flex:1;height:4px;background:${i + 1 < n ? "#22B573" : "#D7DCE8"};border-radius:2px"></span>` : ""}`).join("")}</div>`;
  R.director = ({ w = 280, id = "fd" } = {}) => svg("0 0 280 480", w, w * 1.714, `${shadow(140, 470, 90, 9, 0.2)}
    <rect x="86" y="330" width="44" height="130" rx="14" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/><rect x="150" y="330" width="44" height="130" rx="14" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/>
    <path d="M60 340 Q 50 210 140 196 Q 230 210 220 340 Q 140 366 60 340 Z" fill="#FFF" stroke="${INK}" stroke-width="5"/><path d="M140 200 L 124 250 L 140 340 L 156 250 Z" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <g id="${id}Head"><circle cx="140" cy="130" r="58" fill="#C98B5E" stroke="${INK}" stroke-width="4"/><path d="M84 112 Q 90 64 140 64 Q 190 64 196 112 Q 172 90 140 92 Q 108 90 84 112 Z" fill="#B9BFCC"/><path d="M104 122 Q 118 112 132 122 M148 122 Q 162 112 176 122" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="118" cy="140" rx="16" ry="9" fill="#7A6A8A" opacity=".5"/><ellipse cx="162" cy="140" rx="16" ry="9" fill="#7A6A8A" opacity=".5"/><path d="M116 164 Q 140 174 164 164" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M88 108 q-14 20 0 42" stroke="#B9BFCC" stroke-width="0"/></g>
    <g id="${id}Arm"><path d="M214 230 Q 262 250 250 300" stroke="#FFF" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M214 230 Q 262 250 250 300" stroke="${INK}" stroke-width="4" fill="none" opacity=".4"/><g transform="translate(222 292)"><rect width="42" height="50" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="42" y="10" width="13" height="24" rx="6" fill="none" stroke="${INK}" stroke-width="4"/><rect x="4" y="18" width="34" height="28" fill="#C98B5E"/></g></g>
    <path d="M66 240 Q 30 290 56 330" stroke="#FFF" stroke-width="30" fill="none" stroke-linecap="round"/>`);

  window.ROCKET = R;
})();
