# How It Works — code-made explainer videos

Long-form "how does this everyday thing actually work?" explainers, built **entirely in code**.
Every frame is HTML/SVG/canvas animated with GSAP on one paused timeline, rendered frame by frame
by headless Chrome, and mixed with a code-synthesized music bed and sound effects.

Tone: a witty friend explaining things — playful, a little sarcastic, with an on-screen host.

## Videos

| Video | Length | File | Chapters |
| --- | --- | --- | --- |
| **How India's bullet train works** | 3:36 | [`reels/bullet/final.mp4`](reels/bullet/final.mp4) | C1 All aboard · C2 The nose · C3 The power · C4 The track · C5 Who drives? · C6 Stopping · C7 Arrival |
| **How UPI works — where your ₹10 actually goes** | 3:41 | [`reels/upi/final.mp4`](reels/upi/final.mp4) | The ₹10 chai · Meet the gang · The 2-second journey · The PIN · Why is it free? · Money debited, payment failed · The big picture |
| **How a phone call connects** | 6:00 | [`reels/phonecall/final.mp4`](reels/phonecall/final.mp4) | One hello · Your voice becomes numbers · Into the air · Finding your friend · Across the world · Back into a voice · All together |
| **METER** (short product reel) | 0:45 | [`reels/meter/final.mp4`](reels/meter/final.mp4) · [9:16](reels/meter/final_9x16.mp4) | single scene |

Script for the UPI explainer: [`reels/upi/SCRIPT.md`](reels/upi/SCRIPT.md). Every chapter keeps its narration in `audio/script.txt`.

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
