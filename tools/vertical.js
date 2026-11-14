// vertical.js — make the 9:16 Instagram version of a reel (Prompt 7).
//
//   node tools/vertical.js reels/meter --line2 "Greg's quick question cost $180."
//
// Black 1080x1920 canvas, the 16:9 final.mp4 scaled to 1040 px wide and centred vertically,
// a white EB Garamond caption on top: "This time ✳Claude really cooked 🍳" + an italic one liner.
// Keeps the original audio. Output: <reel>/render/final_9x16.mp4
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const puppeteer = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");
const reel = path.resolve(process.argv[2] || "");
const i = process.argv.indexOf("--line2");
const line2 = i > 0 ? process.argv[i + 1] : "";
const src = path.join(reel, "render", "final.mp4");
if (!fs.existsSync(src)) { console.error("missing " + src + ", run render + mix first"); process.exit(1); }

const VW = 1040, VH = Math.round((VW * 9) / 16 / 2) * 2; // 586
const VY = Math.round((1920 - VH) / 2 / 2) * 2;

const font = (f) => fs.readFileSync(path.join(ROOT, "lib", "fonts", f)).toString("base64");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let rays = "";
for (let k = 0; k < 12; k++) rays += `<polygon points="-8.5,0 0,-${k % 2 ? 84 : 100} 8.5,0" transform="rotate(${k * 30})"/>`;
const spark = `<svg viewBox="-105 -105 210 210" width="52" height="52" style="vertical-align:-6px;margin-right:8px"><g fill="#D97757">${rays}<circle r="12"/></g></svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(data:font/woff2;base64,${font("eb-garamond-latin-500-normal.woff2")}) format("woff2");font-style:normal}
@font-face{font-family:G;src:url(data:font/woff2;base64,${font("eb-garamond-latin-400-italic.woff2")}) format("woff2");font-style:italic}
html,body{margin:0;width:1080px;height:1920px;background:transparent}
#cap{position:absolute;left:60px;right:60px;bottom:${1920 - VY + 56}px;text-align:center;color:#fff;font-family:G,"Segoe UI Emoji",serif}
.l1{font-size:60px;line-height:1.15;white-space:nowrap}
.l2{font-size:48px;font-style:italic;line-height:1.25;margin-top:18px;color:#e9e6df}
.emo{font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji";font-style:normal}
</style></head><body><div id="cap">
<div class="l1">This time ${spark}Claude really cooked <span class="emo">🍳</span></div>
${line2 ? `<div class="l2">${esc(line2)}</div>` : ""}
</div></body></html>`;

(async () => {
  const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", process.env.CHROME_PATH].find((p) => p && fs.existsSync(p));
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--force-device-scale-factor=1", "--hide-scrollbars"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const overlay = path.join(reel, "render", "caption_9x16.png");
  await page.screenshot({ path: overlay, omitBackground: true });
  await browser.close();

  const out = path.join(reel, "render", "final_9x16.mp4");
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-i", overlay,
    "-filter_complex", `color=c=black:s=1080x1920:r=30[bg];[0:v]scale=${VW}:${VH}:flags=lanczos[v];[bg][v]overlay=20:${VY}:shortest=1[a];[a][1:v]overlay=0:0`,
    "-map", "0:a", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
  console.log("wrote", out);
})().catch((e) => { console.error(e); process.exit(1); });
