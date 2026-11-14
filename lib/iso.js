// iso.js — "3D picture" illustration kit: oblique-projection shaded solids (lit top, dark side, soft shadow).
// Every builder returns an SVG string. Load after reel.js.
(function () {
  const INK = "#1B2340";
  const rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  // k>0 lighten toward white, k<0 darken toward deep navy
  const shade = (h, k) => { const c = rgb(h), t = k < 0 ? [24, 28, 58] : [255, 255, 255], a = Math.abs(k); return "#" + c.map((v, i) => Math.round(v + (t[i] - v) * a).toString(16).padStart(2, "0")).join(""); };
  let uid = 0; const nid = (p) => `${p}${++uid}`;
  const DX = 0.55, DY = -0.42; // one unit of depth goes up and to the right
  const P = (x, y, z) => [x + z * DX, y + z * DY];
  const pts = (a) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // solid box: front face top-left (x,y) at depth z, size w x h, depth d
  function box(x, y, z, w, h, d, c, { front = null, side = null, top = null, grad = true } = {}) {
    const f = [P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)];
    const b = (q) => P(q[0], q[1], z + d);
    const tp = [P(x, y, z), P(x, y, z + d), P(x + w, y, z + d), P(x + w, y, z)];
    const sd = [P(x + w, y, z), P(x + w, y, z + d), P(x + w, y + h, z + d), P(x + w, y + h, z)];
    let g = "", ff = front || c;
    if (grad && !front) { const id = nid("bg"); g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, 0.1)}"/><stop offset="1" stop-color="${shade(c, -0.06)}"/></linearGradient></defs>`; ff = `url(#${id})`; }
    void b;
    return `${g}<polygon points="${pts(tp)}" fill="${top || shade(c, 0.38)}"/><polygon points="${pts(sd)}" fill="${side || shade(c, -0.3)}"/><polygon points="${pts(f)}" fill="${ff}"/>`;
  }
  // soft ground shadow
  const shadow = (cx, cy, rx, ry, a = 0.16) => { const id = nid("sh"); return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${INK}" stop-opacity="${a}"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`; };
  // vertical cylinder seen from the front (column, podium, cup)
  function cyl(cx, y, r, h, c, { ry = r * 0.3, top = true } = {}) {
    const id = nid("cy");
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, -0.18)}"/><stop offset=".35" stop-color="${shade(c, 0.28)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.35)}"/></linearGradient></defs>
      <path d="M${cx - r} ${y} L${cx - r} ${y + h} A${r} ${ry} 0 0 0 ${cx + r} ${y + h} L${cx + r} ${y} Z" fill="url(#${id})"/>
      ${top ? `<ellipse cx="${cx}" cy="${y}" rx="${r}" ry="${ry}" fill="${shade(c, 0.4)}"/>` : ""}`;
  }
  // extrude any shape: shapeFn(ox, oy, fill) -> svg; layers stacked along depth
  function extrude(shapeFn, d, c, face, steps = 10) {
    let s = "";
    for (let i = steps; i >= 1; i--) { const k = (i / steps) * d; s += shapeFn(k * DX, k * DY, shade(c, -0.15 - 0.2 * (i / steps))); }
    return s + shapeFn(0, 0, face);
  }

  const ISO = { shade, box, cyl, shadow, extrude, P, INK };

  // ---------------------------------------------------------------- big neoclassical bank with a face in the pediment
  ISO.bank = ({ w = 460, color = "#3E7BFA", id = "bk", label = "BANK", flag = true, wall = "#F7F0E1" } = {}) => {
    const stone = "#E6DCC8";
    const cols = [48, 136, 272, 360];
    const apex = P(220, 30, -12);
    const lr = [P(10, 128, -12), P(220, 30, -12), P(220, 30, 168), P(10, 128, 168)];
    const rr = [P(220, 30, -12), P(430, 128, -12), P(430, 128, 168), P(220, 30, 168)];
    const g = nid("pd");
    return `<svg viewBox="-30 -140 600 600" width="${w}" height="${w}" style="overflow:visible">
      ${shadow(300, 430, 330, 46, 0.22)}
      ${box(-10, 402, -50, 470, 24, 240, stone)}
      ${box(6, 380, -34, 438, 22, 210, stone)}
      ${box(22, 360, -18, 406, 20, 182, stone)}
      ${box(40, 160, 40, 360, 200, 120, wall)}
      <g fill="${shade(color, -0.25)}" opacity=".9">${[0, 1].map((k) => { const a = P(400, 205, 62 + k * 50), b2 = P(400, 205, 92 + k * 50), c2 = P(400, 290, 92 + k * 50), d2 = P(400, 290, 62 + k * 50); return `<polygon points="${pts([a, b2, c2, d2])}"/>`; }).join("")}</g>
      <rect x="190" y="236" width="60" height="124" rx="30" fill="${shade(color, -0.45)}"/><rect x="198" y="246" width="44" height="114" rx="22" fill="${shade(color, -0.25)}"/>
      ${cols.map((x) => `${box(x - 8, 348, -8, 48, 12, 44, stone)}${cyl(x + 16, 176, 17, 174, "#FBF7EE", { top: false })}${box(x - 8, 164, -8, 48, 12, 44, stone)}`).join("")}
      ${box(4, 124, -14, 432, 42, 184, color)}
      <text x="220" y="155" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="27" letter-spacing="4" fill="#fff">${label}</text>
      <polygon points="${pts(lr)}" fill="${shade(color, 0.3)}"/><polygon points="${pts(rr)}" fill="${shade(color, -0.12)}"/>
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.12)}"/><stop offset="1" stop-color="${shade(color, -0.1)}"/></linearGradient></defs>
      <polygon points="${pts([P(10, 128, -12), apex, P(430, 128, -12)])}" fill="url(#${g})"/>
      <polygon points="${pts([P(56, 120, -12), P(220, 46, -12), P(384, 120, -12)])}" fill="${wall}"/>
      <g id="${id}Face">
        <circle cx="${apex[0] - 30}" cy="94" r="15" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="${apex[0] + 30}" cy="94" r="15" fill="#fff" stroke="${INK}" stroke-width="5"/>
        <circle class="pupil" cx="${apex[0] - 30}" cy="96" r="6.5" fill="${INK}"/><circle class="pupil" cx="${apex[0] + 30}" cy="96" r="6.5" fill="${INK}"/>
        <path id="${id}Mouth" d="M${apex[0] - 12} 112 Q${apex[0]} 118 ${apex[0] + 12} 112" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      ${flag ? `<rect x="${apex[0] - 3}" y="-60" width="6" height="${36 + 60 - 30 + 30}" fill="${INK}"/><path id="${id}Flag" d="M${apex[0] + 3} -58 Q${apex[0] + 40} -66 ${apex[0] + 70} -52 L${apex[0] + 70} -22 Q${apex[0] + 40} -36 ${apex[0] + 3} -28 Z" fill="${shade(color, 0.1)}" stroke="${INK}" stroke-width="3"/><text x="${apex[0] + 36}" y="-32" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#fff">₹</text>` : ""}
    </svg>`;
  };

  // ---------------------------------------------------------------- the referee's podium (NPCI)
  ISO.podium = ({ w = 380, color = "#F0566E", label = "NPCI" } = {}) => {
    return `<svg viewBox="0 0 400 220" width="${w}" height="${w * 0.55}" style="overflow:visible">
      ${shadow(200, 190, 210, 34, 0.22)}
      ${cyl(200, 70, 185, 100, "#F7F0E1", { ry: 50 })}
      ${cyl(200, 70, 185, 34, color, { ry: 50, top: false })}
      <ellipse cx="200" cy="70" rx="185" ry="50" fill="${shade("#F7F0E1", 0.5)}"/>
      <ellipse cx="200" cy="70" rx="150" ry="38" fill="none" stroke="${shade(color, 0.2)}" stroke-width="6" stroke-dasharray="18 12"/>
      <text x="200" y="158" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="40" letter-spacing="6" fill="${INK}">${label}</text>
    </svg>`;
  };

  // ---------------------------------------------------------------- phone (extruded) — HTML screen goes on top via EX.phoneBox
  ISO.phone = ({ w = 220, accent = "#12A4C4", body = "#2B3354" } = {}) => {
    const shape = (ox, oy, f) => `<rect x="${4 + ox}" y="${4 + oy}" width="212" height="443" rx="36" fill="${f}"/>`;
    return `<svg viewBox="0 0 220 451" width="${w}" height="${w * 2.05}" style="overflow:visible">
      ${shadow(150, 470, 170, 26, 0.18)}
      ${extrude(shape, 38, body, body, 12)}
      <rect x="4" y="4" width="212" height="443" rx="36" fill="none" stroke="${accent}" stroke-width="5"/>
      <rect x="16" y="18" width="188" height="415" rx="24" fill="#0E1530"/>
      <rect x="80" y="28" width="60" height="14" rx="7" fill="${body}"/>
      <path d="M30 40 Q30 26 44 24" stroke="#fff" stroke-opacity=".25" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>`;
  };

  // ---------------------------------------------------------------- thick gold coin
  ISO.coin = ({ size = 120, label = "₹" } = {}) => {
    const g = nid("cn");
    const shape = (ox, oy, f) => `<circle cx="${60 + ox}" cy="${60 + oy}" r="54" fill="${f}"/>`;
    return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" style="overflow:visible">
      <defs><radialGradient id="${g}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".55" stop-color="#F5B83A"/><stop offset="1" stop-color="#D98F12"/></radialGradient></defs>
      ${extrude(shape, 16, "#E59F1E", `url(#${g})`, 8)}
      <circle cx="60" cy="60" r="42" fill="none" stroke="#B87309" stroke-width="5" opacity=".55"/>
      <text x="60" y="${label.length > 2 ? 72 : 78}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="${label.length > 2 ? 34 : 50}" fill="#9A5D05">${label}</text>
    </svg>`;
  };

  // ---------------------------------------------------------------- envelope (the message)
  ISO.env = ({ w = 120, color = "#FFFFFF", seal = "#F0566E" } = {}) => {
    const shape = (ox, oy, f) => `<rect x="${ox}" y="${oy}" width="120" height="80" rx="8" fill="${f}"/>`;
    return `<svg viewBox="0 0 120 80" width="${w}" height="${w * 0.67}" style="overflow:visible">
      ${extrude(shape, 14, "#D9DCE8", color, 6)}
      <path d="M4 6 L60 46 L116 6" stroke="#C3C8DA" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <circle cx="60" cy="46" r="11" fill="${seal}"/>
    </svg>`;
  };

  // ---------------------------------------------------------------- soundbox speaker
  ISO.speaker = ({ w = 220, color = "#2B3354", light = "#22B573" } = {}) => `<svg viewBox="-10 -40 240 230" width="${w}" height="${w * 0.96}" style="overflow:visible">
      ${shadow(120, 176, 130, 20, 0.2)}
      ${box(0, 20, 0, 180, 150, 60, color)}
      <circle cx="80" cy="95" r="52" fill="${shade(color, -0.25)}"/>
      ${[44, 34, 24, 14].map((r, i) => `<circle cx="80" cy="95" r="${r}" fill="none" stroke="${shade(color, 0.25)}" stroke-width="4" opacity="${0.5 + i * 0.1}"/>`).join("")}
      <circle class="spkLight" cx="152" cy="50" r="11" fill="${light}"/>
      <rect x="140" y="80" width="26" height="60" rx="6" fill="${shade(color, 0.18)}"/>
    </svg>`;

  // ---------------------------------------------------------------- chai stall with striped awning
  ISO.stall = ({ w = 520, id = "st", qr = "", speaker = false } = {}) => {
    const wood = "#C9874B", aw = ["#F0566E", "#FFF5E6"];
    let awn = "";
    for (let i = 0; i < 8; i++) awn += `<path d="M${20 + i * 55} 70 L${75 + i * 55} 70 L${75 + i * 55} 110 Q${47.5 + i * 55} 134 ${20 + i * 55} 110 Z" fill="${aw[i % 2]}"/>`;
    return `<svg viewBox="-20 -120 600 560" width="${w}" height="${w * 0.93}" style="overflow:visible">
      ${shadow(290, 420, 320, 40, 0.2)}
      ${box(30, 60, 90, 400, 300, 40, "#E8D5B5")}
      <rect x="90" y="130" width="${360 * 0}" height="0"/>
      ${box(10, 250, 0, 440, 160, 130, wood)}
      ${[0, 1, 2, 3].map((k) => `<rect x="10" y="${280 + k * 32}" width="440" height="4" fill="${shade(wood, -0.2)}"/>`).join("")}
      ${box(0, 236, -6, 460, 18, 140, "#8A5A3B")}
      ${qr ? `<rect x="50" y="258" width="350" height="148" rx="12" fill="#fff" stroke="${INK}" stroke-width="5"/><text x="130" y="320" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="36" fill="${INK}">SCAN</text><text x="130" y="362" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="36" fill="#F0566E">&amp; PAY</text><g transform="translate(244 264)">${qr}</g>` : `<rect x="80" y="292" width="300" height="70" rx="12" fill="#FFF5E6" stroke="${INK}" stroke-width="5"/>
      <text x="230" y="344" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="44" fill="${INK}">CHAI ₹10</text>`}
      <rect x="18" y="66" width="12" height="176" fill="#8A5A3B"/><rect x="430" y="66" width="12" height="176" fill="#8A5A3B"/>
      ${box(10, 40, -10, 450, 32, 150, "#F0566E")}
      ${awn}
      ${qr ? `<rect x="120" y="-78" width="230" height="64" rx="12" fill="#FFF5E6" stroke="${INK}" stroke-width="5"/><text x="235" y="-33" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="38" fill="${INK}">CHAI ₹10</text><rect x="150" y="-14" width="8" height="14" fill="${INK}"/><rect x="312" y="-14" width="8" height="14" fill="${INK}"/>` : ""}
      ${speaker ? `<svg x="318" y="128" width="130" height="125" viewBox="-10 -40 240 230" style="overflow:visible">${ISO.speaker({ w: 240 }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>` : ""}
      <g id="${id}Kettle" ${speaker ? 'opacity="0"' : ""}><path d="M330 236 L338 182 Q366 168 394 182 L402 236 Z" fill="#A9B4C8" stroke="${INK}" stroke-width="4"/><path d="M398 194 Q428 192 432 212" stroke="${INK}" stroke-width="6" fill="none"/><path d="M336 196 L306 176" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><rect x="356" y="168" width="20" height="10" rx="4" fill="${INK}"/></g>
      ${[90, 140, 190].map((x) => `<path d="M${x} 236 L${x + 4} 204 L${x + 32} 204 L${x + 36} 236 Z" fill="#FFF5E6" stroke="${INK}" stroke-width="3"/><path d="M${x + 3} 214 L${x + 33} 214 L${x + 35} 234 L${x + 1} 234 Z" fill="#B5652E"/>`).join("")}
    </svg>`;
  };

  // ---------------------------------------------------------------- server / office computer with a face
  ISO.server = ({ w = 200, color = "#4B5785", id = "sv", screen = "#BDE9F5" } = {}) => `<svg viewBox="-10 -50 230 300" width="${w}" height="${w * 1.3}" style="overflow:visible">
      ${shadow(110, 236, 120, 18, 0.2)}
      ${box(10, 0, 0, 170, 230, 70, color)}
      <rect x="26" y="18" width="138" height="96" rx="10" fill="${screen}"/>
      <g id="${id}Face"><circle class="pupil" cx="70" cy="62" r="9" fill="${INK}"/><circle class="pupil" cx="120" cy="62" r="9" fill="${INK}"/><path d="M80 90 L110 90" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>
      ${[132, 160, 188].map((y) => `<rect x="26" y="${y}" width="138" height="18" rx="5" fill="${shade(color, -0.22)}"/><circle cx="150" cy="${y + 9}" r="4" fill="#22B573"/>`).join("")}
    </svg>`;

  // ---------------------------------------------------------------- bullet train, side view with shaded volume (picture style)
  // cars = number of cars incl. both nose cars; returns svg of width = cars*600 (scaled by w)
  ISO.bulletTrain = ({ w = 1800, cars = 3, id = "bt", stripe = "#2F6FE0", accent = "#F5A524" } = {}) => {
    const CL = 600, Hh = 120, top = 20, bot = 140, L = cars * CL;
    const noseF = `M6 128 C 40 118, 150 52, 330 ${top} L ${CL} ${top}`;
    const body = `${noseF} L ${L - CL} ${top} L ${L - 330} ${top} C ${L - 150} 52, ${L - 40} 118, ${L - 6} 128 C ${L} 134, ${L - 10} ${bot}, ${L - 30} ${bot} L 30 ${bot} C 10 ${bot}, 0 134, 6 128 Z`;
    const g = nid("tb"), cp = nid("tc"), hl = nid("th");
    let win = "";
    for (let c = 0; c < cars; c++) {
      const x0 = c * CL, from = c === 0 ? 360 : x0 + 40, to = c === cars - 1 ? L - 360 : x0 + CL - 40;
      for (let x = from; x + 34 <= to; x += 46) win += `<rect x="${x}" y="58" width="34" height="26" rx="7" fill="#1E2A48"/>`;
      if (c > 0) win += `<rect x="${x0 - 4}" y="${top}" width="8" height="${bot - top}" fill="#2A3350"/><rect x="${x0 + 14}" y="44" width="22" height="80" rx="5" fill="none" stroke="#C9D0DC" stroke-width="3"/>`;
    }
    return `<svg viewBox="-10 -40 ${L + 20} 230" width="${w}" height="${(w * 230) / (L + 20)}" style="overflow:visible">
      <defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F1F4F8"/><stop offset="1" stop-color="#B9C3D3"/></linearGradient>
        <linearGradient id="${hl}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <clipPath id="${cp}"><path d="${body}"/></clipPath>
      </defs>
      <ellipse cx="${L / 2}" cy="${bot + 26}" rx="${L / 2}" ry="14" fill="${INK}" opacity=".16"/>
      <g id="${id}Panto"><path d="M${CL * 1.5 - 60} ${top} L ${CL * 1.5 - 20} ${top - 34} L ${CL * 1.5 - 70} ${top - 62}" stroke="#7A859C" stroke-width="5" fill="none"/><rect x="${CL * 1.5 - 110}" y="${top - 66}" width="90" height="7" rx="3" fill="#5C677E"/><rect x="${CL * 1.5 - 90}" y="${top - 6}" width="70" height="8" rx="3" fill="#2A3350"/></g>
      <path d="${body}" fill="url(#${g})"/>
      <g clip-path="url(#${cp})">
        <rect x="0" y="${top}" width="${L}" height="14" fill="url(#${hl})"/>
        <rect x="0" y="100" width="${L}" height="12" fill="${stripe}"/>
        <rect x="0" y="115" width="${L}" height="4" fill="${accent}"/>
        <rect x="0" y="128" width="${L}" height="${bot}" fill="#C5CCD8"/>
        ${win}
        <path d="M120 82 C 170 62, 230 40, 300 30 L 312 52 C 250 60, 190 74, 140 90 Z" fill="#1E2A48"/>
        <path d="M${L - 120} 82 C ${L - 170} 62, ${L - 230} 40, ${L - 300} 30 L ${L - 312} 52 C ${L - 250} 60, ${L - 190} 74, ${L - 140} 90 Z" fill="#1E2A48"/>
      </g>
      ${Array.from({ length: cars }, (_, c) => [c * CL + 110, c * CL + CL - 110]).flat().map((x) => `<rect x="${x - 60}" y="${bot - 6}" width="120" height="18" rx="6" fill="#2A3350"/><circle cx="${x - 32}" cy="${bot + 10}" r="9" fill="#5C677E"/><circle cx="${x + 32}" cy="${bot + 10}" r="9" fill="#5C677E"/>`).join("")}
    </svg>`;
  };

  // ---------------------------------------------------------------- padlock
  ISO.lock = ({ w = 260, color = "#F5A524", id = "lk" } = {}) => {
    const body = (ox, oy, f) => `<rect x="${20 + ox}" y="${120 + oy}" width="220" height="180" rx="34" fill="${f}"/>`;
    return `<svg viewBox="0 0 260 320" width="${w}" height="${w * 1.23}" style="overflow:visible">
      ${shadow(150, 312, 140, 16, 0.2)}
      <path id="${id}Shackle" d="M70 126 V80 Q70 24 130 24 Q190 24 190 80 V126" stroke="#A9B4C8" stroke-width="30" fill="none"/>
      <path d="M70 126 V80 Q70 24 130 24" stroke="#D5DCE8" stroke-width="10" fill="none"/>
      ${extrude(body, 26, color, color, 10)}
      <rect x="40" y="138" width="180" height="20" rx="10" fill="#fff" opacity=".35"/>
      <circle cx="130" cy="200" r="24" fill="${INK}"/><path d="M122 210 L118 252 L142 252 L138 210 Z" fill="${INK}"/>
    </svg>`;
  };

  // ---------------------------------------------------------------- scenery
  ISO.tree = ({ h = 200, color = "#3FBF7F" } = {}) => `<svg viewBox="0 0 120 200" width="${h * 0.6}" height="${h}" style="overflow:visible">
      ${shadow(64, 192, 50, 10, 0.18)}<rect x="54" y="120" width="14" height="72" rx="4" fill="#8A5A3B"/>
      <circle cx="60" cy="86" r="50" fill="${shade(color, -0.12)}"/><circle cx="48" cy="72" r="38" fill="${color}"/><circle cx="40" cy="60" r="14" fill="${shade(color, 0.35)}"/>
    </svg>`;
  ISO.cloud = ({ w = 260, color = "#FFFFFF", o = 0.9 } = {}) => `<svg viewBox="0 0 260 110" width="${w}" height="${w * 0.42}" opacity="${o}"><path d="M30 100 Q0 100 4 74 Q10 50 40 54 Q46 20 86 22 Q110 0 144 16 Q180 4 196 40 Q240 36 250 70 Q258 100 226 100 Z" fill="${color}"/></svg>`;
  // a row of soft buildings for the horizon
  ISO.city = ({ w = 1920, h = 300, seed = 3, color = "#B9C6E8" } = {}) => {
    const r = REEL.rng(seed); let s = "", x = -40;
    while (x < w) { const bw = 90 + r() * 120, bh = 90 + r() * (h - 120); s += box(x, h - bh, 30, bw, bh, 40, color, { grad: false, front: color, side: shade(color, -0.12), top: shade(color, 0.3) }); for (let wy = h - bh + 20; wy < h - 30; wy += 34) for (let wx = x + 16; wx < x + bw - 24; wx += 30) if (r() < 0.55) s += `<rect x="${wx}" y="${wy}" width="14" height="18" rx="2" fill="${shade(color, 0.45)}"/>`; x += bw + 10 + r() * 30; }
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="overflow:visible">${s}</svg>`;
  };
  // road between points (SVG path d) with dashes
  ISO.road = (d, { wd = 54, color = "#F6F3EC", edge = "#D6D9E4", dash = "#C9CEDD", id = "" } = {}) => `<path d="${d}" stroke="${edge}" stroke-width="${wd + 10}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${color}" stroke-width="${wd}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path ${id ? `id="${id}"` : ""} d="${d}" stroke="${dash}" stroke-width="5" stroke-dasharray="18 16" fill="none" stroke-linecap="round"/>`;

  window.ISO = ISO;
})();
