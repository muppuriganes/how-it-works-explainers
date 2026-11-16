"""mix.py — synthesize every sound effect with numpy, place them on the cues,
mix with voiceover + music (music ducked under the voice, faded at the end),
and encode the final MP4 at 30 fps.

    python tools/mix.py reels/meter            -> reels/meter/render/final.mp4
    python tools/mix.py reels/meter --sfx 0.8  -> scale all sound effects
    python tools/mix.py --demo                 -> render every sfx to sfx_demo.wav

Inputs:  <reel>/render/video.mp4, <reel>/render/cues.json,
         <reel>/audio/voice.wav (optional), <reel>/audio/music.wav (optional)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
_rng = np.random.default_rng(1234)


# --------------------------------------------------------------------------- helpers
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(dur, a=0.002, d=0.1, curve=1.0):
    t = t_(dur)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)) ** curve
    return e


def noise(dur, seed=None):
    r = np.random.default_rng(seed) if seed is not None else _rng
    return r.standard_normal(int(dur * SR))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def sine(f, dur, phase=0):
    t = t_(dur)
    f = np.broadcast_to(f, t.shape) if np.ndim(f) else np.full(t.shape, f)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# --------------------------------------------------------------------------- sound effects
def s_tick():
    x = bp(noise(0.03), 3000, 9000) * env(0.03, 0.0005, 0.004)
    x += 0.4 * sine(2400, 0.03) * env(0.03, 0.0005, 0.003)
    return norm(x, 0.7)


def s_click():
    x = bp(noise(0.05), 1500, 6000) * env(0.05, 0.0003, 0.006)
    x += 0.5 * sine(1200, 0.05) * env(0.05, 0.0003, 0.008)
    return norm(x, 0.8)


def s_pop():
    d = 0.12
    f = 900 * np.exp(-t_(d) * 30) + 300
    x = sine(f, d) * env(d, 0.001, 0.03)
    return norm(x, 0.8)


def s_print():
    # thermal printer: buzzy stepped motor, ~0.35 s
    d = 0.35
    t = t_(d)
    motor = signal.square(2 * np.pi * 180 * t) * 0.3 + bp(noise(d), 2000, 7000) * 0.6
    gate = (np.sin(2 * np.pi * 28 * t) > -0.2).astype(float)
    e = np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.04)
    return norm(lp(motor * gate * e, 7000), 0.6)


def s_stamp():
    d = 0.4
    thud = sine(110 * np.exp(-t_(d) * 8) + 45, d) * env(d, 0.001, 0.08)
    slap = bp(noise(d), 400, 3500) * env(d, 0.0005, 0.02)
    return norm(thud * 1.0 + slap * 0.8, 0.95)


def s_clunk():
    d = 0.3
    x = sine(160 * np.exp(-t_(d) * 6) + 60, d) * env(d, 0.001, 0.06)
    x += bp(noise(d), 600, 2500) * env(d, 0.0005, 0.015) * 0.7
    x += 0.3 * sine(740, d) * env(d, 0.001, 0.05)
    return norm(x, 0.9)


def s_ding():
    d = 1.4
    x = sum(a * sine(440 * 3 * m, d) * env(d, 0.002, 0.5 / m) for m, a in [(1, 1), (2.76, 0.4), (5.4, 0.2), (8.93, 0.08)])
    return norm(x, 0.7)


def s_whoosh(d=0.5):
    t = t_(d)
    n = noise(d)
    p = np.sin(np.pi * t / d) ** 2  # brightness sweeps up then down
    out = bp(n, 250, 1100) * (1 - p) + bp(n, 1200, 6500) * p
    return norm(out * p, 0.6)


def s_riser(d=1.2):
    t = t_(d)
    f = 200 * (12 ** (t / d))
    x = sine(f, d) * 0.3 + bp(noise(d), 1500, 9000) * (t / d) * 0.6
    e = (t / d) ** 2 * np.minimum(1, (d - t) / 0.02)
    return norm(x * e, 0.6)


def s_fire(d=2.0):
    t = t_(d)
    roar = lp(noise(d), 600) * 0.8
    crackle = np.zeros_like(t)
    r = np.random.default_rng(5)
    for _ in range(int(d * 40)):
        i = r.integers(0, len(t) - 800)
        crackle[i: i + 800] += bp(r.standard_normal(800), 2000, 8000) * np.exp(-np.arange(800) / 90) * r.uniform(0.3, 1)
    e = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.6)
    return norm((roar + crackle) * e, 0.7)


def s_paper():
    d = 0.45
    t = t_(d)
    x = bp(noise(d), 1800, 9000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t)))
    return norm(x * np.sin(np.pi * t / d), 0.5)


def s_tear():
    d = 0.4
    t = t_(d)
    r = np.random.default_rng(9)
    grains = (r.uniform(0, 1, len(t)) > 0.985).astype(float) * r.uniform(0.3, 1, len(t))
    x = bp(lp(grains, 6000) + 0.2 * noise(d), 1200, 8000)
    e = np.minimum(1, t / 0.02) * np.exp(-t / 0.25)
    return norm(x * e, 0.7)


def s_swish():
    d = 0.22
    t = t_(d)
    x = bp(noise(d), 2500, 10000) * np.sin(np.pi * t / d) ** 3
    return norm(x, 0.5)


def s_impact():
    d = 1.0
    boom = sine(70 * np.exp(-t_(d) * 4) + 32, d) * env(d, 0.002, 0.3)
    crack = bp(noise(d), 200, 4000) * env(d, 0.001, 0.05)
    return norm(boom + crack * 0.6, 0.95)


def s_glitch():
    d = 0.35
    r = np.random.default_rng(3)
    out = np.zeros(int(d * SR))
    i = 0
    while i < len(out):
        n = int(r.uniform(0.008, 0.04) * SR)
        kind = r.integers(0, 3)
        tt = np.arange(n) / SR
        if kind == 0:
            seg = signal.square(2 * np.pi * r.uniform(200, 2000) * tt)
        elif kind == 1:
            seg = r.standard_normal(n)
        else:
            seg = np.sin(2 * np.pi * r.uniform(800, 4000) * tt)
        out[i: i + n] = seg[: len(out[i: i + n])] * r.uniform(0.2, 1)
        i += n
    return norm(np.round(out * 6) / 6, 0.5)


def s_beep():
    d = 0.12
    return norm(sine(1800, d) * np.minimum(1, np.minimum(t_(d), d - t_(d)) / 0.005), 0.5)


def s_pistol():
    d = 0.9
    crack = noise(d) * env(d, 0.0003, 0.012)
    body = lp(noise(d), 1200) * env(d, 0.001, 0.12) * 0.7
    tail = bp(noise(d), 300, 3000) * env(d, 0.01, 0.35) * 0.25
    return norm(crack + body + tail, 0.95)


def s_crowd(d=2.5):
    t = t_(d)
    x = np.zeros_like(t)
    r = np.random.default_rng(11)
    for _ in range(14):
        f0 = r.uniform(200, 700)
        x += bp(noise(d), f0, f0 * 2.2) * (0.6 + 0.4 * np.sin(2 * np.pi * r.uniform(0.5, 2) * t + r.uniform(0, 6)))
    e = np.sin(np.pi * np.minimum(1, t / d)) ** 0.7
    return norm(x * e, 0.55)


def s_slam():
    d = 0.6
    x = sine(55 * np.exp(-t_(d) * 3) + 40, d) * env(d, 0.001, 0.15)
    x += lp(noise(d), 2500) * env(d, 0.0005, 0.04) * 1.2
    return norm(x, 0.95)


def s_roll():
    d = 0.6
    t = t_(d)
    clicks = np.zeros_like(t)
    rate = 18 + 30 * (1 - t / d)
    ph = np.cumsum(rate) / SR
    idx = np.where(np.diff(np.floor(ph)) > 0)[0]
    tk = s_tick()
    for i in idx:
        clicks[i: i + len(tk)] += tk[: len(clicks[i: i + len(tk)])] * 0.6
    return norm(clicks, 0.6)


def s_bloop():
    d = 0.18
    f = 300 + 700 * (t_(d) / d)
    return norm(sine(f, d) * env(d, 0.003, 0.06), 0.6)


def s_chime():
    d = 1.6
    x = np.zeros(int(d * SR))
    for k, f in enumerate([1318.5, 1760, 2349.3]):
        o = int(k * 0.07 * SR)
        n = len(x) - o
        x[o:] += sine(f, n / SR) * env(n / SR, 0.002, 0.45) * (0.9 - 0.2 * k)
    return norm(x, 0.55)


def s_coin():
    d = 0.6
    a = sine(988, 0.08) * env(0.08, 0.001, 0.05)
    b = sine(1319, d - 0.08) * env(d - 0.08, 0.001, 0.18)
    return norm(np.concatenate([a, b]) * 0.8, 0.6)


def s_pour(d=1.5):
    t = t_(d)
    x = np.zeros_like(t)
    r = np.random.default_rng(2)
    for _ in range(int(d * 60)):
        i = r.integers(0, len(t) - 2000)
        f = r.uniform(600, 2200)
        g = np.arange(2000) / SR
        x[i: i + 2000] += np.sin(2 * np.pi * f * (1 + 2 * g) * g) * np.exp(-g * 60)
    x += 0.15 * bp(noise(d), 500, 4000)
    e = np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.3)
    return norm(x * e, 0.5)


def s_jet(d=4.0):
    """jet engine spool-up: a turbine whine that climbs, under a broadband roar that swells and holds."""
    t = t_(d)
    k = np.minimum(1, t / (0.45 * d))
    whine = sine(380 + 1300 * k ** 1.4, d) * 0.12 + sine(2 * (380 + 1300 * k ** 1.4), d) * 0.05
    n = noise(d, 77)
    roar = lp(n, 500) * 1.0 + bp(n, 600, 2600) * 0.45 * k
    x = whine * (0.4 + 0.6 * k) + roar * (0.15 + 0.85 * k ** 1.2)
    e = np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.6)
    return norm(x * e, 0.6)


def s_rumble(d=2.0):
    """rocket roar: deep brown-noise rumble with crackle, swelling in and fading out."""
    t = t_(d)
    n = noise(d, 91)
    br = np.cumsum(n); br = br - lp(br, 6, 1); br = br / (np.abs(br).max() + 1e-9)
    crack = (np.random.default_rng(5).random(len(t)) < 0.003) * noise(d, 6)
    crack = bp(np.convolve(crack, np.exp(-np.arange(300) / 50), "same"), 500, 4000)
    x = lp(br, 260) * 1.6 + bp(n, 150, 1500) * 0.25 + crack * 0.6
    e = np.minimum(1, t / min(0.35, d * 0.3)) * np.minimum(1, (d - t) / min(0.8, d * 0.4))
    return norm(x * e, 0.7)


def s_sip():
    """a long slurp of hot chai."""
    d = 1.6
    t = t_(d)
    n = noise(d, 12)
    x = bp(n, 900, 3200) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) ** 2) + bp(n, 300, 900) * 0.3
    e = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.4)
    return norm(x * e, 0.45)


def s_water(d=2.0):
    """deluge: a big gush of water."""
    t = t_(d)
    n = noise(d, 31)
    x = bp(n, 400, 6000) * 0.8 + lp(n, 300) * 0.6
    e = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.6)
    return norm(x * e, 0.55)


SFX = {
    "tick": s_tick, "click": s_click, "pop": s_pop, "print": s_print, "stamp": s_stamp, "clunk": s_clunk,
    "ding": s_ding, "whoosh": s_whoosh, "riser": s_riser, "fire": s_fire, "paper": s_paper, "tear": s_tear,
    "swish": s_swish, "impact": s_impact, "glitch": s_glitch, "beep": s_beep, "pistol": s_pistol,
    "crowd": s_crowd, "slam": s_slam, "roll": s_roll, "bloop": s_bloop, "chime": s_chime, "coin": s_coin, "pour": s_pour, "jet": s_jet, "rumble": s_rumble, "sip": s_sip, "water": s_water,
}
VARIABLE_LEN = {"whoosh", "riser", "fire", "crowd", "pour", "jet", "rumble", "water"}
_cache = {}


def get_sfx(cue):
    typ = cue["type"]
    if typ not in SFX:
        raise SystemExit(f"unknown sfx type {typ!r}")
    key = (typ, cue.get("dur"))
    if key not in _cache:
        fn = SFX[typ]
        _cache[key] = fn(cue["dur"]) if (typ in VARIABLE_LEN and cue.get("dur")) else fn()
    x = _cache[key]
    rate = cue.get("pitch", 1.0)
    if rate != 1.0:
        x = signal.resample(x, int(len(x) / rate))
    return x


# --------------------------------------------------------------------------- mixing
def load(path, n):
    if not Path(path).exists():
        return np.zeros((n, 2))
    x, sr = sf.read(path, always_2d=True)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr, axis=0)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    out = np.zeros((n, 2))
    m = min(n, len(x))
    out[:m] = x[:m, :2]
    return out


def follower(x, hold=0.25, smooth=0.15):
    """Voice envelope: RMS, held over short gaps, then smoothed."""
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    e = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    e = np.sqrt(uniform_filter1d(e ** 2, int(0.02 * SR)))
    e = maximum_filter1d(e, int(hold * SR))
    return uniform_filter1d(e, int(smooth * SR))


def mix(reel: Path, sfx_scale=1.0, music_gain=0.5, voice_gain=1.0, fade_out=1.5):
    rd = reel / "render"
    meta = json.loads((rd / "cues.json").read_text())
    dur = meta["duration"]
    n = int(dur * SR) + SR // 2
    voice = load(reel / "audio" / "voice.wav", n) * voice_gain
    music = load(reel / "audio" / "music.wav", n) * music_gain

    # duck music under voice (about -9 dB while speaking)
    ve = follower(voice)
    ve = np.clip(ve / (np.percentile(ve[ve > 1e-4], 90) if np.any(ve > 1e-4) else 1), 0, 1)
    duck = 1 - 0.65 * ve
    music *= duck[:, None]
    # fade music in 0.05 s, out over the last fade_out seconds
    t = np.arange(n) / SR
    fade = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / max(fade_out, 0.05), 0, 1)
    music *= fade[:, None]

    fx = np.zeros((n, 2))
    for c in meta["cues"]:
        x = get_sfx(c) * c.get("gain", 0.4) * sfx_scale
        i = int(c["t"] * SR)
        if i >= n:
            continue
        m = min(len(x), n - i)
        pan = c.get("pan", 0.0)
        fx[i: i + m, 0] += x[:m] * np.sqrt(0.5 * (1 - pan))
        fx[i: i + m, 1] += x[:m] * np.sqrt(0.5 * (1 + pan))

    out = voice + music + fx
    out = out[: int(dur * SR)]
    # soft limiter
    peak = np.max(np.abs(out)) or 1
    out = out / peak * 0.98
    out = np.tanh(out * 1.3) / np.tanh(1.3)
    wav = rd / "mix.wav"
    sf.write(wav, out.astype(np.float32), SR, subtype="FLOAT")

    final = rd / "final.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(rd / "video.mp4"), "-i", str(wav),
           "-filter:a", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", "48000",
           "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(final)]
    subprocess.run(cmd, check=True)
    print("wrote", final)


def demo():
    parts = []
    for name, fn in SFX.items():
        x = fn()
        parts += [x, np.zeros(int(0.35 * SR))]
        print(name, f"{len(x) / SR:.2f}s")
    sf.write("sfx_demo.wav", np.concatenate(parts).astype(np.float32), SR)
    print("wrote sfx_demo.wav")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        sys.exit(1)
    if a[0] == "--demo":
        demo()
    else:
        def opt(k, d):
            return float(a[a.index(k) + 1]) if k in a else d
        mix(Path(a[0]), sfx_scale=opt("--sfx", 1.0), music_gain=opt("--music", 0.5), voice_gain=opt("--voice", 1.0),
            fade_out=opt("--fade", 1.5))
