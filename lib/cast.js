// cast.js — simple, clean flat host. Load after paper.js; overrides PAPER.ART.host.
// Hooks kept: ${id}Eyes (blink), ${id}BrowL/R, ${id}Mouth (ellipse, lipSync sets ry), ${id}Arm (svgOrigin "300 450").
(function () {
  const SKIN = "#F2C29B", SKIN2 = "#E2A77D", HAIR = "#2B2118", INK = "#2B2118";
  function host({ w = 420, id = "host", shirt = "#3E7BFA" } = {}) {
    return `<svg viewBox="0 0 400 620" width="${w}" height="${w * 1.55}" style="overflow:visible">
      <path d="M70 620 L70 520 Q70 440 150 440 L250 440 Q330 440 330 520 L330 620 Z" fill="${shirt}"/>
      <rect x="178" y="408" width="44" height="40" rx="14" fill="${SKIN2}"/>
      <path d="M168 440 Q200 470 232 440" fill="${SKIN2}"/>
      <g transform="translate(0 20)">
      <circle cx="94" cy="290" r="20" fill="${SKIN2}"/><circle cx="306" cy="290" r="20" fill="${SKIN2}"/>
      <circle cx="200" cy="285" r="112" fill="${SKIN}"/>
      <path d="M90 284 Q86 168 200 164 Q314 168 310 284 Q300 226 262 208 Q226 232 168 214 Q112 226 90 284 Z" fill="${HAIR}"/>
      <path id="${id}BrowL" d="M146 262 Q162 254 178 262" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path id="${id}BrowR" d="M222 262 Q238 254 254 262" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <g id="${id}Eyes"><ellipse cx="162" cy="292" rx="9" ry="12" fill="${INK}"/><ellipse cx="238" cy="292" rx="9" ry="12" fill="${INK}"/></g>
      <circle cx="140" cy="330" r="14" fill="#F48C8C" opacity=".35"/><circle cx="260" cy="330" r="14" fill="#F48C8C" opacity=".35"/>
      <path d="M182 336 Q200 350 218 336" stroke="#8A3324" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse id="${id}Mouth" cx="200" cy="341" rx="17" ry="3" fill="#8A3324"/>
      </g>
      <g id="${id}Arm"><path d="M300 470 Q352 450 368 384" stroke="${shirt}" stroke-width="44" fill="none" stroke-linecap="round"/><circle cx="370" cy="366" r="25" fill="${SKIN}"/></g>
    </svg>`;
  }
  PAPER.ART.host = (o = {}) => host(o);
})();
