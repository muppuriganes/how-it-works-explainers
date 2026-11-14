// sheets.js — builds one asset review sheet (1920x1080) from lib/atm.js. Usage: ATMSHEET(1|2|3)
window.WORDS = window.WORDS || [];
function ATMSHEET(n) {
  const A = window.ATMART, st = document.getElementById("stage");
  const strip = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const BG = { 1: "radial-gradient(ellipse at 50% 20%,#8FCBE6 0%,#3F8FBF 100%)", 2: "radial-gradient(ellipse at 50% 20%,#FFC8A8 0%,#EE8C66 100%)", 3: "radial-gradient(ellipse at 50% 20%,#C4B8F2 0%,#8F80D6 100%)" }[n];
  const TITLE = { 1: "Outside the machine", 2: "Inside the machine", 3: "The journey · people · extras" }[n];
  st.innerHTML = `<div class="abs" style="inset:0;background:${BG}"></div><div class="abs" style="inset:0;background-image:radial-gradient(rgba(27,35,64,.12) 2.5px,transparent 3px);background-size:44px 44px"></div>
    <div class="abs" style="left:40px;top:34px;font-family:Archivo;font-weight:900;font-stretch:68%;font-size:64px;text-transform:uppercase;color:#fff;text-shadow:0 5px 0 #1B2340">ATM explainer · assets ${n}/3 <span style="color:#FFC93D">${TITLE}</span></div>`;
  let k = 0;
  const cell = (x, y, w, h, label, art, sub = "") => {
    k++;
    st.insertAdjacentHTML("beforeend", `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:28px;background:#fff;border:3px solid #1B2340;box-shadow:0 9px 0 #1B2340,0 26px 44px rgba(27,35,64,.3);overflow:hidden">
      <div class="abs" style="left:0;right:0;top:0;bottom:62px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:10px">${art}</div>
      <div class="abs" style="left:14px;bottom:14px;display:flex;gap:10px;align-items:center"><span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#1B2340;color:#FFC93D;align-items:center;justify-content:center;font-family:'JetBrains Mono';font-weight:800;font-size:18px">${n}.${k}</span><span style="font-family:Archivo;font-weight:900;font-size:24px;color:#1B2340;white-space:nowrap">${label}</span>${sub ? `<span style="font-family:'JetBrains Mono';font-weight:700;font-size:15px;color:rgba(27,35,64,.55);white-space:nowrap">${sub}</span>` : ""}</div></div>`);
  };
  if (n === 1) {
    cell(40, 130, 900, 620, "ATM cabin + sleeping guard", A.cabin({ w: 800 }), "Zzz + head nod animate");
    cell(40, 770, 900, 290, "ATM screens", [["Insert card", ""], ["Enter PIN", "• • • •"], ["Please wait…", "talking to your bank"], ["Collect your cash", "", "#22B573"]].map(([a, b, c]) => A.screen(a, b, { w: 196, c })).join(""));
    cell(980, 130, 290, 460, "ATM machine", A.machine({ w: 240, scr: A.scrText("Welcome", "insert card") }), "");
    cell(1285, 130, 290, 460, "Debit card", `<div style="display:flex;flex-direction:column;gap:18px">${A.card({ w: 250 })}${A.card({ w: 250, back: true, id: "cdb" })}</div>`, "front / back");
    cell(1590, 130, 290, 460, "Chip close-up", A.chip({ w: 260 }), "");
    cell(980, 610, 290, 450, "PIN pad", A.pinpad({ w: 260 }), "hand covers");
    cell(1285, 610, 290, 450, "PIN → secret code", A.pinblock({ w: 270 }), "");
    cell(1590, 610, 290, 450, "10-second timer", A.timer({ w: 250 }), "");
  }
  if (n === 2) {
    cell(40, 130, 640, 930, "Cutaway: inside the safe", A.cutaway({ w: 560 }), "rollers spin · notes travel");
    cell(700, 130, 380, 460, "Cash cassette", A.cassette({ w: 330 }), "");
    cell(1100, 130, 380, 460, "Notes ₹100 · ₹200 · ₹500", `<div style="display:flex;flex-direction:column;gap:6px">${[100, 200, 500].map((v) => A.note({ w: 250, n: v })).join("")}</div>`, "stylised");
    cell(1500, 130, 380, 460, "Cash out of the slot", A.fan({ w: 340 }), "");
    cell(700, 610, 380, 450, "Receipt printer", A.printer({ w: 320 }), "");
    cell(1100, 610, 380, 450, "Receipt", A.receipt([["DATE", "15-11-26"], ["TIME", "22:04"], ["CARD", "XX4821"], ["WITHDRAWAL", "₹2,000"], ["BALANCE", "₹10,450"]], { w: 320 }), "");
    cell(1500, 610, 380, 450, "Chapter tracker (receipt)", A.trackerSlip(3, { w: 300 }), "top-right chrome");
  }
  if (n === 3) {
    const W = 445, X = [40, 505, 970, 1435];
    cell(X[0], 130, W, 460, "ATM's bank", ISO.bank({ w: 360, color: "#12A4C4", label: "ATM'S BANK", id: "b1" }), "");
    cell(X[1], 130, W, 460, "NPCI switch (NFS)", A.hub({ w: 300 }), "routes every ATM request");
    cell(X[2], 130, W, 460, "Your bank", ISO.bank({ w: 360, color: "#7B61FF", label: "YOUR BANK", id: "b2" }), "");
    cell(X[3], 130, W, 460, "Messages", `<div style="display:flex;flex-direction:column;gap:22px">${A.packet({ w: 390 })}${A.packet({ w: 390, text: "✓ APPROVED · GIVE ₹2,000", lock: false, c: "#22B573" })}</div>`, "request / reply");
    cell(X[0], 610, W, 450, "Your bank checks", A.checks({ w: 400 }), "");
    cell(X[1], 610, W, 450, "SMS on your phone", `<div id="phS" style="position:relative;width:170px;height:350px"></div>`, "");
    cell(X[2], 610, W, 450, "Heart monitor (the joke)", `<div style="display:flex;flex-direction:column;gap:12px">${A.ecg({ w: 290 })}${A.ecg({ w: 290, flat: true, id: "ecg2" })}</div>`, "normal / flatline");
    cell(X[3], 610, W, 450, "Host", PAPER.ART.host({ w: 240, id: "hs", shirt: "#12A4C4", girl: true }), "same girl host?");
    const P = EX.phoneBox("#phS", { w: 170, accent: "#12A4C4" });
    P.scr.innerHTML = `<div class="abs" style="inset:0;background:#EEF1F7;font-family:Archivo"><div style="margin:40px 10px 0;padding:12px;border-radius:14px;background:#fff;border:3px solid #1B2340"><div style="font-family:'JetBrains Mono';font-weight:800;font-size:11px;opacity:.55">YOUR BANK · NOW</div><div style="font-weight:900;font-size:13px;color:#1B2340;margin-top:4px;line-height:1.2">₹2,000 debited from A/c XX4821 at ATM</div></div></div>`;
  }
  REEL.finish(1);
}
