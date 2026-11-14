// reel.js — shared helpers for code-made reels.
// Load after GSAP + plugins and after words.js (window.WORDS = [{w, s, e}]).
// Everything goes on ONE paused master timeline (REEL.tl). Nothing uses real time.
(function () {
  gsap.registerPlugin(DrawSVGPlugin, SplitText, MorphSVGPlugin, CustomEase, MotionPathPlugin);
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({ paused: true });
  const cues = [];
  const WORDS = window.WORDS || [];
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

  // ---- word timing -------------------------------------------------------
  // W(i) = start time of spoken word i. W.end(i) = end time.
  function W(i) {
    if (i < 0 || i >= WORDS.length) throw new Error("W(" + i + ") out of range, " + WORDS.length + " words");
    return WORDS[i].s;
  }
  W.end = (i) => WORDS[i].e;
  W.word = (i) => WORDS[i].w;
  W.count = () => WORDS.length;
  // W.find("greg", afterIndex) -> index of first matching word after afterIndex
  W.find = (word, after = -1) => {
    const n = norm(word);
    for (let i = after + 1; i < WORDS.length; i++) if (norm(WORDS[i].w) === n) return i;
    throw new Error('word "' + word + '" not found after index ' + after);
  };
  // W.seq("so we built meter") -> index of first word of that phrase
  W.seq = (phrase, after = -1) => {
    const parts = phrase.split(/\s+/).map(norm).filter(Boolean);
    outer: for (let i = after + 1; i <= WORDS.length - parts.length; i++) {
      for (let k = 0; k < parts.length; k++) if (norm(WORDS[i + k].w) !== parts[k]) continue outer;
      return i;
    }
    throw new Error('phrase "' + phrase + '" not found after index ' + after);
  };
  W.last = () => WORDS.length ? WORDS[WORDS.length - 1].e : 0;

  // ---- sound cues (recorded only; the mixer synthesizes them) -------------
  function sfx(t, type, o = {}) {
    cues.push(Object.assign({ t: Math.max(0, +(+t).toFixed(4)), type, gain: 0.4 }, o));
  }

  // ---- seeded random -----------------------------------------------------
  function rng(seed = 1) {
    let a = seed >>> 0;
    const f = () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + f() * (hi - lo);
    f.int = (lo, hi) => Math.floor(f.range(lo, hi + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    return f;
  }

  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

  // ---- stepped counter: ticks through `steps` discrete values -------------
  function counter(el, { from = 0, to, start, dur, steps = 20, fmt = fmtInt, tick = "tick", gain = 0.25 }) {
    const o = { v: from };
    el.textContent = fmt(from);
    tl.to(o, { v: to, duration: dur, ease: "steps(" + steps + ")", onUpdate: () => (el.textContent = fmt(o.v)) }, start);
    if (tick) for (let k = 1; k <= steps; k++) sfx(start + (dur * k) / steps, tick, { gain });
    return o;
  }

  // ---- rolling odometer --------------------------------------------------
  // pattern: "0,000" -> each 0 is a rolling digit, other chars are static.
  function odometer(container, pattern = "0000", { digitClass = "odo-d", sepClass = "odo-s" } = {}) {
    container.classList.add("odo");
    container.innerHTML = "";
    const slots = [];
    for (const ch of pattern) {
      if (ch === "0") {
        const win = document.createElement("span");
        win.className = digitClass;
        win.style.cssText = "display:inline-block;overflow:hidden;height:1em;line-height:1em;vertical-align:top;position:relative;";
        const strip = document.createElement("span");
        strip.style.cssText = "display:block;will-change:transform;";
        for (let d = 0; d <= 10; d++) {
          const s = document.createElement("span");
          s.style.cssText = "display:block;height:1em;line-height:1em;text-align:center;";
          s.textContent = d % 10;
          strip.appendChild(s);
        }
        win.appendChild(strip);
        container.appendChild(win);
        slots.push(strip);
      } else {
        const s = document.createElement("span");
        s.className = sepClass;
        s.textContent = ch;
        container.appendChild(s);
      }
    }
    const n = slots.length;
    function set(v) {
      v = Math.max(0, v);
      for (let i = 0; i < n; i++) {
        const p = n - 1 - i; // place value index (0 = ones)
        const pow = Math.pow(10, p);
        const d = Math.floor(v / pow) % 10;
        let frac;
        if (p === 0) frac = v - Math.floor(v);
        else {
          const rem = v % pow;
          frac = rem > pow - 1 ? rem - (pow - 1) : 0;
        }
        slots[i].style.transform = "translateY(" + -(d + frac) + "em)";
      }
    }
    set(0);
    const api = { value: 0, set };
    // roll(to, start, dur, ease, tickEvery) — adds tween to master timeline
    api.roll = (to, start, dur, ease = "power2.inOut", tickGain = 0.22, ticks = 14) => {
      const from = api.value;
      const o = { v: from };
      tl.to(o, { v: to, duration: dur, ease, onUpdate: () => set(o.v), onStart: () => set(from) }, start);
      // also set exact end so later seeks are stable
      tl.call(() => set(to), null, start + dur);
      api.value = to;
      if (tickGain) for (let k = 0; k < ticks; k++) sfx(start + (dur * (k + 0.5)) / ticks, "tick", { gain: tickGain * (0.7 + 0.3 * Math.sin(k)) });
      return api;
    };
    return api;
  }

  // ---- seven segment display (SVG) ----------------------------------------
  // segments: a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle
  const SEG = {
    a: "10,4 50,4 44,10 16,10", b: "52,6 52,48 46,44 46,12", c: "52,52 52,94 46,88 46,56",
    d: "10,96 50,96 44,90 16,90", e: "8,52 8,94 14,88 14,56", f: "8,6 8,48 14,44 14,12", g: "10,50 16,46 44,46 50,50 44,54 16,54",
  };
  const DIG = {
    0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": "",
  };
  function sevenSeg(container, pattern = "0000", { on = "#FF8A1F", off = "rgba(255,138,31,0.07)", height = 200, skew = -6, glow = true } = {}) {
    container.innerHTML = "";
    const digits = [];
    const svgNS = "http://www.w3.org/2000/svg";
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;align-items:flex-end;gap:" + height * 0.08 + "px;transform:skewX(" + skew + "deg);";
    container.appendChild(wrap);
    for (const ch of pattern) {
      const svg = document.createElementNS(svgNS, "svg");
      if (ch === "0") {
        svg.setAttribute("viewBox", "0 0 60 100");
        svg.setAttribute("width", height * 0.6);
        svg.setAttribute("height", height);
        const segs = {};
        for (const k in SEG) {
          const p = document.createElementNS(svgNS, "polygon");
          p.setAttribute("points", SEG[k]);
          p.setAttribute("fill", off);
          svg.appendChild(p);
          segs[k] = p;
        }
        digits.push(segs);
      } else {
        // separator: comma, dot or colon
        svg.setAttribute("viewBox", "0 0 16 100");
        svg.setAttribute("width", height * 0.16);
        svg.setAttribute("height", height);
        if (ch === ",") {
          // a real comma: square with a tail, so 1,240 never reads as 1.240
          const c = document.createElementNS(svgNS, "polygon");
          c.setAttribute("points", "3,84 13,84 13,96 6,108 2,106 6,96 3,96");
          c.setAttribute("fill", on);
          svg.setAttribute("style", "overflow:visible");
          svg.appendChild(c);
        } else {
          const dots = ch === ":" ? [[8, 32], [8, 72]] : [[8, 92]];
          for (const [cx, cy] of dots) {
            const c = document.createElementNS(svgNS, "rect");
            c.setAttribute("x", cx - 5); c.setAttribute("y", cy - 5); c.setAttribute("width", 10); c.setAttribute("height", 10);
            c.setAttribute("fill", on);
            svg.appendChild(c);
          }
        }
      }
      if (glow) svg.style.filter = "drop-shadow(0 0 " + height * 0.06 + "px " + on + ")";
      wrap.appendChild(svg);
    }
    const n = digits.length;
    function set(v, { leadingZeros = true } = {}) {
      const s = String(Math.max(0, Math.floor(v))).padStart(n, leadingZeros ? "0" : " ").slice(-n);
      for (let i = 0; i < n; i++) {
        const lit = DIG[s[i]] || "";
        for (const k in digits[i]) digits[i][k].setAttribute("fill", lit.includes(k) ? on : off);
      }
    }
    set(0);
    const api = { set, value: 0 };
    api.count = (to, start, dur, steps = 24, tickGain = 0.2) => {
      const from = api.value;
      const o = { v: from };
      tl.to(o, { v: to, duration: dur, ease: "steps(" + steps + ")", onUpdate: () => set(o.v) }, start);
      tl.call(() => set(to), null, start + dur);
      api.value = to;
      if (tickGain) for (let k = 1; k <= steps; k += 2) sfx(start + (dur * k) / steps, "tick", { gain: tickGain });
      return api;
    };
    return api;
  }

  // ---- camera ------------------------------------------------------------
  // camera(worldEl): world is a big container; frame a rect {x,y,w,h} in world px.
  function camera(world, { W: SW = 1920, H: SH = 1080 } = {}) {
    gsap.set(world, { transformOrigin: "0 0" });
    const view = (r, pad = 1) => {
      const s = Math.min(SW / r.w, SH / r.h) * pad;
      return { scale: s, x: SW / 2 - (r.x + r.w / 2) * s, y: SH / 2 - (r.y + r.h / 2) * s };
    };
    return {
      set(r, pad) { gsap.set(world, view(r, pad)); },
      to(r, start, dur, ease = "power3.inOut", pad = 1) { tl.to(world, Object.assign({ duration: dur, ease }, view(r, pad)), start); },
      view,
    };
  }

  // small camera shake at time t. `el` must be a dedicated wrapper whose x/y nothing else animates.
  function shake(el, t, amp = 10, dur = 0.28, seed = 7) {
    const r = rng(seed);
    const steps = 7;
    const sub = gsap.timeline();
    for (let k = 0; k < steps; k++) {
      const f = 1 - k / steps;
      sub.to(el, { x: (r() * 2 - 1) * amp * f, y: (r() * 2 - 1) * amp * f, rotation: (r() * 2 - 1) * amp * 0.03 * f, duration: dur / steps, ease: "none" });
    }
    sub.to(el, { x: 0, y: 0, rotation: 0, duration: 0.04 });
    tl.add(sub, t);
  }

  // per-frame renderers for canvas work: fn(t) is called after every seek, must be a pure function of t
  const frameFns = [];
  function onFrame(fn) { frameFns.push(fn); }

  function finish(endTime) {
    const dur = endTime != null ? endTime : tl.duration();
    // pad the timeline so it ends exactly at dur
    if (tl.duration() < dur) tl.to({}, { duration: dur - tl.duration() }, tl.duration());
    window.__duration = dur;
    window.__cues = cues.slice().sort((a, b) => a.t - b.t);
    window.__seek = (t) => {
      t = Math.min(t, dur);
      tl.seek(t, false);
      for (const fn of frameFns) fn(t);
    };
    window.__seek(0);
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      window.__seek(0.0001);
      window.__seek(0);
      window.__ready = true;
    });
    // preview: ?t=12.5 jumps there, ?play plays in real time (preview only)
    const q = new URLSearchParams(location.search);
    if (q.has("t")) window.__seek(+q.get("t"));
    if (q.has("play")) { tl.paused(false); }
  }

  window.REEL = { tl, W, sfx, rng, counter, odometer, sevenSeg, camera, shake, onFrame, finish, fmtInt, cues };
  window.W = W;
  window.sfx = sfx;
})();
