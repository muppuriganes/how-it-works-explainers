// planefx.js — plane-explainer theme: chrome (phase tag + boarding pass), window-shade chapter wipe,
// cloud wipe, contrail wipe, radar-sweep reveal, drifting-cloud ambient, live flight-data panel.
// Load after explainer2.js and plane.js. Every animation is a pure function of t (timeline or onFrame).
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const P = window.PLANE, INK = "#1B2340", TEAL = "#12A4C4", RED = "#F2553D";
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);
  const pad = (n) => String(n).padStart(2, "0");
  const css = document.createElement("style");
  css.textContent = `.fc,.bub{border:3px solid ${INK} !important;box-shadow:0 9px 0 ${INK},0 26px 44px rgba(27,35,64,.34) !important}
    #tag{left:48px !important;top:30px !important;padding:12px 22px;border-radius:999px;background:#FFC93D;border:3px solid ${INK};box-shadow:0 6px 0 ${INK};color:${INK} !important;font-size:21px !important}
    #tag span{color:rgba(27,35,64,.75)}`;
  document.head.appendChild(css);
  const layer = (z, html) => { const L = document.createElement("div"); L.className = "abs"; L.style.cssText = `inset:0;z-index:${z};overflow:hidden;pointer-events:none`; L.innerHTML = html; $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 }); return L; };

  // ---------------------------------------------------------------- chrome: phase tag (left) + boarding pass (right)
  function passChrome(n, title) {
    EX.chrome(n, 5, title);
    $("#tag").innerHTML = `<b style="color:${TEAL}">PHASE ${pad(n)} / 05</b><span>${title}</span>`;
    $("#tag").dataset.ob = "chrome";
    $("#prog").outerHTML = `<div id="prog" data-ob="chrome2" style="position:absolute;right:44px;top:20px">${P.pass(n, { w: 500 })}</div>`;
    gsap.set(["#tag", "#prog"], { autoAlpha: 0 });
  }

  // ---------------------------------------------------------------- the window shade — ONE continuous cabin window
  // close(N): the view shrinks into an aircraft window (cabin wall zooms out), the shade slides down showing "NEXT ▶ PHASE N+1".
  // open(N): starts in that exact state, NEXT flips to NOW, the shade slides up and we zoom back through the window.
  const STAT = ["0 → 260 KM/H IN ~35 S", "UP TO 35,000 FT · ~20 MIN", "830 KM/H · −50 °C OUTSIDE", "STARTS ~200 KM OUT", "TOUCHDOWN AT ~250 KM/H"];
  const CABIN = ["SEATBELTS ON · SHADES UP", "SEATBELTS ON · EARS POP", "SEATBELT SIGN OFF · SNACKS", "SEATBELTS ON · TRAYS UP", "REMAIN SEATED (UNCLE!)"];
  const TILT = [-9, -15, 0, 8, 3];
  const profile = (hi, done) => {
    const segs = ["M20 128 L 92 128 L 120 112", "M120 112 L 210 34", "M210 34 L 330 34", "M330 34 L 430 108", "M430 108 L 456 126 L 500 128"];
    return `<svg width="500" height="150" viewBox="0 0 520 150"><line x1="10" y1="132" x2="510" y2="132" stroke="${INK}" stroke-width="3" opacity=".25"/>${segs.map((d, i) => `<path d="${d}" stroke="${i + 1 === hi ? "#FFC93D" : i + 1 <= done ? TEAL : "#C9D0DC"}" stroke-width="${i + 1 === hi ? 14 : 9}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}${[[106, 120], [165, 73], [270, 34], [380, 71], [470, 127]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="15" fill="${i + 1 === hi ? "#FFC93D" : i + 1 <= done ? TEAL : "#fff"}" stroke="${INK}" stroke-width="3"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="16" fill="${i + 1 <= done ? "#fff" : INK}">${i + 1}</text>`).join("")}</svg>`;
  };
  function shadeHTML(done, next, k) {
    const nx = next || 5;
    const rows = P.PHASES.map((ph, i) => {
      const n = i + 1, isDone = n <= done, isNext = n === next;
      const badge = isDone ? `<span style="padding:5px 14px;border-radius:999px;background:#22B573;color:#fff">✓ DONE</span>` : isNext ? `<span class="nx" style="display:inline-block;padding:5px 14px;border-radius:999px;background:#FFC93D;color:${INK}"><span class="w1">▶ NEXT</span><span class="w2" style="display:none">▶ NOW</span></span>` : `<span style="opacity:.35">· · ·</span>`;
      return `<div style="display:flex;align-items:center;gap:14px;height:86px;padding:0 14px;${isNext ? "background:rgba(255,201,61,.2);border-radius:18px;" : ""}"><span style="display:inline-flex;width:52px;height:52px;border-radius:14px;align-items:center;justify-content:center;border:3px solid ${INK};background:${isDone ? TEAL : isNext ? "#FFC93D" : "#fff"};color:${isDone ? "#fff" : INK};font-size:24px">${n}</span><span style="font-family:Archivo;font-weight:900;font-size:34px;${isDone || isNext ? "" : "opacity:.4"}">${ph.toUpperCase()}</span><span style="flex:1"></span>${badge}</div>`;
    }).join("");
    const card = (x, inner, bg) => `<div class="abs" style="left:${x}px;top:196px;width:560px;height:690px;border-radius:30px;background:${bg};border:3px solid ${INK};box-shadow:0 10px 0 ${INK},0 30px 50px rgba(27,35,64,.25);padding:26px 24px;font-family:'JetBrains Mono';font-weight:800;color:${INK}">${inner}</div>`;
    const left = card(88, `<div style="font-size:18px;letter-spacing:.16em;opacity:.55">BOARDING PASS · HX 2026</div><div style="font-family:Archivo;font-weight:900;font-size:58px;margin:4px 0 14px">DEL <span style="color:${TEAL}">✈</span> BOM</div><div style="border-top:4px dashed rgba(27,35,64,.25);padding-top:12px">${rows}</div>`, "#E3EEFC");
    const right = card(1272, `<div style="font-size:18px;letter-spacing:.16em;opacity:.55">${next ? "COMING UP" : "FLIGHT COMPLETE"}</div><div style="font-family:Archivo;font-weight:900;font-size:50px;margin:6px 0 4px">${next ? P.PHASES[next - 1].toUpperCase() : "ARRIVED ✓"}</div><div style="margin:10px 0 6px">${profile(next || 0, done)}</div>
      <div style="margin-top:14px;padding:16px 18px;border-radius:18px;background:#0E1530;color:#FFC93D;font-size:23px">${STAT[nx - 1]}</div>
      <div style="margin-top:16px;padding:16px 18px;border-radius:18px;background:#F1F5FB;border:3px solid ${INK};font-size:21px;display:flex;gap:12px;align-items:center"><span style="display:inline-flex;width:44px;height:44px;border-radius:12px;background:#2B3354;color:#FFC93D;align-items:center;justify-content:center;font-size:24px">🔔</span>${CABIN[nx - 1]}</div>`, "#FFE9DA");
    const shade = `<div class="abs shd" style="left:0;top:0;width:520px;height:720px;background:repeating-linear-gradient(180deg,#FFF6DD 0 34px,#F3E6C2 34px 37px);border-bottom:26px solid #C9B98F">
        <div class="abs" style="left:0;right:0;top:120px;text-align:center;font-family:'JetBrains Mono';font-weight:800;font-size:28px;letter-spacing:.16em;color:#B88A00"><span class="w1">${next ? "NEXT ▶" : "LANDED ✓"}</span><span class="w2" style="display:none;color:#22B573">NOW ▶</span></div>
        <div class="abs" style="left:0;right:0;top:170px;text-align:center;white-space:nowrap;font-family:Archivo;font-weight:900;font-stretch:68%;font-size:${next ? 118 : 92}px;line-height:.9;color:${INK}">${next ? `PHASE ${pad(next)}` : "DEL ✈ BOM"}</div>
        <div class="abs" style="left:0;right:0;top:300px;text-align:center;white-space:nowrap;font-family:Archivo;font-weight:900;font-size:60px;color:${TEAL}">${next ? P.PHASES[next - 1].toUpperCase() : "THANK YOU"}</div>
        <div class="abs hero" style="left:110px;top:420px;width:300px;transform:rotate(${TILT[nx - 1]}deg)">${P.side({ w: 300, id: "shp" + k, gear: nx === 1 || nx >= 4 })}</div>
        <div class="abs" style="left:200px;bottom:-22px;width:120px;height:16px;border-radius:8px;background:#5C677E"></div></div>`;
    return `<div class="abs wall" style="left:0;top:0;width:1920px;height:1080px;transform-origin:960px 530px">
      <svg class="abs" style="left:0;top:0;overflow:visible" width="1920" height="1080"><defs><linearGradient id="wl${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB1CF"/><stop offset="1" stop-color="#6F82A6"/></linearGradient></defs>
        <path fill-rule="evenodd" fill="url(#wl${k})" d="M-4000 -4000 H5920 V5080 H-4000 Z M700 390 A220 220 0 0 1 920 170 H1000 A220 220 0 0 1 1220 390 V670 A220 220 0 0 1 1000 890 H920 A220 220 0 0 1 700 670 Z"/>
        ${[30, 1890].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="1080" stroke="#5C6E92" stroke-width="4"/>`).join("")}
        <path fill="none" stroke="#DCE3EE" stroke-width="44" d="M700 390 A220 220 0 0 1 920 170 H1000 A220 220 0 0 1 1220 390 V670 A220 220 0 0 1 1000 890 H920 A220 220 0 0 1 700 670 Z"/>
        <path fill="none" stroke="#A9B3C4" stroke-width="8" d="M682 390 A238 238 0 0 1 920 152 H1000 A238 238 0 0 1 1238 390 V670 A238 238 0 0 1 1000 908 H920 A238 238 0 0 1 682 670 Z"/></svg>
      <div class="abs" style="left:700px;top:170px;width:520px;height:720px;border-radius:220px;overflow:hidden">${shade}</div>
      ${left}${right}</div>`;
  }
  function shadeClose(t, { phase = 1, until = null } = {}) {
    const next = phase < 5 ? phase + 1 : null;
    const L = layer(70, shadeHTML(phase, next, "c")), wall = $(".wall", L), shd = $(".shd", L);
    gsap.set(wall, { scale: 4.6 }); gsap.set(shd, { yPercent: -104 });
    tl.set(wall, { scale: 4.6 }, t - 1.2); tl.set(shd, { yPercent: -104 }, t - 1.2);
    tl.set(L, { autoAlpha: 1 }, t - 1.15);
    tl.to(["#tag", "#prog"], { autoAlpha: 0, duration: 0.2 }, t - 1.15);
    tl.fromTo(wall, { scale: 4.6 }, { scale: 1, duration: 0.65, ease: "power3.inOut", immediateRender: false }, t - 1.15);
    tl.fromTo(shd, { yPercent: -104 }, { yPercent: 0, duration: 0.5, ease: "bounce.out", immediateRender: false }, t - 0.5);
    tl.fromTo($(".hero", L), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, t);
    sfx(t - 1.15, "whoosh", { gain: 0.24, dur: 0.6 }); sfx(t - 0.5, "roll", { gain: 0.2 }); sfx(t - 0.08, "clunk", { gain: 0.26 }); sfx(t + 0.1, "ding", { gain: 0.18 });
    if (until != null) tl.set(L, { autoAlpha: 0 }, until);
    T(t - 1.25, until != null ? until : 1e6);
  }
  function shadeOpen(t, { phase = 2 } = {}) {
    const L = layer(70, shadeHTML(phase - 1, phase, "o")), wall = $(".wall", L), shd = $(".shd", L);
    tl.set(L, { autoAlpha: 1 }, 0);
    const tn = Math.max(0.05, t - 0.45);
    tl.set($$(".w1", L), { display: "none" }, tn); tl.set($$(".w2", L), { display: "inline" }, tn);
    tl.fromTo($$(".nx", L), { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, tn);
    sfx(tn, "chime", { gain: 0.2 });
    tl.to(shd, { yPercent: -104, duration: 0.42, ease: "power2.in" }, t);
    tl.to(wall, { scale: 4.6, duration: 0.6, ease: "power3.in" }, t + 0.32);
    tl.set(L, { autoAlpha: 0 }, t + 0.94);
    sfx(t, "roll", { gain: 0.2 }); sfx(t + 0.32, "whoosh", { gain: 0.24, dur: 0.6 });
    T(0, t + 1.0);
  }
  function phaseStart(n, title, { t = 0.75, chromeAt = null } = {}) {
    passChrome(n, title);
    $("#subs").dataset.ob = "subs";
    EX.subtitles();
    shadeOpen(t, { phase: n });
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, chromeAt != null ? chromeAt : t + 0.9);
  }

  // ---------------------------------------------------------------- cloud wipe: a solid cloud bank rolls across (covered t-0.15 .. t+0.15)
  const bank = (seed) => {
    const r = REEL.rng(seed); let s = `<rect x="1100" y="-200" width="3600" height="1500" fill="#fff"/>`;
    for (let y = -200; y < 1300; y += 110) {
      [[1100, -1], [4700, 1]].forEach(([x0, dir]) => { const rr = 150 + r() * 120, x = x0 + dir * (r() * 160 - 20); s += `<circle cx="${x + 16}" cy="${y + 26}" r="${rr}" fill="#D9E6F3"/><circle cx="${x}" cy="${y}" r="${rr}" fill="#fff"/>`; });
    }
    for (let i = 0; i < 14; i++) s += `<circle cx="${1300 + r() * 3200}" cy="${r() * 1080}" r="${120 + r() * 180}" fill="#EEF4FA" opacity=".8"/>`;
    return `<svg class="abs" style="left:0;top:0;overflow:visible" width="5800" height="1080">${s}</svg>`;
  };
  function cloudWipe(t, { seed = 5 } = {}) {
    const L = layer(66, `<div class="abs cb" style="left:0;top:0;width:5800px;height:1080px">${bank(seed)}</div><div class="abs cp" style="left:0;top:0">${P.side({ w: 420, id: "cwp" + seed, gear: false })}</div>`);
    const cb = $(".cb", L), cp = $(".cp", L);
    gsap.set(cb, { x: 2000 }); gsap.set(cp, { x: -500, y: 900, rotation: -14 });
    tl.set(cb, { x: 2000 }, t - 0.78); tl.set(L, { autoAlpha: 1 }, t - 0.76);
    tl.fromTo(cb, { x: 1920 }, { x: -5800, duration: 1.4, ease: "none", immediateRender: false }, t - 0.7);
    tl.fromTo(cp, { x: -500, y: 900 }, { x: 2100, y: 150, duration: 1.4, ease: "none", immediateRender: false }, t - 0.7);
    tl.set(L, { autoAlpha: 0 }, t + 0.72);
    sfx(t - 0.7, "whoosh", { gain: 0.3, dur: 1.4 });
    T(t - 0.8, t + 0.75);
  }
  // swap two scenes instantly at t (use under a covering wipe)
  function swap(out, inn, t) { tl.set(inn, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, t); if (out) tl.set(out, { autoAlpha: 0 }, t); }

  // ---------------------------------------------------------------- contrail wipe: a jet streaks across, its white trail covers the screen, then dissolves
  function contrailWipe(t, { ang = -32 } = {}) {
    const a = (ang * Math.PI) / 180, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], C = [960, 540];
    const A = [C[0] - d[0] * 2400, C[1] - d[1] * 2400], H0 = [C[0] - d[0] * 1500, C[1] - d[1] * 1500], B = [C[0] + d[0] * 2000, C[1] + d[1] * 2000];
    const L = layer(67, `<svg class="abs" style="left:0;top:0;overflow:visible" width="1920" height="1080"><path class="o" fill="#fff" opacity=".55"/><path class="i" fill="#fff"/></svg><div class="abs jp" style="left:0;top:0;width:360px;height:108px">${P.side({ w: 360, id: "ctp", gear: false })}</div>`);
    const po = $(".o", L), pi = $(".i", L), jp = $(".jp", L);
    const band = (H, extra) => { const len = Math.hypot(H[0] - A[0], H[1] - A[1]), lft = [], rgt = []; for (let s = 0; s <= len; s += 40) { const hw = 1400 * Math.min(1, s / 600) + extra + 46 * Math.abs(Math.sin(s / 70 + 1.3)), x = H[0] - d[0] * s, y = H[1] - d[1] * s; lft.push(`${(x + n[0] * hw).toFixed(0)},${(y + n[1] * hw).toFixed(0)}`); rgt.push(`${(x - n[0] * hw).toFixed(0)},${(y - n[1] * hw).toFixed(0)}`); } return `M${H[0].toFixed(0)} ${H[1].toFixed(0)} L${lft.join(" L")} L${rgt.reverse().join(" L")} Z`; };
    tl.set(L, { autoAlpha: 1 }, t - 0.66);
    tl.to(L, { autoAlpha: 0, duration: 0.32, ease: "power1.out" }, t - 0.02);
    REEL.onFrame((tt) => {
      if (tt < t - 0.7 || tt > t + 0.6) return;
      const u = Math.min(1, Math.max(0, (tt - (t - 0.65)) / 0.65)), e = u, H = [H0[0] + (B[0] - H0[0]) * e, H0[1] + (B[1] - H0[1]) * e];
      po.setAttribute("d", band(H, 80)); pi.setAttribute("d", band(H, 0));
      jp.style.transform = `translate(${(H[0] - 300).toFixed(1)}px,${(H[1] - 70).toFixed(1)}px) rotate(${ang}deg)`;
    });
    sfx(t - 0.66, "whoosh", { gain: 0.32, dur: 0.8 }); sfx(t + 0.1, "swish", { gain: 0.18 });
    T(t - 0.7, t + 0.55);
  }

  // ---------------------------------------------------------------- radar sweep: the next scene is painted in by a rotating radar beam
  function radarSweep(out, inn, t, { dur = 0.75, cx = 960, cy = 540 } = {}) {
    const el = $(inn);
    const L = layer(68, `<svg class="abs" style="left:0;top:0;overflow:visible" width="1920" height="1080"><g class="bm"><path d="M${cx} ${cy} L ${cx + 2400} ${cy} A 2400 2400 0 0 0 ${cx + 2400 * Math.cos(0.5)} ${cy - 2400 * Math.sin(0.5)} Z" fill="#22D07A" opacity=".22"/><line x1="${cx}" y1="${cy}" x2="${cx + 2400}" y2="${cy}" stroke="#7CFFB2" stroke-width="10"/></g>${[160, 340, 560].map((r) => `<circle class="rr" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#7CFFB2" stroke-width="4" opacity=".5"/>`).join("")}<circle cx="${cx}" cy="${cy}" r="14" fill="#7CFFB2"/></svg>`);
    const bm = $(".bm", L);
    tl.set(inn, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, t);
    tl.set(L, { autoAlpha: 1 }, t); tl.set(L, { autoAlpha: 0 }, t + dur + 0.02);
    if (out) tl.set(out, { autoAlpha: 0 }, t + dur);
    REEL.onFrame((tt) => {
      const on = tt >= t && tt <= t + dur;
      if (!on) { if (el.style.maskImage) { el.style.maskImage = ""; el.style.webkitMaskImage = ""; } return; }
      const u = (tt - t) / dur, A = 360 * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
      const m = `conic-gradient(from 90deg at ${cx}px ${cy}px, #000 ${A.toFixed(1)}deg, transparent ${A.toFixed(1)}deg)`;
      el.style.maskImage = m; el.style.webkitMaskImage = m;
      bm.setAttribute("transform", `rotate(${(A).toFixed(1)} ${cx} ${cy})`);
    });
    sfx(t, "beep", { gain: 0.14, pitch: 1.4 }); sfx(t + 0.05, "swish", { gain: 0.22 });
    T(t - 0.05, t + dur + 0.05);
  }

  // ---------------------------------------------------------------- ambient: soft clouds drifting (pure function of t)
  function ambientClouds(scene, { from = 0, to = 1e6, seed = 1, n = 9, op = 0.8, y0 = 120, y1 = 900, speed = 1 } = {}) {
    const sc = typeof scene === "string" ? $(scene) : scene, r = REEL.rng(seed);
    const L = document.createElement("div"); L.className = "abs amb"; L.style.cssText = "inset:0;overflow:hidden;pointer-events:none";
    const anchor = sc.querySelector(".dots") || sc.querySelector(".bg"); anchor ? anchor.after(L) : sc.prepend(L);
    const it = Array.from({ length: n }, () => ({ x: r() * 2400, y: y0 + r() * (y1 - y0), s: 0.6 + r() * 1.4, sp: (16 + r() * 30) * speed }));
    L.innerHTML = it.map((q) => `<svg class="abs ac" style="left:0;top:0;overflow:visible" width="200" height="120" viewBox="-100 -60 200 120"><g transform="scale(${q.s.toFixed(2)})" opacity="${op}"><ellipse cx="0" cy="12" rx="78" ry="16" fill="#D7E6F2"/><circle cx="-38" cy="0" r="28" fill="#fff"/><circle cx="2" cy="-18" r="36" fill="#fff"/><circle cx="40" cy="2" r="26" fill="#fff"/><rect x="-66" y="-2" width="132" height="18" rx="9" fill="#fff"/></g></svg>`).join("");
    const els = $$(".ac", L);
    REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; els.forEach((e, i) => { const q = it[i], x = ((q.x - t * q.sp) % 2400 + 2400) % 2400 - 240; e.style.transform = `translate(${x.toFixed(1)}px,${q.y.toFixed(1)}px)`; }); });
    return L;
  }

  // ---------------------------------------------------------------- split-flap text: settles from random glyphs to `text` at time t
  function flapText(el, text, t, { rate = 22, dur = 0.6, seed = 1 } = {}) {
    const G = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", r = REEL.rng(seed), noise = Array.from({ length: 64 }, () => Array.from({ length: text.length }, () => G[Math.floor(r() * G.length)]).join(""));
    REEL.onFrame((tt) => {
      if (tt < t - 0.05) { el.textContent = " ".repeat(text.length); return; }
      if (tt >= t + dur) { el.textContent = text; return; }
      const f = Math.max(0, Math.floor((tt - t) * rate)), k = Math.max(0, Math.floor(((tt - t) / dur) * text.length));
      el.textContent = text.slice(0, k) + noise[f % 64].slice(k).split("").map((c, i) => (text[k + i] === " " ? " " : c)).join("");
    });
  }


  // ---------------------------------------------------------------- window reveal: an aircraft-window-shaped hole grows from (x,y) and becomes the screen
  function windowReveal(inn, t, x, y, { dur = 0.7, out = null } = {}) {
    const el = $(inn);
    const ring = layer(69, `<div class="abs wr" style="left:${x - 60}px;top:${y - 80}px;width:120px;height:160px;border-radius:60px;border:10px solid #DCE3EE;box-shadow:0 0 0 6px #1B2340,inset 0 0 0 4px #1B2340"></div>`);
    const wr = $(".wr", ring);
    tl.set(inn, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, t);
    tl.set(ring, { autoAlpha: 1 }, t); tl.set(ring, { autoAlpha: 0 }, t + dur);
    REEL.onFrame((tt) => {
      if (tt < t || tt > t + dur) { if (el.style.clipPath && el.style.clipPath.startsWith("inset")) el.style.clipPath = ""; return; }
      const u = (tt - t) / dur, k = u * u * u, s = 1 + k * 30, ww = 120 * s, hh = 160 * s, cx = x + (960 - x) * u * u, cy = y + (540 - y) * u * u, r = 60 * s;
      el.style.clipPath = `inset(${(cy - hh / 2).toFixed(1)}px ${(1920 - cx - ww / 2).toFixed(1)}px ${(1080 - cy - hh / 2).toFixed(1)}px ${(cx - ww / 2).toFixed(1)}px round ${r.toFixed(1)}px)`;
      wr.style.transform = `translate(${(cx - x).toFixed(1)}px,${(cy - y).toFixed(1)}px) scale(${s.toFixed(3)})`;
    });
    if (out) tl.set(out, { autoAlpha: 0 }, t + dur);
    sfx(t, "whoosh", { gain: 0.24, dur: dur }); sfx(t + 0.1, "riser", { gain: 0.08, dur: 0.5 });
    T(t - 0.05, t + dur + 0.05);
  }
  // ---------------------------------------------------------------- film-strip wipe (for "in the movies" beats): a strip slides across, covers at t, slides off
  function filmWipe(t, { dur = 0.4, dir = 1 } = {}) {
    const holes = Array.from({ length: 22 }, (_, i) => `<rect x="${20 + i * 100}" y="20" width="56" height="40" rx="8" fill="#F3E6C2"/><rect x="${20 + i * 100}" y="1060" width="56" height="40" rx="8" fill="#F3E6C2"/>`).join("");
    const L = layer(66, `<div class="abs fs" style="left:0;top:-20px;width:2300px;height:1120px;background:#141414"><svg class="abs" style="left:0;top:0" width="2300" height="1120">${holes}${[0, 1].map((i) => `<rect x="${140 + i * 1100}" y="110" width="980" height="900" rx="16" fill="#2A2A2A"/>`).join("")}</svg></div>`);
    const fs = $(".fs", L), A = dir > 0 ? -2400 : 2000, B = dir > 0 ? 2000 : -2400;
    gsap.set(fs, { x: A }); tl.set(fs, { x: A }, t - dur - 0.06); tl.set(L, { autoAlpha: 1 }, t - dur - 0.05);
    tl.fromTo(fs, { x: A }, { x: -190, duration: dur, ease: "power3.in", immediateRender: false }, t - dur - 0.05);
    tl.to(fs, { x: B, duration: dur, ease: "power3.out" }, t + 0.06);
    tl.set(L, { autoAlpha: 0 }, t + dur + 0.1);
    sfx(t - dur, "roll", { gain: 0.2 }); sfx(t, "click", { gain: 0.3 }); sfx(t + 0.06, "swish", { gain: 0.2 });
    T(t - dur - 0.1, t + dur + 0.15);
  }
  Object.assign(EX, { windowReveal, filmWipe, passChrome, shadeClose, shadeOpen, phaseStart, cloudWipe, swap, contrailWipe, radarSweep, ambientClouds, flapText });
})();
