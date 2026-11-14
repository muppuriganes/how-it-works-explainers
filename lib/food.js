// food.js: order-tracker kit for the food delivery explainer. Load after explainer2.js.
// EX.tracker(num,total,title): order-status chrome · EX.notify(t,{mode,title,sub,big}): push-notification wipe
// EX.scooterWipe(t): a delivery rider + giant bag streak across · EX.stopStart(num,total,title): chapter opener
// FD.*: picture-style art (rider, biryani handi, app icon, kitchen, signal, stop icons)
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);
  const INK = "#1B2340", RED = "#F2553D", RED2 = "#C93A26", SAFF = "#F5A524";
  const css = document.createElement("style");
  css.textContent = `.fc,.bub{border:3px solid ${INK} !important;box-shadow:0 9px 0 ${INK},0 26px 44px rgba(27,35,64,.34) !important}
    .fc.soft{box-shadow:0 9px 0 ${INK},0 30px 60px rgba(10,10,40,.45) !important}`;
  document.head.appendChild(css);
  const STOPS = ["Order placed", "Restaurant accepts", "Rider assigned", "On the way", "Delivered"];
  const STOP_ICON = [0, 1, 2, 4, 6];   // FD.stopIcon index for each stop

  // ---------------------------------------------------------------- art
  const FD = {};
  FD.icon = (s = 64) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${RED}"/><path d="M22 14 L22 30 Q22 36 27 36 L27 52 M17 14 L17 28 M27 14 L27 28" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M42 52 L42 14 Q50 18 50 32 L42 34" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // clay biryani handi with a rice mound, saffron streaks and a mint leaf; steam has class "stm"
  FD.handi = ({ w = 260, id = "hd", steam = true } = {}) => `<svg viewBox="0 0 260 250" width="${w}" height="${w * 0.96}" style="overflow:visible">
      <defs><linearGradient id="${id}G" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E3F1E"/><stop offset=".45" stop-color="#C8683A"/><stop offset="1" stop-color="#7A3218"/></linearGradient>
      <radialGradient id="${id}R" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#FFF6DE"/><stop offset="1" stop-color="#F1D9A6"/></radialGradient></defs>
      <ellipse cx="130" cy="240" rx="110" ry="10" fill="${INK}" opacity=".18"/>
      <path d="M30 120 Q 20 232 130 236 Q 240 232 230 120 Z" fill="url(#${id}G)"/>
      <path d="M44 150 Q 130 176 216 150" stroke="#E79A62" stroke-width="6" fill="none" opacity=".7"/>
      <path d="M40 190 Q 130 214 220 190" stroke="#6A2A12" stroke-width="5" fill="none" opacity=".5"/>
      <ellipse cx="130" cy="118" rx="108" ry="26" fill="#6A2A12"/>
      <ellipse cx="130" cy="112" rx="112" ry="24" fill="#B85A2E"/>
      <path d="M36 112 Q 50 52 130 46 Q 210 52 224 112 Q 130 132 36 112 Z" fill="url(#${id}R)"/>
      <path d="M70 88 Q 92 70 120 78 M136 64 Q 160 58 178 74 M100 104 Q 128 92 158 100" stroke="${SAFF}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M150 52 Q 172 34 194 46 Q 176 64 150 52 Z" fill="#3FAE5B"/><path d="M150 52 L 190 46" stroke="#2C8A44" stroke-width="2"/>
      <circle cx="96" cy="72" r="5" fill="#E2B04A"/><circle cx="170" cy="94" r="5" fill="#E2B04A"/><circle cx="122" cy="62" r="4" fill="#fff"/>
      ${steam ? [80, 130, 180].map((x, i) => `<path class="stm" d="M${x} 40 q -14 -22 0 -44 q 14 -22 0 -44" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85" style="animation-delay:${i}s"/>`).join("") : ""}
    </svg>`;
  // delivery rider on a scooter, side view facing right; wheels have class "wh"; bag says nothing (unbranded)
  FD.rider = ({ w = 360, id = "rd", bag = RED } = {}) => {
    const wheel = (cx) => `<g class="wh" data-cx="${cx}" transform="translate(${cx} 176)"><circle r="27" fill="${INK}"/><circle r="15" fill="#C9D0DC"/><path d="M-15 0 L15 0 M0 -15 L0 15" stroke="#5C677E" stroke-width="4"/></g>`;
    return `<svg viewBox="0 0 320 220" width="${w}" height="${w * 0.69}" style="overflow:visible"><defs><linearGradient id="${id}S" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#E9A90F"/></linearGradient><linearGradient id="${id}B" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bag}"/><stop offset="1" stop-color="${RED2}"/></linearGradient></defs>
      <ellipse cx="160" cy="208" rx="140" ry="9" fill="${INK}" opacity=".18"/>
      <path d="M60 170 Q 60 120 120 116 L 196 116 Q 236 116 250 150 L 262 176 L 70 176 Z" fill="url(#${id}S)" stroke="${INK}" stroke-width="3"/>
      <path d="M232 60 L 262 160 L 246 166 L 218 74 Z" fill="url(#${id}S)" stroke="${INK}" stroke-width="3"/><rect x="214" y="56" width="44" height="10" rx="4" fill="${INK}"/><circle cx="258" cy="96" r="9" fill="#FFF3B0" stroke="${INK}" stroke-width="3"/>
      <rect x="104" y="104" width="76" height="16" rx="7" fill="#2B2118"/>${wheel(96)}${wheel(246)}
      <g id="${id}Bag"><path d="M28 24 L 104 24 L 116 34 L 116 108 L 40 108 L 28 98 Z" fill="${RED2}"/><rect x="28" y="24" width="76" height="84" rx="6" fill="url(#${id}B)" stroke="${INK}" stroke-width="3"/><rect x="28" y="56" width="76" height="10" fill="#fff" opacity=".9"/><path d="M50 40 L 50 50 M58 40 L 58 50 M66 40 L66 50 M78 40 L 78 50 Q 86 44 82 40" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      <path d="M138 106 L 128 150 L 150 152 L 160 112 Z" fill="#2F4A94"/><path d="M128 150 L 150 152 L 156 172 L 132 172 Z" fill="#2B2118"/>
      <rect x="122" y="44" width="58" height="68" rx="18" fill="${RED}"/><rect x="122" y="70" width="58" height="8" fill="#fff" opacity=".85"/><path d="M178 66 L 226 64" stroke="${RED}" stroke-width="14" stroke-linecap="round"/><circle cx="228" cy="64" r="8" fill="#C98B5E"/>
      <circle cx="156" cy="26" r="24" fill="#C98B5E"/><path d="M128 28 Q 126 -8 160 -6 Q 192 -4 186 30 L 172 28 Q 170 14 156 14 L 130 28 Z" fill="${RED}" stroke="${INK}" stroke-width="3"/><path d="M168 20 L 188 26 L 186 32 L 170 30 Z" fill="#9FD7F2" stroke="${INK}" stroke-width="2"/>
      <circle cx="166" cy="34" r="3.5" fill="#2B2118"/><path d="M160 44 q8 4 14 -1" stroke="#2B2118" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  };
  // traffic signal (vertical); lamps have ids ${id}R/Y/G
  FD.signal = ({ h = 300, id = "sg" } = {}) => `<svg viewBox="0 0 100 300" width="${h / 3}" height="${h}" style="overflow:visible"><rect x="44" y="150" width="12" height="150" fill="#5C677E"/><rect x="14" y="0" width="72" height="190" rx="18" fill="#2B3354" stroke="${INK}" stroke-width="3"/><rect x="86" y="10" width="10" height="170" rx="4" fill="#1E2540"/>
      <circle id="${id}R" cx="50" cy="38" r="22" fill="#F0566E"/><circle id="${id}Y" cx="50" cy="95" r="22" fill="#5A5038"/><circle id="${id}G" cx="50" cy="152" r="22" fill="#2E4A3A"/></svg>`;
  // a kitchen counter with a gas stove, a big kadhai, flames (class "fl") and a hanging ladle
  FD.kitchen = ({ w = 440, id = "kt" } = {}) => `<svg viewBox="0 0 440 340" width="${w}" height="${w * 0.773}" style="overflow:visible">
      ${ISO.shadow(220, 332, 210, 16, 0.18)}
      ${ISO.box(20, 170, 0, 380, 150, 50, "#E7DCCB")}
      <rect x="20" y="210" width="380" height="8" fill="#CDBFA8"/><rect x="60" y="236" width="120" height="70" rx="8" fill="#D6C8B1"/><rect x="240" y="236" width="120" height="70" rx="8" fill="#D6C8B1"/><circle cx="168" cy="270" r="5" fill="#9A8A70"/><circle cx="252" cy="270" r="5" fill="#9A8A70"/>
      ${ISO.box(110, 150, 0, 220, 22, 40, "#3B4566")}
      <g class="fl">${[150, 175, 200, 225, 250, 275].map((x, i) => `<path d="M${x} 152 Q ${x - 8} 136 ${x} ${120 - (i % 2) * 8} Q ${x + 8} 136 ${x} 152 Z" fill="${i % 2 ? "#FFC93D" : "#FF8A3D"}"/>`).join("")}</g>
      <path d="M112 112 Q 220 176 328 112 Z" fill="#2B3354"/><path d="M104 112 L 336 112" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M90 108 Q 74 104 72 92 M350 108 Q 366 104 368 92" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="220" cy="108" rx="100" ry="14" fill="#F1D9A6"/><path d="M180 104 Q 200 96 222 102 M236 100 Q 254 96 268 104" stroke="${SAFF}" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${[170, 220, 270].map((x) => `<path class="stm" d="M${x} 88 q -12 -20 0 -40 q 12 -20 0 -40" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".8"/>`).join("")}
      <rect x="20" y="0" width="400" height="10" rx="5" fill="#8A93AB"/><path d="M380 10 L 380 60" stroke="#8A93AB" stroke-width="5"/><ellipse cx="380" cy="66" rx="16" ry="9" fill="#A9B4C8" stroke="${INK}" stroke-width="3"/>
    </svg>`;
  // small round stop icons for the big tracker (index 0..6)
  FD.stopIcon = (i, s = 120, on = true) => {
    const c = on ? RED : "#C9CEDD";
    const g = [
      `<rect x="40" y="26" width="40" height="68" rx="8" fill="#fff"/><rect x="46" y="34" width="28" height="44" rx="3" fill="${c}" opacity=".35"/><path d="M50 56 L 57 63 L 71 47" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="M36 62 Q 28 40 46 38 Q 50 24 60 24 Q 72 24 76 38 Q 94 40 86 62 Z" fill="#fff"/><rect x="40" y="62" width="42" height="24" rx="4" fill="#fff"/><path d="M48 74 L 76 74" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
      `<circle cx="60" cy="44" r="16" fill="#fff"/><path d="M32 94 Q 32 66 60 66 Q 88 66 88 94 Z" fill="#fff"/><path d="M76 30 l 6 -6 M84 40 l 8 -2 M44 30 l -6 -6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
      `<rect x="34" y="40" width="52" height="48" rx="6" fill="#fff"/><path d="M46 40 Q 46 24 60 24 Q 74 24 74 40" stroke="#fff" stroke-width="6" fill="none"/><path d="M48 62 L 56 70 L 72 54" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<circle cx="38" cy="80" r="11" fill="#fff"/><circle cx="84" cy="80" r="11" fill="#fff"/><path d="M38 80 L 52 56 L 74 56 L 84 80 M70 56 L 66 38 L 78 38" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="30" y="40" width="26" height="22" rx="3" fill="#fff"/>`,
      `<rect x="34" y="30" width="52" height="64" rx="4" fill="#fff"/>${[0, 1, 2].map((r) => `<rect x="42" y="${38 + r * 16}" width="12" height="10" fill="${c}" opacity=".5"/><rect x="66" y="${38 + r * 16}" width="12" height="10" fill="${c}" opacity=".5"/>`).join("")}<rect x="54" y="80" width="12" height="14" fill="${c}"/>`,
      `<path d="M30 60 L 60 34 L 90 60 L 90 92 L 30 92 Z" fill="#fff"/><rect x="52" y="66" width="16" height="26" rx="2" fill="${c}"/><path d="M78 26 l 4 8 8 2 -6 6 2 8 -8 -4 -8 4 2 -8 -6 -6 8 -2 Z" fill="#FFC93D"/>`,
    ][i];
    return `<svg viewBox="0 0 120 120" width="${s}" height="${s}"><circle cx="60" cy="60" r="56" fill="${c}"/><circle cx="60" cy="60" r="56" fill="none" stroke="${INK}" stroke-opacity=".12" stroke-width="6"/>${g}</svg>`;
  };
  // top-down picture map: pastel blocks, parks, a lake, white roads. Returns svg (w x h)
  FD.map = ({ w = 1920, h = 1080, seed = 4, step = 240, road = 46 } = {}) => {
    const r = REEL.rng(seed);
    let s = `<rect width="${w}" height="${h}" fill="#D9E6D3"/>`;
    for (let y = -road / 2; y < h; y += step) for (let x = -road / 2; x < w; x += step) {
      const bx = x + road, by = y + road, bw = step - road, bh = step - road, k = r();
      if (k < 0.14) s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="26" fill="#A9D79A"/>${[0, 1, 2].map(() => `<circle cx="${bx + 30 + r() * (bw - 60)}" cy="${by + 30 + r() * (bh - 60)}" r="${16 + r() * 10}" fill="#7CC07A"/>`).join("")}`;
      else if (k < 0.2) s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="26" fill="#9FD3EE"/><path d="M${bx + 30} ${by + bh / 2} q 20 -12 40 0 t 40 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>`;
      else {
        s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="22" fill="#F4EEE3"/>`;
        const n = 2 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { const qw = 40 + r() * 50, qh = 40 + r() * 50, qx = bx + 14 + r() * (bw - qw - 28), qy = by + 14 + r() * (bh - qh - 28), c = ["#E8D9C4", "#F2C9B8", "#CFD8EE", "#E9E0F5"][Math.floor(r() * 4)]; s += `<rect x="${qx}" y="${qy + 6}" width="${qw}" height="${qh}" rx="8" fill="rgba(27,35,64,.12)"/><rect x="${qx}" y="${qy}" width="${qw}" height="${qh}" rx="8" fill="${c}"/>`; }
      }
    }
    for (let y = 0; y < h + step; y += step) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#fff" stroke-width="${road}"/><line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#E2E6EE" stroke-width="3" stroke-dasharray="18 18"/>`;
    for (let x = 0; x < w + step; x += step) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#fff" stroke-width="${road}"/><line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#E2E6EE" stroke-width="3" stroke-dasharray="18 18"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${s}</svg>`;
  };
  // map pin with a symbol: "chef" | "home" | "rider"
  FD.pin = (kind = "chef", s = 110, c = RED) => {
    const g = { chef: `<path d="M20 40 Q 14 24 27 22 Q 30 12 38 12 Q 46 12 49 22 Q 62 24 56 40 Z M24 40 L 52 40 L 52 50 L 24 50 Z" fill="#fff"/>`,
      home: `<path d="M18 36 L 38 18 L 58 36 L 58 54 L 18 54 Z" fill="#fff"/><rect x="33" y="40" width="10" height="14" fill="${c}"/>`,
      rider: `<circle cx="28" cy="48" r="7" fill="#fff"/><circle cx="52" cy="48" r="7" fill="#fff"/><path d="M28 48 L 36 34 L 48 34 L 52 48 M46 34 L 44 24 L 52 24" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="22" y="24" width="14" height="12" rx="2" fill="#fff"/>` }[kind];
    return `<svg width="${s}" height="${s * 1.25}" viewBox="0 0 76 95" style="overflow:visible"><ellipse cx="38" cy="92" rx="14" ry="4" fill="${INK}" opacity=".3"/><path d="M38 92 C 38 92, 4 56, 4 36 A34 34 0 0 1 72 36 C 72 56, 38 92, 38 92 Z" fill="${c}" stroke="${INK}" stroke-width="4"/>${g}</svg>`;
  };
  // standing / walking rider (front-ish side view, facing right); legs ids ${id}LL / ${id}LR swing around the hip (60,150)
  FD.walker = ({ w = 160, id = "wk" } = {}) => `<svg viewBox="0 0 120 260" width="${w}" height="${w * 2.17}" style="overflow:visible">
      <ellipse cx="60" cy="254" rx="44" ry="6" fill="${INK}" opacity=".18"/>
      <g id="${id}LL"><rect x="44" y="146" width="20" height="96" rx="9" fill="#2F4A94"/><rect x="40" y="232" width="32" height="14" rx="6" fill="#2B2118"/></g>
      <g id="${id}LR"><rect x="58" y="146" width="20" height="96" rx="9" fill="#3A58A8"/><rect x="56" y="232" width="32" height="14" rx="6" fill="#2B2118"/></g>
      <rect x="0" y="62" width="44" height="64" rx="6" fill="${RED2}" stroke="${INK}" stroke-width="3"/><rect x="0" y="84" width="44" height="8" fill="#fff" opacity=".85"/>
      <rect x="34" y="62" width="58" height="96" rx="22" fill="${RED}"/><rect x="34" y="96" width="58" height="8" fill="#fff" opacity=".85"/>
      <path d="M80 80 Q 98 108 88 128" stroke="${RED}" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="88" cy="132" r="8" fill="#C98B5E"/>
      <circle cx="64" cy="34" r="24" fill="#C98B5E"/><path d="M38 36 Q 36 0 68 2 Q 98 4 92 36 L 80 34 Q 78 22 64 22 L 40 36 Z" fill="${RED}" stroke="${INK}" stroke-width="3"/><path d="M76 26 L 94 32 L 92 38 L 78 36 Z" fill="#9FD7F2" stroke="${INK}" stroke-width="2"/>
      <circle cx="74" cy="42" r="3.5" fill="#2B2118"/><path d="M68 52 q8 4 14 -1" stroke="#2B2118" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  // closed delivery bag (front)
  FD.bag = ({ w = 160 } = {}) => `<svg viewBox="0 0 160 150" width="${w}" height="${w * 0.94}" style="overflow:visible"><ellipse cx="80" cy="146" rx="70" ry="6" fill="${INK}" opacity=".18"/><path d="M14 30 L 138 30 L 150 42 L 150 140 L 26 140 L 14 128 Z" fill="${RED2}"/><rect x="14" y="30" width="124" height="110" rx="10" fill="${RED}" stroke="${INK}" stroke-width="4"/><rect x="14" y="70" width="124" height="12" fill="#fff" opacity=".9"/><path d="M50 30 Q 50 6 76 6 Q 102 6 102 30" stroke="${INK}" stroke-width="7" fill="none"/><path d="M58 46 L 58 60 M68 46 L 68 60 M78 46 L 78 60 M94 46 L 94 60 Q 104 52 100 46" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

  // notification card html (white, rounded, app icon, title + sub)
  FD.notif = (title, sub = "", { w = 980 } = {}) => `<div class="fc" style="width:${w}px;display:flex;align-items:center;gap:26px;padding:24px 34px;border-radius:34px;background:#fff">${FD.icon(78)}<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono';font-weight:800;font-size:20px;letter-spacing:.12em;color:rgba(27,35,64,.5)"><span>FOOD APP</span><span>NOW</span></div><div style="font-family:Archivo;font-weight:900;font-size:40px;color:${INK};margin-top:6px;white-space:nowrap">${title}</div>${sub ? `<div style="font-family:Archivo;font-weight:600;font-size:28px;color:rgba(27,35,64,.62);margin-top:4px;white-space:nowrap">${sub}</div>` : ""}</div></div>`;

  // ---------------------------------------------------------------- chrome: order tracker
  function tracker(num, total, title) {
    EX.chrome(num, total, title);
    $("#tag").innerHTML = `<b style="color:${RED}">STOP ${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}</b><span>${title}</span>`;
    const W = 470, step = W / (total - 1), tx = (num - 1) * step;
    const dots = Array.from({ length: total }, (_, i) => `<circle cx="${i * step}" cy="14" r="${i + 1 === num ? 8 : 5.5}" fill="${i + 1 < num ? RED : i + 1 === num ? "#fff" : "#fff"}" stroke="${i + 1 <= num ? RED : "rgba(27,35,64,.3)"}" stroke-width="${i + 1 === num ? 4 : 2}"/>`).join("");
    const mini = `<g transform="translate(${tx - 22} -30) scale(0.14)">${FD.rider({ w: 320, id: "mini" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>`;
    $("#prog").outerHTML = `<div id="prog" data-ob="chrome" style="position:absolute;right:64px;top:30px;display:flex;align-items:center;gap:22px;font-family:'JetBrains Mono';font-weight:800;font-size:17px;letter-spacing:.12em;color:rgba(27,35,64,.6)">
      <span>TAP</span><svg width="${W + 16}" height="40" viewBox="-8 -10 ${W + 16} 40" style="overflow:visible"><line x1="0" y1="14" x2="${W}" y2="14" stroke="rgba(27,35,64,.2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/><line x1="0" y1="14" x2="${tx}" y2="14" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>${dots}${mini}</svg><span>DOOR</span></div>`;
    gsap.set("#prog", { autoAlpha: 0 });
  }

  // ---------------------------------------------------------------- notification wipe
  // mode "close": a notification drops in, then grows to fill the screen (covered from t, stays until `until`)
  // mode "open": starts covered, at t the cover shrinks back into the card, which flies up
  function notify(t, { mode = "close", title = "", sub = "", big = "", next = "", until = null, from = 0 } = {}) {
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:70;overflow:hidden;pointer-events:none";
    L.innerHTML = `<div class="abs nf" style="inset:0;background:radial-gradient(circle at 50% 42%,#FF7A5C 0%,${RED} 55%,${RED2} 100%)">
        <div class="abs nfr" style="left:-600px;top:-1000px;width:3120px;height:3120px;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,.07) 0 7.5deg,transparent 7.5deg 15deg)"></div>
        <div class="abs nfc" style="left:0;right:0;top:250px;display:flex;flex-direction:column;align-items:center;gap:26px">
          <svg class="nfk" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff"/><path class="nfp" d="M58 102 L 88 132 L 144 72" stroke="${RED}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="nft" style="font-family:Archivo;font-weight:900;font-stretch:68%;font-size:150px;line-height:.9;text-transform:uppercase;color:#fff;white-space:nowrap;text-shadow:0 8px 0 rgba(120,20,10,.35)">${big}</div>
          ${next ? `<div class="nfn" style="padding:12px 30px;border-radius:999px;background:rgba(255,255,255,.95);font-family:'JetBrains Mono';font-weight:800;font-size:30px;letter-spacing:.14em;color:${RED2};white-space:nowrap">${next}</div>` : ""}
        </div></div>
      <div class="abs nc" style="left:470px;top:40px">${FD.notif(title, sub)}</div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    const nf = $(".nf", L), nc = $(".nc", L);
    const CARD = "inset(40px 470px 900px 470px round 34px)", FULL = "inset(0px 0px 0px 0px round 0px)";
    if (mode === "close") {
      gsap.set(nc, { y: -260 }); gsap.set(nf, { clipPath: CARD, autoAlpha: 0 });
      // clear the landing zone: anything in the last scene's top band (cards, titles, notifications) slides up and fades
      // before the closing notification drops, so two cards never stack on top of each other
      const sc = $$(".scene").pop();
      const top = sc ? [...sc.querySelectorAll("[data-ob]")].filter((el) => { const r = el.getBoundingClientRect(); return r.top < 235 && r.bottom > 0 && r.right > 440 && r.left < 1480; }) : [];
      if (top.length) tl.to(top, { autoAlpha: 0, y: "-=40", duration: 0.25, ease: "power2.in", stagger: 0.03 }, t - 1.6);
      tl.set(L, { autoAlpha: 1 }, t - 1.3);
      tl.to(["#tag", "#prog"], { autoAlpha: 0, duration: 0.2 }, t - 1.3);
      tl.fromTo(nc, { y: -260 }, { y: 0, duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, t - 1.3);
      sfx(t - 1.25, "bloop", { gain: 0.28 }); sfx(t - 1.15, "ding", { gain: 0.2, pitch: 1.3 });
      tl.set(nf, { autoAlpha: 1 }, t - 0.5);
      tl.fromTo(nf, { clipPath: CARD }, { clipPath: FULL, duration: 0.5, ease: "power3.inOut", immediateRender: false }, t - 0.5);
      tl.to(nc, { autoAlpha: 0, scale: 1.15, duration: 0.25 }, t - 0.45);
      tl.fromTo($(".nfk", L), { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.4)", immediateRender: false }, t - 0.05);
      tl.fromTo($(".nfp", L), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.35, ease: "power2.out", immediateRender: false }, t + 0.1);
      tl.fromTo($(".nft", L), { autoAlpha: 0, y: 80, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2)", immediateRender: false }, t + 0.12);
      if (next) tl.fromTo($(".nfn", L), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, t + 0.45);
      tl.fromTo($(".nfr", L), { rotation: 0 }, { rotation: 30, duration: 3, ease: "none", immediateRender: false }, t - 0.5);
      sfx(t - 0.5, "whoosh", { gain: 0.3, dur: 0.5 }); sfx(t + 0.1, "chime", { gain: 0.2 });
      if (until != null) tl.set(L, { autoAlpha: 0 }, until);
      T(t - 1.35, until != null ? until : 1e6);
    } else {
      gsap.set(nf, { clipPath: FULL }); gsap.set(nc, { autoAlpha: 0 });
      gsap.set($(".nfp", L), { drawSVG: "100%" });
      tl.set(L, { autoAlpha: 1 }, from);
      tl.fromTo(nf, { clipPath: FULL }, { clipPath: CARD, duration: 0.5, ease: "power3.inOut", immediateRender: false }, t);
      tl.to($(".nfc", L), { autoAlpha: 0, scale: 0.6, duration: 0.3 }, t);
      tl.fromTo(nc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, t + 0.35);
      tl.set(nf, { autoAlpha: 0 }, t + 0.5);
      tl.to(nc, { y: -300, duration: 0.35, ease: "back.in(1.4)" }, t + 0.75);
      tl.set(L, { autoAlpha: 0 }, t + 1.12);
      sfx(t, "whoosh", { gain: 0.25, dur: 0.5 }); sfx(t + 0.75, "swish", { gain: 0.22 });
      if (from > 0) gsap.set(L, { autoAlpha: 0 });
      T(from, t + 1.15);
    }
    return L;
  }

  // ---------------------------------------------------------------- scooter wipe: rider leads a giant motion trail across the screen
  function scooterWipe(t, { dur = 0.8 } = {}) {
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:66;overflow:hidden;pointer-events:none";
    const len = 5200, cols = [RED, "#FF8A6B", SAFF, "#FFE3A3", "#fff", "#FFE3A3", SAFF, "#FF8A6B", RED];
    L.innerHTML = `<div class="abs sw" style="left:0;top:-60px;width:${len}px;height:1200px">
      <div class="abs" style="left:0;top:0;width:${len - 900}px;height:1200px;display:flex;flex-direction:column;border-radius:0 600px 600px 0;overflow:hidden">${cols.map((c) => `<div style="flex:1;background:${c}"></div>`).join("")}</div>
      <div class="abs" style="left:${len - 1650}px;top:120px">${FD.rider({ w: 1500, id: "swr" })}</div></div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    // timed so the stripe trail covers the whole screen at t (scene swap hidden), rider enters/leaves off-screen
    const b = $(".sw", L), span = dur * 1.8, t0 = t - span * 0.43;
    tl.set(L, { autoAlpha: 1 }, t0);
    tl.fromTo(b, { x: -len }, { x: 1920 + 200, duration: span, ease: "none", immediateRender: false }, t0);
    tl.set(L, { autoAlpha: 0 }, t0 + span);
    sfx(t0, "whoosh", { gain: 0.38, dur: span }); sfx(t0 + 0.1, "roll", { gain: 0.2 });
    T(t0 - 0.05, t0 + span + 0.05);
  }

  // shrink-into-phone: the old scene shrinks (rounded corners) into a screen rect of the new scene, then dissolves into it.
  // inEl is shown underneath from t; rect = {x,y,w,h} is the phone screen in the new scene
  function shrinkInto(outEl, inEl, t, { x, y, w, h, r = 30, dur = 0.75 } = {}) {
    outEl = typeof outEl === "string" ? $(outEl) : outEl; inEl = typeof inEl === "string" ? $(inEl) : inEl;
    const k = Math.min(w / 1920, h / 1080), fx = x + (w - 1920 * k) / 2, fy = y + (h - 1080 * k) / 2;
    tl.set(outEl, { zIndex: 20, transformOrigin: "0px 0px", overflow: "hidden" }, t);
    tl.set(inEl, { autoAlpha: 1 }, t);
    tl.fromTo(outEl, { x: 0, y: 0, scale: 1, borderRadius: 0, boxShadow: "0 0 0 rgba(27,35,64,0)" },
      { x: fx, y: fy, scale: k, borderRadius: r / k, boxShadow: "0 40px 120px rgba(27,35,64,.45)", duration: dur, ease: "power3.inOut", immediateRender: false }, t);
    tl.to(outEl, { autoAlpha: 0, duration: 0.25 }, t + dur - 0.05);
    tl.set(outEl, { x: 0, y: 0, scale: 1, borderRadius: 0, boxShadow: "none", zIndex: "auto" }, t + dur + 0.25);
    sfx(t, "whoosh", { gain: 0.28, dur }); sfx(t + dur - 0.1, "pop", { gain: 0.18 });
    T(t - 0.05, t + dur + 0.3);
  }

  // wheels spin + slight bounce for any rider container (pure function of t)
  function ride(sel, from = 0, to = 1e6, rate = 720) {
    REEL.onFrame((t) => { if (t < from || t > to) return; $$(`${sel} .wh`).forEach((g) => g.setAttribute("transform", `translate(${g.dataset.cx} 176) rotate(${(t * rate) % 360})`)); });
  }
  // steam wisps (class "stm") drift and fade: pure function of t
  function steam(sel, from = 0, to = 1e6) {
    REEL.onFrame((t) => { if (t < from || t > to) return; $$(`${sel} .stm`).forEach((p, i) => { const u = ((t * 0.7 + i * 0.37) % 1); p.setAttribute("transform", `translate(${Math.sin((t + i) * 3) * 6} ${-u * 34})`); p.setAttribute("opacity", (0.85 * Math.sin(u * Math.PI)).toFixed(2)); }); });
  }

  // chapter opener: chrome + subtitles + notification cover shrinking away at t
  function stopStart(num, total, title, { t = 0.35 } = {}) {
    tracker(num, total, title);
    $("#subs").dataset.ob = "subs";
    EX.subtitles();
    notify(t, { mode: "open", title: `Stop ${num} · ${title}`, sub: "Tracking your order", big: `Stop ${String(num).padStart(2, "0")}` });
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, t + 0.9);
  }

  window.FD = FD;
  Object.assign(EX, { tracker, notify, scooterWipe, shrinkInto, ride, steam, stopStart, STOPS, STOP_ICON });
})();
