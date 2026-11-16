# How It Works — code-made explainer videos

Long-form "how does this everyday thing actually work?" explainers, built **entirely in code**.
Every frame is HTML/SVG/canvas animated with GSAP on one paused timeline, rendered frame by frame
by headless Chrome, and mixed with a code-synthesized music bed and sound effects.

Tone: a witty friend explaining things — playful, a little sarcastic, with an on-screen host.

## Videos

| Video | Length | File | Chapters |
| --- | --- | --- | --- |
| **How a rocket reaches space: pad to orbit and back** | 3:03 | [`reels/rocket/final.mp4`](reels/rocket/final.mp4) · [captions](reels/rocket/captions.srt) | One continuous trip: countdown · liftoff · Max-Q · staging · orbit · re-entry · splashdown |
| **How a plane actually flies: runway to 35,000 ft and back** | 5:23 | [`reels/plane/final.mp4`](reels/plane/final.mp4) | Phase 1 Take-off · Phase 2 Climb · Phase 3 Cruise · Phase 4 Descent · Phase 5 Landing |
| **How an ATM gives you cash in 10 seconds** | 3:03 | [`reels/atm/final.mp4`](reels/atm/final.mp4) | Step 1 Card & chip · Step 2 PIN check · Step 3 Bank network · Step 4 Bank says yes · Step 5 Cash out |
| **How a food delivery order reaches you in 30 minutes** | 3:15 | [`reels/food/final.mp4`](reels/food/final.mp4) | Stop 1 Order placed · Stop 2 Restaurant accepts · Stop 3 Rider assigned · Stop 4 On the way · Stop 5 Delivered |
| **How India's bullet train works** | 3:36 | [`reels/bullet/final.mp4`](reels/bullet/final.mp4) | C1 All aboard · C2 The nose · C3 The power · C4 The track · C5 Who drives? · C6 Stopping · C7 Arrival |
| **How UPI works — where your ₹10 actually goes** | 3:41 | [`reels/upi/final.mp4`](reels/upi/final.mp4) | The ₹10 chai · Meet the gang · The 2-second journey · The PIN · Why is it free? · Money debited, payment failed · The big picture |
| **How a phone call connects** | 6:00 | [`reels/phonecall/final.mp4`](reels/phonecall/final.mp4) | One hello · Your voice becomes numbers · Into the air · Finding your friend · Across the world · Back into a voice · All together |
| **METER** (short product reel) | 0:45 | [`reels/meter/final.mp4`](reels/meter/final.mp4) · [9:16](reels/meter/final_9x16.mp4) | single scene |

Script for the UPI explainer: [`reels/upi/SCRIPT.md`](reels/upi/SCRIPT.md). Every chapter keeps its narration in `audio/script.txt`.

### The rocket explainer — one continuous journey with bullet-time freezes
- **One trip, no chapters:** a single 3D launcher (two stages, crew capsule) flies from a twilight pad to orbit and back to a splashdown, built in [`lib/rocket3d.js`](lib/rocket3d.js) (three.js + bloom, procedural skins, launch complex, soft particle smoke and plumes, Earth with night lights, a Gerstner wave sea with foam). Two pages, [`reels/rocket/j1`](reels/rocket/j1) and [`j2`](reels/rocket/j2), joined behind a cloud wipe.
- **Bullet-time freezes:** at Max-Q, staging, orbit, re-entry and ignition, mission time ramps to a hold while the camera keeps gliding. A small "⏸ TIME HELD" chip replaces any big pause icon, and the mission clock shows "▶▶×N" when time is sped up.
- **Picture-first 2D:** each explanation is one small illustrated scene ([`lib/rocket2d.js`](lib/rocket2d.js)) beside the rocket or pinned to it: an x-ray cutaway, a balloon, a gravity turn, Max-Q, 3× g, dead weight, booster landing, Newton's cannon, a 90-minute lap, 16 sunrises, floating, and the heat shield. The countdown is a silent ticking dial.
- Ends on a "Mission complete" board. No burned-in captions: the exact caption file is [`reels/rocket/captions.srt`](reels/rocket/captions.srt) (made with [`tools/srt.py`](tools/srt.py)). Script: [`reels/rocket/SCRIPT.md`](reels/rocket/SCRIPT.md). Narration by Kokoro `af_heart`.

### The plane explainer — a real 3D plane, a quiz in every phase
- **Assets first:** a real 3D airliner and airport ([`lib/plane3d.js`](lib/plane3d.js), three.js, unbranded A320-class) plus a 2D diagram kit ([`lib/plane.js`](lib/plane.js)), approved on four asset sheets ([`reels/plane/assets_sheet1.jpg`](reels/plane/assets_sheet1.jpg)–[`4`](reels/plane/assets_sheet4.jpg)) before any animation was built.
- 5 chapters for the 5 real phases of a flight. The chapter change is **one aircraft window**: the shade comes down on "NEXT ▶ PHASE 0N" and opens on the next phase ([`lib/planefx.js`](lib/planefx.js)), with a boarding pass for the phase tracker.
- Tone: you are in seat 23A, there is a "quick guess" quiz in most phases, and a running gag about the uncle in 23C. Narration by Kokoro `af_heart`.
- Facts: rotation at ~260 km/h; ~3,000 domestic flights a day in India; bypass air makes ~80% of the push; cruise at 35,000 ft, −50 °C outside, cabin pressure equal to 6–8,000 ft; descent starts ~200 km out (3 nautical miles per 1,000 ft); ILS glide slope 3°; touchdown at ~250 km/h. The flight codes, weights split and route chart are illustrative.

### The ATM explainer — one continuous receipt
- **Assets first:** every visual was drawn up front as a reusable art kit ([`lib/atm.js`](lib/atm.js)) and approved on three asset sheets ([`reels/atm/assets_sheet1.jpg`](reels/atm/assets_sheet1.jpg)–[`3`](reels/atm/assets_sheet3.jpg)) before any animation was built.
- 5 chapters for the 5 real steps. Every chapter change is **one transaction slip**: the ending slip and the next chapter's opening slip are identical, "NEXT" flips to "NOW", then the slip tears off ([`lib/atmfx.js`](lib/atmfx.js)).
- Full-frame scenes: concept-based ambient motion (floating ₹, circuit traces, hex rain, network grids, drifting receipts) plus live panels (transaction logs, info cards, counters) so no part of the screen sits empty.
- Highlights: a 10-second meeting around a table, the chip's new code every transaction vs a copied key that bounces off the lock, NPCI's National Financial Switch network with live counters, a customer-list search ending in "NOT FOUND", a pick → belt → double-note sensor → reject bin line, the 2-second "please collect your cash" heart-stop, the RBI T+5-day / ₹100-a-day refund rule, and a wallet/dustbin finale.
- Facts: NPCI's NFS links ~1,349 banks and ~2.58 lakh ATMs (Feb 2025); ₹19 interchange per cash withdrawal since May 2025; chip cards make a new cryptogram per transaction while the magnetic stripe is static; RBI: failed-withdrawal debits reversed within T+5 days or ₹100/day compensation. The secret codes, daily limit and balances shown are example values.
- Voice: Kokoro `af_heart`, girl host. Narration: [`reels/atm/SCRIPT.md`](reels/atm/SCRIPT.md).

### The food delivery explainer — an order tracker
- The chapter count follows the concept: an order really goes through **5 tracker stages**, so the video has 5 stops. A mini order tracker (TAP → DOOR) in the corner moves one stop per chapter.
- Every chapter ends with a push notification ("Order placed ✓", "Restaurant accepted ✓"...) that drops in and grows to fill the screen; the next chapter opens by shrinking it back ([`lib/food.js`](lib/food.js)). Anything already at the top of the scene clears first, so cards never stack.
- Scene changes: a delivery rider wipe, iris, stripes, a camera dive, a rolling coin, and a scene shrinking into the phone screen.
- Picture-style wow shots: a perspective night city full of order pins, a side-scrolling street ride (red signal, a cow's meeting, the security gate, "Tower B, behind the temple").
- Running gag: "Your rider is 2 minutes away" — with a stopwatch at 9:00, and once more after the food has arrived.
- Every overlay card has a dark outline + solid edge + soft shadow, on deeper tinted backgrounds, so nothing blends in.
- Voice: Kokoro `af_heart`, with a simple flat girl host (`ART.host({ girl: true })` in [`lib/cast.js`](lib/cast.js)). Narration: [`reels/food/SCRIPT.md`](reels/food/SCRIPT.md).
- Facts from news reports and public research: just-in-time rider assignment and batching, ML food-preparation-time prediction, 15–30% commission, ₹14.9 / ₹17.58 platform fees (2026), ₹50–70 rider pay per order (critics say less), tips on only 3–5% of orders. The 14 min prep, minute-8 dispatch and ≈26 min wait are example values to explain the logic, not real data.

### The bullet train explainer — a train journey
- Every chapter is a **coach**: chapters end with sliding train doors and an LED "NEXT · COACH" sign, and the next one opens the same doors. A route map (Mumbai → Ahmedabad) in the corner moves one stop per coach.
- **Real 3D** (three.js, [`lib/train3d.js`](lib/train3d.js)) for 4–5 "wow" shots: the train blasting past on a twin-track viaduct, a nose orbit, the pantograph on the wire, the undersea tunnel under Thane Creek, and the arrival at Ahmedabad station. Everything that explains something stays in the cleaner picture style.
- Inside a coach, scenes change with a passing-train wipe, a dive through a window, an iris, or a 3D cube turn ([`lib/journey.js`](lib/journey.js)).
- Running gag: a ₹10 coin standing on the tray table — still standing at the end.
- Facts checked against NHSRCL / PIB / news sources (508 km, 12 stations, 320 km/h, J-slab, 2×25 kV, 28 seismometers, ~7 km undersea tunnel, opening from 2027).

### Look of the UPI explainer (v2)
- Soft, low-contrast backgrounds with dark ink text; subtitles in a white pill.
- "3D picture" illustrations from [`lib/iso.js`](lib/iso.js): shaded banks with faces, NPCI podium, extruded phones, coins, chai stall, soundbox, servers, city skylines.
- Full-screen maps (banks in the corners, the referee in the middle, roads between them) with the ₹10 travelling along the roads.
- Illustrated chapter cards and a different transition per concept: colour shutters, iris burst, 3D cube turn, rolling coin wipe, camera dive, buildings dropping in.
- A deliberately simple flat host ([`lib/cast.js`](lib/cast.js)) — talks, blinks, waves.

## Repo layout

```
lib/        engine + art
  reel.js        paused master timeline, __seek/__ready hooks, sfx cues, helpers
  explainer.js   chapter chrome, word-synced subtitles, scene helpers, paper tear/fold
  explainer2.js  v2: light theme, illustrated chapter cards, stripes/iris/coin/cube/dive transitions
  iso.js         "3D picture" illustration kit (oblique-projection shaded solids)
  cast.js        the simple host character (optional conductor cap)
  train3d.js     real 3D bullet train world (three.js): lofted kingfisher-nose train, viaduct, catenary, tunnel, station
  journey.js     train-journey kit: route-map chrome, coach doors, passing-train wipe, kingfisher art
  food.js        order-tracker kit: tracker chrome, notification wipe, rider wipe, shrink-into-phone, map/rider/handi art
  atm.js         ATM art kit: machine, cabin + guard, card, chip, PIN pad, cutaway safe, cassettes, notes, printer, hub, packets, ECG
  atmfx.js       ATM theme: receipt-slip chapter changes, shutter wipe, note bursts, ambient fillers, log terminals, info cards
  paper.js       cast art (referee, you, chai, QR...), lip sync, blink
  fonts/ vendor/ self-hosted fonts and GSAP
tools/
  render.js      headless-Chrome frame renderer (--fps, --workers, --stills, --check overlap audit)
  kvoice.py      Kokoro TTS voice + Whisper word timings (used for UPI, voice am_puck)
  voice.py       edge-tts voice or your own recording + word timings
  music.py       synthesized music beds (meter / explainer / playful presets)
  mix.py         voice + sfx + ducked music for one chapter, -14 LUFS
  assemble.py    joins chapters with one continuous music bed -> final.mp4
  sheets.py      contact sheets of stills for review
  flashes.py     finds one-frame flashes (a frame unlike both neighbours) in a rendered video
  vertical.js    9:16 version for Instagram
reels/<video>/chN/
  index.html     the chapter animation
  words.js       word timings for subtitles + cues
  audio/script.txt, audio/voice.wav
```

## Setup

Requirements: Node 18+, Python 3.11+, ffmpeg on PATH, Google Chrome installed.

```bash
npm install
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
```

Kokoro voice models (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) are not in the repo — download them from the
[kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx/releases) into a folder and pass it with `--models`.

## Make / re-render a chapter

```bash
# voice + word timings (Kokoro, male voice am_puck)
.venv/Scripts/python tools/kvoice.py reels/upi/ch3 --voice am_puck --models path/to/kokoro --lead 2.4 --keep 0.6

# overlap audit, then review stills
node tools/render.js reels/upi/ch3 --check
node tools/render.js reels/upi/ch3 --stills auto 12
.venv/Scripts/python tools/sheets.py reels/upi/ch3

# render frames to video
node tools/render.js reels/upi/ch3 --fps 30 --workers 4

# join all chapters with one music bed
MUSIC_PRESET=playful .venv/Scripts/python tools/assemble.py reels/upi ch1 ch2 ch3 ch4 ch5 ch6 ch7
```

Preview a chapter live: serve the repo folder and open `reels/upi/ch3/index.html?play` (or `?t=12.5` to jump).

Large media (`*.mp4`, `*.wav`) is stored with **Git LFS**.
