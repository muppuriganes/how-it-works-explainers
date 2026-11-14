// atm.js — picture-style (3D-looking 2D) art kit for the ATM explainer. Load after iso.js.
// Every builder returns an SVG/HTML string. Animated parts carry ids/classes (noted per builder).
(function () {
  const { box, cyl, shadow, extrude, shade } = ISO;
  const INK = "#1B2340", TEAL = "#12A4C4", NAVY = "#2B3354", GOLD = "#E9B949";
  const NOTE = { 100: ["#B9A6E8", "#8E74D6"], 200: ["#FFD15C", "#E9A90F"], 500: ["#B9C4B0", "#8E9C84"] };
  const svg = (vb, w, h, s) => `<svg viewBox="${vb}" width="${w}" height="${h}" style="overflow:visible">${s}</svg>`;
  const A = {};

  // ---------------------------------------------------------------- the ATM machine (front, 3D body)
  // ids: ${id}Scr (screen group), ${id}Slot (card slot light), ${id}Cash (cash slot), ${id}Shut (shutter), ${id}Rcpt (receipt slot)
  A.machine = ({ w = 420, id = "atm", scr = "" } = {}) => svg("0 0 460 700", w, w * 1.52, `
    ${shadow(230, 690, 230, 22, 0.22)}
    ${box(20, 60, 0, 380, 620, 70, "#3E4A7A")}
    <rect x="20" y="60" width="380" height="74" fill="${TEAL}"/><rect x="20" y="126" width="380" height="8" fill="${shade(TEAL, -0.25)}"/>
    <text x="210" y="112" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="46" fill="#fff" letter-spacing="6">ATM</text>
    <circle cx="372" cy="96" r="12" fill="#1B2340"/><circle cx="372" cy="96" r="6" fill="#5B7BD6"/>
    <rect x="44" y="156" width="332" height="230" rx="16" fill="#1B2340"/>
    <g id="${id}Scr"><rect x="60" y="172" width="300" height="198" rx="8" fill="#BDE9F5"/>${scr}</g>
    ${[0, 1, 2].map((i) => `<rect x="24" y="${190 + i * 56}" width="18" height="36" rx="4" fill="#5C677E"/><rect x="378" y="${190 + i * 56}" width="18" height="36" rx="4" fill="#5C677E"/>`).join("")}
    ${box(40, 404, 0, 340, 26, 30, "#4B5785")}
    <rect x="250" y="440" width="120" height="16" rx="8" fill="#1B2340"/><rect id="${id}Slot" x="262" y="445" width="96" height="6" rx="3" fill="#22D07A"/>
    <text x="310" y="476" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="13" fill="#C9D0DC">CARD</text>
    ${Array.from({ length: 12 }, (_, i) => { const x = 60 + (i % 3) * 52, y = 440 + Math.floor(i / 3) * 34; return `<rect x="${x}" y="${y + 4}" width="44" height="26" rx="6" fill="#11182E"/><rect x="${x}" y="${y}" width="44" height="26" rx="6" fill="#E6E8F0"/>`; }).join("")}
    ${["#F0566E", "#FFC93D", "#22B573"].map((c, i) => `<rect x="222" y="${444 + i * 34}" width="20" height="26" rx="5" fill="${c}"/>`).join("")}
    <rect x="250" y="490" width="120" height="14" rx="7" fill="#1B2340"/><rect id="${id}Rcpt" x="262" y="494" width="96" height="6" rx="3" fill="#8A93AB"/>
    <text x="310" y="522" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="13" fill="#C9D0DC">RECEIPT</text>
    <rect x="70" y="586" width="280" height="54" rx="12" fill="#11182E"/>
    <rect id="${id}Cash" x="86" y="598" width="248" height="30" rx="6" fill="#0B0F20"/>
    <rect id="${id}Shut" x="86" y="598" width="248" height="30" rx="6" fill="#5C677E"/><path d="M96 613 L 324 613" stroke="#8A93AB" stroke-width="3" stroke-dasharray="10 8"/>
    <text x="210" y="660" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="13" fill="#C9D0DC">CASH</text>`);

  // tiny ATM screen contents (sit on the 300x198 screen at 60,172 inside A.machine, or alone via A.screen)
  A.scrText = (title, sub = "", c = INK) => `<text x="210" y="${sub ? 262 : 276}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="30" fill="${c}">${title}</text>${sub ? `<text x="210" y="300" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="22" fill="${INK}" opacity=".65">${sub}</text>` : ""}`;
  A.screen = (title, sub = "", { w = 300, c = INK, bg = "#BDE9F5" } = {}) => svg("44 156 332 230", w, w * 0.693, `<rect x="44" y="156" width="332" height="230" rx="16" fill="#1B2340"/><rect x="60" y="172" width="300" height="198" rx="8" fill="${bg}"/>${A.scrText(title, sub, c)}`);

  // ---------------------------------------------------------------- the ATM cabin: glass booth, AC, sleeping guard
  // ids: ${id}Z (zzz group), ${id}Head (guard head, rotate around 196 352)
  A.cabin = ({ w = 900, id = "cab" } = {}) => svg("0 0 900 600", w, w * 0.667, `
    ${shadow(450, 590, 440, 18, 0.18)}
    <rect x="20" y="40" width="860" height="540" rx="18" fill="#E7EEF8" stroke="#1B2340" stroke-width="5"/>
    <rect x="20" y="40" width="860" height="70" rx="18" fill="${TEAL}"/><rect x="20" y="96" width="860" height="14" fill="${shade(TEAL, -0.2)}"/>
    <text x="450" y="90" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="40" fill="#fff" letter-spacing="10">24 × 7 ATM</text>
    <rect x="36" y="124" width="828" height="440" fill="#DCEAF7"/><path d="M36 124 L 300 124 L 140 564 L 36 564 Z" fill="#fff" opacity=".35"/>
    <rect x="36" y="500" width="828" height="64" fill="#C9D3E3"/>
    ${box(620, 150, 0, 210, 60, 22, "#F4F6FA")}<path d="M630 212 L 820 212" stroke="#9AA3B4" stroke-width="4"/><path d="M650 222 l 0 30 M700 222 l 0 40 M750 222 l 0 30 M800 222 l 0 40" stroke="#BDE9F5" stroke-width="5" stroke-linecap="round" opacity=".9"/>
    <g transform="translate(440 150) scale(0.6)">${A.machine({ w: 460, id: id + "M" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>
    <rect x="130" y="420" width="130" height="14" rx="6" fill="#F0566E"/><rect x="140" y="434" width="10" height="120" fill="#C93A50"/><rect x="240" y="434" width="10" height="120" fill="#C93A50"/><rect x="140" y="330" width="14" height="100" rx="6" fill="#F0566E"/>
    <path d="M150 430 L 150 380 Q 150 350 180 350 L 220 350 Q 246 350 250 376 L 262 430 Z" fill="#2F4A94"/><path d="M170 432 L 166 520 M236 432 L 252 520" stroke="#2F4A94" stroke-width="26" stroke-linecap="round"/><path d="M160 524 L 180 524 M242 524 L 266 524" stroke="#2B2118" stroke-width="16" stroke-linecap="round"/>
    <g id="${id}Head"><circle cx="208" cy="318" r="34" fill="#C98B5E"/><path d="M172 306 Q 176 270 210 272 Q 244 274 246 304 Z" fill="#2F4A94"/><rect x="168" y="300" width="84" height="12" rx="6" fill="#1B2F6A"/><path d="M192 326 q 8 5 16 0 M216 326 q 8 5 16 0" stroke="#2B2118" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M200 340 q 8 6 16 0" stroke="#2B2118" stroke-width="4" fill="none"/></g>
    <g id="${id}Z" font-family="Archivo" font-weight="900" fill="#7B61FF"><text x="262" y="270" font-size="34">Z</text><text x="292" y="236" font-size="44">Z</text><text x="330" y="196" font-size="56">Z</text></g>`);

  // ---------------------------------------------------------------- debit card (front / back) with thickness
  // front ids: ${id}Chip ; back: magnetic stripe
  A.card = ({ w = 420, id = "cd", back = false, c1 = "#7B61FF", c2 = "#12A4C4" } = {}) => {
    const shape = (ox, oy, f) => `<rect x="${10 + ox}" y="${10 + oy}" width="400" height="252" rx="26" fill="${f}"/>`;
    const gid = id + "G";
    const face = back
      ? `<rect x="10" y="10" width="400" height="252" rx="26" fill="url(#${gid})"/><rect x="10" y="44" width="400" height="56" fill="#1B2340"/><rect x="36" y="130" width="250" height="44" rx="6" fill="#F7F3E8"/><path d="M48 160 q 20 -24 40 0 t 40 0 t 40 0" stroke="#3E7BFA" stroke-width="3" fill="none"/><rect x="296" y="134" width="64" height="36" rx="6" fill="#fff"/><text x="328" y="160" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="20" fill="#1B2340">•••</text><text x="36" y="226" font-family="JetBrains Mono" font-weight="700" font-size="16" fill="#fff" opacity=".8">MAGNETIC STRIPE · EASY TO COPY</text>`
      : `<rect x="10" y="10" width="400" height="252" rx="26" fill="url(#${gid})"/><path d="M10 190 Q 200 120 410 200 L 410 236 Q 410 262 384 262 L 36 262 Q 10 262 10 236 Z" fill="#fff" opacity=".12"/>
        <text x="40" y="58" font-family="Archivo" font-weight="900" font-size="28" fill="#fff">YOUR BANK</text><text x="340" y="58" text-anchor="end" font-family="JetBrains Mono" font-weight="800" font-size="18" fill="#fff" opacity=".85">DEBIT</text>
        <g id="${id}Chip"><rect x="44" y="96" width="70" height="54" rx="10" fill="${GOLD}" stroke="#B88A1E" stroke-width="3"/><path d="M44 114 L 70 114 M44 132 L 70 132 M88 114 L 114 114 M88 132 L 114 132 M70 96 L 70 150 M88 96 L 88 150" stroke="#B88A1E" stroke-width="3"/></g>
        <path d="M140 108 q 10 15 0 30 M154 100 q 16 23 0 46 M168 92 q 22 31 0 62" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
        <text x="44" y="200" font-family="JetBrains Mono" font-weight="800" font-size="26" fill="#fff" letter-spacing="3">•••• •••• •••• 4821</text>
        <text x="44" y="240" font-family="Archivo" font-weight="800" font-size="20" fill="#fff" opacity=".9">YOU</text><circle cx="342" cy="228" r="22" fill="#F0566E" opacity=".9"/><circle cx="370" cy="228" r="22" fill="#FFC93D" opacity=".85"/>`;
    return svg("0 0 440 290", w, w * 0.66, `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>${shadow(220, 286, 200, 12, 0.2)}${extrude(shape, 12, shade(c1, -0.2), "none", 4)}${face}`);
  };

  // ---------------------------------------------------------------- chip close-up: gold contacts + the tiny computer inside
  A.chip = ({ w = 380, id = "ch" } = {}) => svg("0 0 400 300", w, w * 0.75, `
    ${shadow(200, 290, 180, 12, 0.2)}
    ${extrude((ox, oy, f) => `<rect x="${30 + ox}" y="${40 + oy}" width="300" height="230" rx="34" fill="${f}"/>`, 18, "#B88A1E", "none", 6)}
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE59A"/><stop offset=".5" stop-color="${GOLD}"/><stop offset="1" stop-color="#C9962A"/></linearGradient></defs>
    <rect x="30" y="40" width="300" height="230" rx="34" fill="url(#${id}g)" stroke="#9C7416" stroke-width="5"/>
    <path d="M30 116 L 120 116 M30 194 L 120 194 M240 116 L 330 116 M240 194 L 330 194 M120 40 L 120 270 M240 40 L 240 270" stroke="#9C7416" stroke-width="6"/>
    <g id="${id}Die"><rect x="134" y="104" width="92" height="102" rx="10" fill="#1B2340" stroke="#fff" stroke-width="4"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M134 ${120 + i * 22} L 116 ${120 + i * 22} M226 ${120 + i * 22} L 244 ${120 + i * 22}" stroke="#fff" stroke-width="4"/>`).join("")}
    <rect x="150" y="122" width="26" height="26" rx="4" fill="#22D07A"/><rect x="186" y="122" width="26" height="26" rx="4" fill="#12A4C4"/><rect x="150" y="160" width="62" height="28" rx="4" fill="#7B61FF"/></g>
    <rect x="278" y="10" width="112" height="44" rx="22" fill="#1B2340"/><text x="334" y="40" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="18" fill="#FFC93D">TINY CPU</text>`);

  // ---------------------------------------------------------------- PIN pad (3D keys) with an optional covering hand
  // ids: ${id}K0..${id}K9 (digit keys), ${id}Hand
  A.pinpad = ({ w = 400, id = "pp", hand = true } = {}) => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];
    let k = "";
    keys.forEach((n, i) => { if (n === "") return; const x = 50 + (i % 3) * 82, y = 70 + Math.floor(i / 3) * 70; k += `<g id="${id}K${n}">${box(x, y, 0, 64, 50, 12, "#E6E8F0")}<text x="${x + 32}" y="${y + 36}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="30" fill="${INK}">${n}</text></g>`; });
    [["CANCEL", "#F0566E"], ["CLEAR", "#FFC93D"], ["ENTER", "#22B573"]].forEach(([t, c], i) => { const y = 70 + i * 70; k += `${box(306, y, 0, 96, 50, 12, c)}<text x="354" y="${y + 32}" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="${i === 1 ? INK : "#fff"}">${t}</text>`; });
    const hd = hand ? `<g id="${id}Hand" transform="translate(170 150) scale(0.62)"><path d="M150 380 Q 120 230 210 170 Q 300 120 370 150 Q 402 168 380 196 Q 320 200 300 240 L 340 250 Q 372 262 352 292 Q 300 300 300 330 L 300 380 Z" fill="#E2A77D" stroke="${INK}" stroke-width="4"/><path d="M230 186 Q 280 170 330 178 M240 214 Q 290 200 340 206" stroke="#C98B5E" stroke-width="4" fill="none"/><rect x="130" y="376" width="200" height="60" rx="14" fill="#F2553D"/></g>` : "";
    return svg("0 0 460 430", w, w * 0.935, `${shadow(220, 410, 210, 14, 0.2)}${box(26, 46, 0, 400, 330, 26, "#5C677E")}<rect x="40" y="58" width="372" height="306" rx="14" fill="#3E4A6A"/>${k}${hd}`);
  };

  // ---------------------------------------------------------------- inside the safe: cutaway (side cross-section)
  // ids/classes: .rl (rollers, rotate around own center: data-cx/data-cy), ${id}Beam (sensor laser), ${id}Path (note path for motion), ${id}Shut
  A.cutaway = ({ w = 760, id = "cut" } = {}) => {
    const cas = [[500, "₹500"], [200, "₹200"], [100, "₹100"]];
    let s = `${shadow(380, 1000, 360, 20, 0.22)}${box(60, 60, 0, 600, 920, 60, "#4B5785")}
      <rect x="84" y="84" width="552" height="872" rx="18" fill="#E9EDF5"/><rect x="84" y="430" width="552" height="526" rx="18" fill="#D6DCE8"/>
      <rect x="84" y="410" width="552" height="22" fill="#5C677E"/><text x="104" y="404" font-family="JetBrains Mono" font-weight="800" font-size="18" fill="#5C677E">SAFE (STEEL, BOLTED DOWN)</text>`;
    cas.forEach(([n, lab], i) => {
      const y = 470 + i * 150, [c1, c2] = NOTE[n];
      s += `${box(110, y, 0, 300, 110, 30, "#8A93AB")}<rect x="126" y="${y + 16}" width="268" height="78" rx="8" fill="#F4F6FA"/>`;
      for (let j = 0; j < 9; j++) s += `<rect x="${136 + j * 3}" y="${y + 24 + j * 0}" width="230" height="62" rx="4" fill="${j % 2 ? c1 : c2}" transform="translate(${j * 2} 0)" opacity=".95"/>`;
      s += `<rect x="290" y="${y + 36}" width="90" height="34" rx="8" fill="#1B2340"/><text x="335" y="${y + 60}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#fff">${lab}</text>`;
      s += `<g class="rl" data-cx="440" data-cy="${y + 54}"><circle cx="440" cy="${y + 54}" r="22" fill="#1B2340"/><circle cx="440" cy="${y + 54}" r="9" fill="#C9D0DC"/><path d="M440 ${y + 36} L 440 ${y + 72} M422 ${y + 54} L 458 ${y + 54}" stroke="#5C677E" stroke-width="4"/></g>`;
    });
    s += `${box(110, 870, 0, 300, 70, 26, "#F0566E")}<text x="260" y="914" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="20" fill="#fff">REJECT BIN</text>`;
    s += `<path id="${id}Path" d="M470 830 L 520 830 L 520 300 L 520 200 L 360 200 L 190 200" stroke="#1B2340" stroke-width="22" fill="none" stroke-linejoin="round" opacity=".18"/>`;
    s += `<path d="M520 860 L 520 200" stroke="#5C677E" stroke-width="10" stroke-dasharray="18 10"/>`;
    s += `${box(540, 300, 0, 70, 90, 20, "#7B61FF")}<rect id="${id}Beam" x="498" y="340" width="60" height="8" rx="4" fill="#FF4D6A"/><text x="575" y="290" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="#7B61FF">2-NOTE</text><text x="575" y="406" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="#7B61FF">SENSOR</text>`;
    [[520, 250], [430, 200], [300, 200]].forEach(([x, y]) => (s += `<g class="rl" data-cx="${x}" data-cy="${y - 26}"><circle cx="${x}" cy="${y - 26}" r="16" fill="#1B2340"/><circle cx="${x}" cy="${y - 26}" r="6" fill="#C9D0DC"/></g>`));
    s += `${box(150, 120, 0, 240, 60, 20, "#12A4C4")}<text x="270" y="158" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="18" fill="#fff">STACKER</text>`;
    s += `<rect x="60" y="180" width="30" height="80" fill="#1B2340"/><rect id="${id}Shut" x="60" y="180" width="30" height="80" fill="#8A93AB"/><text x="100" y="244" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="#5C677E">◀ SHUTTER</text>`;
    s += `${box(430, 100, 0, 170, 70, 20, "#C9D0DC")}<circle cx="470" cy="135" r="24" fill="#fff" stroke="#8A93AB" stroke-width="5"/><text x="540" y="141" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="15" fill="${INK}">PRINTER</text>`;
    return svg("0 0 720 1020", w, w * 1.417, s);
  };

  // single cash cassette with a window showing the notes
  A.cassette = ({ w = 340, n = 500 } = {}) => { const [c1, c2] = NOTE[n]; let s = `${shadow(170, 230, 160, 12, 0.2)}${box(20, 50, 0, 280, 160, 50, "#8A93AB")}<rect x="40" y="74" width="240" height="96" rx="10" fill="#F4F6FA"/>`; for (let j = 0; j < 10; j++) s += `<rect x="${52 + j * 2}" y="88" width="196" height="68" rx="4" fill="${j % 2 ? c1 : c2}"/>`; s += `<rect x="96" y="180" width="128" height="22" rx="11" fill="#1B2340"/><text x="160" y="197" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="#fff">₹${n} · 2,000</text><rect x="120" y="36" width="80" height="16" rx="8" fill="#5C677E"/>`; return svg("0 0 340 240", w, w * 0.706, s); };

  // a stylised banknote with thickness (not a copy of any real note)
  A.note = ({ w = 320, n = 500, rot = 0 } = {}) => { const [c1, c2] = NOTE[n]; return svg("0 0 330 160", w, w * 0.485, `<g transform="rotate(${rot} 165 80)">${extrude((ox, oy, f) => `<rect x="${10 + ox}" y="${16 + oy}" width="300" height="134" rx="10" fill="${f}"/>`, 6, c2, c1, 3)}<rect x="22" y="28" width="276" height="110" rx="6" fill="none" stroke="${shade(c2, -0.2)}" stroke-width="3"/><circle cx="96" cy="83" r="34" fill="${shade(c1, 0.3)}" stroke="${shade(c2, -0.15)}" stroke-width="3"/><rect x="176" y="28" width="6" height="110" fill="${shade(c2, -0.3)}" opacity=".6"/><text x="292" y="64" text-anchor="end" font-family="Archivo" font-weight="900" font-size="38" fill="${shade(c2, -0.45)}">₹${n}</text><text x="292" y="126" text-anchor="end" font-family="Archivo" font-weight="900" font-size="22" fill="${shade(c2, -0.35)}">${n}</text><path d="M200 100 q 20 -16 40 0 t 40 0" stroke="${shade(c2, -0.2)}" stroke-width="3" fill="none"/></g>`); };
  // a fan of notes coming out of the cash slot
  A.fan = ({ w = 420, notes = [500, 500, 200, 100] } = {}) => svg("0 0 460 300", w, w * 0.65, `${shadow(230, 286, 200, 12, 0.2)}${notes.map((n, i) => `<g transform="translate(${60 + i * 26} ${70 - i * 10}) rotate(${-12 + i * 8} 165 140)">${A.note({ w: 300, n }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>`).join("")}<rect x="20" y="236" width="420" height="40" rx="12" fill="#11182E"/>`);

  // receipt printer with a paper roll; id ${id}Paper (paper strip, scaleY from top)
  A.printer = ({ w = 360, id = "pr" } = {}) => svg("0 0 380 340", w, w * 0.895, `${shadow(190, 330, 170, 12, 0.2)}${box(30, 150, 0, 300, 170, 50, "#C9D0DC")}${cyl(180, 90, 70, 60, "#FFFFFF", { ry: 20 })}<circle cx="180" cy="120" r="20" fill="#E6E8F0" stroke="#8A93AB" stroke-width="4"/><rect x="70" y="196" width="220" height="16" rx="8" fill="#1B2340"/><g id="${id}Paper"><path d="M86 204 L 274 204 L 274 300 L 262 292 L 250 300 L 238 292 L 226 300 L 214 292 L 202 300 L 190 292 L 178 300 L 166 292 L 154 300 L 142 292 L 130 300 L 118 292 L 106 300 L 94 292 L 86 300 Z" fill="#fff" stroke="#C9D0DC" stroke-width="2"/>${[226, 244, 262].map((y) => `<rect x="104" y="${y}" width="${150 - (y % 3) * 20}" height="7" rx="3" fill="#C9D0DC"/>`).join("")}</g><circle cx="300" cy="180" r="8" fill="#22D07A"/>`);

  // receipt (HTML) — lines: [[label, value], ...]; used for the chapter chrome and the final slip
  A.receipt = (lines, { w = 420, title = "ATM RECEIPT", foot = "THANK YOU · VISIT AGAIN" } = {}) => `<div style="width:${w}px;background:#fff;padding:22px 26px 34px;font-family:'JetBrains Mono';font-weight:700;color:${INK};clip-path:polygon(0 0,100% 0,100% calc(100% - 12px),95% 100%,90% calc(100% - 12px),85% 100%,80% calc(100% - 12px),75% 100%,70% calc(100% - 12px),65% 100%,60% calc(100% - 12px),55% 100%,50% calc(100% - 12px),45% 100%,40% calc(100% - 12px),35% 100%,30% calc(100% - 12px),25% 100%,20% calc(100% - 12px),15% 100%,10% calc(100% - 12px),5% 100%,0 calc(100% - 12px));filter:drop-shadow(0 10px 0 rgba(27,35,64,.25))">
    <div style="text-align:center;font-weight:800;font-size:22px;letter-spacing:.14em">${title}</div><div style="border-top:3px dashed rgba(27,35,64,.3);margin:12px 0"></div>
    ${lines.map(([a, b]) => `<div class="rcl" style="display:flex;justify-content:space-between;font-size:20px;padding:5px 0"><span>${a}</span><span>${b}</span></div>`).join("")}
    <div style="border-top:3px dashed rgba(27,35,64,.3);margin:12px 0"></div><div style="text-align:center;font-size:16px;opacity:.6">${foot}</div></div>`;

  // ---------------------------------------------------------------- the network: NPCI switch hub
  // class .hl (glowing rings)
  A.hub = ({ w = 360, label = "NPCI · NFS" } = {}) => svg("0 0 360 380", w, w * 1.055, `${shadow(180, 368, 160, 14, 0.22)}${cyl(180, 120, 120, 220, "#3E4A7A", { ry: 36 })}${[170, 230, 290].map((y, i) => `<ellipse class="hl" cx="180" cy="${y}" rx="121" ry="36" fill="none" stroke="#22D07A" stroke-width="7" opacity="${0.5 + i * 0.2}"/>`).join("")}<rect x="90" y="180" width="180" height="58" rx="12" fill="#1B2340"/><text x="180" y="218" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="22" fill="#FFC93D">${label}</text>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${90 + i * 36}" cy="140" r="7" fill="${i % 2 ? "#22D07A" : "#FFC93D"}"/>`).join("")}<path d="M180 84 L 180 40 M160 40 L 200 40" stroke="#5C677E" stroke-width="8" stroke-linecap="round"/><circle cx="180" cy="34" r="10" fill="#F0566E"/>`);

  // the request message travelling between banks (capsule with a lock)
  A.packet = ({ w = 360, text = "₹2,000 · CARD ••4821", lock = true, c = "#7B61FF" } = {}) => svg("0 0 380 130", w, w * 0.342, `${shadow(190, 124, 160, 8, 0.2)}${extrude((ox, oy, f) => `<rect x="${14 + ox}" y="${20 + oy}" width="340" height="92" rx="46" fill="${f}"/>`, 10, shade(c, -0.25), c, 4)}${lock ? `<rect x="42" y="56" width="40" height="32" rx="6" fill="#FFC93D" stroke="${INK}" stroke-width="3"/><path d="M50 56 L 50 46 Q 50 32 62 32 Q 74 32 74 46 L 74 56" stroke="${INK}" stroke-width="5" fill="none"/>` : ""}<text x="${lock ? 222 : 184}" y="74" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="20" fill="#fff">${text}</text>`);

  // PIN → encrypted block (inside the PIN pad's own chip)
  A.pinblock = ({ w = 520 } = {}) => svg("0 0 560 170", w, w * 0.304, `${["4", "8", "2", "1"].map((d, i) => `${box(10 + i * 62, 50, 0, 50, 64, 10, "#E6E8F0")}<text x="${35 + i * 62}" y="94" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="34" fill="${INK}">${d}</text>`).join("")}<path d="M268 82 L 318 82" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M304 66 L 322 82 L 304 98" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${extrude((ox, oy, f) => `<rect x="${340 + ox}" y="${34 + oy}" width="206" height="96" rx="18" fill="${f}"/>`, 10, "#11182E", "#1B2340", 4)}<text x="443" y="78" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="#22D07A">7F3A 9C02</text><text x="443" y="110" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="#22D07A">E61B 44D8</text><rect x="510" y="18" width="34" height="28" rx="6" fill="#FFC93D" stroke="${INK}" stroke-width="3"/>`);

  // your bank's checks + APPROVED stamp (HTML) ; ids ${id}C0..C2 rows, ${id}St stamp
  A.checks = ({ w = 460, id = "ck", bal = "₹12,450" } = {}) => `<div style="position:relative;width:${w}px;background:#fff;border-radius:24px;padding:22px 26px;font-family:Archivo;color:${INK};border:3px solid ${INK};box-shadow:0 9px 0 ${INK},0 26px 44px rgba(27,35,64,.3)">
    <div style="font-family:'JetBrains Mono';font-weight:800;font-size:18px;letter-spacing:.14em;opacity:.55">YOUR ACCOUNT</div><div style="font-weight:900;font-size:44px">${bal}</div>
    ${["Enough balance", "Under daily limit", "Card not blocked"].map((t, i) => `<div id="${id}C${i}" style="display:flex;gap:12px;align-items:center;font-weight:800;font-size:26px;padding:6px 0"><span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#22B573;color:#fff;align-items:center;justify-content:center;font-size:22px">✓</span>${t}</div>`).join("")}
    <div id="${id}St" style="position:absolute;right:-14px;top:-30px;padding:4px 16px;border:6px solid #22B573;border-radius:12px;color:#22B573;font-weight:900;font-size:34px;transform:rotate(-10deg);background:rgba(255,255,255,.9)">APPROVED</div></div>`;

  // heart-rate monitor for the running joke; ids ${id}Line (polyline, set points per frame), ${id}Bpm
  A.ecg = ({ w = 420, id = "ecg", flat = false } = {}) => {
    let pts = ""; for (let x = 0; x <= 340; x += 4) { const k = x % 85; const y = flat && x > 150 ? 70 : k > 40 && k < 46 ? 20 : k >= 46 && k < 52 ? 110 : k >= 52 && k < 58 ? 60 : 70; pts += `${30 + x},${50 + y} `; }
    return svg("0 0 420 260", w, w * 0.62, `${shadow(210, 250, 190, 10, 0.2)}${box(10, 20, 0, 380, 220, 22, "#3E4A6A")}<rect x="26" y="36" width="348" height="160" rx="12" fill="#0E1530"/><path d="M26 76 L374 76 M26 116 L374 116 M26 156 L374 156" stroke="#1E2A4A" stroke-width="2"/><polyline id="${id}Line" points="${pts}" fill="none" stroke="${flat ? "#F0566E" : "#22D07A"}" stroke-width="5" stroke-linejoin="round"/><text id="${id}Bpm" x="360" y="64" text-anchor="end" font-family="JetBrains Mono" font-weight="800" font-size="24" fill="${flat ? "#F0566E" : "#22D07A"}">${flat ? "♥ 0" : "♥ 118"}</text><circle cx="52" cy="216" r="8" fill="#22D07A"/><rect x="250" y="208" width="110" height="16" rx="8" fill="#5C677E"/>`);
  };

  // 10-second timer (digital) ; id ${id}N
  A.timer = ({ w = 300, id = "tm", text = "00:10" } = {}) => svg("0 0 300 170", w, w * 0.567, `${shadow(150, 164, 130, 8, 0.2)}${box(14, 30, 0, 260, 120, 18, "#1B2340")}<rect x="30" y="46" width="228" height="88" rx="10" fill="#0B0F20"/><text id="${id}N" x="144" y="112" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="62" fill="#FFC93D">${text}</text><rect x="120" y="14" width="48" height="18" rx="6" fill="#F0566E"/>`);

  // receipt-style chapter tracker chrome (HTML) — n = current step (1..5)
  A.STEPS = ["Card & chip", "PIN check", "Bank network", "Bank says yes", "Cash out"];
  A.trackerSlip = (n, { w = 330 } = {}) => A.receipt(A.STEPS.map((s, i) => [`${String(i + 1).padStart(2, "0")} ${s.toUpperCase()}`, i + 1 < n ? "✓" : i + 1 === n ? "▶" : "·"]), { w, title: "TXN #4821", foot: `STEP ${n} OF ${A.STEPS.length}` });

  // standalone sleeping guard on a plastic chair; ids ${id}Head (rotate around 108 182), ${id}Z
  A.guard = ({ w = 260, id = "gd" } = {}) => svg("0 0 260 300", w, w * 1.154, `${shadow(120, 292, 110, 10, 0.2)}
    <rect x="30" y="170" width="130" height="14" rx="6" fill="#F0566E"/><rect x="40" y="184" width="10" height="110" fill="#C93A50"/><rect x="140" y="184" width="10" height="110" fill="#C93A50"/><rect x="40" y="80" width="14" height="100" rx="6" fill="#F0566E"/>
    <path d="M50 180 L 50 130 Q 50 100 80 100 L 120 100 Q 146 100 150 126 L 162 180 Z" fill="#2F4A94"/><path d="M70 182 L 66 270 M136 182 L 152 270" stroke="#2F4A94" stroke-width="26" stroke-linecap="round"/><path d="M60 274 L 80 274 M142 274 L 166 274" stroke="#2B2118" stroke-width="16" stroke-linecap="round"/>
    <g id="${id}Head"><circle cx="108" cy="68" r="34" fill="#C98B5E"/><path d="M72 56 Q 76 20 110 22 Q 144 24 146 54 Z" fill="#2F4A94"/><rect x="68" y="50" width="84" height="12" rx="6" fill="#1B2F6A"/><path d="M92 76 q 8 5 16 0 M116 76 q 8 5 16 0" stroke="#2B2118" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 90 q 8 6 16 0" stroke="#2B2118" stroke-width="4" fill="none"/></g>
    <g id="${id}Z" font-family="Archivo" font-weight="900" fill="#7B61FF"><text x="160" y="40" font-size="30">Z</text><text x="186" y="12" font-size="40">Z</text></g>`);
  // a flat hand (palm down, fingers to the left) used to cover the keypad
  A.hand = ({ w = 360 } = {}) => svg("100 110 300 340", w, w * 1.133, `<path d="M150 380 Q 120 230 210 170 Q 300 120 370 150 Q 402 168 380 196 Q 320 200 300 240 L 340 250 Q 372 262 352 292 Q 300 300 300 330 L 300 380 Z" fill="#E2A77D" stroke="${INK}" stroke-width="4"/><path d="M230 186 Q 280 170 330 178 M240 214 Q 290 200 340 206" stroke="#C98B5E" stroke-width="4" fill="none"/><rect x="130" y="376" width="200" height="60" rx="14" fill="#12A4C4"/>`);
  A.NOTE = NOTE;
  window.ATMART = A;
})();
