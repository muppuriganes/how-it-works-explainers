// cast.js — simple, clean flat host. Load after paper.js; overrides PAPER.ART.host.
// Hooks kept: ${id}Eyes (blink), ${id}BrowL/R, ${id}Mouth (ellipse, lipSync sets ry), ${id}Arm (svgOrigin "300 450").
(function () {
  const SKIN = "#F2C29B", SKIN2 = "#E2A77D", HAIR = "#2B2118", INK = "#2B2118";
  // girl: shoulder-length hair behind the head, side-swept bangs, lashes, small earrings (same flat style)
  function host({ w = 420, id = "host", shirt = "#3E7BFA", cap = false, girl = false, hair = HAIR } = {}) {
    return `<svg viewBox="0 0 400 620" width="${w}" height="${w * 1.55}" style="overflow:visible">
      <path d="M70 620 L70 520 Q70 440 150 440 L250 440 Q330 440 330 520 L330 620 Z" fill="${shirt}"/>
      <rect x="178" y="408" width="44" height="40" rx="14" fill="${SKIN2}"/>
      <path d="M168 440 Q200 470 232 440" fill="${SKIN2}"/>
      <g transform="translate(0 20)">
      ${girl ? `<path d="M82 300 Q72 158 200 150 Q328 158 318 300 L326 418 Q300 446 268 424 L268 360 L132 360 L132 424 Q100 446 74 418 Z" fill="${hair}"/>` : ""}
      <circle cx="94" cy="290" r="20" fill="${SKIN2}"/><circle cx="306" cy="290" r="20" fill="${SKIN2}"/>
      ${girl ? `<circle cx="94" cy="316" r="7" fill="#F5C64B"/><circle cx="306" cy="316" r="7" fill="#F5C64B"/>` : ""}
      <circle cx="200" cy="285" r="112" fill="${SKIN}"/>
      ${girl ? `<path d="M88 300 Q80 162 200 158 Q320 162 312 300 Q304 230 262 206 Q226 252 120 250 Q98 266 88 300 Z" fill="${hair}"/>
      <path d="M153 283 L147 279 M247 283 L253 279" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M90 284 Q86 168 200 164 Q314 168 310 284 Q300 226 262 208 Q226 232 168 214 Q112 226 90 284 Z" fill="${hair}"/>`}
      ${cap ? `<path d="M92 236 Q92 140 200 136 Q308 140 308 236 L308 220 Q200 194 92 220 Z" fill="#1B2340"/><path d="M80 230 Q200 200 320 230 L332 250 Q200 222 68 250 Z" fill="#11182E"/><rect x="176" y="168" width="48" height="30" rx="6" fill="#F5A524"/>` : ""}
      <path id="${id}BrowL" d="M146 262 Q162 254 178 262" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path id="${id}BrowR" d="M222 262 Q238 254 254 262" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <g id="${id}Eyes"><ellipse cx="162" cy="292" rx="9" ry="12" fill="${INK}"/><ellipse cx="238" cy="292" rx="9" ry="12" fill="${INK}"/></g>
      <circle cx="140" cy="330" r="14" fill="#F48C8C" opacity=".35"/><circle cx="260" cy="330" r="14" fill="#F48C8C" opacity=".35"/>
      <path d="M182 336 Q200 350 218 336" stroke="${girl ? "#C2475A" : "#8A3324"}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse id="${id}Mouth" cx="200" cy="341" rx="17" ry="3" fill="${girl ? "#B23A4E" : "#8A3324"}"/>
      </g>
      <g id="${id}Arm"><path d="M300 470 Q352 450 368 384" stroke="${shirt}" stroke-width="44" fill="none" stroke-linecap="round"/><circle cx="370" cy="366" r="25" fill="${SKIN}"/></g>
    </svg>`;
  }
  PAPER.ART.host = (o = {}) => host(o);
})();
