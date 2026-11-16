// rocketfx.js — rocket-explainer theme: chrome (phase pill + live mission clock), launch-smoke wipe,
// chapter open (the phase board lifts off like a rocket) and chapter close (smoke rises, NEXT board drops in).
// Load after explainer2.js and rocket.js. Every animation is a pure function of t (timeline or onFrame).
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const R = window.ROCKET, INK = "#1B2340", TEAL = "#12A4C4", RED = "#F2553D", YEL = "#FFC93D";
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);
  const pad = (n) => String(n).padStart(2, "0");
  const css = document.createElement("style");
  css.textContent = `.fc,.bub{border:3px solid ${INK} !important;box-shadow:0 9px 0 ${INK},0 26px 44px rgba(10,15,40,.38) !important}
    #tag{left:44px !important;top:28px !important;padding:10px 22px 10px 10px;border-radius:999px;background:#0E1530;border:3px solid ${INK};box-shadow:0 6px 0 ${INK};color:#fff !important;font-size:21px !important;gap:14px !important}
    #tag span{color:#9FE3F2}
    .flip{display:inline-block;position:relative;background:linear-gradient(180deg,#26305A 0 49.5%,#1B2346 50.5% 100%);color:${YEL};border-radius:14px;border:3px solid ${INK};box-shadow:0 8px 0 ${INK};text-align:center}
    .flip:after{content:"";position:absolute;left:0;right:0;top:50%;height:3px;background:rgba(0,0,0,.45)}`;
  document.head.appendChild(css);
  const layer = (z, html) => { const L = document.createElement("div"); L.className = "abs"; L.style.cssText = `inset:0;z-index:${z};overflow:hidden;pointer-events:none`; L.innerHTML = html; $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 }); return L; };
  const PH = R.PHASES || ["Countdown", "Liftoff", "Staging", "Orbit", "Return"];

  // ---------------------------------------------------------------- chrome: phase pill (left) + live mission clock (right)
  // clock(t) -> signed seconds (negative = T-minus)
  function chrome(n, title, clock) {
    EX.chrome(n, 5, title);
    $("#tag").innerHTML = `<span style="display:inline-flex;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2F4A9E,#16204A);border:3px solid ${YEL};align-items:center;justify-content:center;font-size:22px">🚀</span><b style="color:${YEL}">PHASE ${pad(n)} / 05</b><span>${title}</span>`;
    $("#tag").dataset.ob = "chrome";
    $("#prog").outerHTML = `<div id="prog" data-ob="chrome2" style="position:absolute;right:40px;top:22px;display:flex;gap:12px;align-items:stretch">
      <div style="display:flex;gap:6px;align-items:center;padding:10px 14px;border-radius:18px;background:#0E1530;border:3px solid ${INK};box-shadow:0 6px 0 ${INK}">${PH.map((p, i) => `<i style="display:inline-flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;font:800 14px 'JetBrains Mono';font-style:normal;${i + 1 < n ? `background:#22B573;color:#fff` : i + 1 === n ? `background:${YEL};color:${INK}` : `background:#2B3354;color:#8D97B5`}">${i + 1 < n ? "✓" : i + 1}</i>`).join("")}</div>
      <div style="padding:8px 18px;border-radius:18px;background:#0E1530;border:3px solid ${INK};box-shadow:0 6px 0 ${INK};font-family:'JetBrains Mono';font-weight:800"><div style="font-size:13px;letter-spacing:.18em;color:#8D97B5">MISSION CLOCK</div><div id="mcT" style="font-size:34px;line-height:1;color:${YEL}">T-00:00</div></div></div>`;
    gsap.set(["#tag", "#prog"], { autoAlpha: 0 });
    if (clock) REEL.onFrame((t) => { const s = clock(t), a = Math.abs(s), neg = s < 0 ? Math.ceil(a - 1e-4) : Math.floor(a); const el = $("#mcT"); el.textContent = `T${s < 0 ? "-" : "+"}${pad(Math.floor(neg / 60))}:${pad(neg % 60)}`; el.style.color = s < 0 && a <= 10 ? (Math.floor(t * 4) % 2 ? "#FF7A6A" : YEL) : s >= 0 ? "#5CF0A6" : YEL; });
  }

  // ---------------------------------------------------------------- launch smoke: a tall column of shaded puffs
  const puffs = (seed, w, h, { dense = 1, tint = "#fff", shadow = "#C9D3E2" } = {}) => {
    const r = REEL.rng(seed); let s = "";
    const n = Math.round((w * h) / 26000 * dense);
    for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rr = 90 + r() * 170; s += `<circle cx="${(x + rr * 0.12).toFixed(0)}" cy="${(y + rr * 0.16).toFixed(0)}" r="${rr.toFixed(0)}" fill="${shadow}"/>`; }
    const r2 = REEL.rng(seed); for (let i = 0; i < n; i++) { const x = r2() * w, y = r2() * h, rr = 90 + r2() * 170; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(0)}" fill="${tint}"/><circle cx="${(x - rr * 0.25).toFixed(0)}" cy="${(y - rr * 0.3).toFixed(0)}" r="${(rr * 0.45).toFixed(0)}" fill="#fff" opacity=".7"/>`; }
    return s;
  };
  // edge puffs make the top/bottom of the column billowy; the middle 1080px is solid
  const column = (seed) => `<svg class="abs" style="left:0;top:0;overflow:visible" width="1920" height="3400"><defs><linearGradient id="cg${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF1FA"/><stop offset=".5" stop-color="#D9DEEE"/><stop offset="1" stop-color="#E9ECF6"/></linearGradient></defs><rect x="-200" y="900" width="2320" height="1600" fill="url(#cg${seed})"/>${puffs(seed, 1920, 900, { dense: 1.4 }).replace(/cy="(\d+)"/g, (m, y) => `cy="${+y + 300}"`)}${puffs(seed + 1, 1920, 900, { dense: 1.4 }).replace(/cy="(\d+)"/g, (m, y) => `cy="${+y + 1900}"`)}${puffs(seed + 2, 1920, 1300, { dense: 1.1, tint: "#F6F8FD", shadow: "#BFC6DD" }).replace(/cy="(\d+)"/g, (m, y) => `cy="${+y + 1000}"`)}</svg>`;
  // smokeWipe: the screen is fully covered from t-0.15 to t+0.15 (swap scenes at t)
  function smokeWipe(t, { seed = 3, dur = 1.3 } = {}) {
    const L = layer(66, `<div class="abs col" style="left:0;top:0;width:1920px;height:3400px">${column(seed)}</div>`), col = $(".col", L);
    gsap.set(col, { y: 1200 });
    tl.set(col, { y: 1200 }, t - dur / 2 - 0.03); tl.set(L, { autoAlpha: 1 }, t - dur / 2 - 0.02);
    tl.fromTo(col, { y: 1200 }, { y: -1050, duration: dur / 2, ease: "power2.in", immediateRender: false }, t - dur / 2);
    tl.to(col, { y: -3400, duration: dur / 2, ease: "power2.out" }, t);
    tl.set(L, { autoAlpha: 0 }, t + dur / 2 + 0.03);
    sfx(t - dur / 2, "whoosh", { gain: 0.28, dur: dur }); sfx(t - 0.2, "rumble", { gain: 0.18, dur: 0.9 });
    T(t - dur / 2 - 0.05, t + dur / 2 + 0.06);
  }

  // smokeReveal: the page OPENS fully covered by the cloud column (continuing a smokeWipe that ended the previous part), then it clears upward
  function smokeReveal({ seed = 3, dur = 0.65 } = {}) {
    const L = layer(66, `<div class="abs col" style="left:0;top:0;width:1920px;height:3400px">${column(seed)}</div>`), col = $(".col", L);
    gsap.set(col, { y: -1050 }); tl.set(L, { autoAlpha: 1 }, 0); tl.set(col, { y: -1050 }, 0);
    tl.to(col, { y: -3400, duration: dur, ease: "power2.out" }, 0.02);
    tl.set(L, { autoAlpha: 0 }, dur + 0.05);
    T(0, dur + 0.1);
  }
  // ---------------------------------------------------------------- the phase board (dark split-flap panel with a little rocket on top)
  const board = (n, status, k) => `<div class="abs brd" style="left:560px;top:250px;width:800px">
      <div class="abs flm" style="left:340px;top:520px;width:120px;height:260px"><svg width="120" height="260" viewBox="0 0 120 260"><path d="M20 0 Q 0 120 60 260 Q 120 120 100 0 Z" fill="#FF8A2A"/><path d="M38 0 Q 26 90 60 200 Q 94 90 82 0 Z" fill="#FFD27A"/><path d="M50 0 Q 46 60 60 120 Q 74 60 70 0 Z" fill="#fff"/></svg></div>
      <div style="position:relative;width:800px;height:540px;border-radius:36px;background:linear-gradient(180deg,#16204A,#0E1530);border:4px solid ${INK};box-shadow:0 12px 0 ${INK},0 40px 80px rgba(0,0,0,.45);font-family:'JetBrains Mono';font-weight:800;color:#fff;text-align:center">
        <div style="position:absolute;left:0;right:0;top:34px;font-size:22px;letter-spacing:.3em;color:#8D97B5">HX LAUNCH · MISSION BOARD</div>
        <div style="position:absolute;left:0;right:0;top:86px"><span style="font-family:Archivo;font-weight:900;font-size:56px;color:#9FE3F2;letter-spacing:.06em">PHASE</span></div>
        <div style="position:absolute;left:0;right:0;top:160px;display:flex;justify-content:center;gap:14px">${pad(n).split("").map((d) => `<span class="flip" style="width:150px;height:190px;font-family:Archivo;font-weight:900;font-size:170px;line-height:190px">${d}</span>`).join("")}</div>
        <div style="position:absolute;left:0;right:0;top:376px;font-family:Archivo;font-weight:900;font-size:76px;color:${YEL}">${PH[n - 1].toUpperCase()}</div>
        <div style="position:absolute;left:0;right:0;top:470px;display:flex;justify-content:center;gap:12px;font-size:24px">${status}</div>
      </div>
      <div class="abs" style="left:250px;top:-118px;width:300px;height:130px"><svg width="300" height="130" viewBox="0 0 300 130"><path d="M150 0 Q 196 40 204 120 L 96 120 Q 104 40 150 0 Z" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="150" cy="66" r="16" fill="${TEAL}" stroke="${INK}" stroke-width="4"/><path d="M96 120 L 60 128 L 96 90 Z M204 120 L 240 128 L 204 90 Z" fill="${RED}" stroke="${INK}" stroke-width="4"/></svg></div></div>`;
  const sky = (k) => `<div class="abs" style="inset:0;background:linear-gradient(180deg,#0B1640 0%,#2A2F6E 45%,#E07E6E 82%,#FFC98C 100%)"></div><div class="abs" style="inset:0;background-image:radial-gradient(rgba(255,255,255,.5) 1.5px,transparent 2px);background-size:70px 70px;opacity:.5;mask-image:linear-gradient(180deg,#000,transparent 60%)"></div>`;
  const lamps = (go) => ["FUEL", "ENGINES", "WEATHER", "CREW"].map((x) => `<span style="padding:6px 12px;border-radius:999px;background:${go ? "#22B573" : "#2B3354"};color:${go ? "#fff" : "#8D97B5"}">${x} ${go ? "✓" : "…"}</span>`).join("");

  // open(n): the board shows PHASE n, all lamps flip to GO, then the board LIFTS OFF upward and smoke clears to the scene
  function phaseOpen(n, t) {
    const L = layer(70, `${sky()}<div class="abs smk" style="left:0;top:0;width:1920px;height:3400px">${column(40 + n)}</div>${board(n, `<span class="st1" style="display:flex;gap:12px">${lamps(false)}</span><span class="st2" style="display:none;gap:12px">${lamps(true)}</span>`, "o")}`);
    const brd = $(".brd", L), smk = $(".smk", L), flm = $(".flm", L);
    tl.set(L, { autoAlpha: 1 }, 0); gsap.set(smk, { y: 2100 }); gsap.set(flm, { scaleY: 0, transformOrigin: "50% 0%" });
    const tg = Math.max(0.1, t - 0.55);
    tl.set($(".st1", L), { display: "none" }, tg); tl.set($(".st2", L), { display: "flex" }, tg); sfx(tg, "chime", { gain: 0.2 });
    tl.fromTo(flm, { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: "power2.out", immediateRender: false }, t - 0.25);
    tl.to(brd, { y: -1500, duration: 0.75, ease: "power2.in" }, t - 0.05);
    tl.fromTo(smk, { y: 2100 }, { y: -1050, duration: 0.5, ease: "power2.out", immediateRender: false }, t - 0.2);
    tl.to(smk, { y: -3400, duration: 0.55, ease: "power2.in" }, t + 0.32);
    tl.set(L, { autoAlpha: 0 }, t + 0.9);
    sfx(t - 0.25, "rumble", { gain: 0.3, dur: 1.2 }); sfx(t, "whoosh", { gain: 0.26, dur: 0.8 });
    T(0, t + 0.95);
  }
  // close(n): smoke rises over the scene, then the board for phase n+1 drops in with NEXT ▶
  function phaseClose(t, { phase = 1 } = {}) {
    const next = phase < 5 ? phase + 1 : null;
    const L = layer(70, `${sky()}${next ? board(next, `<span style="padding:6px 16px;border-radius:999px;background:${YEL};color:${INK}">▶ NEXT UP</span>`, "c") : ""}<div class="abs smk" style="left:0;top:0;width:1920px;height:3400px">${column(60 + phase)}</div>`);
    const brd = $(".brd", L), smk = $(".smk", L), sk = $$(":scope > div", L).slice(0, 2);
    gsap.set(smk, { y: 1200 }); if (brd) gsap.set(brd, { y: -1300 }); gsap.set(sk, { autoAlpha: 0 });
    tl.set(smk, { y: 1200 }, t - 1.0); tl.set(L, { autoAlpha: 1 }, t - 0.98);
    tl.to(["#tag", "#prog"], { autoAlpha: 0, duration: 0.2 }, t - 0.95);
    tl.fromTo(smk, { y: 1200 }, { y: -1050, duration: 0.6, ease: "power2.in", immediateRender: false }, t - 0.95);
    tl.set(sk, { autoAlpha: 1 }, t - 0.33);
    tl.to(smk, { y: -3400, duration: 0.6, ease: "power2.out" }, t - 0.32);
    if (brd) { tl.fromTo(brd, { y: -1300 }, { y: 0, duration: 0.55, ease: "back.out(1.3)", immediateRender: false }, t - 0.2); sfx(t + 0.3, "clunk", { gain: 0.26 }); sfx(t + 0.45, "ding", { gain: 0.18 }); }
    sfx(t - 0.95, "rumble", { gain: 0.26, dur: 1.2 }); sfx(t - 0.95, "whoosh", { gain: 0.24, dur: 0.9 });
    T(t - 1.05, 1e6);
  }
  function phaseStart(n, title, { t = 0.9, clock = null } = {}) {
    chrome(n, title, clock);
    // no burned-in captions (YouTube gets an exact .srt instead)
    $("#subs").style.display = "none"; $("#subsBand").style.display = "none";
    phaseOpen(n, t);
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, t + 0.7);
  }
  function swap(out, inn, t) { tl.set(inn, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, t); if (out) tl.set(out, { autoAlpha: 0 }, t); }
  Object.assign(EX, { rchrome: chrome, smokeWipe, smokeReveal, phaseOpen, phaseClose, phaseStart, swap });
})();
