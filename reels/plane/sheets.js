// sheets.js — builds one asset review sheet (1920x1080) for the plane explainer. Usage: PLANESHEET(1..4, imgs?)
window.WORDS = window.WORDS || [];
function PLANESHEET(n, imgs) {
  const P = window.PLANE, st = document.getElementById("stage");
  const BG = { 1: "radial-gradient(ellipse at 50% 20%,#8FCBE6 0%,#3F6FBF 100%)", 2: "radial-gradient(ellipse at 50% 20%,#C4B8F2 0%,#7B61C6 100%)", 3: "radial-gradient(ellipse at 50% 20%,#9FDDB4 0%,#3F9E70 100%)", 4: "radial-gradient(ellipse at 50% 20%,#FFC8A8 0%,#E07A56 100%)" }[n];
  const TITLE = { 1: "The real 3D plane & world", 2: "How it flies — diagrams", 3: "Up there — cruise", 4: "Arrival · people · theme" }[n];
  st.innerHTML = `<div class="abs" style="inset:0;background:${BG}"></div><div class="abs" style="inset:0;background-image:radial-gradient(rgba(27,35,64,.12) 2.5px,transparent 3px);background-size:44px 44px"></div>
    <div class="abs" style="left:40px;top:30px;font-family:Archivo;font-weight:900;font-stretch:68%;font-size:60px;text-transform:uppercase;color:#fff;text-shadow:0 5px 0 #1B2340">Plane explainer · assets ${n}/4 <span style="color:#FFC93D">${TITLE}</span></div>`;
  let k = 0;
  const cell = (x, y, w, h, label, art, sub = "", pad = 10) => {
    k++;
    st.insertAdjacentHTML("beforeend", `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:26px;background:#fff;border:3px solid #1B2340;box-shadow:0 9px 0 #1B2340,0 26px 44px rgba(27,35,64,.3);overflow:hidden">
      <div class="abs" style="left:0;right:0;top:0;bottom:58px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:${pad}px;overflow:hidden">${art}</div>
      <div class="abs" style="left:14px;bottom:12px;display:flex;gap:10px;align-items:center"><span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#1B2340;color:#FFC93D;align-items:center;justify-content:center;font-family:'JetBrains Mono';font-weight:800;font-size:17px">${n}.${k}</span><span style="font-family:Archivo;font-weight:900;font-size:23px;color:#1B2340;white-space:nowrap">${label}</span>${sub ? `<span style="font-family:'JetBrains Mono';font-weight:700;font-size:14px;color:rgba(27,35,64,.55);white-space:nowrap">${sub}</span>` : ""}</div></div>`);
  };
  const img = (src) => `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:16px">`;
  if (n === 1) {
    const L = [["On the runway", "A320-class · unbranded"], ["Engine close-up", "fan blades spin"], ["Take-off: rotation", "nose up at ~260 km/h"], ["Cruise above the clouds", "sunset mood"], ["Night approach", "gear + flaps down"], ["Touchdown", "spoilers up · flaps out"]];
    imgs.forEach((src, i) => cell(40 + (i % 3) * 620, 120 + Math.floor(i / 3) * 480, 600, 460, L[i][0], img(src), L[i][1], 0));
  }
  if (n === 2) {
    cell(40, 120, 900, 470, "The four forces", P.forces({ w: 840 }), "arrows grow/animate");
    cell(980, 120, 900, 470, "How a wing makes lift", P.airfoil({ w: 730 }), "airflow lines move");
    cell(40, 610, 900, 450, "Jet engine cutaway", P.engine({ w: 680 }), "fan spins · flow dashes");
    cell(980, 610, 440, 450, "Slats + flaps", P.flaps({ w: 420 }), "slide out");
    cell(1440, 610, 440, 450, "Landing gear", P.gear({ w: 300 }), "");
  }
  if (n === 3) {
    cell(40, 120, 460, 940, "Altitude ladder", P.ladder({ w: 440 }), "", 4);
    cell(520, 120, 920, 560, "Cockpit + autopilot", P.cockpit({ w: 820 }), "AP light · PFD moves");
    cell(1460, 120, 420, 560, "Ear pop", P.ear({ w: 400 }), "");
    cell(520, 700, 580, 360, "Airways (sky highways)", P.airways({ w: 450 }), "en-route chart");
    cell(1120, 700, 760, 360, "Stopping: spoilers · reverse · brakes", P.stopping({ w: 700 }), "");
  }
  if (n === 4) {
    cell(40, 120, 620, 470, "ATC radar + tower", `${P.radar({ w: 360 })}${P.tower({ w: 180 })}`, "sweep rotates");
    cell(680, 120, 1200, 470, "ILS: the 3° radio ramp", P.ils({ w: 1150 }), "plane slides down");
    cell(40, 610, 800, 450, "Cabin + the uncle (row 23)", P.cabin({ w: 770 }), "uncle stands");
    cell(860, 610, 440, 450, "Boarding pass + flight data", `<div style="display:flex;flex-direction:column;gap:22px;transform:scale(.78)">${P.pass(2, { w: 520 })}${P.fdp({ w: 520 })}</div>`, "");
    cell(1320, 610, 270, 450, "Window shade", P.window({ w: 200 }), "");
    cell(1610, 610, 270, 450, "Host + uncle", `${PAPER.ART.host({ w: 120, id: "hs", shirt: "#12A4C4", girl: true })}${P.uncle({ w: 110 })}`, "");
  }
  REEL.finish(1);
}
