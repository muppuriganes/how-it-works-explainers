// art.js — flat illustration kit drawn in code (SVG strings). Load after reel.js.
(function () {
  const rng = REEL.rng;
  const SKIN = "#F2C29B", SKIN2 = "#C98E6A", INK = "#0A0F1E";

  const ART = {
    // front-facing person holding a phone to the ear. ids let you animate parts.
    caller({ w = 300, shirt = "#2a5bd7", hair = "#1a1530", skin = SKIN, phone = "#3EE0FF", id = "p" } = {}) {
      return `<svg viewBox="0 0 300 420" width="${w}" height="${w * 1.4}" style="overflow:visible">
        <path d="M40 420 Q40 268 150 258 Q260 268 260 420 Z" fill="${shirt}"/>
        <rect x="128" y="214" width="44" height="56" rx="14" fill="${skin}"/>
        <path id="${id}Arm" d="M222 300 Q292 330 262 232 Q252 200 228 186" stroke="${shirt}" stroke-width="40" fill="none" stroke-linecap="round"/>
        <circle cx="150" cy="160" r="74" fill="${skin}"/>
        <path d="M76 168 Q70 80 150 80 Q232 80 226 160 Q206 118 150 120 Q100 122 76 168 Z" fill="${hair}"/>
        <circle cx="122" cy="168" r="7" fill="${INK}"/><circle cx="172" cy="168" r="7" fill="${INK}"/>
        <ellipse id="${id}Mouth" cx="147" cy="200" rx="16" ry="6" fill="${INK}"/>
        <rect x="214" y="128" width="30" height="66" rx="8" fill="#151d38" stroke="${phone}" stroke-width="4"/>
        <circle cx="228" cy="188" r="20" fill="${skin}"/>
      </svg>`;
    },
    // side profile head facing right, ids: profMouth
    profile({ h = 700, fill = INK } = {}) {
      return `<svg viewBox="0 0 260 340" width="${(h * 260) / 340}" height="${h}" style="overflow:visible">
        <path d="M100 18 C168 6 206 50 210 104 L230 146 Q234 154 222 156 L210 158 Q216 168 208 174 L212 180 Q216 190 206 194 Q210 220 186 230 Q160 238 152 262 L150 340 L28 340 L40 262 Q8 214 18 128 Q30 28 100 18 Z" fill="${fill}"/>
        <path id="profMouth" d="M206 182 Q216 186 208 190" stroke="#FFB547" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
      </svg>`;
    },
    // pointing hand (index finger up), tip at (60, 0)
    hand({ w = 160, skin = SKIN, cuff = "#2a5bd7" } = {}) {
      return `<svg viewBox="0 0 120 260" width="${w}" height="${(w * 260) / 120}" style="overflow:visible">
        <rect x="44" y="0" width="34" height="130" rx="17" fill="${skin}" stroke="${SKIN2}" stroke-width="3"/>
        <path d="M20 110 Q20 92 38 92 H96 Q112 92 112 112 V180 Q112 214 78 214 H52 Q20 214 20 180 Z" fill="${skin}" stroke="${SKIN2}" stroke-width="3"/>
        <path d="M78 112 V150 M96 116 V150" stroke="${SKIN2}" stroke-width="3" stroke-linecap="round"/>
        <rect x="26" y="206" width="84" height="54" rx="10" fill="${cuff}"/>
      </svg>`;
    },
    // city skyline silhouette with windows
    skyline({ w = 960, h = 380, seed = 3, color = "#101a44", win = "#FFD27A", lit = 0.35, minH = 120, maxH = 340 } = {}) {
      const r = rng(seed);
      let x = 0, out = "";
      while (x < w) {
        const bw = 50 + r() * 90, bh = minH + r() * (maxH - minH);
        out += `<rect x="${x.toFixed(0)}" y="${(h - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${color}"/>`;
        if (r() < 0.25) out += `<rect x="${(x + bw / 2 - 3).toFixed(0)}" y="${(h - bh - 40).toFixed(0)}" width="6" height="40" fill="${color}"/>`;
        for (let wy = h - bh + 16; wy < h - 20; wy += 26)
          for (let wx = x + 10; wx < x + bw - 16; wx += 20)
            if (r() < lit) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="9" height="13" fill="${win}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
        x += bw + 4 + r() * 10;
      }
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out}</svg>`;
    },
    fish({ w = 90, color = "#0d3550" } = {}) {
      return `<svg viewBox="0 0 100 50" width="${w}" height="${w / 2}"><ellipse cx="42" cy="25" rx="36" ry="17" fill="${color}"/><path d="M74 25 L98 8 L94 25 L98 42 Z" fill="${color}"/><circle cx="22" cy="21" r="3.5" fill="#3EE0FF"/></svg>`;
    },
    cloud({ w = 260, color = "rgba(255,255,255,.85)" } = {}) {
      return `<svg viewBox="0 0 260 110" width="${w}" height="${(w * 110) / 260}"><path d="M30 100 Q0 100 4 74 Q8 50 40 54 Q46 18 88 22 Q112 0 146 18 Q186 6 198 44 Q244 40 252 72 Q258 100 226 100 Z" fill="${color}"/></svg>`;
    },
    moon(size = 120) {
      return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="40" fill="#F4F1DE"/><circle cx="68" cy="40" r="36" fill="#1a2560"/></svg>`;
    },
    sun(size = 200) {
      return `<svg viewBox="-100 -100 200 200" width="${size}" height="${size}" style="overflow:visible"><g class="rays" fill="#FFF3C4">${Array.from({ length: 12 }, (_, k) => `<rect x="-5" y="-96" width="10" height="26" rx="5" transform="rotate(${k * 30})"/>`).join("")}</g><circle r="56" fill="#FFF3C4"/></svg>`;
    },
  };
  window.ART = ART;
})();
