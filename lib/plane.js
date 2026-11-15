// plane.js — picture-style (3D-looking 2D) diagrams + characters for the "how a plane flies" explainer. Load after iso.js.
// Every builder returns an SVG/HTML string; animated parts carry ids/classes noted per builder.
(function () {
  const { box, cyl, shadow, extrude, shade } = ISO;
  const INK = "#1B2340", TEAL = "#12A4C4", RED = "#F2553D", SKY = "#BDE9F5";
  const svg = (vb, w, h, s) => `<svg viewBox="${vb}" width="${w}" height="${h}" style="overflow:visible">${s}</svg>`;
  const strip = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const arrow = (x1, y1, x2, y2, c, w = 14, label = "", lx = 0, ly = 0, id = "") => { const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(a) * 34, hy = y2 - Math.sin(a) * 34; return `<g ${id ? `id="${id}"` : ""}><path d="M${x1} ${y1} L${hx} ${hy}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2} ${y2} L${hx + Math.cos(a + 1.57) * 22} ${hy + Math.sin(a + 1.57) * 22} L${hx - Math.cos(a + 1.57) * 22} ${hy - Math.sin(a + 1.57) * 22} Z" fill="${c}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>${label ? `<g transform="translate(${lx} ${ly})"><rect x="-6" y="-30" width="${label.length * 19 + 22}" height="44" rx="12" fill="${c}" stroke="${INK}" stroke-width="3"/><text x="${label.length * 9.5 + 5}" y="0" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="#fff">${label}</text></g>` : ""}</g>`; };
  const P = {};

  // ---------------------------------------------------------------- shared helpers (gradients, chips, chunky arrows, clouds)
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
  const cloud = (x, y, s = 1, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="10" rx="72" ry="15" fill="#C9DCEC"/><circle cx="-36" cy="-2" r="26" fill="#fff"/><circle cx="2" cy="-18" r="34" fill="#fff"/><circle cx="38" cy="0" r="24" fill="#fff"/><rect x="-62" y="-4" width="124" height="16" rx="8" fill="#fff"/><circle cx="-6" cy="-26" r="14" fill="#fff" opacity=".9"/></g>`;
  const bg = (x, y, w, h, c1, c2, id, rx = 30) => `<defs>${lin(id, [[0, c1], [1, c2]])}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id})"/>`;

  // ---------------------------------------------------------------- side-view airliner (shaded picture style), nose to the right. 1000 x 300 units
  // ids: ${id}Gear (landing gear group), ${id}Fan (fan face), ${id}Flap
  P.side = ({ w = 900, id = "ps", gear = true } = {}) => svg("0 0 1000 300", w, w * 0.3, `
    <defs>${lin(id + "B", [[0, "#FFFFFF"], [0.3, "#F6F8FB"], [0.6, "#E2E7EE"], [0.61, "#CDD4DF"], [1, "#A3AEC0"]])}${lin(id + "E", [[0, "#FFFFFF"], [0.5, "#E3E8EF"], [1, "#A9B3C4"]])}${lin(id + "W", [[0, "#D5DBE5"], [1, "#8E98AC"]])}${lin(id + "T", [[0, "#36C6E2"], [1, "#0D7C96"]])}</defs>
    ${shadow(500, 292, 420, 10, 0.18)}
    <path d="M70 70 L 130 18 Q 140 8 156 10 L 196 12 L 226 112 L 120 116 Z" fill="url(#${id}T)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M118 112 Q 150 70 190 40 L 214 96 Z" fill="${RED}"/><circle cx="168" cy="56" r="14" fill="#fff"/><path d="M161 56 L 175 56 M168 51 L 172 56 L 168 61" stroke="${TEAL}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M136 22 L 150 14" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>
    <path d="M30 150 Q 34 116 90 112 L 840 108 Q 930 110 968 150 Q 980 170 960 180 Q 930 196 840 196 L 150 196 Q 70 190 30 150 Z" fill="url(#${id}B)" stroke="${INK}" stroke-width="4"/>
    <path d="M110 121 L 840 117 Q 900 119 928 132" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>
    <path d="M60 160 L 940 158" stroke="${TEAL}" stroke-width="6"/><path d="M70 168 L 930 166" stroke="${RED}" stroke-width="3"/>
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${250 + i * 20}" y="128" width="9" height="13" rx="4" fill="${INK}"/><rect x="${251.5 + i * 20}" y="130" width="3" height="5" rx="1.5" fill="#8FC8F0"/>`).join("")}
    <rect x="215" y="122" width="16" height="44" rx="4" fill="none" stroke="#9AA3B4" stroke-width="3"/><rect x="852" y="122" width="16" height="44" rx="4" fill="none" stroke="#9AA3B4" stroke-width="3"/>
    <path d="M898 128 L 920 127 L 923 140 L 901 141 Z M927 127 L 938 129 Q 948 133 952 142 L 930 140 Z" fill="${INK}"/><path d="M902 131 L 914 130" stroke="#8FC8F0" stroke-width="2"/>
    <path d="M20 152 L 50 140 L 130 146 L 46 160 Z" fill="url(#${id}W)" stroke="${INK}" stroke-width="3"/><path d="M26 158 L 34 152" stroke="#5C677E" stroke-width="5" stroke-linecap="round"/>
    <path d="M410 195 Q 520 214 650 195" fill="#C3CAD6" stroke="${INK}" stroke-width="3"/>
    <path d="M430 178 L 700 168 L 720 182 L 470 194 Z" fill="url(#${id}W)" stroke="${INK}" stroke-width="3"/><g id="${id}Flap"><path d="M440 186 L 480 184 L 470 196 L 436 198 Z" fill="#9AA3B4" stroke="${INK}" stroke-width="2"/></g>
    <g><path d="M572 196 L 640 196 L 628 212 L 584 212 Z" fill="#C9D0DC" stroke="${INK}" stroke-width="3"/>
      <path d="M520 206 Q 516 232 540 244 L 664 244 Q 690 238 692 222 Q 690 204 664 200 L 540 200 Q 524 200 520 206 Z" fill="url(#${id}E)" stroke="${INK}" stroke-width="4"/>
      <path d="M600 201 L 640 201 L 640 243 L 600 243 Z" fill="${TEAL}" opacity=".9"/><path d="M546 207 L 660 207" stroke="#fff" stroke-width="4" opacity=".85" stroke-linecap="round"/>
      <ellipse cx="688" cy="222" rx="7" ry="20" fill="#C9D0DC" stroke="${INK}" stroke-width="3"/><ellipse id="${id}Fan" cx="688" cy="222" rx="4" ry="15" fill="${INK}"/>
      <path d="M520 210 L 502 214 L 498 223 L 502 232 L 522 236 Z" fill="#5C677E" stroke="${INK}" stroke-width="2.5"/></g>
    ${gear ? `<g id="${id}Gear"><path d="M880 196 L 880 246" stroke="#9AA3B4" stroke-width="8"/><circle cx="880" cy="258" r="14" fill="#1B1D24" stroke="${INK}" stroke-width="2"/><circle cx="880" cy="258" r="6" fill="#C9D0DC"/><path d="M500 196 L 500 244" stroke="#9AA3B4" stroke-width="10"/><path d="M476 246 L 524 246" stroke="#5C677E" stroke-width="6" stroke-linecap="round"/><circle cx="484" cy="262" r="19" fill="#1B1D24" stroke="${INK}" stroke-width="2"/><circle cx="516" cy="262" r="19" fill="#1B1D24" stroke="${INK}" stroke-width="2"/><circle cx="484" cy="262" r="8" fill="#C9D0DC"/><circle cx="516" cy="262" r="8" fill="#C9D0DC"/></g>` : ""}`);

  // ---------------------------------------------------------------- the four forces (sky panel, chunky 3D arrows). ids: ${id}L ${id}W ${id}T ${id}D
  P.forces = ({ w = 900, id = "fo" } = {}) => svg("-330 -230 1660 760", w, w * 0.4578, `${bg(-320, -222, 1640, 744, "#7EC2EE", "#DDF2FC", id + "Sk", 34)}${cloud(-200, 380, 1.2, 0.85)}${cloud(1200, -40, 1.0, 0.85)}${cloud(1190, 330, 0.9, 0.8)}${cloud(-230, -60, 0.8, 0.8)}
    ${cloud(150, -70, 1.0, 0.9)}${cloud(860, -150, 0.9, 0.85)}${cloud(330, 440, 1.3, 0.8)}${cloud(980, 400, 0.8, 0.8)}
    ${[214, 238, 262].map((yy, i) => `<path d="M${-96 + (i % 2) * 24} ${yy} L ${-20 + (i % 2) * 24} ${yy}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>`).join("")}
    <g>${strip(P.side({ w: 1000, id: id + "S", gear: false }))}</g>
    ${arrow3(560, 110, 560, -196, "#22B573", 34, id + "L")}${arrow3(560, 250, 560, 488, RED, 34, id + "W")}
    ${arrow3(985, 150, 1104, 150, "#3E7BFA", 30, id + "T")}${arrow3(32, 150, -96, 150, "#8A93AB", 30, id + "D")}
    ${chip(604, -200, "LIFT", "#22B573", { fs: 26 })}${chip(604, 420, "WEIGHT", RED, { fs: 26 })}${chip(900, 46, "THRUST", "#3E7BFA", { fs: 26 })}${chip(-92, 40, "DRAG", "#8A93AB", { fs: 26 })}
    ${chip(-92, -204, "LEVEL FLIGHT: LIFT = WEIGHT · THRUST = DRAG", INK, { fs: 19, tc: "#FFC93D" })}`);

  // ---------------------------------------------------------------- airfoil (3D wing slice) + pressure + streamlines + pushed-down air + lift
  // classes: .sl (streamlines — animate stroke-dashoffset), id ${id}Lift, ${id}Down
  P.airfoil = ({ w = 900, id = "af" } = {}) => {
    const foil = "M160 260 Q 200 180 360 168 Q 560 160 760 236 Q 780 246 760 250 Q 560 262 360 280 Q 200 296 160 260 Z";
    let sl = "";
    for (let k = 0; k < 7; k++) { const y = 60 + k * 50, above = y < 230, bend = above ? -40 + (y - 60) * 0.1 : 30; const tail = above ? `S 860 ${y + 90 + k * 8}, 1060 ${y + 150 + k * 10}` : `S 820 ${y + 60 + k * 6}, 980 ${y + 100 + k * 8}`; sl += `<path class="sl" d="M-40 ${y} C 200 ${y}, 300 ${y + bend}, 520 ${y + bend * 0.6 + (above ? 10 : 20)} ${tail}" stroke="${above ? "#3E7BFA" : "#12A4C4"}" stroke-width="7" fill="none" stroke-dasharray="${above ? "36 14" : "16 20"}" stroke-linecap="round" opacity=".85"/>`; }
    return svg("-60 -40 1140 600", w, w * 0.526, `<defs>${rad(id + "Lo", [[0, "#3E7BFA", 0.34], [1, "#3E7BFA", 0]])}${rad(id + "Hi", [[0, "#F5A524", 0.42], [1, "#F5A524", 0]])}${lin(id + "F", [[0, "#FFFFFF"], [0.45, "#E4E8EF"], [1, "#A9B3C4"]])}</defs>
      ${bg(-50, -30, 1120, 580, "#E3F3FD", "#FFFFFF", id + "Sk")}
      <ellipse cx="470" cy="130" rx="400" ry="110" fill="url(#${id}Lo)"/><ellipse cx="470" cy="335" rx="330" ry="80" fill="url(#${id}Hi)"/>
      ${sl}
      <g transform="rotate(8 460 230)">${extrude((ox, oy, f) => `<path d="${foil}" transform="translate(${ox} ${oy})" fill="${f}"/>`, 70, "#C9D0DC", `url(#${id}F)`, 12)}<path d="${foil}" fill="none" stroke="${INK}" stroke-width="6"/><path d="M205 232 Q 360 186 560 194" stroke="#fff" stroke-width="9" fill="none" opacity=".85" stroke-linecap="round"/></g>
      ${arrow3(470, 150, 470, -14, "#22B573", 30, id + "Lift")}${chip(512, -26, "LIFT", "#22B573", { fs: 24 })}
      <g id="${id}Down">${[0, 1, 2].map((i) => arrow3(880 + i * 66, 286 + i * 22, 906 + i * 66, 398 + i * 22, "#12A4C4", 16)).join("")}${chip(640, 506, "AIR PUSHED DOWN", "#12A4C4", { fs: 20 })}</g>
      ${chip(-40, -22, "LOW PRESSURE · FAST AIR", "#3E7BFA", { fs: 20 })}${chip(-40, 480, "HIGH PRESSURE · SLOW AIR", "#E8930C", { fs: 20 })}`);
  };

  // ---------------------------------------------------------------- turbofan cutaway (technical-sheet look)
  // ids: ${id}Fan (blade group — slide down 16 px for a seamless spin), ${id}Flame, classes .by (bypass flow) .co (core flow)
  P.engine = ({ w = 1000, id = "en" } = {}) => svg("0 -40 1300 700", w, w * 0.5385, `
    <defs>${lin(id + "N", [[0, "#FFFFFF"], [0.45, "#E3E8EF"], [1, "#A9B3C4"]])}${lin(id + "N2", [[0, "#A9B3C4"], [0.55, "#E3E8EF"], [1, "#FFFFFF"]])}${lin(id + "C", [[0, "#E9EDF3"], [0.3, "#FFFFFF"], [0.62, "#B9C2D2"], [1, "#7F8AA3"]])}${lin(id + "Cp", [[0, "#F2F5F9"], [0.5, "#9AA3B4"], [1, "#DDE3EC"]], 1, 0)}${lin(id + "Tb", [[0, "#FFE08A"], [0.5, "#E8A317"], [1, "#A86E06"]], 1, 0)}${lin(id + "Ex", [[0, "#6B7690"], [0.5, "#3E4A6A"], [1, "#262E48"]])}${rad(id + "Fl", [[0, "#FFF6C8"], [0.35, "#FFC93D"], [0.72, "#F2553D"], [1, "#F2553D", 0]])}${rad(id + "Pl", [[0, "#FF9A3D", 0.6], [1, "#FF9A3D", 0]], 0, 0.5, 1)}${rad(id + "Bp", [[0, "#7FB2FF", 0.45], [1, "#7FB2FF", 0]], 0, 0.5, 1)}
      <pattern id="${id}Gr" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="#C9D7EA" stroke-width="1.5"/></pattern>
      <clipPath id="${id}Byp"><path d="M150 124 L 1080 150 L 1080 270 L 880 230 L 380 210 L 300 200 L 300 400 L 380 390 L 880 370 L 1080 330 L 1080 450 L 150 476 Z"/></clipPath><clipPath id="${id}Cor"><path d="M380 214 L 880 234 L 1240 292 L 1240 308 L 880 366 L 380 386 Z"/></clipPath><clipPath id="${id}Fc"><ellipse cx="232" cy="300" rx="31" ry="174"/></clipPath></defs>
    ${bg(0, -40, 1300, 700, "#F4F8FD", "#E4EDF8", id + "Bg")}<rect x="0" y="-40" width="1300" height="700" rx="30" fill="url(#${id}Gr)" opacity=".7"/>
    ${shadow(650, 572, 600, 14, 0.2)}
    <ellipse cx="1150" cy="170" rx="160" ry="40" fill="url(#${id}Bp)"/><ellipse cx="1150" cy="430" rx="160" ry="40" fill="url(#${id}Bp)"/><ellipse cx="1240" cy="300" rx="150" ry="36" fill="url(#${id}Pl)"/>
    <rect x="150" y="120" width="930" height="360" fill="#DCEBF8"/>
    <g clip-path="url(#${id}Byp)">${Array.from({ length: 8 }, (_, i) => `<path class="by" d="M150 ${140 + (i % 4) * 16 + (i < 4 ? 0 : 252)} L 1100 ${140 + (i % 4) * 16 + (i < 4 ? 0 : 252)}" stroke="#3E7BFA" stroke-width="7" stroke-dasharray="30 26" opacity=".8"/>`).join("")}</g>
    <path d="M380 210 L 880 230 Q 980 250 1080 270 L 1080 330 Q 980 350 880 370 L 380 390 Z" fill="url(#${id}C)" stroke="${INK}" stroke-width="5"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${404 + i * 22}" y="${222 + i * 3}" width="12" height="${156 - i * 6}" rx="5" fill="url(#${id}Cp)" stroke="${INK}" stroke-width="1.5"/>`).join("")}
    <rect x="620" y="236" width="110" height="128" rx="24" fill="#2B3354" stroke="${INK}" stroke-width="3"/><g id="${id}Flame"><ellipse cx="675" cy="300" rx="62" ry="58" fill="url(#${id}Fl)"/><path d="M646 300 Q 676 244 706 300 Q 676 352 646 300 Z" fill="#FFC93D" opacity=".9"/><path d="M660 300 Q 676 272 692 300 Q 676 326 660 300 Z" fill="#FFF3C4"/></g>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${754 + i * 26}" y="${244 + i * 3}" width="12" height="${112 - i * 6}" rx="5" fill="url(#${id}Tb)" stroke="${INK}" stroke-width="1.5"/>`).join("")}
    <path d="M1080 270 L 1240 290 L 1240 310 L 1080 330 Z" fill="url(#${id}Ex)" stroke="${INK}" stroke-width="4"/>
    <g clip-path="url(#${id}Cor)">${Array.from({ length: 3 }, (_, i) => `<path class="co" d="M380 ${282 + i * 18} L 1260 ${282 + i * 18}" stroke="${RED}" stroke-width="6" stroke-dasharray="20 22" opacity=".8"/>`).join("")}</g>
    <path d="M120 70 Q 140 40 260 40 L 1000 70 Q 1060 80 1080 140 L 1080 160 L 1000 150 L 260 120 L 180 120 Q 150 120 150 150 Z" fill="url(#${id}N)" stroke="${INK}" stroke-width="5"/>
    <path d="M120 530 Q 140 560 260 560 L 1000 530 Q 1060 520 1080 460 L 1080 440 L 1000 450 L 260 480 L 180 480 Q 150 480 150 450 Z" fill="url(#${id}N2)" stroke="${INK}" stroke-width="5"/>
    <path d="M156 132 Q 162 124 182 124 L 260 124 L 1000 154 L 1076 160" stroke="#F3C98B" stroke-width="8" fill="none"/><path d="M156 468 Q 162 476 182 476 L 260 476 L 1000 446 L 1076 440" stroke="#F3C98B" stroke-width="8" fill="none"/>
    <path d="M200 56 L 980 80" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="M160 80 L 1000 96" stroke="${TEAL}" stroke-width="10" opacity=".9"/>
    <ellipse cx="232" cy="300" rx="34" ry="178" fill="#2B3354" stroke="${INK}" stroke-width="4"/>
    <g clip-path="url(#${id}Fc)"><g id="${id}Fan">${Array.from({ length: 27 }, (_, i) => { const y = 102 + i * 16; return `<path d="M204 ${y} Q 232 ${y + 7} 260 ${y + 18}" stroke="#C9D0DC" stroke-width="7" fill="none" stroke-linecap="round"/>`; }).join("")}</g></g>
    <path d="M194 300 Q 198 262 262 254 L 262 346 Q 198 338 194 300 Z" fill="url(#${id}C)" stroke="${INK}" stroke-width="4"/><path d="M212 300 Q 226 282 246 290" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${[["FAN", 230, 232, 478, "#5C677E", "#fff"], ["COMPRESSOR", 470, 480, 380, "#5C677E", "#fff"], ["FUEL BURNS", 675, 675, 364, RED, "#fff"], ["TURBINE", 845, 800, 356, "#E8A317", INK], ["EXHAUST", 1160, 1160, 310, "#3E4A6A", "#fff"]].map(([t, x, x2, y2, c, tc]) => `<path d="M${x2} ${y2} L ${x} 592" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6" opacity=".45"/>${chip(x, 594, t, c, { fs: 21, tc, a: "middle" })}`).join("")}
    ${chip(580, -32, "BYPASS AIR → ≈ 80% OF THE PUSH", "#3E7BFA", { fs: 22, a: "middle" })}`);

  // ---------------------------------------------------------------- slats + flaps: cruise (tucked in) vs landing (out), extruded 3D wing slices
  // ids: ${id}Slat, ${id}Flap (on the landing slice; ext 0..1)
  P.flaps = ({ w = 800, id = "fl", ext = 1 } = {}) => {
    const main = "M150 210 Q 190 140 360 128 Q 560 122 720 176 L 716 236 Q 560 236 360 246 Q 210 254 150 210 Z";
    const slat = "M116 214 Q 138 146 246 130 L 238 154 Q 172 166 150 212 Z";
    const flap = "M704 180 Q 800 196 900 232 Q 800 244 708 236 Z";
    const ex = (d, c, face) => extrude((ox, oy, f) => `<path d="${d}" transform="translate(${ox} ${oy})" fill="${f}"/>`, 46, c, face, 8) + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
    const sec = (dy, sT, fT, ids) => `<g transform="translate(0 ${dy})">${ids ? `<path d="M700 236 L 790 290" stroke="#5C677E" stroke-width="10" stroke-linecap="round"/>` : ""}<g ${ids ? `id="${id}Flap"` : ""} transform="${fT}">${ex(flap, RED, `url(#${id}R)`)}</g><g ${ids ? `id="${id}Slat"` : ""} transform="${sT}">${ex(slat, TEAL, `url(#${id}S)`)}</g>${ex(main, "#C9D0DC", `url(#${id}M)`)}<path d="M206 194 Q 360 150 560 156" stroke="#fff" stroke-width="8" fill="none" opacity=".85" stroke-linecap="round"/></g>`;
    return svg("40 0 960 840", w, w * 0.875, `<defs>${lin(id + "M", [[0, "#FFFFFF"], [0.5, "#E4E8EF"], [1, "#A9B3C4"]])}${lin(id + "S", [[0, "#5BD3EC"], [1, "#0D7C96"]])}${lin(id + "R", [[0, "#FF8A6E"], [1, "#C8361F"]])}</defs>
      ${bg(44, 4, 952, 340, "#EEF6FC", "#FFFFFF", id + "B1", 26)}${bg(44, 362, 952, 474, "#EAF3FB", "#FFFFFF", id + "B2", 26)}
      ${chip(64, 18, "CRUISE · TUCKED IN", "#5C677E", { fs: 30 })}
      ${sec(60, "", "", false)}
      ${chip(64, 376, "LANDING · SLATS + FLAPS OUT", INK, { fs: 30, tc: "#FFC93D" })}
      ${[0, 1, 2].map((i) => `<path d="M60 ${486 + i * 26} C 300 ${452 + i * 26}, 620 ${470 + i * 30}, 980 ${600 + i * 40}" stroke="#3E7BFA" stroke-width="5" fill="none" stroke-dasharray="24 14" stroke-linecap="round" opacity=".6"/>`).join("")}
      <g transform="translate(0 440)" opacity=".45"><path d="${slat}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="8 7"/><path d="${flap}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="8 7"/></g>
      ${sec(440, `translate(${-34 * ext} ${22 * ext}) rotate(${-16 * ext} 150 210)`, `translate(${70 * ext} ${34 * ext}) rotate(${24 * ext} 712 208)`, true)}
      ${chip(520, 784, "MORE CURVE + MORE AREA → MORE LIFT, SLOWER", "#22B573", { fs: 26, a: "middle" })}`);
  };

  // ---------------------------------------------------------------- main landing gear (shaded): strut, torque links, brace, hose, twin tyres
  P.gear = ({ w = 420, id = "lg" } = {}) => svg("0 0 420 480", w, w * 1.143, `<defs>${lin(id + "Wg", [[0, "#F2F4F8"], [1, "#B9C2D2"]])}${lin(id + "St", [[0, "#7F8AA3"], [0.35, "#D5DBE5"], [0.6, "#9AA3B4"], [1, "#5C677E"]], 1, 0)}${lin(id + "Ch", [[0, "#B9C2D2"], [0.4, "#FFFFFF"], [0.7, "#C9D0DC"], [1, "#8A93AB"]], 1, 0)}${rad(id + "Ty", [[0, "#4A4F5C"], [0.7, "#2A2D36"], [1, "#16181E"]])}${rad(id + "Hb", [[0, "#FFFFFF"], [0.6, "#C9D0DC"], [1, "#8A93AB"]], 0.4, 0.35)}${lin(id + "Dr", [[0, "#E3E8EF"], [1, "#AEB7C7"]], 1, 0)}</defs>
    ${shadow(210, 466, 190, 12, 0.24)}
    <path d="M24 16 L 396 16 L 386 64 L 34 64 Z" fill="url(#${id}Wg)" stroke="${INK}" stroke-width="5"/><path d="M40 30 L 380 30" stroke="#fff" stroke-width="5" opacity=".8" stroke-linecap="round"/>
    <path d="M56 66 L 146 66 L 128 236 L 74 226 Z" fill="url(#${id}Dr)" stroke="${INK}" stroke-width="4"/><path d="M70 90 L 128 92" stroke="#fff" stroke-width="4" opacity=".7"/>
    <path d="M236 118 L 332 68" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M236 118 L 332 68" stroke="#9AA3B4" stroke-width="11" stroke-linecap="round"/>
    <rect x="186" y="62" width="48" height="196" rx="14" fill="url(#${id}St)" stroke="${INK}" stroke-width="5"/>
    <rect x="196" y="226" width="28" height="118" rx="8" fill="url(#${id}Ch)" stroke="${INK}" stroke-width="4"/>
    <path d="M226 84 Q 256 190 222 300" stroke="#262A33" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="244" cy="160" r="5" fill="${RED}"/>
    <path d="M194 266 L 156 300 L 194 332" stroke="${INK}" stroke-width="14" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M194 266 L 156 300 L 194 332" stroke="#9AA3B4" stroke-width="8" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="156" cy="300" r="7" fill="#C9D0DC" stroke="${INK}" stroke-width="3"/>
    <rect x="86" y="334" width="248" height="24" rx="9" fill="url(#${id}St)" stroke="${INK}" stroke-width="4"/>
    ${[110, 310].map((x) => `<circle cx="${x + 10}" cy="${374}" r="74" fill="#121419" stroke="${INK}" stroke-width="4"/><circle cx="${x}" cy="380" r="74" fill="url(#${id}Ty)" stroke="${INK}" stroke-width="5"/><circle cx="${x}" cy="380" r="60" fill="none" stroke="#3A3E4A" stroke-width="4"/><circle cx="${x}" cy="380" r="40" fill="none" stroke="#C8833A" stroke-width="5" opacity=".7"/><circle cx="${x}" cy="380" r="32" fill="url(#${id}Hb)" stroke="${INK}" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => { const t = (i / 6) * Math.PI * 2; return `<circle cx="${(x + Math.cos(t) * 18).toFixed(1)}" cy="${(380 + Math.sin(t) * 18).toFixed(1)}" r="3.5" fill="${INK}"/>`; }).join("")}<circle cx="${x}" cy="380" r="7" fill="#5C677E"/><path d="M${x - 46} 334 Q ${x - 20} 318 ${x + 20} 322" stroke="#fff" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round"/>`).join("")}`);

  // ---------------------------------------------------------------- stopping: 1 spoilers, 2 reverse thrust, 3 brakes (three panels)
  // ids: ${id}Sp (raised spoiler panels), class .rv (reverse-flow arrows), ${id}Brk (brake glow)
  P.stopping = ({ w = 900, id = "st" } = {}) => {
    const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const H0 = [64, 316], H1 = [446, 241];
    const sp = [0, 1, 2, 3].map((i) => { const sa = 0.1 + i * 0.21, sb = sa + 0.18, k = 1 - 0.3 * sa, A = L(H0, H1, sa), B = L(H0, H1, sb); const up = (p, f) => `${(p[0] + 7 * f).toFixed(1)},${(p[1] - 66 * f).toFixed(1)}`, fl = (p, f) => `${(p[0] + 9 * f).toFixed(1)},${(p[1] + 26 * f).toFixed(1)}`; return { slot: `${A.join(",")} ${B.join(",")} ${fl(B, k)} ${fl(A, k)}`, pan: `${A.join(",")} ${B.join(",")} ${up(B, k)} ${up(A, k)}` }; });
    const panel = (x, n, t, c, tc = "#fff") => `<rect x="${x}" y="10" width="470" height="540" rx="28" fill="#F1F5FB" stroke="#D3DBE8" stroke-width="3"/>${chip(x + 18, 22, `${n}  ${t}`, c, { fs: 28, tc })}`;
    return svg("0 0 1500 560", w, w * 0.3733, `<defs>${lin(id + "Wt", [[0, "#FFFFFF"], [1, "#C9D0DC"]], 1, 1)}${lin(id + "Sr", [[0, "#FF8A6E"], [1, "#C8361F"]])}${lin(id + "Nc", [[0, "#FFFFFF"], [0.45, "#E3E8EF"], [1, "#A3AEC0"]])}${rad(id + "Ty", [[0, "#4A4F5C"], [0.7, "#2A2D36"], [1, "#16181E"]])}${rad(id + "Gw", [[0, "#FFF3C4"], [0.35, "#FFB547"], [0.7, "#F2553D"], [1, "#F2553D", 0]])}</defs>
      ${panel(10, "1", "SPOILERS UP", RED)}${panel(515, "2", "REVERSE THRUST", "#3E7BFA")}${panel(1020, "3", "BRAKES", "#FFC93D", INK)}
      <g transform="translate(10 40)">
        ${[0, 1, 2].map((i) => `<path d="M30 ${136 + i * 30} q 30 -26 60 0 t 60 0 t 60 0 t 60 0 t 60 0" stroke="#3E7BFA" stroke-width="5" fill="none" stroke-dasharray="18 12" opacity=".55" transform="translate(${i * 24} ${-i * 8})"/>`).join("")}
        <polygon points="80,360 450,262 450,278 80,378" fill="#8E98AC" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="40,250 440,210 450,262 80,360" fill="url(#${id}Wt)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M60 262 L 430 222" stroke="#fff" stroke-width="6" opacity=".8" stroke-linecap="round"/>
        ${sp.map((s) => `<polygon points="${s.slot}" fill="#2B3354"/>`).join("")}
        <g id="${id}Sp">${sp.map((s) => `<polygon points="${s.pan}" fill="url(#${id}Sr)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`).join("")}</g>
      </g>
      ${chip(30, 478, "LIFT DUMPED → WEIGHT ON WHEELS", RED, { fs: 22 })}
      <g>
        <path d="M560 262 L 524 276 L 524 304 L 560 318 Z" fill="#3E4A6A" stroke="${INK}" stroke-width="3"/>
        <path d="M560 236 L 716 224 L 716 356 L 560 344 Z" fill="url(#${id}Nc)" stroke="${INK}" stroke-width="4"/>
        <rect x="716" y="230" width="46" height="120" fill="#2B3354" stroke="${INK}" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => `<path d="M724 ${242 + i * 19} L 756 ${234 + i * 19}" stroke="#C9D0DC" stroke-width="5" stroke-linecap="round"/>`).join("")}
        <path d="M762 222 L 900 214 Q 950 218 952 290 Q 950 362 900 366 L 762 358 Z" fill="url(#${id}Nc)" stroke="${INK}" stroke-width="4"/><path d="M780 236 L 900 230" stroke="#fff" stroke-width="5" opacity=".85" stroke-linecap="round"/><path d="M790 250 L 900 246 L 900 334 L 790 330 Z" fill="${TEAL}" opacity=".85"/>
        <ellipse cx="948" cy="290" rx="16" ry="74" fill="#C9D0DC" stroke="${INK}" stroke-width="4"/><ellipse cx="948" cy="290" rx="9" ry="60" fill="#2B3354"/>
        ${[[732, 222, 800, 132], [752, 222, 862, 158], [732, 358, 800, 448], [752, 358, 862, 422]].map(([a, b, c2, d]) => arrow3(a, b, c2, d, "#3E7BFA", 15, "", "rv")).join("")}
      </g>
      ${chip(535, 478, "FAN AIR BLOWN FORWARD", "#3E7BFA", { fs: 22 })}
      <g>
        <path d="M1040 452 L 1470 452" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>${[0, 1, 2].map((i) => `<path d="M${1060 + i * 30} ${440 - i * 2} L ${1110 + i * 30} ${440 - i * 2}" stroke="#1B1D24" stroke-width="4" opacity=".35" stroke-linecap="round"/>`).join("")}
        ${[0, 1, 2].map((i) => `<path d="M${1210 + i * 40} 132 q 8 -12 0 -24 t 0 -24" stroke="#F5A524" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`).join("")}
        <circle cx="1266" cy="306" r="134" fill="#121419" stroke="${INK}" stroke-width="4"/><circle cx="1256" cy="314" r="134" fill="url(#${id}Ty)" stroke="${INK}" stroke-width="5"/><circle cx="1256" cy="314" r="110" fill="none" stroke="#3A3E4A" stroke-width="5"/>
        <circle id="${id}Brk" cx="1256" cy="314" r="84" fill="url(#${id}Gw)"/>${[70, 56, 42].map((r) => `<circle cx="1256" cy="314" r="${r}" fill="none" stroke="#8A2A16" stroke-width="5" opacity=".6"/>`).join("")}
        <circle cx="1256" cy="314" r="26" fill="#C9D0DC" stroke="${INK}" stroke-width="4"/><circle cx="1256" cy="314" r="8" fill="#5C677E"/>
        <rect x="1226" y="222" width="60" height="30" rx="8" fill="#5C677E" stroke="${INK}" stroke-width="4"/><path d="M1236 231 L 1276 231" stroke="#C9D0DC" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${chip(1040, 478, "SPEED → HEAT IN THE DISCS", "#FFC93D", { fs: 22, tc: INK })}`);
  };

  // ---------------------------------------------------------------- ILS: glide slope beam (side) + localizer (inset)
  // ids: ${id}Pl (plane marker — move along the beam), ${id}Beam
  P.ils = ({ w = 1100, id = "il" } = {}) => svg("0 0 1400 520", w, w * 0.371, `
    <rect x="0" y="420" width="1400" height="100" fill="#9CC98A"/><rect x="900" y="410" width="500" height="20" fill="#4B505C"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${930 + i * 80}" y="417" width="40" height="5" fill="#fff"/>`).join("")}
    <g id="${id}Beam"><path d="M960 412 L 0 140 L 0 220 Z" fill="#22D07A" opacity=".18"/><path d="M960 412 L 0 180" stroke="#22D07A" stroke-width="6" stroke-dasharray="20 14"/></g>
    <path d="M820 412 A 140 140 0 0 1 822 372" stroke="${INK}" stroke-width="4" fill="none"/><text x="760" y="392" font-family="JetBrains Mono" font-weight="800" font-size="30" fill="${INK}">3°</text>
    <rect x="1000" y="360" width="18" height="52" fill="#5C677E"/><rect x="990" y="350" width="38" height="16" rx="4" fill="${RED}"/><text x="1009" y="336" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="20" fill="${INK}">GLIDESLOPE ANTENNA</text>
    <g id="${id}Pl" transform="translate(300 255) rotate(-3)">${strip(P.side({ w: 1000, id: id + "S", gear: true })).replace(/^/, '<g transform="scale(0.22) translate(-500 -150)">') + "</g>"}</g>
    <text x="120" y="110" font-family="JetBrains Mono" font-weight="800" font-size="26" fill="#1F9D5A">ILS RADIO BEAM — "SLIDE DOWN THIS RAMP"</text>`);

  // ---------------------------------------------------------------- altitude ladder 0 → 40,000 ft (tall): Himalaya ridges, clouds, birds, contrail, thermometer
  // ids: ${id}Pl (plane at 35k), ${id}Cab (cabin-feels-like marker)
  P.ladder = ({ w = 520, id = "ld" } = {}) => {
    const y = (ft) => 1060 - ft * 0.025;   // 40,000 ft -> 60
    const tick = (ft) => `<line x1="90" y1="${y(ft)}" x2="120" y2="${y(ft)}" stroke="${INK}" stroke-width="4"/>${T(80, y(ft) + 8, ft.toLocaleString("en-IN"), { fs: 22, a: "end" })}`;
    const R = (pts) => pts.map(([x, f]) => `${x},${f === null ? 1060 : y(f).toFixed(1)}`).join(" ");
    const bird = (x, f) => `<path d="M${x - 11} ${y(f) - 4} Q ${x - 5} ${y(f) - 11} ${x} ${y(f)} Q ${x + 5} ${y(f) - 11} ${x + 11} ${y(f) - 4}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return svg("0 0 700 1120", w, w * 1.6, `<defs>${lin(id + "S", [[0, "#111B45"], [0.25, "#24479A"], [0.62, "#6FAEE6"], [1, "#D9F0FC"]])}${lin(id + "M1", [[0, "#B7C2D8"], [1, "#8C98B4"]])}${lin(id + "M2", [[0, "#8E9CB8"], [1, "#4F5C7C"]])}${lin(id + "Th", [[0, "#7FC8FF"], [0.55, "#DDF0FF"], [1, "#F2553D"]])}${lin(id + "Ct", [[0, "#FFFFFF", 0], [1, "#FFFFFF", 0.95]], 1, 0)}<clipPath id="${id}K"><rect x="120" y="40" width="560" height="1020" rx="20"/></clipPath></defs>
      <rect x="120" y="40" width="560" height="1020" rx="20" fill="url(#${id}S)"/>
      <g clip-path="url(#${id}K)">
        ${[[160, 60], [230, 90], [300, 70], [420, 100], [520, 66], [600, 120], [180, 140], [470, 150]].map(([x, yy]) => `<circle cx="${x}" cy="${yy}" r="2.5" fill="#fff" opacity=".6"/>`).join("")}
        ${[[170, 31500, 180], [430, 32500, 220]].map(([x, f, l]) => `<path d="M${x} ${y(f)} q ${l / 2} -16 ${l} 0" stroke="#fff" stroke-width="6" fill="none" opacity=".45" stroke-linecap="round"/><path d="M${x + 30} ${y(f) + 12} q ${l / 3} -10 ${l * 0.7} 0" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`).join("")}
        <polygon points="${R([[120, null], [120, 15000], [200, 19500], [262, 16500], [360, 21500], [460, 18000], [540, 22500], [620, 18500], [680, 20500], [680, null]])}" fill="url(#${id}M1)" opacity=".85"/>
        ${cloud(560, y(10500), 1.0, 0.85)}${cloud(220, y(12500), 0.85, 0.8)}
        <polygon points="${R([[120, null], [176, 14000], [238, 22500], [300, 29032], [352, 24500], [420, 26800], [470, 20500], [540, 16000], [600, 11500], [680, 8500], [680, null]])}" fill="url(#${id}M2)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="${R([[272, 25600], [300, 29032], [328, 25400], [314, 26300], [300, 25200], [286, 26200]])}" fill="#fff"/><polygon points="${R([[402, 24600], [420, 26800], [440, 24300], [428, 24900], [420, 24100], [410, 24900]])}" fill="#fff"/><polygon points="${R([[222, 20800], [238, 22500], [254, 20600], [238, 20100]])}" fill="#fff"/>
        ${cloud(250, y(4000), 1.2, 0.95)}${cloud(530, y(4600), 1.0, 0.95)}
        ${[[200, 1700], [232, 2100], [258, 1500], [470, 2000], [498, 2400]].map(([x, f]) => bird(x, f)).join("")}
        <g id="${id}Cab"><line x1="120" y1="${y(7000)}" x2="680" y2="${y(7000)}" stroke="#FFC93D" stroke-width="5" stroke-dasharray="14 10"/>${chip(360, y(7000) - 50, "CABIN FEELS LIKE THIS", "#FFC93D", { fs: 17, tc: INK })}</g>
        <rect x="120" y="${y(35000) - 1}" width="290" height="12" fill="url(#${id}Ct)"/>
        <line x1="120" y1="${y(35000)}" x2="680" y2="${y(35000)}" stroke="#fff" stroke-width="3" stroke-dasharray="10 10" opacity=".7"/>
        <g id="${id}Pl" transform="translate(380 ${y(35000) - 30}) scale(0.2)">${strip(P.side({ w: 1000, id: id + "P", gear: false }))}</g>
        ${chip(140, y(35000) - 76, "35,000 FT · −50 °C", INK, { fs: 20, tc: "#FFC93D" })}
        <rect x="640" y="78" width="22" height="964" rx="11" fill="url(#${id}Th)" stroke="${INK}" stroke-width="3"/><circle cx="651" cy="1036" r="17" fill="${RED}" stroke="${INK}" stroke-width="3"/>
        ${T(630, 104, "−50°", { fs: 18, c: "#fff", a: "end" })}${T(630, 1030, "+30°", { fs: 18, a: "end" })}
      </g>
      ${chip(300, y(29032) - 60, "EVEREST 29,032 FT", "#fff", { fs: 17, tc: INK, a: "middle" })}
      ${[0, 10000, 20000, 30000, 40000].map(tick).join("")}<line x1="120" y1="40" x2="120" y2="1060" stroke="${INK}" stroke-width="5"/>`);
  };

  // ---------------------------------------------------------------- cockpit (glass cockpit): windscreen over a cloud deck, glareshield FCU + AP, PFD / ND / engine gauges, side-sticks, thrust levers
  // ids: ${id}AP (autopilot light), ${id}Hz (horizon group on the PFD), ${id}Alt (altitude text), ${id}Spd
  P.cockpit = ({ w = 1000, id = "ck" } = {}) => {
    const S0 = 370, S1 = 596, CY = 483;
    const scr = (x, cid) => `<rect x="${x}" y="356" width="300" height="254" rx="18" fill="#232B45" stroke="${INK}" stroke-width="3"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${x + 110 + i * 20}" cy="603" r="3.5" fill="#56627F"/>`).join("")}<rect x="${x + 16}" y="${S0}" width="268" height="${S1 - S0}" rx="8" fill="#0B0F20"/><clipPath id="${cid}"><rect x="${x + 16}" y="${S0}" width="268" height="${S1 - S0}" rx="8"/></clipPath>`;
    const glare = (x) => `<path d="M${x + 16} ${S0} L ${x + 150} ${S0} L ${x + 16} ${S0 + 120} Z" fill="#fff" opacity=".07"/>`;
    const pa = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)].map((n) => n.toFixed(1));
    const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = pa(cx, cy, r, a0), [x1, y1] = pa(cx, cy, r, a1); return `M${x0} ${y0} A ${r} ${r} 0 ${a0 - a1 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
    const gauge = (cx, cy, v) => { const a = 210 - 240 * v, [nx, ny] = pa(cx, cy, 40, a); return `<path d="${arc(cx, cy, 48, 210, -30)}" stroke="#3A4566" stroke-width="10" fill="none"/><path d="${arc(cx, cy, 48, 210, a)}" stroke="#22D07A" stroke-width="10" fill="none"/><path d="${arc(cx, cy, 48, -10, -30)}" stroke="${RED}" stroke-width="10" fill="none"/><path d="M${cx} ${cy} L ${nx} ${ny}" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="#fff"/>${T(cx, cy + 40, (v * 100).toFixed(1), { fs: 20, c: "#22D07A" })}`; };
    const stick = (x, flip) => `<g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)"><ellipse cx="0" cy="640" rx="34" ry="12" fill="#1C2440"/><path d="M-12 640 L -8 572 Q -10 548 6 540 Q 22 544 20 566 L 12 640 Z" fill="#2B3354" stroke="${INK}" stroke-width="3"/><circle cx="8" cy="550" r="5" fill="${RED}"/></g>`;
    return svg("0 0 1200 700", w, w * 0.583, `<defs>${lin(id + "W", [[0, "#3B7FD4"], [0.62, "#A8D6F4"], [0.63, "#FDFDFE"], [1, "#D2DCEA"]])}${lin(id + "Pn", [[0, "#5A6684"], [1, "#3A4562"]])}${lin(id + "Gs", [[0, "#323C5E"], [1, "#1B2340"]])}${lin(id + "Fr", [[0, "#3E4A6A"], [1, "#2B3354"]])}</defs>
      <path d="M40 316 L 150 30 L 1050 30 L 1160 316 Z" fill="url(#${id}Fr)"/>
      ${[["M98 300 L 188 62 L 584 62 L 584 300 Z", 0], ["M616 300 L 616 62 L 1012 62 L 1102 300 Z", 1]].map(([d]) => `<path d="${d}" fill="url(#${id}W)"/>`).join("")}
      ${[[230, 212, 90], [400, 220, 120], [520, 214, 70], [720, 216, 110], [880, 222, 130], [1010, 214, 70]].map(([x, yy, r]) => `<ellipse cx="${x}" cy="${yy}" rx="${r}" ry="${r * 0.16}" fill="#fff"/><ellipse cx="${x - r * 0.3}" cy="${yy - r * 0.08}" rx="${r * 0.4}" ry="${r * 0.12}" fill="#fff"/>`).join("")}
      <path d="M200 90 L 330 90 L 190 230 Z" fill="#fff" opacity=".12"/><path d="M700 90 L 820 90 L 680 220 Z" fill="#fff" opacity=".12"/>
      <path d="M98 300 L 188 62 L 584 62 L 584 300 Z M616 300 L 616 62 L 1012 62 L 1102 300 Z" fill="none" stroke="#56627F" stroke-width="12" stroke-linejoin="round"/>
      <path d="M40 300 Q 600 276 1160 300 L 1160 350 L 40 350 Z" fill="url(#${id}Gs)"/>
      <rect x="330" y="300" width="540" height="40" rx="10" fill="#0D1328" stroke="#56627F" stroke-width="3"/>
      ${["SPD 290", "HDG 270", "ALT 35000"].map((t, i) => T(400 + i * 145, 327, t, { fs: 19, c: "#FFB547" })).join("")}
      <rect id="${id}AP" x="782" y="306" width="72" height="28" rx="6" fill="#22D07A" stroke="#0E7A45" stroke-width="2"/>${T(818, 327, "AP1", { fs: 18, c: "#0B2A1A" })}
      ${[110, 150, 190, 230, 270, 930, 970, 1010, 1050, 1090].map((x) => `<rect x="${x - 14}" y="310" width="28" height="18" rx="5" fill="#475375" stroke="#1B2340" stroke-width="2"/>`).join("")}
      <rect x="40" y="350" width="1120" height="350" fill="url(#${id}Pn)"/>
      <g transform="translate(-40 0)">${scr(170, id + "Pc")}${scr(490, id + "Nc")}${scr(810, id + "Ec")}
      <g clip-path="url(#${id}Pc)"><g id="${id}Hz"><rect x="80" y="${CY - 260}" width="480" height="260" fill="#3E9BFF"/><rect x="80" y="${CY}" width="480" height="260" fill="#A0622E"/><line x1="80" y1="${CY}" x2="560" y2="${CY}" stroke="#fff" stroke-width="4"/>${[-2, -1, 1, 2].map((k) => `<line x1="${320 - (k % 2 ? 22 : 40)}" y1="${CY - k * 32}" x2="${320 + (k % 2 ? 22 : 40)}" y2="${CY - k * 32}" stroke="#fff" stroke-width="3"/>`).join("")}${[-2, 2].map((k) => T(372, CY - k * 32 + 6, Math.abs(k) * 5, { fs: 14, c: "#fff" })).join("")}</g>
        <path d="M262 ${CY} L 296 ${CY} L 306 ${CY + 12} M378 ${CY} L 344 ${CY} L 334 ${CY + 12}" stroke="#FFC93D" stroke-width="7" fill="none"/><rect x="314" y="${CY - 5}" width="12" height="10" fill="#FFC93D"/>
        <rect x="186" y="${S0 + 26}" width="50" height="172" fill="rgba(20,26,46,.7)"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="226" y1="${S0 + 34 + i * 26}" x2="236" y2="${S0 + 34 + i * 26}" stroke="#fff" stroke-width="2"/>`).join("")}<rect x="186" y="${CY - 15}" width="50" height="30" fill="#0B0F20" stroke="#FFC93D" stroke-width="2"/>${T(211, CY + 7, "290", { fs: 17, c: "#fff" }).replace("<text", `<text id="${id}Spd"`)}
        <rect x="404" y="${S0 + 26}" width="50" height="172" fill="rgba(20,26,46,.7)"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="404" y1="${S0 + 34 + i * 26}" x2="414" y2="${S0 + 34 + i * 26}" stroke="#fff" stroke-width="2"/>`).join("")}<rect x="400" y="${CY - 15}" width="54" height="30" fill="#0B0F20" stroke="#FFC93D" stroke-width="2"/>${T(427, CY + 6, "35000", { fs: 13, c: "#fff" }).replace("<text", `<text id="${id}Alt"`)}
        <rect x="186" y="${S0}" width="268" height="24" fill="#0B0F20"/>${["SPEED", "ALT CRZ", "NAV", "AP1"].map((t, i) => T(214 + i * 66, S0 + 17, t, { fs: 12, c: i === 3 ? "#fff" : "#22D07A" })).join("")}
        <rect x="186" y="${S1 - 22}" width="268" height="22" fill="#0B0F20"/>${[250, 290, 330, 370, 410].map((x, i) => `<line x1="${x}" y1="${S1 - 22}" x2="${x}" y2="${S1 - 14}" stroke="#fff" stroke-width="2"/>`).join("")}<rect x="300" y="${S1 - 22}" width="40" height="20" fill="#0B0F20" stroke="#FFC93D" stroke-width="2"/>${T(320, S1 - 7, "270", { fs: 13, c: "#fff" })}
      </g>${glare(170)}
      <g clip-path="url(#${id}Nc)">
        <path d="${arc(640, 590, 190, 150, 30)}" stroke="#fff" stroke-width="3" fill="none"/>${Array.from({ length: 13 }, (_, i) => { const a = 150 - i * 10, [x0, y0] = pa(640, 590, 190, a), [x1, y1] = pa(640, 590, i % 3 ? 180 : 172, a); return `<path d="M${x0} ${y0} L ${x1} ${y1}" stroke="#fff" stroke-width="2.5"/>`; }).join("")}
        ${[[125, "24"], [90, "27"], [55, "30"]].map(([a, t]) => { const [x, yy] = pa(640, 590, 168, a); return T(x, +yy + 6, t, { fs: 15, c: "#fff" }); }).join("")}
        <path d="${arc(640, 590, 100, 150, 30)}" stroke="#56627F" stroke-width="2" fill="none" stroke-dasharray="8 8"/>
        <path d="M640 586 L 632 512 L 650 452 L 700 404" stroke="#E040FB" stroke-width="5" fill="none"/>${[[632, 512, "TELAG"], [650, 452, "AKTIV"], [700, 404, "BOM"]].map(([x, yy, n]) => `<path d="M${x} ${yy - 10} L ${x + 9} ${yy + 6} L ${x - 9} ${yy + 6} Z" fill="none" stroke="#fff" stroke-width="3"/>${T(x + 14, yy + 5, n, { fs: 13, c: "#fff", a: "start" })}`).join("")}
        <path d="M640 566 L 628 594 L 652 594 Z" fill="#FFC93D"/>${T(512, S0 + 20, "GS 470  TAS 465", { fs: 12, c: "#22D07A", a: "start" })}${T(766, S0 + 20, "BOM 412 NM", { fs: 12, c: "#E040FB", a: "end" })}
      </g>${glare(490)}
      <g clip-path="url(#${id}Ec)">
        ${T(960, S0 + 24, "N1 %", { fs: 14, c: "#C9D0DC" })}${gauge(900, 446, 0.84)}${gauge(1020, 446, 0.84)}
        ${T(842, 548, "FUEL", { fs: 14, c: "#C9D0DC", a: "start" })}${T(1078, 548, "9.8 T", { fs: 16, c: "#22D07A", a: "end" })}${T(842, 576, "CAB ALT", { fs: 14, c: "#C9D0DC", a: "start" })}${T(1078, 576, "7000 FT", { fs: 16, c: "#FFC93D", a: "end" })}
      </g>${glare(810)}</g>
      ${stick(80, false)}${stick(1120, true)}
      ${box(500, 646, 0, 200, 54, 26, "#2B3354")}${[565, 635].map((x) => `<rect x="${x - 6}" y="624" width="14" height="34" rx="5" fill="#9AA3B4"/><rect x="${x - 20}" y="616" width="42" height="18" rx="7" fill="#DDE2EA" stroke="${INK}" stroke-width="2.5"/>`).join("")}${T(600, 686, "THRUST", { fs: 14, c: "#9AA3B4" })}`);
  };

  // ---------------------------------------------------------------- airways: an en-route chart (no borders) — airports, waypoints, labelled airways, magenta active route
  // ids: ${id}Pl (plane marker), ${id}Rt (route path to animate along)
  P.airways = ({ w = 800, id = "aw" } = {}) => {
    const C = { DEL: [500, 74], JAI: [400, 172], AMD: [218, 250], BOM: [214, 408], GOI: [300, 532], BLR: [530, 560], HYD: [560, 400], CCU: [880, 262] };
    const WPT = { TELAG: [462, 104], AKTIV: [330, 194], PAKDA: [262, 320], LUBAK: [690, 168], IGOLU: [540, 478] };
    const pt = (n) => C[n] || WPT[n];
    const AW = [["DEL TELAG AKTIV PAKDA BOM", "W33", 1], ["DEL LUBAK CCU", "A47", 0], ["BOM IGOLU BLR", "W15", 0], ["DEL HYD", "Q12", 0], ["AMD AKTIV", "W20", 0], ["HYD CCU", "A55", 0], ["GOI BOM", "W41", 0], ["HYD IGOLU", "Q19", 0]];
    const path = (s) => s.split(" ").map((n, i) => `${i ? "L" : "M"}${pt(n).join(" ")}`).join(" ");
    const lbl = (s, t, act) => { const ns = s.split(" "), a = pt(ns[0]), b = pt(ns[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return `<rect x="${mx - 26}" y="${my - 14}" width="52" height="26" rx="6" fill="#fff" stroke="${act ? "#C2185B" : "#3E7BFA"}" stroke-width="2.5"/>${T(mx, my + 6, t, { fs: 15, c: act ? "#C2185B" : "#2C5FC9" })}`; };
    return svg("0 0 1000 620", w, w * 0.62, `${bg(0, 0, 1000, 620, "#F4F8FB", "#E7EFF6", id + "Bg", 24)}
      ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 125}" y1="0" x2="${i * 125}" y2="620" stroke="#C9D7E6" stroke-width="1.5"/>`).join("")}${Array.from({ length: 5 }, (_, i) => `<line x1="0" y1="${i * 155}" x2="1000" y2="${i * 155}" stroke="#C9D7E6" stroke-width="1.5"/>`).join("")}
      <g transform="translate(560 400)">${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2, r1 = i % 3 ? 62 : 54; return `<line x1="${(Math.cos(a) * 70).toFixed(1)}" y1="${(Math.sin(a) * 70).toFixed(1)}" x2="${(Math.cos(a) * r1).toFixed(1)}" y2="${(Math.sin(a) * r1).toFixed(1)}" stroke="#3E7BFA" stroke-width="2" opacity=".6"/>`; }).join("")}<circle r="70" fill="none" stroke="#3E7BFA" stroke-width="2" opacity=".6"/></g>
      ${AW.filter((a) => !a[2]).map(([s]) => `<path d="${path(s)}" stroke="#3E7BFA" stroke-width="4" fill="none" opacity=".7"/>`).join("")}
      <path id="${id}Rt" d="${path(AW[0][0])}" stroke="#C2185B" stroke-width="8" fill="none" stroke-linejoin="round" opacity=".92"/>
      ${AW.map(([s, t, act]) => lbl(s, t, act)).join("")}
      ${Object.entries(WPT).map(([n, [x, yy]]) => `<path d="M${x} ${yy - 13} L ${x + 12} ${yy + 8} L ${x - 12} ${yy + 8} Z" fill="#fff" stroke="${INK}" stroke-width="3"/>${T(x + 16, yy + 18, n, { fs: 14, c: "#5C677E", a: "start" })}`).join("")}
      ${Object.entries(C).map(([n, [x, yy]]) => `<circle cx="${x}" cy="${yy}" r="13" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${x}" cy="${yy}" r="6" fill="${RED}"/>${T(n === "AMD" ? x - 20 : x + 20, yy - 12, n, { fs: 22, a: n === "AMD" ? "end" : "start" })}`).join("")}
      <g id="${id}Pl" transform="translate(286 276)"><circle r="24" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M-13 0 L 13 0 M0 -11 L 6 0 L 0 11 M-11 -5 L -9 0 L -11 5" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/></g>
      ${chip(24, 572, "EN-ROUTE CHART · ILLUSTRATIVE", INK, { fs: 15, tc: "#fff" })}`);
  };

  // ---------------------------------------------------------------- ATC radar scope with sweep + blips; and the tower
  // ids: ${id}Sw (sweep line, rotate around 300 300), classes .bp (blips)
  P.radar = ({ w = 560, id = "rd" } = {}) => svg("0 0 600 600", w, w, `${box(20, 20, 0, 560, 560, 30, "#2B3354")}
    <circle cx="300" cy="300" r="250" fill="#06231A" stroke="#1B2340" stroke-width="8"/>${[80, 160, 240].map((r) => `<circle cx="300" cy="300" r="${r}" fill="none" stroke="#1F7A55" stroke-width="2"/>`).join("")}<path d="M50 300 L 550 300 M300 50 L 300 550" stroke="#1F7A55" stroke-width="2"/>
    <g id="${id}Sw"><path d="M300 300 L 300 50 A 250 250 0 0 1 420 80 Z" fill="#22D07A" opacity=".18"/><path d="M300 300 L 300 50" stroke="#22D07A" stroke-width="4"/></g>
    ${[[380, 150, "HX201 FL120"], [460, 260, "AI440 FL090"], [400, 380, "6E102 FL060"], [330, 340, "HX303 FL030"], [180, 200, "UK811 FL150"]].map(([x, y, t]) => `<g class="bp"><rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#7CFFB2"/><text x="${x + 12}" y="${y - 10}" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="#7CFFB2">${t}</text></g>`).join("")}
    <path d="M330 340 L 300 300" stroke="#FFC93D" stroke-width="3" stroke-dasharray="6 6"/><rect x="292" y="292" width="16" height="16" fill="#FFC93D"/>`);
  P.tower = ({ w = 300, id = "tw" } = {}) => svg("0 0 300 520", w, w * 1.733, `${shadow(150, 510, 110, 10, 0.2)}
    ${cyl(150, 200, 40, 300, "#E6E1D6", { ry: 12 })}<path d="M70 200 L 230 200 L 260 100 L 40 100 Z" fill="#3E4A6A" stroke="${INK}" stroke-width="4"/><path d="M60 196 L 240 196 L 254 112 L 46 112 Z" fill="#9FC7E8"/>
    <circle cx="150" cy="150" r="22" fill="#C98B5E"/><path d="M126 146 Q 150 110 174 146" stroke="${INK}" stroke-width="6" fill="none"/><circle cx="128" cy="150" r="7" fill="${INK}"/><path d="M128 156 Q 136 172 150 168" stroke="${INK}" stroke-width="3" fill="none"/>
    <rect x="50" y="80" width="200" height="24" rx="6" fill="${INK}"/><path d="M150 80 L 150 30" stroke="#5C677E" stroke-width="6"/><circle cx="150" cy="26" r="9" fill="${RED}"/>
    <text x="150" y="420" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="${INK}">ATC</text>`);

  // ---------------------------------------------------------------- ear pop: head profile + magnifier cross-section (canal → eardrum → middle ear → tube to throat)
  // ids: ${id}Drum (eardrum path — bulge), ${id}Pop
  P.ear = ({ w = 520, id = "er" } = {}) => svg("0 0 640 700", w, w * 1.094, `<defs>${lin(id + "Sk", [[0, "#F6CBA6"], [1, "#E2A77D"]])}${rad(id + "Mg", [[0, "#FFF1E6"], [1, "#F6D3B8"]])}<clipPath id="${id}K"><circle cx="380" cy="250" r="184"/></clipPath></defs>
    ${shadow(220, 668, 120, 10, 0.2)}
    <path d="M150 664 L 150 620 Q 108 612 96 586 Q 80 582 80 568 Q 86 560 92 556 Q 76 548 80 536 Q 66 530 66 518 Q 66 506 82 498 Q 70 470 76 440 Q 92 360 190 350 Q 300 346 322 440 Q 336 520 300 580 L 300 664 Z" fill="url(#${id}Sk)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M78 452 Q 90 352 196 344 Q 312 342 328 448 Q 302 414 254 422 Q 204 392 152 408 Q 108 404 78 452 Z" fill="#3B2A20" stroke="${INK}" stroke-width="3"/>
    <path d="M102 472 Q 116 480 130 472" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 456 Q 116 448 132 456" stroke="#3B2A20" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="88" cy="546" rx="7" ry="10" fill="#7A2E22"/><circle cx="132" cy="516" r="12" fill="#F19A7E" opacity=".45"/>
    <path id="${id}EarO" d="M236 452 Q 272 438 278 480 Q 282 522 250 530 Q 238 522 248 506 Q 262 500 258 482 Q 254 466 238 470 Z" fill="#E9AE86" stroke="${INK}" stroke-width="3"/>
    <polygon points="252,478 202,316 476,414" fill="${INK}" opacity=".07"/><path d="M252 478 L 202 316 M252 478 L 476 414" stroke="${INK}" stroke-width="2.5" stroke-dasharray="7 7" opacity=".35"/>
    <circle cx="380" cy="250" r="190" fill="url(#${id}Mg)" stroke="${INK}" stroke-width="8"/>
    <g clip-path="url(#${id}K)">
      <ellipse cx="444" cy="236" rx="96" ry="108" fill="#F1E6D2" stroke="#D8C7A8" stroke-width="3"/>
      <path d="M180 202 Q 280 194 360 198 L 360 272 Q 280 276 180 270 Z" fill="#FFF8F2" stroke="#C98B5E" stroke-width="5"/>
      ${arrow3(208, 236, 344, 236, "#3E7BFA", 16)}
      <ellipse cx="444" cy="236" rx="62" ry="74" fill="#FFF8F2" stroke="#C98B5E" stroke-width="5"/>
      <path d="M372 226 L 404 210 L 418 218 M418 218 L 430 236 L 444 230 M444 230 L 458 244" stroke="#E9DCC6" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M372 226 L 404 210 L 418 218 M418 218 L 430 236 L 444 230 M444 230 L 458 244" stroke="${INK}" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M432 306 Q 424 372 316 440" stroke="#C98B5E" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M432 306 Q 424 372 316 440" stroke="#FFF8F2" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path id="${id}Drum" d="M364 194 Q 384 236 364 278" stroke="${RED}" stroke-width="11" fill="none" stroke-linecap="round"/>
      ${T(262, 304, "EAR CANAL", { fs: 19, c: "#8A5A3C" })}${T(352, 178, "EARDRUM", { fs: 19, c: RED })}${T(444, 258, "AIR", { fs: 18, c: "#8A5A3C" })}${T(450, 150, "MIDDLE EAR", { fs: 18, c: "#8A5A3C" })}
      ${T(452, 372, "TUBE TO", { fs: 14, c: "#8A5A3C", a: "start" })}${T(452, 390, "THROAT", { fs: 14, c: "#8A5A3C", a: "start" })}
    </g>
    <g id="${id}Pop"><path d="M538 54 L 556 18 L 566 56 L 604 36 L 582 72 L 624 84 L 580 92 L 600 128 L 562 104 L 546 140 L 540 100 L 502 112 L 526 80 Z" fill="#FFC93D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>${T(562, 88, "POP!", { fs: 24, f: "Archivo", w: 900 })}</g>
    ${chip(14, 8, "CABIN PRESSURE CHANGES", "#3E7BFA", { fs: 17 })}
    ${chip(334, 600, "YAWN → TUBE OPENS → POP!", "#FFC93D", { fs: 17, tc: INK })}`);

  // ---------------------------------------------------------------- the uncle (standing, bag over head) + seated passenger heads
  // ids: ${id}Arm (arm with bag), ${id}Head
  P.uncle = ({ w = 300, id = "un", bag = true } = {}) => svg("0 0 300 560", w, w * 1.867, `${shadow(150, 550, 100, 10, 0.2)}
    <rect x="96" y="380" width="44" height="160" rx="16" fill="#E9ECF2" stroke="${INK}" stroke-width="3"/><rect x="160" y="380" width="44" height="160" rx="16" fill="#E9ECF2" stroke="${INK}" stroke-width="3"/>
    <path d="M70 380 Q 60 220 150 210 Q 240 220 230 380 Q 150 410 70 380 Z" fill="#F5A524" stroke="${INK}" stroke-width="4"/><path d="M150 214 L 150 300" stroke="#C47D10" stroke-width="5"/>
    <g id="${id}Head"><circle cx="150" cy="150" r="52" fill="#C98B5E" stroke="${INK}" stroke-width="3"/><path d="M100 136 Q 110 92 150 94 Q 190 92 200 136 Q 180 116 150 118 Q 120 116 100 136 Z" fill="#5C677E"/><circle cx="132" cy="150" r="5" fill="${INK}"/><circle cx="168" cy="150" r="5" fill="${INK}"/><path d="M120 172 Q 150 160 180 172 Q 150 186 120 172 Z" fill="#2B2118"/><path d="M138 192 Q 150 198 162 192" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g id="${id}Arm"><path d="M220 240 Q 270 170 250 80" stroke="#F5A524" stroke-width="30" fill="none" stroke-linecap="round"/><circle cx="250" cy="72" r="18" fill="#C98B5E"/>${bag ? `<rect x="190" y="0" width="120" height="70" rx="12" fill="#7B61FF" stroke="${INK}" stroke-width="4"/><path d="M226 0 Q 250 -26 274 0" stroke="${INK}" stroke-width="6" fill="none"/>` : ""}</g>
    <path d="M80 240 Q 40 300 70 360" stroke="#F5A524" stroke-width="30" fill="none" stroke-linecap="round"/>`);

  // cabin interior (side cut): seats, windows, overhead bins, seatbelt sign; ids: ${id}Belt (sign light), ${id}Un (uncle slot)
  P.cabin = ({ w = 1100, id = "cb" } = {}) => svg("0 0 1400 600", w, w * 0.4286, `
    <path d="M0 80 Q 700 -10 1400 80 L 1400 560 L 0 560 Z" fill="#EEF1F7"/><rect x="0" y="80" width="1400" height="90" fill="#DDE2EA"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${20 + i * 200}" y="88" width="180" height="72" rx="16" fill="#E9ECF2" stroke="#B9C2D2" stroke-width="3"/>`).join("")}
    <rect x="600" y="172" width="120" height="44" rx="10" fill="#2B3354"/><g id="${id}Belt"><circle cx="630" cy="194" r="13" fill="#FFC93D"/><path d="M652 186 L 700 186 M652 202 L 700 202" stroke="#FFC93D" stroke-width="5"/></g>
    ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${100 + i * 200}" cy="250" rx="26" ry="38" fill="#9FD3F0" stroke="#B9C2D2" stroke-width="6"/>`).join("")}
    <rect x="0" y="520" width="1400" height="40" fill="#5C677E"/>
    ${Array.from({ length: 7 }, (_, i) => { const x = 60 + i * 200; return `<path d="M${x} 520 L ${x} 330 Q ${x} 300 ${x + 30} 300 L ${x + 70} 300 Q ${x + 100} 300 ${x + 100} 330 L ${x + 100} 440 L ${x + 160} 440 L ${x + 160} 520 Z" fill="${TEAL}" stroke="${INK}" stroke-width="4"/><circle cx="${x + 120}" cy="${i === 3 ? 0 : 380}" r="${i === 3 ? 0 : 30}" fill="#C98B5E"/><text x="${x + 50}" y="290" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="20" fill="#5C677E">${20 + i}</text>`; }).join("")}
    <g id="${id}Un" transform="translate(690 200) scale(0.62)">${strip(P.uncle({ w: 300, id: id + "U" }))}</g>`);

  // ---------------------------------------------------------------- aircraft window with sliding shade (transition element). id ${id}Shade
  P.window = ({ w = 420, id = "wn", view = "" } = {}) => svg("0 0 420 560", w, w * 1.333, `<defs><clipPath id="${id}C"><rect x="70" y="80" width="280" height="400" rx="120"/></clipPath><linearGradient id="${id}V" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FA8E8"/><stop offset=".7" stop-color="#E6F4FC"/><stop offset=".7" stop-color="#F6F7FB"/><stop offset="1" stop-color="#DDE3EE"/></linearGradient></defs>
    <rect x="0" y="0" width="420" height="560" rx="60" fill="#EEF1F7"/><rect x="50" y="60" width="320" height="440" rx="140" fill="#DDE2EA" stroke="#B9C2D2" stroke-width="6"/>
    <g clip-path="url(#${id}C)"><rect x="70" y="80" width="280" height="400" fill="url(#${id}V)"/>${view}<rect id="${id}Shade" x="70" y="80" width="280" height="240" fill="#E9ECF2" stroke="#B9C2D2" stroke-width="4"/></g>
    <rect x="70" y="80" width="280" height="400" rx="120" fill="none" stroke="#C9D0DC" stroke-width="10"/>`);

  // ---------------------------------------------------------------- boarding pass chrome (HTML) and flight data panel (HTML)
  P.PHASES = ["Take-off", "Climb", "Cruise", "Descent", "Landing"];
  P.pass = (n, { w = 560 } = {}) => `<div style="width:${w}px;display:flex;border-radius:18px;overflow:hidden;background:#fff;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};font-family:'JetBrains Mono';font-weight:800;color:${INK}">
    <div style="flex:1;padding:12px 18px"><div style="display:flex;justify-content:space-between;font-size:14px;opacity:.55"><span>BOARDING PASS · HX 2026</span><span>SEAT 23A</span></div>
      <div style="display:flex;align-items:center;gap:12px;font-size:30px;margin-top:4px">DEL <span style="flex:1;position:relative;height:4px;background:#E6E8F0;border-radius:2px"><span style="position:absolute;left:0;top:0;height:4px;width:${(n - 1) * 25}%;background:${TEAL}"></span><span style="position:absolute;left:calc(${(n - 1) * 25}% - 12px);top:-14px;font-size:22px">✈</span></span> BOM</div></div>
    <div style="width:150px;border-left:3px dashed rgba(27,35,64,.3);padding:12px 14px;background:#FFF6D8"><div style="font-size:13px;opacity:.6">PHASE</div><div style="font-size:24px">${n} / 5</div><div style="font-size:15px;color:${TEAL}">${P.PHASES[n - 1].toUpperCase()}</div></div></div>`;
  P.fdp = ({ alt = "35,000 ft", spd = "830 km/h", temp = "−50 °C", w = 640 } = {}) => `<div style="width:${w}px;display:flex;gap:10px;padding:12px;border-radius:20px;background:#0E1530;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};font-family:'JetBrains Mono';font-weight:800">
    ${[["ALT", alt, "#22D07A"], ["SPEED", spd, "#FFC93D"], ["OUTSIDE", temp, "#7FC8FF"]].map(([k, v, c]) => `<div style="flex:1;background:#151E3E;border-radius:12px;padding:8px 12px"><div style="font-size:13px;color:#8FA0D6;letter-spacing:.12em">${k}</div><div class="fv" style="font-size:26px;color:${c}">${v}</div></div>`).join("")}</div>`;

  // ---------------------------------------------------------------- top-down seat map (3-3 cabin section). ids: ${id}S<row><letter> (seat cushion), ${id}W<row>A/F (windows)
  P.seatmap = ({ w = 1500, id = "sm", rows = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27], hi = {} } = {}) => {
    const L = ["A", "B", "C", "D", "E", "F"], Y = { A: 78, B: 142, C: 206, D: 344, E: 408, F: 472 };
    const seat = (x, y, r, l) => { const c = hi[`${r}${l}`] || "#3E7BFA"; return `<g><rect x="${x - 30}" y="${y + 4}" width="66" height="56" rx="12" fill="${shade(c, -0.45)}"/><rect id="${id}S${r}${l}" x="${x - 30}" y="${y}" width="66" height="56" rx="12" fill="${c}" stroke="${INK}" stroke-width="3"/><rect x="${x - 30}" y="${y}" width="16" height="56" rx="6" fill="${shade(c, -0.3)}"/><rect x="${x - 8}" y="${y + 8}" width="34" height="8" rx="4" fill="#fff" opacity=".35"/></g>`; };
    return svg("0 0 1500 570", w, w * 0.38, `<defs>${lin(id + "F", [[0, "#EEF3FA"], [0.5, "#DCE5F2"], [1, "#C3CFE2"]])}</defs>
      <rect x="20" y="20" width="1460" height="530" rx="70" fill="url(#${id}F)" stroke="${INK}" stroke-width="6"/>
      <rect x="40" y="272" width="1420" height="62" rx="10" fill="#B7C4D8"/>
      ${rows.map((r, i) => { const x = 120 + i * 135; return `<rect id="${id}W${r}A" x="${x - 18}" y="26" width="36" height="14" rx="7" fill="#7EC8F0" stroke="${INK}" stroke-width="2"/><rect id="${id}W${r}F" x="${x - 18}" y="530" width="36" height="14" rx="7" fill="#7EC8F0" stroke="${INK}" stroke-width="2"/>${L.map((l) => seat(x, Y[l], r, l)).join("")}${T(x + 3, 312, r, { fs: 26, c: INK })}`; }).join("")}
      ${["A", "B", "C", "D", "E", "F"].map((l) => T(66, Y[l] + 38, l, { fs: 22, c: "#5C677E" })).join("")}`);
  };
  // ---------------------------------------------------------------- a scooter (side view)
  P.scooter = ({ w = 300, id = "sc" } = {}) => svg("0 0 300 200", w, w * 0.667, `${shadow(150, 192, 120, 8, 0.2)}
    ${[70, 236].map((x) => `<circle cx="${x}" cy="160" r="30" fill="#22252E" stroke="${INK}" stroke-width="4"/><circle cx="${x}" cy="160" r="12" fill="#C9D0DC"/>`).join("")}
    <path d="M40 150 Q 40 104 92 102 L 176 102 Q 196 102 206 120 L 236 130 L 230 150 Z" fill="#F5A524" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M206 120 L 222 40" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M200 38 L 248 32" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><circle cx="252" cy="58" r="11" fill="#FFE08A" stroke="${INK}" stroke-width="3"/>
    <path d="M70 100 Q 76 80 120 82 L 152 84 Q 160 96 150 102 Z" fill="#3E4A6A" stroke="${INK}" stroke-width="3"/><path d="M60 112 L 170 112" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/>`);
  // ---------------------------------------------------------------- an express train (side view, red + cream livery)
  P.train = ({ w = 420, id = "tr" } = {}) => svg("0 0 420 200", w, w * 0.476, `${shadow(210, 190, 200, 8, 0.2)}
    <rect x="0" y="176" width="420" height="10" fill="#5C677E"/>
    <path d="M10 60 L 330 60 Q 400 64 410 150 L 410 166 L 10 166 Z" fill="#C8361F" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M10 112 L 395 112 L 404 136 L 10 136 Z" fill="#F6E7C8"/>
    ${[40, 100, 160, 220].map((x) => `<rect x="${x}" y="76" width="44" height="28" rx="6" fill="#1B2340"/><rect x="${x + 4}" y="79" width="12" height="8" rx="3" fill="#8FC8F0"/>`).join("")}
    <path d="M300 74 L 344 74 Q 378 82 388 108 L 300 108 Z" fill="#1B2340"/><circle cx="398" cy="148" r="8" fill="#FFE08A" stroke="${INK}" stroke-width="3"/>
    ${[50, 110, 250, 310].map((x) => `<circle cx="${x}" cy="172" r="14" fill="#22252E" stroke="${INK}" stroke-width="3"/>`).join("")}`);

  // ---------------------------------------------------------------- a car (side view, moving right) with a passenger's arm out of the window, hand flat like a wing
  // ids: ${id}Arm (rotate around the shoulder at 560 150), ${id}Hand, class .whl (wheels — rotate)
  P.car = ({ w = 900, id = "car" } = {}) => svg("0 0 900 420", w, w * 0.467, `<defs>${lin(id + "B", [[0, "#FF7A5C"], [1, "#D9432A"]])}${lin(id + "G", [[0, "#BFE6F8"], [1, "#7FB8E0"]])}</defs>
    ${shadow(450, 400, 400, 14, 0.25)}
    <path d="M60 300 Q 60 236 130 226 L 250 214 Q 300 140 380 130 L 600 128 Q 670 132 720 210 L 820 230 Q 870 240 870 296 L 870 330 L 60 330 Z" fill="url(#${id}B)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M280 214 Q 320 158 390 152 L 470 150 L 470 214 Z" fill="url(#${id}G)" stroke="${INK}" stroke-width="4"/><path d="M490 150 L 590 150 Q 640 154 680 214 L 490 214 Z" fill="url(#${id}G)" stroke="${INK}" stroke-width="4"/>
    <path d="M120 250 L 840 252" stroke="#fff" stroke-width="5" opacity=".4" stroke-linecap="round"/><rect x="820" y="256" width="40" height="18" rx="6" fill="#FFE08A" stroke="${INK}" stroke-width="3"/>
    ${[220, 700].map((x) => `<g class="whl" data-cx="${x}"><circle cx="${x}" cy="330" r="56" fill="#22252E" stroke="${INK}" stroke-width="5"/><circle cx="${x}" cy="330" r="24" fill="#C9D0DC"/>${[0, 1, 2, 3].map((k) => `<rect x="${x - 4}" y="${330 - 22}" width="8" height="44" fill="#5C677E" transform="rotate(${k * 45} ${x} 330)"/>`).join("")}</g>`).join("")}
    <circle cx="540" cy="186" r="26" fill="#C98B5E" stroke="${INK}" stroke-width="3"/><path d="M516 178 Q 540 150 564 178" fill="#3B2A20"/>
    <g id="${id}Arm"><path d="M560 196 Q 610 186 660 150" stroke="#12A4C4" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M650 156 Q 700 120 740 112" stroke="#C98B5E" stroke-width="20" fill="none" stroke-linecap="round"/>
      <g id="${id}Hand"><path d="M728 104 Q 770 92 806 98 Q 816 104 806 112 Q 770 120 730 124 Z" fill="#C98B5E" stroke="${INK}" stroke-width="3"/></g></g>`);
  window.PLANE = P;
})();
