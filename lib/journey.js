// journey.js — train-journey kit for the bullet train explainer. Load after explainer2.js.
// EX.journey(num,total,title): route-map chrome · EX.doors(t,{mode,sign}): sliding coach doors · EX.passBy(t): a train streaks past as a wipe
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);

  function journey(num, total, title) {
    EX.chrome(num, total, title);
    $("#tag").innerHTML = `<b>COACH ${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}</b><span>${title}</span>`;
    const W = 470, step = W / (total - 1), tx = (num - 1) * step;
    const dots = Array.from({ length: total }, (_, i) => `<circle cx="${i * step}" cy="14" r="${i + 1 === num ? 7 : 5}" fill="${i + 1 < num ? "#12A4C4" : i + 1 === num ? "#F5A524" : "#fff"}" stroke="#1B2340" stroke-opacity=".35" stroke-width="2"/>`).join("");
    $("#prog").outerHTML = `<div id="prog" data-ob="chrome" style="position:absolute;right:64px;top:30px;display:flex;align-items:center;gap:22px;font-family:'JetBrains Mono';font-weight:800;font-size:17px;letter-spacing:.12em;color:rgba(27,35,64,.6)">
      <span>MUMBAI</span><svg width="${W + 16}" height="40" viewBox="-8 -10 ${W + 16} 40" style="overflow:visible"><line x1="0" y1="14" x2="${W}" y2="14" stroke="rgba(27,35,64,.25)" stroke-width="4" stroke-linecap="round"/><line x1="0" y1="14" x2="${tx}" y2="14" stroke="#12A4C4" stroke-width="4" stroke-linecap="round"/>${dots}
      <g transform="translate(${tx - 26} -26)"><path d="M2 14 Q 10 2 30 2 L 52 2 L 52 14 Z" fill="#fff" stroke="#1B2340" stroke-width="2"/><rect x="18" y="5" width="6" height="4" rx="1" fill="#1B2340"/><rect x="28" y="5" width="6" height="4" rx="1" fill="#1B2340"/><rect x="38" y="5" width="6" height="4" rx="1" fill="#1B2340"/><rect x="2" y="10" width="50" height="2" fill="#2F6FE0"/></g></svg><span>AHMEDABAD</span></div>`;
    gsap.set("#prog", { autoAlpha: 0 });
  }

  function doorLayer(sign) {
    const panel = (side) => `<div class="abs dp" style="top:0;${side}:0;width:960px;height:1080px;background:linear-gradient(90deg,#E6EAF1,#FBFCFE 45%,#DCE1E9);${side === "left" ? "border-right" : "border-left"}:14px solid #2A3350">
        <div class="abs" style="${side === "left" ? "right:130px" : "left:130px"};top:230px;width:300px;height:420px;border-radius:46px;background:linear-gradient(160deg,#CFEAFB,#8CC2E6);border:14px solid #C9D0DC;box-shadow:inset 0 0 0 4px rgba(255,255,255,.5)"></div>
        <div class="abs" style="${side === "left" ? "right:44px" : "left:44px"};top:560px;width:22px;height:210px;border-radius:11px;background:#9AA3B4"></div>
        <div class="abs" style="left:0;right:0;top:830px;height:24px;background:#2F6FE0"></div><div class="abs" style="left:0;right:0;top:862px;height:8px;background:#F5A524"></div></div>`;
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:70;overflow:hidden";
    L.innerHTML = `${panel("left")}${panel("right")}<div class="abs bar" style="left:0;top:0;width:1920px;height:120px;background:#1B2340;display:flex;align-items:center;justify-content:center"><div style="font-family:'JetBrains Mono';font-weight:800;font-size:46px;letter-spacing:.18em;color:#FFB547;text-shadow:0 0 16px rgba(255,181,71,.75);white-space:nowrap">${sign}</div></div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    return L;
  }
  // mode "close": doors slide shut by t and stay shut; mode "open": start shut, slide open at t
  function doors(t, { mode = "close", sign = "", until = null, from = 0 } = {}) {
    const L = doorLayer(sign), [l, r] = $$(".dp", L), bar = $(".bar", L);
    if (mode === "close") {
      tl.set(L, { autoAlpha: 1 }, t - 0.75);
      tl.fromTo(bar, { y: -130 }, { y: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, t - 0.75);
      tl.fromTo(l, { x: -990 }, { x: 0, duration: 0.6, ease: "power3.inOut", immediateRender: false }, t - 0.6);
      tl.fromTo(r, { x: 990 }, { x: 0, duration: 0.6, ease: "power3.inOut", immediateRender: false }, t - 0.6);
      sfx(t - 0.8, "ding", { gain: 0.25 }); sfx(t - 0.55, "ding", { gain: 0.22, pitch: 0.8 }); sfx(t - 0.02, "clunk", { gain: 0.3 });
      if (until != null) tl.set(L, { autoAlpha: 0 }, until);
      T(t - 0.8, until != null ? until : 1e6);
    } else {
      tl.set(L, { autoAlpha: 1 }, from);
      tl.fromTo(l, { x: 0 }, { x: -990, duration: 0.7, ease: "power3.inOut", immediateRender: false }, t);
      tl.fromTo(r, { x: 0 }, { x: 990, duration: 0.7, ease: "power3.inOut", immediateRender: false }, t);
      tl.to(bar, { y: -130, duration: 0.3, ease: "power2.in" }, t + 0.45);
      tl.set(L, { autoAlpha: 0 }, t + 0.8);
      sfx(t, "whoosh", { gain: 0.25, dur: 0.6 });
      if (from > 0) gsap.set(L, { autoAlpha: 0 });
      T(from, t + 0.85);
    }
    return L;
  }

  // a train streaks across the whole screen; swap scenes at t (the screen is fully covered around t)
  function passBy(t, { dir = 1, dur = 0.8 } = {}) {
    const L = document.createElement("div"); L.className = "abs"; L.style.cssText = "inset:0;z-index:66;overflow:hidden";
    const len = 6000;
    L.innerHTML = `<div class="abs pb" style="left:0;top:-40px;width:${len}px;height:1160px;background:linear-gradient(180deg,#FBFCFE 0%,#F1F4F8 45%,#C9D0DC 100%);border-radius:${dir > 0 ? "0 520px 520px 0" : "520px 0 0 520px"}">
      <div class="abs" style="left:0;right:0;top:300px;height:150px;background:repeating-linear-gradient(90deg,transparent 0 40px,#1E2A48 40px 150px,transparent 150px 190px)"></div>
      <div class="abs" style="left:0;right:0;top:760px;height:64px;background:#2F6FE0"></div><div class="abs" style="left:0;right:0;top:836px;height:16px;background:#F5A524"></div>
      ${Array.from({ length: 6 }, (_, i) => `<div class="abs" style="left:${i * 1000 + 500}px;top:0;width:26px;height:1160px;background:#2A3350"></div>`).join("")}</div>`;
    $("#stage").appendChild(L); gsap.set(L, { autoAlpha: 0 });
    const b = $(".pb", L), span = dur * 1.8;
    tl.set(L, { autoAlpha: 1 }, t - dur / 2);
    tl.fromTo(b, { x: dir > 0 ? -len : 1920 }, { x: dir > 0 ? 1920 : -len, duration: span, ease: "none", immediateRender: false }, t - dur / 2);
    tl.set(L, { autoAlpha: 0 }, t - dur / 2 + span);
    sfx(t - dur / 2, "whoosh", { gain: 0.38, dur: span });
    T(t - dur / 2 - 0.05, t - dur / 2 + span + 0.05);
  }

  // coach opener: chrome + subtitles + doors (shut, showing this coach's LED sign) sliding open at t
  function coachStart(num, total, title, { t = 0.35 } = {}) {
    journey(num, total, title);
    $("#subs").dataset.ob = "subs";
    EX.subtitles();
    doors(t, { mode: "open", sign: `COACH C${num} · ${title.toUpperCase()}` });
    tl.to(["#tag", "#prog"], { autoAlpha: 1, duration: 0.4 }, t + 0.5);
  }
  // shaded picture-style kingfisher (side view, beak to the right)
  const kingfisher = (w = 300) => `<svg viewBox="0 0 300 200" width="${w}" height="${w * 0.667}" style="overflow:visible">
      <path d="M40 120 Q 60 60 130 58 Q 170 56 190 80 L 296 96 L 190 104 Q 186 140 140 150 Q 80 160 40 120 Z" fill="#1F8FD6"/>
      <path d="M190 80 L 296 96 L 190 104 Z" fill="#2B2118"/>
      <path d="M70 128 Q 110 150 150 138 Q 170 130 182 108 Q 150 132 70 128 Z" fill="#F08A3C"/>
      <path d="M40 120 Q 10 128 0 150 Q 30 140 60 132 Z" fill="#1673B0"/>
      <path d="M80 96 Q 120 70 160 84 Q 120 92 90 112 Z" fill="#3FB6F0"/>
      <circle cx="160" cy="82" r="8" fill="#fff"/><circle cx="162" cy="82" r="4.5" fill="#1B2340"/>
      <path d="M150 96 Q 160 100 176 96" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>
    </svg>`;
  Object.assign(EX, { journey, doors, passBy, coachStart, kingfisher });
})();
