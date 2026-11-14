// atmfx.js — receipt theme for the ATM explainer: chrome, receipt print/tear chapter wipes, shutter wipe, note bursts.
// Load after explainer2.js and atm.js.
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const A = window.ATMART, INK = "#1B2340";
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);
  const css = document.createElement("style");
  css.textContent = `.fc,.bub{border:3px solid ${INK} !important;box-shadow:0 9px 0 ${INK},0 26px 44px rgba(27,35,64,.34) !important}
    .zig{clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),97.5% 100%,95% calc(100% - 18px),92.5% 100%,90% calc(100% - 18px),87.5% 100%,85% calc(100% - 18px),82.5% 100%,80% calc(100% - 18px),77.5% 100%,75% calc(100% - 18px),72.5% 100%,70% calc(100% - 18px),67.5% 100%,65% calc(100% - 18px),62.5% 100%,60% calc(100% - 18px),57.5% 100%,55% calc(100% - 18px),52.5% 100%,50% calc(100% - 18px),47.5% 100%,45% calc(100% - 18px),42.5% 100%,40% calc(100% - 18px),37.5% 100%,35% calc(100% - 18px),32.5% 100%,30% calc(100% - 18px),27.5% 100%,25% calc(100% - 18px),22.5% 100%,20% calc(100% - 18px),17.5% 100%,15% calc(100% - 18px),12.5% 100%,10% calc(100% - 18px),7.5% 100%,5% calc(100% - 18px),2.5% 100%,0 calc(100% - 18px))}`;
  document.head.appendChild(css);

  // ---------------------------------------------------------------- chrome: step tag + a small receipt tab with 5 boxes
  function slipChrome(num, title) {
    EX.chrome(num, A.STEPS.length, title);
    $("#tag").innerHTML = `<b style="color:#12A4C4">STEP ${String(num).padStart(2, "0")} / ${String(A.STEPS.length).padStart(2, "0")}</b><span>${title}</span>`;
    $("#prog").outerHTML = `<div id="prog" data-ob="chrome" class="zig" style="position:absolute;right:56px;top:0;padding:14px 18px 26px;background:#FBFAF6;filter:drop-shadow(0 6px 0 rgba(27,35,64,.25));display:flex;gap:8px;align-items:center;font-family:'JetBrains Mono';font-weight:800;font-size:15px;color:${INK}">
      <span style="opacity:.55;margin-right:6px">TXN #4821</span>${A.STEPS.map((s, i) => `<span style="display:inline-flex;width:30px;height:30px;border-radius:7px;align-items:center;justify-content:center;border:2px solid ${INK};background:${i + 1 < num ? "#22B573" : i + 1 === num ? "#FFC93D" : "#fff"};color:${i + 1 < num ? "#fff" : INK}">${i + 1 < num ? "✓" : i + 1}</span>`).join("")}</div>`;
    gsap.set(["#tag", "#prog"], { autoAlpha: 0 });
  }

  // ---------------------------------------------------------------- the receipt wipe — ONE continuous transaction slip
  // The slip lists all 5 steps (icon · label · status) + a big panel for the next step + barcode.
  // close(N) ends showing: steps 1..N ✓, step N+1 "NEXT". open(N+1) starts in that exact state, flips NEXT → NOW, then tears off.
  const ICON = (i) => [A.card({ w: 76, id: "ri" + i }), A.pinpad({ w: 74, hand: false, id: "rp" + i }), A.hub({ w: 58 }), ISO.bank({ w: 78, flag: false, color: "#7B61FF", label: "", id: "rb" + i }), A.note({ w: 84, n: 500 })][i];
  const HERO = (n, k) => [A.card({ w: 360, id: "rh1" + k }), A.pinpad({ w: 320, hand: true, id: "rh2" + k }), A.hub({ w: 250 }), ISO.bank({ w: 320, color: "#7B61FF", label: "YOUR BANK", id: "rh4" + k }), A.fan({ w: 380 })][n - 1];
  const barcode = () => { const r = REEL.rng(4821); let x = 0, s = ""; while (x < 880) { const bw = 3 + Math.floor(r() * 9); if (r() > 0.35) s += `<rect x="${x}" y="0" width="${bw}" height="90" fill="${INK}"/>`; x += bw + 3; } return `<svg width="880" height="90">${s}</svg>`; };
  function slipHTML(done, nextStep, k) {
    const rows = A.STEPS.map((st, i) => {
      const n = i + 1, isDone = n <= done, isNext = n === nextStep;
      const badge = isDone ? `<span class="bd" style="padding:6px 18px;border-radius:999px;background:#22B573;color:#fff">✓ DONE</span>`
        : isNext ? `<span class="bd nx" style="padding:6px 18px;border-radius:999px;background:#FFC93D;color:${INK}"><span class="w1">▶ NEXT</span><span class="w2" style="display:none">▶ NOW</span></span>` : `<span class="bd" style="opacity:.35">· · ·</span>`;
      return `<div class="rw" style="display:flex;align-items:center;gap:22px;height:112px;${isNext ? "background:rgba(255,201,61,.18);border-radius:20px;" : ""}padding:0 16px">
        <div style="width:96px;height:96px;border-radius:20px;background:#F1F3F8;border:3px solid ${INK};display:flex;align-items:center;justify-content:center;overflow:hidden;${isDone || isNext ? "" : "opacity:.45"}">${ICON(i)}</div>
        <span style="font-size:34px;${isDone || isNext ? "" : "opacity:.45"}">${String(n).padStart(2, "0")} ${st.toUpperCase()}</span><span style="flex:1;border-bottom:4px dotted rgba(27,35,64,.25);margin:0 6px;transform:translateY(10px)"></span>${badge}</div>`;
    }).join("");
    const panel = nextStep ? `<div style="font-size:30px;letter-spacing:.14em;color:#B88A00"><span class="w1">NEXT ▶</span><span class="w2" style="display:none;color:#22B573">NOW ▶</span></div>
        <div style="font-family:Archivo;font-weight:900;font-stretch:68%;font-size:150px;line-height:.9;color:${INK}">STEP ${String(nextStep).padStart(2, "0")}</div>
        <div style="font-family:Archivo;font-weight:900;font-size:52px;color:#7B61FF;margin-top:6px">${A.STEPS[nextStep - 1]}</div>
        <div class="hero" style="margin-top:22px;display:flex;justify-content:center">${HERO(nextStep, k)}</div>`
      : `<div style="font-size:30px;letter-spacing:.14em;color:#22B573">ALL STEPS ✓</div>
        <div style="font-family:Archivo;font-weight:900;font-stretch:68%;font-size:104px;line-height:.92;color:${INK}">DONE IN<br><span style="color:#F2553D">10 SECONDS</span></div>
        <div style="font-family:Archivo;font-weight:900;font-size:46px;color:#7B61FF;margin-top:10px">Thanks for watching!</div>
        <div class="hero" style="margin-top:6px;display:flex;justify-content:center;transform:scale(.8)">${HERO(5, k)}</div>`;
    return `<div class="abs" style="left:170px;top:112px;width:1580px;display:flex;justify-content:space-between;font-size:26px;letter-spacing:.2em;opacity:.6"><span>ATM RECEIPT · TXN #4821</span><span>CARD XX4821 · ₹2,000 · 22:04</span></div>
      <div class="abs" style="left:170px;top:160px;width:1580px;border-top:4px dashed rgba(27,35,64,.3)"></div>
      <div class="abs" style="left:150px;top:190px;width:900px">${rows}</div>
      <div class="abs" style="left:1110px;top:190px;width:640px;height:610px;border-radius:30px;border:4px dashed rgba(27,35,64,.3);padding:26px 34px;text-align:center">${panel}</div>
      <div class="abs" style="left:170px;top:832px;width:1580px;border-top:4px dashed rgba(27,35,64,.3)"></div>
      <div class="abs" style="left:520px;top:858px;text-align:center">${barcode()}<div style="font-size:20px;letter-spacing:.3em;opacity:.55;margin-top:8px">THANK YOU · KEEP THIS RECEIPT (OR DON'T)</div></div>`;
  }
  function paperLayer(inner) {
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:70;overflow:hidden;pointer-events:none";
    L.innerHTML = `<div class="abs pp zig" style="left:0;top:0;width:1920px;height:1180px;background:#FBFAF6;background-image:repeating-linear-gradient(0deg,rgba(27,35,64,.03) 0 2px,transparent 2px 44px);font-family:'JetBrains Mono';font-weight:800;color:${INK}">${inner}</div>
      <div class="abs pb" style="left:0;top:0;width:1920px;height:84px;background:linear-gradient(180deg,#2B3354,#1B2340)"><div class="abs" style="left:120px;right:120px;top:62px;height:12px;border-radius:6px;background:#0B0F20"></div><div class="abs" style="left:60px;top:28px;width:18px;height:18px;border-radius:50%;background:#22D07A"></div></div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    return L;
  }
  // close: the slip prints down in jerky steps (rows appear as they print) and covers the screen at t
  function receiptClose(t, { step = 1, until = null } = {}) {
    const next = step < A.STEPS.length ? step + 1 : null;
    const L = paperLayer(slipHTML(step, next, "c")), pp = $(".pp", L), pb = $(".pb", L), rws = $$(".rw", L);
    gsap.set(pp, { y: -1180 }); gsap.set(pb, { y: -90 });
    const cur = rws[step - 1], bd = $(".bd", cur);
    tl.set(L, { autoAlpha: 1 }, t - 1.25);
    tl.to(["#tag", "#prog"], { autoAlpha: 0, duration: 0.2 }, t - 1.25);
    tl.to(pb, { y: 0, duration: 0.25, ease: "power2.out" }, t - 1.25);
    tl.fromTo(pp, { y: -1180 }, { y: 0, duration: 1.0, ease: "steps(16)", immediateRender: false }, t - 1.0);
    gsap.set(bd, { autoAlpha: 0 });
    tl.fromTo(bd, { autoAlpha: 0, scale: 2 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: "power4.in", immediateRender: false }, t + 0.05);
    tl.fromTo($(".hero", L), { scale: 0.85 }, { scale: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, t + 0.1);
    for (let k = 0; k < 6; k++) sfx(t - 1.0 + k * 0.17, "print", { gain: 0.18 });
    sfx(t + 0.2, "stamp", { gain: 0.3 }); sfx(t + 0.3, "ding", { gain: 0.2 });
    if (until != null) tl.set(L, { autoAlpha: 0 }, until);
    T(t - 1.3, until != null ? until : 1e6);
  }
  // open: starts as the exact slip the previous chapter ended on; NEXT flips to NOW, then the slip tears off at t
  function receiptOpen(t, { step = 2 } = {}) {
    const L = paperLayer(slipHTML(step - 1, step, "o")), pp = $(".pp", L), pb = $(".pb", L);
    tl.set(L, { autoAlpha: 1 }, 0);
    const tn = Math.max(0.1, t - 0.45);
    tl.set($$(".w1", L), { display: "none" }, tn); tl.set($$(".w2", L), { display: "inline" }, tn);
    tl.fromTo($$(".nx", L), { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, tn);
    tl.to($(".hero", L), { y: -14, duration: 0.15, yoyo: true, repeat: 1 }, tn);
    sfx(tn, "chime", { gain: 0.2 });
    tl.to(pp, { y: -1260, rotation: -2.5, duration: 0.5, ease: "power3.in" }, t);
    tl.to(pb, { y: -100, duration: 0.3, ease: "power2.in" }, t + 0.3);
    tl.set(L, { autoAlpha: 0 }, t + 0.62);
    sfx(t, "tear", { gain: 0.32 });
    T(0, t + 0.65);
  }
  function stepStart(num, title, { t = 0.75 } = {}) {
    slipChrome(num, title);
    $("#subs").dataset.ob = "subs";
    EX.subtitles();
    receiptOpen(t, { step: num, title });
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, t + 0.5);
  }

  // ---------------------------------------------------------------- ATM shutter wipe: steel slats slide down (cover at t), then up
  function shutterWipe(t, { dur = 0.45 } = {}) {
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:66;overflow:hidden;pointer-events:none";
    L.innerHTML = `<div class="abs sh" style="left:0;top:0;width:1920px;height:1100px;background:repeating-linear-gradient(180deg,#9AA3B4 0 52px,#7C869A 52px 60px,#C9D0DC 60px 66px);border-bottom:22px solid #3E4A6A"><div class="abs" style="left:900px;bottom:30px;width:120px;height:22px;border-radius:11px;background:#3E4A6A"></div></div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    const sh = $(".sh", L);
    tl.set(L, { autoAlpha: 1 }, t - dur);
    tl.fromTo(sh, { y: -1140 }, { y: 0, duration: dur, ease: "bounce.out", immediateRender: false }, t - dur);
    tl.to(sh, { y: -1140, duration: dur, ease: "power3.in" }, t + 0.12);
    tl.set(L, { autoAlpha: 0 }, t + 0.15 + dur);
    sfx(t - dur, "roll", { gain: 0.22 }); sfx(t - 0.05, "clunk", { gain: 0.28 }); sfx(t + 0.12, "roll", { gain: 0.18 });
    T(t - dur - 0.05, t + dur + 0.2);
  }

  // ---------------------------------------------------------------- note burst: n notes fly out of (x,y) on ballistic arcs (pure, deterministic)
  function noteBurst(parent, t, x, y, { n = 12, seed = 3, spread = 900, up = 700, dur = 1.6, w = 170, ob = null } = {}) {
    const r = REEL.rng(seed), P = typeof parent === "string" ? $(parent) : parent;
    const els = [], par = [];
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div"); d.className = "abs nb"; if (ob) d.dataset.ob = ob;
      d.style.cssText = `left:${x - w / 2}px;top:${y - w * 0.25}px;opacity:0`;
      d.innerHTML = A.note({ w, n: [500, 200, 100][i % 3] });
      P.appendChild(d); els.push(d);
      par.push({ vx: (r() * 2 - 1) * spread, vy: -(0.6 + r() * 0.4) * up, rot: (r() * 2 - 1) * 540, t0: t + i * 0.05 });
    }
    // projectile: x = vx*k, y = vy*2k + g*k^2 (k = 0..1 over dur) — rises, then falls off the bottom
    REEL.onFrame((tt) => els.forEach((d, i) => {
      const q = par[i], k = (tt - q.t0) / dur;
      if (k < 0 || k > 1) { d.style.opacity = 0; return; }
      const X = q.vx * k, Y = q.vy * 2 * k + (Math.abs(q.vy) * 2 + 1100) * k * k;
      d.style.opacity = 1;
      d.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) rotate(${(q.rot * k).toFixed(1)}deg) scale(${(0.4 + 0.6 * Math.min(1, k * 3)).toFixed(2)})`;
    }));
    for (let k = 0; k < 4; k++) sfx(t + k * 0.12, "paper", { gain: 0.14 });
    return els;
  }

  // ---------------------------------------------------------------- screen fillers (concept-based, gentle motion, pure functions of t)
  // ambient(scene, kind, {from,to,seed,c}) — a background texture layer placed right above the scene's .bg/.dots
  // kinds: "rupee" floating ₹ coins + notes · "circuit" PCB traces with travelling pulses · "hex" falling code columns · "net" blinking node grid · "rx" faint receipts drifting
  function ambient(scene, kind, { from = 0, to = 1e6, seed = 1, c = "rgba(255,255,255,.18)" } = {}) {
    const sc = typeof scene === "string" ? $(scene) : scene, r = REEL.rng(seed);
    const L = document.createElement("div"); L.className = "abs amb"; L.style.cssText = "inset:0;overflow:hidden;pointer-events:none";
    const anchor = sc.querySelector(".dots") || sc.querySelector(".bg"); anchor ? anchor.after(L) : sc.prepend(L);
    if (kind === "rupee") {
      const it = Array.from({ length: 22 }, (_, i) => ({ x: r() * 1920, s: 40 + r() * 70, sp: 18 + r() * 30, ph: r(), note: i % 4 === 0, rot: r() * 360 }));
      L.innerHTML = it.map((q, i) => q.note ? `<div class="abs ai" style="left:0;top:0;opacity:.22">${A.note({ w: q.s * 2.2, n: [100, 200, 500][i % 3] })}</div>` : `<div class="abs ai" style="left:0;top:0;width:${q.s}px;height:${q.s}px;border-radius:50%;background:rgba(255,255,255,.22);border:3px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-family:Archivo;font-weight:900;font-size:${q.s * 0.55}px;color:rgba(255,255,255,.55)">₹</div>`).join("");
      const els = $$(".ai", L);
      REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; els.forEach((e, i) => { const q = it[i], y = 1180 - (((t * q.sp + q.ph * 1300) % 1300)); e.style.transform = `translate(${(q.x + Math.sin(t * 0.8 + i) * 30).toFixed(1)}px,${y.toFixed(1)}px) rotate(${(q.rot + t * 12 * (i % 2 ? 1 : -1)).toFixed(1)}deg)`; }); });
    } else if (kind === "circuit") {
      let s = "", paths = [];
      for (let i = 0; i < 16; i++) { let x = r() * 1920, y = r() * 1080, d = `M${x.toFixed(0)} ${y.toFixed(0)}`; for (let k = 0; k < 4; k++) { if (k % 2) x += (r() - 0.5) * 600; else y += (r() - 0.5) * 400; d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; } paths.push(d); s += `<path class="ct" d="${d}" stroke="${c}" stroke-width="4" fill="none"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="8" fill="none" stroke="${c}" stroke-width="4"/>`; }
      s += paths.map(() => `<circle class="cp" r="7" fill="rgba(255,236,150,.85)"/>`).join("");
      L.innerHTML = `<svg width="1920" height="1080" style="position:absolute;left:0;top:0">${s}</svg>`;
      const pe = $$(".ct", L), dots = $$(".cp", L), lens = pe.map((p) => p.getTotalLength());
      REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; dots.forEach((d, i) => { const p = pe[i].getPointAtLength(((t * 220 + i * 137) % lens[i])); d.setAttribute("cx", p.x.toFixed(1)); d.setAttribute("cy", p.y.toFixed(1)); }); });
    } else if (kind === "hex") {
      const cols = Array.from({ length: 24 }, (_, i) => ({ x: i * 82 + r() * 20, sp: 60 + r() * 80, ph: r() * 1000, txt: Array.from({ length: 16 }, () => "0123456789ABCDEF"[Math.floor(r() * 16)]).join("<br>") }));
      L.innerHTML = cols.map((q) => `<div class="abs hx" style="left:${q.x.toFixed(0)}px;top:0;font-family:'JetBrains Mono';font-weight:800;font-size:30px;line-height:1.25;color:${c};text-align:center">${q.txt}</div>`).join("");
      const els = $$(".hx", L);
      REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; els.forEach((e, i) => { const q = cols[i]; e.style.transform = `translateY(${((t * q.sp + q.ph) % 1700 - 620).toFixed(1)}px)`; }); });
    } else if (kind === "net") {
      const pts = Array.from({ length: 40 }, () => [r() * 1920, r() * 1080]);
      let s = ""; pts.forEach((p, i) => { const q = pts[(i * 7 + 3) % pts.length]; s += `<line x1="${p[0].toFixed(0)}" y1="${p[1].toFixed(0)}" x2="${q[0].toFixed(0)}" y2="${q[1].toFixed(0)}" stroke="${c}" stroke-width="2"/>`; });
      s += pts.map((p) => `<circle class="nd" cx="${p[0].toFixed(0)}" cy="${p[1].toFixed(0)}" r="7" fill="${c}"/>`).join("");
      L.innerHTML = `<svg width="1920" height="1080" style="position:absolute;left:0;top:0">${s}</svg>`;
      const nd = $$(".nd", L);
      REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; nd.forEach((n, i) => n.setAttribute("r", (5 + 4 * Math.max(0, Math.sin(t * 3 + i * 1.7))).toFixed(1))); });
    } else if (kind === "rx") {
      const it = Array.from({ length: 9 }, (_, i) => ({ x: i * 220 + r() * 60, sp: 30 + r() * 30, ph: r() * 1400, rot: (r() - 0.5) * 16 }));
      L.innerHTML = it.map(() => `<div class="abs rr zig" style="left:0;top:0;width:150px;height:240px;background:rgba(255,255,255,.28);padding:16px">${Array.from({ length: 7 }, (_, k) => `<div style="height:8px;margin:10px 0;border-radius:4px;background:rgba(27,35,64,.18);width:${60 + ((k * 37) % 40)}%"></div>`).join("")}</div>`).join("");
      const els = $$(".rr", L);
      REEL.onFrame((t) => { if (t < from - 0.5 || t > to + 0.5) return; els.forEach((e, i) => { const q = it[i]; e.style.transform = `translate(${q.x.toFixed(0)}px,${((t * q.sp + q.ph) % 1400 - 300).toFixed(1)}px) rotate(${(q.rot + Math.sin(t + i) * 4).toFixed(1)}deg)`; }); });
    }
    return L;
  }

  // live transaction-log terminal: lines = [[t, text, color?], ...]; each line types in at its time; blinking cursor
  function logPanel(scene, { x, y, w = 560, h = 300, title = "ATM · TXN LOG", lines = [], ob = "log" } = {}) {
    const sc = typeof scene === "string" ? $(scene) : scene;
    const P = document.createElement("div"); P.className = "abs fc"; P.dataset.ob = ob;
    P.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:24px;background:#0E1530;overflow:hidden;font-family:'JetBrains Mono';font-weight:700`;
    P.innerHTML = `<div style="height:44px;background:#1B2340;display:flex;align-items:center;gap:8px;padding:0 16px"><i style="width:12px;height:12px;border-radius:50%;background:#F0566E"></i><i style="width:12px;height:12px;border-radius:50%;background:#FFC93D"></i><i style="width:12px;height:12px;border-radius:50%;background:#22D07A"></i><span style="margin-left:10px;color:#8FA0D6;font-size:16px;letter-spacing:.12em">${title}</span></div><div class="lg" style="padding:12px 18px;font-size:21px;line-height:1.5"></div>`;
    sc.appendChild(P);
    const box = $(".lg", P), maxL = Math.floor((h - 64) / 31);
    REEL.onFrame((t) => {
      const vis = lines.filter((l) => t >= l[0]);
      const shown = vis.slice(-maxL).map((l, i, arr) => { const k = Math.min(l[1].length, Math.floor((t - l[0]) * 40)); const last = i === arr.length - 1; return `<div style="color:${l[2] || "#22D07A"};white-space:nowrap">&gt; ${l[1].slice(0, k)}${last && Math.floor(t * 3) % 2 ? "▌" : ""}</div>`; });
      box.innerHTML = shown.join("");
    });
    lines.forEach((l) => sfx(l[0], "tick", { gain: 0.05 }));
    return P;
  }

  // info card with icon rows popping in one by one; items = [[icon, text], ...]
  function infoCard(scene, { x, y, w = 480, title = "", items = [], t0 = 0, gap = 0.3, ob = "info", bg = "#fff" } = {}) {
    const sc = typeof scene === "string" ? $(scene) : scene;
    const C = document.createElement("div"); C.className = "abs fc"; C.dataset.ob = ob;
    C.style.cssText = `left:${x}px;top:${y}px;width:${w}px;padding:20px 24px;border-radius:24px;background:${bg};font-family:Archivo;color:${INK}`;
    C.innerHTML = `${title ? `<div style="font-family:'JetBrains Mono';font-weight:800;font-size:18px;letter-spacing:.14em;opacity:.55;margin-bottom:8px">${title}</div>` : ""}${items.map(([ic, tx]) => `<div class="ir" style="display:flex;gap:14px;align-items:center;font-weight:800;font-size:26px;padding:7px 0"><span style="display:inline-flex;width:44px;height:44px;border-radius:12px;background:#F1F3F8;align-items:center;justify-content:center;font-size:24px">${ic}</span>${tx}</div>`).join("")}`;
    sc.appendChild(C);
    gsap.set(C, { autoAlpha: 0 });
    tl.fromTo(C, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)", immediateRender: false }, t0);
    $$(".ir", C).forEach((r, i) => { tl.fromTo(r, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, t0 + 0.2 + i * gap); sfx(t0 + 0.2 + i * gap, "pop", { gain: 0.08 }); });
    return C;
  }

  Object.assign(EX, { slipChrome, receiptClose, receiptOpen, stepStart, shutterWipe, noteBurst, ambient, logPanel, infoCard });
})();
