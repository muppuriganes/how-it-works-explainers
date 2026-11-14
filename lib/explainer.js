// explainer.js — shared pieces for long-form explainer chapters (load after reel.js)
// Page needs: <div id="shake"><div id="bgfx"></div><div id="stage">…scenes…</div></div>
(function () {
  const { tl, W, sfx } = REEL;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const w = (phrase, after) => W(W.seq(phrase, after));
  const we = (phrase, after) => { const i = W.seq(phrase, after); return W.end(i + phrase.trim().split(/\s+/).length - 1); };
  const idx = (phrase, after) => W.seq(phrase, after);

  // ---------------------------------------------------------------- chrome
  function chrome(num, total, title) {
    const sh = $("#shake");
    sh.insertAdjacentHTML("beforeend", `
      <div id="tag"><b>${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}</b><span>${title}</span></div>
      <div id="prog">${Array.from({ length: total }, (_, i) => `<i class="${i + 1 < num ? "done" : i + 1 === num ? "on" : ""}"></i>`).join("")}</div>
      <div id="subsBand"></div><div id="subs"></div>
      <div class="vign"></div>
      <div id="cc"><div class="n">${String(num).padStart(2, "0")}</div><div class="t">${title}</div><div class="u"></div></div>`);
    gsap.set(["#tag", "#prog"], { autoAlpha: 0 });
  }

  // chapter title card from t0 to t1 (narration starts after it)
  function chapterCard(t0, t1) {
    tl.set("#cc", { autoAlpha: 1 }, t0);
    tl.from("#cc .n", { scale: 0.6, autoAlpha: 0, duration: 0.6, ease: "expo.out" }, t0 + 0.05);
    tl.from("#cc .t", { y: 40, autoAlpha: 0, duration: 0.5, ease: "expo.out" }, t0 + 0.25);
    tl.from("#cc .u", { scaleX: 0, duration: 0.7, ease: "expo.inOut" }, t0 + 0.35);
    sfx(t0 + 0.05, "whoosh", { gain: 0.25, dur: 0.6 });
    sfx(t0 + 0.35, "chime", { gain: 0.16 });
    tl.to("#cc", { autoAlpha: 0, scale: 1.06, duration: 0.45, ease: "power2.in" }, t1 - 0.45);
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, t1 - 0.1);
  }

  // ---------------------------------------------------------------- subtitles (pure function of t)
  function subtitles() {
    const WORDS = window.WORDS;
    const groups = [];
    let cur = [];
    WORDS.forEach((wd, i) => {
      const gap = i > 0 ? wd.s - WORDS[i - 1].e : 0;
      const chars = cur.reduce((a, j) => a + WORDS[j].w.length + 1, 0);
      if (cur.length && (gap > 0.22 || cur.length >= 8 || chars + wd.w.length > 46)) { groups.push(cur); cur = []; }
      cur.push(i);
    });
    if (cur.length) groups.push(cur);
    const el = $("#subs");
    const spans = groups.map((g) => g.map((i) => { const s = document.createElement("span"); s.textContent = WORDS[i].w; return s; }));
    let shown = -1;
    REEL.onFrame((t) => {
      let gi = -1;
      for (let k = 0; k < groups.length; k++) {
        const g = groups[k];
        const s = WORDS[g[0]].s - 0.05, e = (k + 1 < groups.length ? WORDS[groups[k + 1][0]].s - 0.05 : WORDS[g[g.length - 1]].e + 0.6);
        if (t >= s && t < e) { gi = k; break; }
      }
      if (gi !== shown) {
        el.innerHTML = "";
        if (gi >= 0) spans[gi].forEach((s) => el.appendChild(s));
        shown = gi;
      }
      if (gi >= 0) groups[gi].forEach((i, k) => spans[gi][k].classList.toggle("on", t >= WORDS[i].s - 0.02));
    });
  }

  // ---------------------------------------------------------------- scene helpers
  function scene(id, t0, t1, { inDur = 0.5, outDur = 0.45, from = { y: 30 } } = {}) {
    const el = typeof id === "string" ? $(id) : id;
    tl.set(el, { autoAlpha: 0 }, 0);
    tl.fromTo(el, Object.assign({ autoAlpha: 0 }, from), { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: inDur, ease: "power3.out", immediateRender: false }, t0);
    if (t1 != null) tl.to(el, { autoAlpha: 0, duration: outDur, ease: "power2.in" }, t1 - outDur);
    return el;
  }
  const pop = (el, t, o = {}) => { tl.fromTo(el, { autoAlpha: 0, scale: o.from ?? 0.5 }, { autoAlpha: 1, scale: 1, duration: o.dur ?? 0.45, ease: o.ease ?? "back.out(2)", immediateRender: false }, t); if (o.sfx !== false) sfx(t, o.sfx || "pop", { gain: o.gain ?? 0.16 }); };
  const rise = (el, t, o = {}) => tl.fromTo(el, { autoAlpha: 0, y: o.y ?? 30 }, { autoAlpha: 1, y: 0, duration: o.dur ?? 0.45, ease: "power3.out", immediateRender: false }, t);
  const fade = (el, t, o = {}) => tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: o.dur ?? 0.4, ease: "none", immediateRender: false }, t);
  const hide = (el, t, d = 0.3) => tl.to(el, { autoAlpha: 0, duration: d, ease: "power2.in" }, t);
  const draw = (el, t, d = 0.8, ease = "power2.inOut") => { gsap.set(el, { drawSVG: "0%" }); tl.to(el, { drawSVG: "100%", duration: d, ease }, t); };
  const drift = (el, t0, t1, s = 1.04) => tl.fromTo(el, { scale: 1 }, { scale: s, duration: t1 - t0, ease: "none", immediateRender: false }, t0);

  // hide all .scene children then show by time
  function hideAllScenes() { $$(".scene").forEach((s) => gsap.set(s, { autoAlpha: 0 })); }

  // ---------------------------------------------------------------- SVG art
  const SVG = {
    phone: ({ w = 220, accent = "#3EE0FF", screen = "#0E1530", id = "" } = {}) => {
      const h = w * 2.05;
      return `<svg ${id ? `id="${id}"` : ""} viewBox="0 0 220 451" width="${w}" height="${h}" style="overflow:visible">
        <rect x="4" y="4" width="212" height="443" rx="34" fill="#151d38" stroke="${accent}" stroke-width="5"/>
        <rect x="16" y="18" width="188" height="415" rx="24" fill="${screen}"/>
        <rect x="80" y="28" width="60" height="14" rx="7" fill="#151d38"/>
      </svg>`;
    },
    tower: ({ h = 360, color = "#EEF2F7", accent = "#3EE0FF" } = {}) => `<svg viewBox="0 0 200 360" width="${(h * 200) / 360}" height="${h}" style="overflow:visible">
        <g stroke="${color}" stroke-width="5" fill="none" stroke-linejoin="round">
          <path d="M70 352 L96 70 L104 70 L130 352"/>
          <path d="M77 290 L123 240 M80 240 L120 200 M84 200 L117 160 M88 160 L113 120 M91 120 L110 90"/>
          <path d="M123 290 L77 240 M120 240 L80 200 M117 200 L84 160 M113 160 L88 120 M110 120 L91 90"/>
        </g>
        <rect x="58" y="46" width="16" height="58" rx="4" fill="${accent}"/><rect x="92" y="34" width="16" height="58" rx="4" fill="${accent}"/><rect x="126" y="46" width="16" height="58" rx="4" fill="${accent}"/>
        <circle cx="100" cy="22" r="7" fill="#FF5D73"/>
      </svg>`,
    arcs: ({ size = 160, color = "#3EE0FF", cls = "arc" } = {}) => `<svg viewBox="-100 -100 200 200" width="${size}" height="${size}" style="overflow:visible">
        ${[30, 55, 80].map((r) => `<path class="${cls}" d="M${-r * 0.7} ${-r * 0.7} A${r} ${r} 0 0 1 ${r * 0.7} ${-r * 0.7}" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>`).join("")}
      </svg>`,
    sim: (size = 160, color = "#FFB547") => `<svg viewBox="0 0 100 130" width="${size}" height="${size * 1.3}"><path d="M8 4 H70 L94 28 V122 Q94 126 90 126 H8 Q4 126 4 122 V8 Q4 4 8 4Z" fill="#151d38" stroke="${color}" stroke-width="4"/><rect x="22" y="44" width="56" height="56" rx="8" fill="${color}"/><path d="M22 62 H78 M22 82 H78 M50 44 V100" stroke="#151d38" stroke-width="3"/></svg>`,
    router: (size = 120, color = "#9B8CFF") => `<svg viewBox="0 0 120 80" width="${size}" height="${(size * 80) / 120}"><rect x="4" y="20" width="112" height="52" rx="12" fill="#151d38" stroke="${color}" stroke-width="4"/><circle cx="28" cy="46" r="6" fill="${color}"/><circle cx="48" cy="46" r="6" fill="${color}" opacity=".6"/><path d="M80 46 H100" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path d="M60 20 V4" stroke="${color}" stroke-width="4"/></svg>`,
    satellite: (size = 200, color = "#EEF2F7") => `<svg viewBox="-100 -60 200 120" width="${size}" height="${size * 0.6}"><rect x="-22" y="-22" width="44" height="44" rx="6" fill="#151d38" stroke="${color}" stroke-width="4"/><g fill="#1f3a7a" stroke="${color}" stroke-width="3"><rect x="-96" y="-18" width="64" height="36"/><rect x="32" y="-18" width="64" height="36"/></g><path d="M-96 0 H-32 M32 0 H96 M-64 -18 V18 M64 -18 V18" stroke="${color}" stroke-width="2"/><path d="M0 22 V40" stroke="${color}" stroke-width="4"/><circle cx="0" cy="44" r="6" fill="#3EE0FF"/></svg>`,
    mic: (size = 140, color = "#FFB547") => `<svg viewBox="0 0 100 150" width="${size}" height="${size * 1.5}"><rect x="28" y="6" width="44" height="78" rx="22" fill="#151d38" stroke="${color}" stroke-width="5"/><path d="M14 64 Q14 108 50 108 Q86 108 86 64" stroke="${color}" stroke-width="5" fill="none"/><path d="M50 108 V136 M30 138 H70" stroke="${color}" stroke-width="5" stroke-linecap="round"/></svg>`,
    speaker: (size = 160, color = "#FFB547") => `<svg viewBox="0 0 120 120" width="${size}" height="${size}" style="overflow:visible"><path d="M10 42 H34 L64 16 V104 L34 78 H10 Z" fill="#151d38" stroke="${color}" stroke-width="5" stroke-linejoin="round"/></svg>`,
    ear: (size = 160, color = "#FF5D73") => `<svg viewBox="0 0 100 130" width="${size}" height="${size * 1.3}"><path d="M78 46 Q78 10 46 10 Q14 10 14 46 Q14 62 26 72 Q34 80 34 94 Q34 118 54 118 Q70 118 74 102" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/><path d="M58 50 Q58 32 44 32 Q30 32 32 50 Q34 60 44 62" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/></svg>`,
    packet: (label = "", color = "#3EE0FF", w = 120) => `<div class="pkt" style="position:absolute;width:${w}px;height:${w * 0.56}px;border-radius:12px;background:rgba(62,224,255,.12);border:3px solid ${color};display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono';font-weight:700;font-size:${w * 0.15}px;color:${color}">${label}</div>`,
    person: (size = 180, color = "#EEF2F7") => `<svg viewBox="0 0 100 120" width="${size}" height="${size * 1.2}"><circle cx="50" cy="34" r="24" fill="${color}"/><path d="M10 118 Q10 66 50 66 Q90 66 90 118 Z" fill="${color}"/></svg>`,
  };

  // chip label helper
  function chip(parent, text, x, y, color = "#3EE0FF", extra = "") {
    const el = document.createElement("div");
    el.className = "chip";
    el.style.cssText += `left:${x}px;top:${y}px;color:${color};${extra}`;
    el.innerHTML = text;
    (typeof parent === "string" ? $(parent) : parent).appendChild(el);
    gsap.set(el, { autoAlpha: 0 });
    return el;
  }

  // expanding radio arcs from an element, repeating between t0 and t1 (pure timeline)
  function pulseArcs(svgEl, t0, t1, period = 0.9) {
    const arcs = $$(".arc", svgEl);
    gsap.set(arcs, { autoAlpha: 0 });
    for (let t = t0; t < t1; t += period) {
      arcs.forEach((a, k) => {
        tl.fromTo(a, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, t + k * 0.12);
        tl.to(a, { autoAlpha: 0, duration: 0.3 }, t + k * 0.12 + 0.35);
      });
    }
  }

  // a phone with an HTML screen you can fill: returns { el, scr }
  function phoneBox(parent, { x = 0, y = 0, w = 300, accent = "#3EE0FF", id = "" } = {}) {
    const el = document.createElement("div");
    el.className = "abs phone";
    if (id) el.id = id;
    const h = w * 2.05;
    el.style.cssText += `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    el.innerHTML = SVG.phone({ w, accent });
    const scr = document.createElement("div");
    scr.className = "abs scr";
    const k = w / 220;
    scr.style.cssText = `left:${16 * k}px;top:${18 * k}px;width:${188 * k}px;height:${415 * k}px;border-radius:${24 * k}px;overflow:hidden`;
    el.appendChild(scr);
    (typeof parent === "string" ? $(parent) : parent).appendChild(el);
    return { el, scr };
  }

  // tap ripple at (x,y) inside parent at time t
  function tap(parent, x, y, t, color = "#EEF2F7") {
    const r = document.createElement("div");
    r.className = "abs";
    r.style.cssText = `left:${x - 40}px;top:${y - 40}px;width:80px;height:80px;border-radius:50%;border:4px solid ${color};background:rgba(255,255,255,.12)`;
    (typeof parent === "string" ? $(parent) : parent).appendChild(r);
    gsap.set(r, { autoAlpha: 0, scale: 0.3 });
    tl.to(r, { autoAlpha: 1, scale: 0.6, duration: 0.08 }, t);
    tl.to(r, { autoAlpha: 0, scale: 1.4, duration: 0.45, ease: "power2.out" }, t + 0.08);
    sfx(t, "click", { gain: 0.3 });
    return r;
  }

  // show a scene from a to b (hard visibility set at b), with an entrance
  function show(id, a, b, from = {}) {
    tl.set(id, { autoAlpha: 0 }, 0);
    tl.fromTo(id, Object.assign({ autoAlpha: 0 }, from), { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, a);
    if (b != null) tl.set(id, { autoAlpha: 0 }, b);
  }
  // typewriter: reveals text char by char between t0 and t0+dur (pure function of t)
  function typeText(el, text, t0, dur, { tick = true } = {}) {
    el = typeof el === "string" ? $(el) : el;
    el.textContent = "";
    REEL.onFrame((t) => {
      const n = Math.max(0, Math.min(text.length, Math.floor(((t - t0) / dur) * text.length)));
      if (el.textContent.length !== n) el.textContent = text.slice(0, n);
    });
    if (tick) for (let k = 0; k < text.length; k += 3) sfx(t0 + (dur * k) / text.length, "tick", { gain: 0.08 });
  }
  // number count-up on the timeline
  function countUp(el, from, to, t0, dur, fmt = (v) => Math.round(v).toLocaleString("en-US"), ease = "power2.out") {
    el = typeof el === "string" ? $(el) : el;
    const o = { v: from };
    el.textContent = fmt(from);
    tl.to(o, { v: to, duration: dur, ease, onUpdate: () => (el.textContent = fmt(o.v)) }, t0);
  }
  // repeating loop helper: calls fn(t) every period between a and b
  function every(a, b, period, fn) { for (let t = a; t < b; t += period) fn(t); }

  // ---------------------------------------------------------------- paper-cut transitions (sharp edges)
  // the screen rips in two along a jagged line (white torn fibre edge), halves fly apart revealing the next scene
  // a paper sheet snaps shut over the old scene (t-0.3 .. t), the scene swaps at t, then the paper rips apart
  function tear(t, color = "#F6F1E7", { dur = 0.6, seed = 3, edge = "#CFC3A8" } = {}) {
    const r = REEL.rng(seed);
    const ys = []; for (let x = 0, k = 0; x <= 1980; x += 55, k++) ys.push([x, 540 + (k % 2 ? -1 : 1) * (18 + r() * 22)]);
    const line = (off) => ys.map(([x, y]) => `${x}px ${y + off}px`);
    const top = (off) => `polygon(0 0,100% 0,${line(off).reverse().join(",")})`;
    const bot = (off) => `polygon(${line(off).join(",")},100% 100%,0 100%)`;
    const mk = (isTop) => {
      const h = document.createElement("div"); h.className = "abs"; h.style.cssText = "inset:0;z-index:60";
      h.innerHTML = `<div class="abs" style="inset:0;background:${edge};clip-path:${isTop ? top(12) : bot(-12)}"></div><div class="abs" style="inset:0;background:${color};clip-path:${isTop ? top(0) : bot(0)};box-shadow:inset 0 0 120px rgba(0,0,0,.08)"></div>`;
      $("#stage").appendChild(h); gsap.set(h, { autoAlpha: 0 }); return h;
    };
    const a = mk(true), b = mk(false);
    tl.fromTo(a, { autoAlpha: 1, y: -600 }, { y: 0, duration: 0.3, ease: "power3.in", immediateRender: false }, t - 0.3);
    tl.fromTo(b, { autoAlpha: 1, y: 600 }, { y: 0, duration: 0.3, ease: "power3.in", immediateRender: false }, t - 0.3);
    tl.to(a, { y: -640, rotation: -4, duration: dur, ease: "power3.in", transformOrigin: "30% 50%" }, t + 0.08);
    tl.to(b, { y: 640, rotation: 3, duration: dur, ease: "power3.in", transformOrigin: "70% 50%" }, t + 0.08);
    tl.set([a, b], { autoAlpha: 0 }, t + dur + 0.1);
    (window.__trans = window.__trans || []).push([t - 0.35, t + dur + 0.12]);
    sfx(t - 0.3, "paper", { gain: 0.3 });
    sfx(t + 0.08, "tear", { gain: 0.45 });
  }
  // whole-screen page fold: out-scene folds away like a card, in-scene unfolds
  function fold(outEl, inEl, t, { dur = 0.7 } = {}) {
    gsap.set("#stage", { perspective: 2200 });
    tl.to(outEl, { rotationY: 90, transformOrigin: "0% 50%", duration: dur / 2, ease: "power2.in" }, t);
    tl.set(outEl, { autoAlpha: 0 }, t + dur / 2);
    tl.fromTo(inEl, { autoAlpha: 1, rotationY: -90, transformOrigin: "100% 50%" }, { rotationY: 0, duration: dur / 2, ease: "power2.out", immediateRender: false }, t + dur / 2);
    (window.__trans = window.__trans || []).push([t - 0.05, t + dur + 0.05]);
    sfx(t, "paper", { gain: 0.4 });
    sfx(t + dur / 2, "swish", { gain: 0.25 });
  }

  window.EX = { $, $$, w, we, idx, chrome, chapterCard, subtitles, scene, pop, rise, fade, hide, draw, drift, SVG, chip, pulseArcs, hideAllScenes, phoneBox, tap, show, typeText, countUp, every, tear, fold };
})();
