// render.js — record a reel's index.html frame by frame into an MP4 (silent) + cues.json
//
//   node tools/render.js reels/meter                 full render (default 60 fps, 4 workers)
//   node tools/render.js reels/meter --fps 30
//   node tools/render.js reels/meter --stills 0,1.5,3   save JPG stills at those times
//   node tools/render.js reels/meter --stills auto 18   N evenly spaced stills
//   node tools/render.js reels/meter --from 10 --to 15  render a time range only
//
// Output: <reel>/render/video.mp4, <reel>/render/cues.json, <reel>/render/stills/*.jpg
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, resp) => {
      if (req.url.startsWith("/favicon")) { resp.writeHead(204); return resp.end(); }
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { resp.writeHead(404); return resp.end(); }
      resp.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(p).pipe(resp);
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "load" });
  try {
    await page.waitForFunction("window.__ready === true", { timeout: 20000 });
  } catch (e) {
    throw new Error("page never set window.__ready. Errors:\n" + errors.join("\n"));
  }
  if (errors.length) console.warn("[page errors]\n" + errors.join("\n"));
  const cdp = await page.target().createCDPSession();
  return { page, cdp };
}

async function grab(p, t, format = "jpeg", quality = 95) {
  // no requestAnimationFrame here: background tabs never fire it. captureScreenshot forces a fresh frame.
  await p.page.evaluate((t) => { window.__seek(t); }, t);
  const { data } = await p.cdp.send("Page.captureScreenshot", { format, quality, optimizeForSpeed: true, captureBeyondViewport: false });
  return Buffer.from(data, "base64");
}

function ffmpegWriter(out, fps) {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c)))));
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));
  return { write, end: () => { ff.stdin.end(); return done; } };
}

(async () => {
  const reelArg = process.argv[2];
  if (!reelArg) { console.log("usage: node tools/render.js reels/<name> [--fps 60] [--stills t1,t2|auto N]"); process.exit(1); }
  const reelDir = path.resolve(reelArg);
  const rel = path.relative(ROOT, reelDir).split(path.sep).join("/");
  const outDir = path.join(reelDir, "render");
  fs.mkdirSync(outDir, { recursive: true });

  const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chrome) throw new Error("Chrome not found, set CHROME_PATH");
  const srv = await serve();
  const url = "http://127.0.0.1:" + srv.address().port + "/" + rel + "/index.html";
  // one Chrome per worker: background tabs in a shared browser can stall screenshots
  const launch = () => puppeteer.launch({ executablePath: chrome, headless: true, protocolTimeout: 120000, args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--hide-scrollbars", "--force-device-scale-factor=1", "--disable-web-security", "--font-render-hinting=none", "--force-color-profile=srgb"] });
  const browser = await launch();
  const extra = [];

  try {
    const first = await openPage(browser, url);
    const duration = await first.page.evaluate("window.__duration");
    const cues = await first.page.evaluate("window.__cues || []");
    fs.writeFileSync(path.join(outDir, "cues.json"), JSON.stringify({ duration, cues }, null, 1));
    console.log(`duration ${duration.toFixed(2)} s, ${cues.length} sound cues`);

    // --check: overlap + off-screen audit of every [data-ob] element, sampled every 0.25 s
    if (arg("check")) {
      const issues = new Map();
      for (let t = 0; t <= duration; t += 0.25) {
        await first.page.evaluate((t) => window.__seek(t), t);
        if (await first.page.evaluate((t) => (window.__trans || []).some(([a, b]) => t >= a && t <= b), t)) continue;
        const found = await first.page.evaluate(() => {
          const vis = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && parseFloat(getComputedStyle(el).opacity) > 0.05;
          const items = [...document.querySelectorAll("[data-ob]")].filter(vis).map((el) => {
            let r = el.getBoundingClientRect();
            if (el.id === "subs") { const rs = [...el.children].map((s) => s.getBoundingClientRect()); if (!rs.length) return null; r = { left: Math.min(...rs.map((x) => x.left)), right: Math.max(...rs.map((x) => x.right)), top: Math.min(...rs.map((x) => x.top)), bottom: Math.max(...rs.map((x) => x.bottom)) }; }
            if (r.right - r.left < 2 || r.bottom - r.top < 2) return null;
            return { el, g: el.dataset.ob, name: el.id || el.className || el.dataset.ob, r, bleed: el.hasAttribute("data-bleed") };
          }).filter(Boolean);
          const out = [];
          for (let i = 0; i < items.length; i++) {
            const a = items[i];
            if (!a.bleed && (a.r.left < -4 || a.r.right > 1924 || a.r.top < -4 || a.r.bottom > 1084)) out.push(`OFFSCREEN ${a.name}`);
            for (let j = i + 1; j < items.length; j++) {
              const b = items[j];
              if (a.g === b.g || a.el.contains(b.el) || b.el.contains(a.el)) continue;
              const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
              if (w > 6 && h > 6 && w * h > 500) out.push(`OVERLAP ${a.name} x ${b.name}`);
            }
          }
          return out;
        });
        for (const f of found) { if (!issues.has(f)) issues.set(f, []); issues.get(f).push(+t.toFixed(2)); }
      }
      if (!issues.size) console.log("CHECK OK: no overlaps");
      for (const [k, ts] of issues) console.log(`${k}  @ ${ts[0]}s..${ts[ts.length - 1]}s (${ts.length} samples)`);
      return;
    }

    const stills = arg("stills");
    if (stills) {
      let times;
      if (stills === "auto") {
        const n = +(process.argv[process.argv.indexOf("auto") + 1]) || 18;
        times = Array.from({ length: n }, (_, i) => +((duration * (i + 0.5)) / n).toFixed(2));
        times[0] = 0.05;
      } else times = String(stills).split(",").map(Number);
      const sdir = path.join(outDir, "stills");
      fs.mkdirSync(sdir, { recursive: true });
      for (const f of fs.readdirSync(sdir)) fs.unlinkSync(path.join(sdir, f));
      for (const t of times) {
        const buf = await grab(first, t, "jpeg", 90);
        const name = "t" + t.toFixed(2).padStart(6, "0") + ".jpg";
        fs.writeFileSync(path.join(sdir, name), buf);
        console.log("still", name);
      }
      return;
    }

    const fps = +arg("fps", 60);
    const workers = Math.max(1, +arg("workers", 4));
    const t0 = +arg("from", 0);
    const t1 = Math.min(+arg("to", duration), duration);
    const total = Math.round((t1 - t0) * fps);
    const per = Math.ceil(total / workers);
    const pages = [first];
    for (let w = 1; w < workers; w++) {
      const b = await launch();
      extra.push(b);
      pages.push(await openPage(b, url));
    }
    let doneFrames = 0;
    const started = Date.now();
    const segs = [];
    await Promise.all(pages.map(async (p, w) => {
      const a = w * per, b = Math.min(total, a + per);
      if (a >= b) return;
      const seg = path.join(outDir, `seg${w}.mp4`);
      segs[w] = seg;
      const ff = ffmpegWriter(seg, fps);
      for (let f = a; f < b; f++) {
        await ff.write(await grab(p, t0 + f / fps));
        doneFrames++;
        if (doneFrames % 60 === 0) {
          const el = (Date.now() - started) / 1000;
          process.stdout.write(`\r${doneFrames}/${total} frames  ${(doneFrames / el).toFixed(1)} fps  eta ${Math.round(((total - doneFrames) * el) / doneFrames)} s   `);
        }
      }
      await ff.end();
    }));
    console.log(`\nrendered ${total} frames in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    const list = path.join(outDir, "segs.txt");
    fs.writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s.split(path.sep).join("/")}'`).join("\n"));
    await new Promise((res, rej) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", path.join(outDir, "video.mp4")], { stdio: "inherit" })
      .on("close", (c) => (c === 0 ? res() : rej(new Error("concat failed")))));
    for (const s of segs.filter(Boolean)) fs.unlinkSync(s);
    fs.unlinkSync(list);
    console.log("wrote", path.join(outDir, "video.mp4"));
  } finally {
    await browser.close();
    for (const b of extra) await b.close();
    srv.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
