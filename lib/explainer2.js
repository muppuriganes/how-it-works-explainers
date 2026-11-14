// explainer2.js — v2 look: light theme, illustrated chapter cards, richer transitions. Load after explainer.js + iso.js.
(function () {
  const { tl, sfx } = REEL;
  const { $, $$ } = EX;
  const T = (a, b) => (window.__trans = window.__trans || []).push([a, b]);
  const layer = (html, z = 60, parent = "#stage") => { const d = document.createElement("div"); d.className = "abs"; d.style.cssText = `inset:0;z-index:${z};pointer-events:none`; d.innerHTML = html; $(parent).appendChild(d); gsap.set(d, { autoAlpha: 0 }); return d; };
  document.documentElement.classList.add("light");

  // ---------------------------------------------------------------- phone: 3D extruded body
  const basePhoneBox = EX.phoneBox;
  EX.phoneBox = (parent, o = {}) => { const r = basePhoneBox(parent, o); const svg = r.el.querySelector("svg"); svg.outerHTML = ISO.phone({ w: o.w || 300, accent: o.accent || "#12A4C4" }); return r; };

  // ---------------------------------------------------------------- illustrated chapter card
  // opts: { bg, accent, hero (html), heroAnim(fn(el,t)) }
  const CCOL = [["#FFE1C8", "#F0566E"], ["#E3DCFA", "#7B61FF"], ["#D3F2E3", "#12A4C4"], ["#FFD9DC", "#F0566E"], ["#FFF0C2", "#F5A524"], ["#DDEBFB", "#3E7BFA"], ["#D3F2E3", "#22B573"]];
  function chapterCard2(num, title, t0, t1, o = {}) {
    const [bg, ac] = CCOL[(num - 1) % CCOL.length];
    const B = o.bg || bg, A = o.accent || ac;
    const rays = Array.from({ length: 24 }, (_, i) => `<path d="M1600 1600 L${1600 + 1700 * Math.cos((i / 24) * 6.283)} ${1600 + 1700 * Math.sin((i / 24) * 6.283)} L${1600 + 1700 * Math.cos(((i + 0.5) / 24) * 6.283)} ${1600 + 1700 * Math.sin(((i + 0.5) / 24) * 6.283)} Z" fill="${A}"/>`).join("");
    const words = title.split(" ").map((w) => `<span>${w}</span>`).join(" ");
    $("#shake").insertAdjacentHTML("beforeend", `<div id="cc2"><div class="bgc" style="background:radial-gradient(ellipse at 70% 50%,#fff 0%,${B} 60%)"></div>
      <svg class="rays" viewBox="0 0 3200 3200">${rays}</svg><div id="ccConf" class="abs" style="inset:0"></div>
      <div class="lab">CHAPTER</div><div class="n x3d" style="--xf:${A};--xs:#1B2340">${String(num).padStart(2, "0")}</div>
      <div class="u" style="background:${A}"></div><div class="t">${words}</div><div class="hero">${o.hero || ""}</div></div>`);
    const cc = $("#cc2");
    // confetti coins & shapes drifting
    const r = REEL.rng(num * 7);
    for (let i = 0; i < 12; i++) { const el = document.createElement("div"); el.className = "abs"; const s = 40 + r() * 60; let cx = r() * 1880, cy = r() * 1000; if (cx < 1000 && cy > 180 && cy < 860) cx = 1000 + cx * 0.85; el.style.cssText = `left:${cx}px;top:${cy}px`; el.innerHTML = i % 3 === 0 ? ISO.coin({ size: s }) : `<div style="width:${s * 0.6}px;height:${s * 0.6}px;border-radius:${i % 2 ? "50%" : "10px"};background:${i % 2 ? A : "#fff"};opacity:.5"></div>`; $("#ccConf").appendChild(el); tl.fromTo(el, { y: 40, rotation: 0 }, { y: -120 - r() * 120, rotation: r() * 90 - 45, duration: t1 - t0 + 0.5, ease: "none", immediateRender: false }, t0); }
    gsap.set(cc, { autoAlpha: 0 });
    // in: stripes slam in, card revealed
    tl.set(cc, { autoAlpha: 1 }, t0);
    tl.fromTo(cc, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.55, ease: "power3.out", immediateRender: false }, t0);
    tl.fromTo(".rays", { rotation: 0 }, { rotation: 40, duration: t1 - t0, ease: "none", immediateRender: false }, t0);
    tl.fromTo("#cc2 .lab", { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.35, immediateRender: false }, t0 + 0.15);
    tl.fromTo("#cc2 .n", { autoAlpha: 0, scale: 2.2, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.2)", immediateRender: false }, t0 + 0.12);
    tl.fromTo("#cc2 .u", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.inOut", immediateRender: false }, t0 + 0.3);
    tl.fromTo($$("#cc2 .t span"), { autoAlpha: 0, y: 60, rotation: 6 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.07, immediateRender: false }, t0 + 0.35);
    tl.fromTo("#cc2 .hero", { autoAlpha: 0, scale: 0.4, y: 120, rotation: 6 }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0.65, ease: "back.out(1.7)", immediateRender: false }, t0 + 0.25);
    tl.to("#cc2 .hero", { y: -16, duration: (t1 - t0) / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, t0 + 0.9);
    if (o.heroAnim) o.heroAnim($("#cc2 .hero"), t0 + 0.5);
    sfx(t0, "whoosh", { gain: 0.25, dur: 0.6 }); sfx(t0 + 0.15, "impact", { gain: 0.18 }); sfx(t0 + 0.4, "chime", { gain: 0.16 });
    // out: card flips up and away like a page
    tl.to(cc, { yPercent: -105, rotation: -3, duration: 0.5, ease: "power3.in" }, t1 - 0.5);
    tl.set(cc, { autoAlpha: 0 }, t1);
    tl.fromTo(["#tag", "#prog"], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }, t1 - 0.1);
    sfx(t1 - 0.5, "swish", { gain: 0.25 });
    T(t0, t1 + 0.05);
  }

  // ---------------------------------------------------------------- transitions
  // 1) shutter stripes sweep in (cover at t) and out (scene already swapped)
  function stripes(t, { colors = ["#F0566E", "#F5A524", "#12A4C4", "#7B61FF", "#22B573", "#3E7BFA"], dur = 0.45 } = {}) {
    const n = colors.length, h = 1600 / n;
    const L = layer(`<div class="abs" style="left:-400px;top:-260px;width:2720px;height:1600px;transform:rotate(-12deg)">${colors.map((c, i) => `<div class="abs sb" style="left:0;top:${i * h}px;width:2720px;height:${h + 2}px;background:${c}"></div>`).join("")}</div>`);
    const bars = $$(".sb", L);
    // park the bars off-screen first: each bar's slide-in starts a few ms after the layer turns on,
    // and without this they would sit across the whole screen for one frame (a visible flash)
    gsap.set(bars, { x: -2800 });
    tl.set(bars, { x: -2800 }, t - dur - 0.06);
    tl.set(L, { autoAlpha: 1 }, t - dur - 0.05);
    bars.forEach((b, i) => { tl.fromTo(b, { x: -2800 }, { x: 0, duration: dur, ease: "power3.in", immediateRender: false }, t - dur - 0.05 + i * 0.01); tl.to(b, { x: 2800, duration: dur, ease: "power3.out" }, t + 0.03 + i * 0.03); });
    tl.set(L, { autoAlpha: 0 }, t + dur + 0.25);
    sfx(t - dur, "whoosh", { gain: 0.3, dur: 0.5 }); sfx(t + 0.03, "swish", { gain: 0.25 });
    T(t - dur - 0.1, t + dur + 0.3);
  }
  // 2) iris: a coloured circle bursts out of (x,y) to fill the screen, then the next scene opens from the same spot
  function iris(inEl, t, x, y, { color = "#F0566E", dur = 0.45 } = {}) {
    inEl = typeof inEl === "string" ? $(inEl) : inEl;
    const D = layer(`<div class="abs" style="left:${x - 2300}px;top:${y - 2300}px;width:4600px;height:4600px;border-radius:50%;background:${color}"></div>`);
    const under = document.createElement("div"); under.className = "abs"; under.style.cssText = `inset:0;background:${color}`; inEl.parentNode.insertBefore(under, inEl); gsap.set(under, { autoAlpha: 0 });
    const disc = D.firstChild;
    tl.set(D, { autoAlpha: 1 }, t - dur);
    tl.fromTo(disc, { scale: 0 }, { scale: 1, duration: dur, ease: "power2.in", immediateRender: false }, t - dur);
    tl.set(D, { autoAlpha: 0 }, t); tl.set(under, { autoAlpha: 1 }, t); tl.set(under, { autoAlpha: 0 }, t + dur + 0.05);
    tl.fromTo(inEl, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(2300px at ${x}px ${y}px)`, duration: dur + 0.05, ease: "power2.in", immediateRender: false }, t);
    tl.set(inEl, { clipPath: "none" }, t + dur + 0.06);
    sfx(t - dur, "riser", { gain: 0.12, dur: dur }); sfx(t, "impact", { gain: 0.2 });
    T(t - dur - 0.05, t + dur + 0.1);
  }
  // 3) a giant 3D coin rolls across the screen; the new scene unrolls behind it
  function coinWipe(outEl, inEl, t, { dur = 0.9 } = {}) {
    inEl = typeof inEl === "string" ? $(inEl) : inEl;
    const C = layer(`<div class="abs cw" style="left:0;top:90px">${ISO.coin({ size: 900 })}</div>`, 61);
    const coin = $(".cw", C);
    tl.set(C, { autoAlpha: 1 }, t);
    tl.fromTo(coin, { x: -1000, rotation: -360 }, { x: 2000, rotation: 360, duration: dur, ease: "power1.inOut", immediateRender: false }, t);
    tl.set(inEl, { zIndex: 5 }, t);
    tl.fromTo(inEl, { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -25% 0 0)", duration: dur, ease: "power1.inOut", immediateRender: false }, t);
    tl.set(inEl, { clipPath: "none", zIndex: "auto" }, t + dur);
    tl.set(outEl, { autoAlpha: 0 }, t + dur);
    tl.set(C, { autoAlpha: 0 }, t + dur);
    sfx(t, "coin", { gain: 0.3 }); sfx(t + 0.1, "whoosh", { gain: 0.25, dur: dur });
    T(t - 0.05, t + dur + 0.05);
  }
  // 4) 3D cube turn: the old scene rotates away as the side of a cube, the new face rotates in
  function cube(outEl, inEl, t, { dur = 0.8, dir = 1 } = {}) {
    gsap.set("#stage", { perspective: 2600 });
    const o = "50% 50% -960px";
    tl.fromTo(outEl, { rotationY: 0, transformOrigin: o }, { rotationY: -90 * dir, duration: dur, ease: "power2.inOut", immediateRender: false }, t);
    tl.fromTo(inEl, { autoAlpha: 1, rotationY: 90 * dir, transformOrigin: o }, { rotationY: 0, duration: dur, ease: "power2.inOut", immediateRender: false }, t);
    tl.fromTo("#stage", { scale: 1 }, { keyframes: { scale: [1, 0.86, 1] }, duration: dur, ease: "none", immediateRender: false }, t);
    tl.set(outEl, { autoAlpha: 0, rotationY: 0 }, t + dur);
    sfx(t, "whoosh", { gain: 0.3, dur: dur }); sfx(t + dur - 0.1, "clunk", { gain: 0.15 });
    T(t - 0.05, t + dur + 0.05);
  }
  // 5) dive: camera flies into point (x,y) of the old scene, the new scene zooms out from it
  function dive(outEl, inEl, t, x, y, { dur = 0.7 } = {}) {
    tl.to(outEl, { scale: 6, transformOrigin: `${x}px ${y}px`, autoAlpha: 0, duration: dur * 0.6, ease: "power3.in" }, t - dur * 0.6);
    tl.set(outEl, { scale: 1 }, t + 0.01);
    tl.fromTo(inEl, { autoAlpha: 0, scale: 0.25, transformOrigin: `${x}px ${y}px` }, { autoAlpha: 1, scale: 1, duration: dur * 0.7, ease: "back.out(1.3)", immediateRender: false }, t);
    sfx(t - dur * 0.6, "riser", { gain: 0.14, dur: dur * 0.6 }); sfx(t, "whoosh", { gain: 0.25, dur: 0.5 });
    T(t - dur * 0.6 - 0.05, t + dur * 0.7 + 0.05);
  }
  // 6) build-in: elements drop from the sky and land with a bounce + dust puff
  function drop(el, t, { from = -900, sfxName = "clunk" } = {}) {
    tl.fromTo(el, { autoAlpha: 1, y: from, scaleY: 1.1 }, { y: 0, scaleY: 1, duration: 0.55, ease: "bounce.out", immediateRender: false }, t);
    sfx(t + 0.3, sfxName, { gain: 0.2 });
  }

  Object.assign(EX, { chapterCard2, stripes, iris, coinWipe, cube, dive, drop });
})();
