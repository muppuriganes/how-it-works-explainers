// paper.js — paper-cutout look: rough edges, grain, stop-motion boil, paper cast. Load after reel.js + explainer.js.
(function () {
  const { tl, W, sfx, rng } = REEL;
  const $ = (s) => document.querySelector(s);
  const INK = "#2B2118", SKIN = "#E8B48A", SKIN2 = "#D49A6E";

  // ---------------------------------------------------------------- setup: filters, grain, chrome, stop motion
  function setup({ num, total, title }) {
    document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute"><defs>
      <filter id="pedge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence id="pturb" type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
    </defs></svg>`);
    const g = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' seed='5' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.36  0 0 0 0.22 0'/></filter><rect width='300' height='300' filter='url(#n)'/></svg>`;
    document.documentElement.style.setProperty("--grain", `url("data:image/svg+xml,${encodeURIComponent(g)}")`);
    const pts = []; for (let x = 0, k = 0; x <= 1940; x += 22, k++) pts.push(`${x}px ${k % 2 ? 0 : 12}px`);
    pts.push("100% 12px", "100% 100%", "0 100%");
    document.documentElement.style.setProperty("--zig", `polygon(${pts.join(",")})`);
    const sh = $("#shake");
    sh.insertAdjacentHTML("beforeend", `<div class="grain"></div>
      <div id="ptag" data-ob="chrome"><b>${String(num).padStart(2, "0")}</b> · ${title}</div>
      <div id="pprog" data-ob="chrome">${Array.from({ length: total }, (_, i) => `<i class="${i + 1 < num ? "done" : i + 1 === num ? "on" : ""}"></i>`).join("")}</div>
      <div id="subsBand"></div><div id="subs" data-ob="subs"></div>`);
    // edge boil: new noise seed 12 times a second
    REEL.onFrame((t) => { const s = 1 + (Math.floor(t * 12) % 6); const el = $("#pturb"); if (el.getAttribute("seed") != s) el.setAttribute("seed", s); });
  }
  // call after REEL.finish(): quantize time to 12 drawings per second (stop motion)
  function stopMotion(fps = 12) {
    const base = window.__seek;
    window.__seek = (t) => base(Math.floor(t * fps + 1e-6) / fps);
  }

  // ---------------------------------------------------------------- transitions
  // paper rips in two (top half up, bottom half down) revealing what's underneath
  function tear(t, color = "#F3E9D7", parent = "#stage") {
    const zig = (top) => { const p = []; for (let x = 0, k = 0; x <= 1960; x += 60, k++) p.push(`${x}px ${540 + (k % 2 ? -26 : 26) + (k % 3) * 8}px`); return top ? `polygon(0 0,100% 0,${p.reverse().join(",")})` : `polygon(${p.join(",")},100% 100%,0 100%)`; };
    const a = document.createElement("div"), b = document.createElement("div");
    [a, b].forEach((el, i) => { el.className = "abs"; el.style.cssText = `inset:0;background:${color};clip-path:${zig(i === 0)};z-index:50;filter:drop-shadow(0 ${i ? -8 : 8}px 0 rgba(43,33,24,.25))`; el.insertAdjacentHTML("beforeend", `<div class="grain"></div>`); $(parent).appendChild(el); gsap.set(el, { autoAlpha: 0 }); });
    tl.set([a, b], { autoAlpha: 1 }, t - 0.01);
    tl.to(a, { yPercent: -70, rotation: -3, duration: 0.55, ease: "power3.in" }, t);
    tl.to(b, { yPercent: 70, rotation: 2, duration: 0.55, ease: "power3.in" }, t);
    tl.set([a, b], { autoAlpha: 0 }, t + 0.56);
    sfx(t, "tear", { gain: 0.45 });
  }
  // a sheet slides over the screen (wipe) of a colour
  function slideIn(el, t, from = "right") { const k = { right: { xPercent: 110 }, left: { xPercent: -110 }, top: { yPercent: -110 }, bottom: { yPercent: 110 } }[from]; tl.fromTo(el, Object.assign({ autoAlpha: 1, rotation: from === "top" ? -3 : 2 }, k), { xPercent: 0, yPercent: 0, rotation: 0, duration: 0.5, ease: "back.out(1.2)", immediateRender: false }, t); sfx(t, "paper", { gain: 0.3 }); }
  // pop a paper piece in (stop-motion bounce)
  function plop(el, t, o = {}) { tl.fromTo(el, { autoAlpha: 0, scale: o.from ?? 0.3, rotation: o.rot ?? -8 }, { autoAlpha: 1, scale: 1, rotation: o.to ?? 0, duration: o.dur ?? 0.45, ease: "back.out(2.2)", immediateRender: false }, t); if (o.sfx !== false) sfx(t, o.sfx || "pop", { gain: o.gain ?? 0.18 }); }

  // ---------------------------------------------------------------- lip sync from word timings
  function lipSync(mouth, { from = 0, to = 1e9, open = 16, closed = 4 } = {}) {
    const WORDS = window.WORDS;
    REEL.onFrame((t) => {
      let ry = closed;
      if (t >= from && t <= to) for (const w of WORDS) if (t >= w.s && t <= w.e) { ry = closed + (open - closed) * Math.abs(Math.sin((t - w.s) * 15)); break; }
      mouth.setAttribute("ry", ry.toFixed(1));
    });
  }
  function blink(eyes, times) { times.forEach((t) => { tl.to(eyes, { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.06 }, t); tl.to(eyes, { scaleY: 1, duration: 0.08 }, t + 0.08); }); }

  // ---------------------------------------------------------------- the cast (SVG strings)
  const ART = {
    host({ w = 420, id = "host", male = false } = {}) {
      return `<svg viewBox="0 0 400 620" width="${w}" height="${w * 1.55}" style="overflow:visible">
        ${male ? "" : `<path d="M110 250 Q80 140 140 92 Q200 52 262 92 Q324 140 292 252 Q300 300 270 330 L130 330 Q100 300 110 250Z" fill="#3B2418"/>`}
        <path d="M70 620 Q70 420 200 400 Q330 420 330 620Z" fill="#2A9D8F"/>
        <path d="M158 404 L200 470 L242 404 Z" fill="#F3E9D7"/>
        <rect x="178" y="330" width="44" height="80" rx="16" fill="${SKIN2}"/>
        <ellipse cx="200" cy="232" rx="92" ry="108" fill="${SKIN}"/>
        <ellipse cx="108" cy="240" rx="16" ry="24" fill="${SKIN2}"/><ellipse cx="292" cy="240" rx="16" ry="24" fill="${SKIN2}"/>
        ${male ? `<path d="M120 268 Q200 372 280 268 Q276 334 200 346 Q124 334 120 268Z" fill="#3B2418" opacity=".28"/>
        <path d="M104 206 Q96 108 200 102 Q306 108 296 206 Q290 150 262 140 Q230 122 196 136 Q150 124 128 150 Q110 172 104 206Z" fill="#2B1A12"/>` : `<circle cx="292" cy="262" r="7" fill="#F2B33D"/><circle cx="108" cy="262" r="7" fill="#F2B33D"/>
        <path d="M108 200 Q110 120 200 116 Q292 120 294 200 Q262 150 214 160 Q170 150 108 200Z" fill="#3B2418"/>`}
        <g id="${id}Eyes"><circle cx="164" cy="236" r="10" fill="${INK}"/><circle cx="236" cy="236" r="10" fill="${INK}"/><circle cx="168" cy="232" r="3" fill="#fff"/><circle cx="240" cy="232" r="3" fill="#fff"/></g>
        <g fill="none" stroke="${INK}" stroke-width="6"><circle cx="164" cy="236" r="30"/><circle cx="236" cy="236" r="30"/><path d="M194 236 Q200 228 206 236"/></g>
        <path id="${id}BrowL" d="M140 190 Q164 178 186 190" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path id="${id}BrowR" d="M214 190 Q236 178 260 190" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <circle cx="140" cy="284" r="14" fill="#F4A6A6" opacity=".8"/><circle cx="260" cy="284" r="14" fill="#F4A6A6" opacity=".8"/>
        <ellipse id="${id}Mouth" cx="200" cy="296" rx="26" ry="5" fill="#7A2A1E"/>
        <g id="${id}Arm"><path d="M300 450 Q370 430 388 350" stroke="#2A9D8F" stroke-width="46" fill="none" stroke-linecap="round"/><circle cx="390" cy="336" r="26" fill="${SKIN}"/><rect x="380" y="282" width="20" height="56" rx="10" fill="${SKIN}"/></g>
        <path d="M100 450 Q60 520 110 600" stroke="#2A9D8F" stroke-width="46" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    you({ w = 300, id = "you", shirt = "#E8553B" } = {}) {
      return `<svg viewBox="0 0 300 440" width="${w}" height="${w * 1.47}" style="overflow:visible">
        <path d="M40 440 Q40 280 150 268 Q260 280 260 440Z" fill="${shirt}"/>
        <rect x="128" y="226" width="44" height="56" rx="14" fill="${SKIN2}"/>
        <circle cx="150" cy="170" r="76" fill="${SKIN}"/>
        <path d="M74 172 Q70 88 150 86 Q232 88 226 166 Q200 120 150 124 Q102 126 74 172Z" fill="#2B2118"/>
        <g id="${id}Eyes"><circle cx="122" cy="176" r="8" fill="${INK}"/><circle cx="178" cy="176" r="8" fill="${INK}"/></g>
        <path id="${id}Smile" d="M128 210 Q150 228 172 210" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <g id="${id}Shades" opacity="0"><rect x="92" y="156" width="56" height="34" rx="10" fill="${INK}"/><rect x="152" y="156" width="56" height="34" rx="10" fill="${INK}"/><rect x="140" y="164" width="20" height="8" fill="${INK}"/><path d="M100 164 L118 164" stroke="#fff" stroke-width="5"/></g>
      </svg>`;
    },
    bank({ w = 260, color = "#2A9D8F", id = "b", label = "BANK" } = {}) {
      return `<svg viewBox="0 0 260 280" width="${w}" height="${w * 1.08}" style="overflow:visible">
        <path d="M20 90 L130 18 L240 90 Z" fill="${color}"/><rect x="20" y="90" width="220" height="20" fill="#2B2118"/>
        <rect x="30" y="110" width="200" height="150" fill="#F3E9D7"/>
        ${[50, 100, 150, 200].map((x) => `<rect x="${x - 10}" y="120" width="20" height="132" rx="4" fill="${color}" opacity=".55"/>`).join("")}
        <rect x="16" y="258" width="228" height="22" fill="#2B2118"/>
        <g id="${id}Face"><circle cx="100" cy="170" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="160" cy="170" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/><circle class="pupil" cx="100" cy="172" r="5" fill="${INK}"/><circle class="pupil" cx="160" cy="172" r="5" fill="${INK}"/><path d="M110 214 Q130 206 150 214" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>
        <text x="130" y="76" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="22" fill="#F3E9D7">${label}</text>
      </svg>`;
    },
    computer({ w = 200, color = "#1D3557", id = "c" } = {}) {
      return `<svg viewBox="0 0 200 190" width="${w}" height="${w * 0.95}" style="overflow:visible">
        <rect x="10" y="10" width="180" height="130" rx="16" fill="${color}"/><rect x="24" y="24" width="152" height="102" rx="8" fill="#A8DADC"/>
        <circle class="pupil" cx="76" cy="70" r="9" fill="${INK}"/><circle class="pupil" cx="124" cy="70" r="9" fill="${INK}"/><path d="M84 102 L116 102" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
        <rect x="86" y="140" width="28" height="26" fill="${color}"/><rect x="56" y="164" width="88" height="16" rx="6" fill="${color}"/>
      </svg>`;
    },
    referee({ w = 260, id = "ref" } = {}) {
      return `<svg viewBox="0 0 260 360" width="${w}" height="${w * 1.38}" style="overflow:visible">
        <path d="M30 360 Q30 220 130 210 Q230 220 230 360Z" fill="#F3E9D7"/>
        ${[50, 90, 130, 170, 210].map((x) => `<rect x="${x - 10}" y="226" width="20" height="134" fill="${INK}"/>`).join("")}
        <circle cx="130" cy="136" r="70" fill="${SKIN}"/>
        <path d="M60 124 Q64 60 130 58 Q196 60 200 124 Q170 96 130 100 Q90 96 60 124Z" fill="${INK}"/>
        <path id="${id}BrowL" d="M88 116 L120 128" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path id="${id}BrowR" d="M172 116 L140 128" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
        <circle class="pupil" cx="106" cy="142" r="8" fill="${INK}"/><circle class="pupil" cx="154" cy="142" r="8" fill="${INK}"/>
        <path d="M110 178 L150 178" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
        <g id="${id}Whistle"><path d="M104 214 Q130 250 160 254" stroke="#E8553B" stroke-width="5" fill="none"/><rect x="156" y="244" width="40" height="22" rx="10" fill="#F2B33D" stroke="#2B2118" stroke-width="4"/><circle cx="196" cy="255" r="13" fill="#F2B33D" stroke="#2B2118" stroke-width="4"/></g>
      </svg>`;
    },
    chai({ w = 120, steam = true, id = "chai" } = {}) {
      return `<svg viewBox="0 0 120 170" width="${w}" height="${w * 1.42}" style="overflow:visible">
        ${steam ? `<g id="${id}Steam" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"><path d="M40 52 Q28 36 40 22 Q52 8 40 -6"/><path d="M70 52 Q58 36 70 22 Q82 8 70 -6"/></g>` : ""}
        <path d="M18 62 L102 62 L92 162 L28 162 Z" fill="#F3E9D7" stroke="${INK}" stroke-width="5"/>
        <path d="M22 90 L98 90 L92 160 L28 160 Z" fill="#B5652E"/>
        <rect x="14" y="56" width="92" height="12" rx="6" fill="${INK}"/>
      </svg>`;
    },
    note({ w = 260, id = "note" } = {}) {
      return `<svg viewBox="0 0 260 200" width="${w}" height="${w * 0.77}" style="overflow:visible">
        <rect x="10" y="30" width="240" height="120" rx="12" fill="#C9B6E4" stroke="${INK}" stroke-width="5"/>
        <circle cx="130" cy="90" r="38" fill="#E6DAF3"/><text x="130" y="104" text-anchor="middle" font-family="Fraunces" font-weight="900" font-size="44" fill="${INK}">10</text>
        <g><rect x="78" y="62" width="44" height="26" rx="8" fill="${INK}"/><rect x="138" y="62" width="44" height="26" rx="8" fill="${INK}"/><rect x="118" y="68" width="24" height="6" fill="${INK}"/></g>
        <path d="M60 150 L52 190 M200 150 L208 190" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
        <rect x="214" y="120" width="56" height="44" rx="8" fill="#E8553B" stroke="${INK}" stroke-width="5"/><path d="M230 120 Q242 104 254 120" stroke="${INK}" stroke-width="5" fill="none"/>
      </svg>`;
    },
    palm({ w = 200 } = {}) {
      return `<svg viewBox="0 0 200 300" width="${w}" height="${w * 1.5}"><path d="M100 300 Q92 200 108 110" stroke="#8A5A3B" stroke-width="22" fill="none" stroke-linecap="round"/><g fill="#7BB662"><path d="M108 110 Q40 70 8 120 Q60 96 108 110Z"/><path d="M108 110 Q170 64 196 116 Q150 96 108 110Z"/><path d="M108 110 Q80 30 30 40 Q86 60 108 110Z"/><path d="M108 110 Q140 20 186 44 Q134 56 108 110Z"/></g><ellipse cx="100" cy="296" rx="80" ry="14" fill="#F2B33D"/></svg>`;
    },
    qr({ size = 220, seed = 3 } = {}) {
      const r = rng(seed); let s = "";
      const N = 21, c = size / N;
      const finder = (x, y) => `<rect x="${x * c}" y="${y * c}" width="${7 * c}" height="${7 * c}" fill="${INK}"/><rect x="${(x + 1) * c}" y="${(y + 1) * c}" width="${5 * c}" height="${5 * c}" fill="#fff"/><rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}" fill="${INK}"/>`;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12); if (!inF && r() < 0.45) s += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}" fill="${INK}"/>`; }
      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/>${s}${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}</svg>`;
    },
    burst({ size = 300, color = "#F2B33D", text = "BEEP!", fs = 64 } = {}) {
      const pts = Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2, rr = k % 2 ? 0.62 : 1; return `${(150 + Math.cos(a) * 140 * rr).toFixed(0)},${(150 + Math.sin(a) * 140 * rr).toFixed(0)}`; }).join(" ");
      return `<svg viewBox="0 0 300 300" width="${size}" height="${size}" style="overflow:visible"><polygon points="${pts}" fill="${color}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><text x="150" y="${150 + fs * 0.35}" text-anchor="middle" font-family="Fraunces" font-weight="900" font-size="${fs}" fill="${INK}">${text}</text></svg>`;
    },
  };

  window.PAPER = { setup, stopMotion, tear, slideIn, plop, lipSync, blink, ART };
})();
