"""music.py — synthesize a background music bed in code (numpy), no samples.

    python tools/music.py meter reels/meter --dur 44.97 --lift 21.75 --end 43.6

Presets follow the music briefs in the guide. Writes <reel>/audio/music.wav (stereo, 48 kHz).
  --dur   total length in seconds
  --lift  time where the second-half lift starts
  --end   time of the final single note (groove stops just before it)
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ks_pluck(freq, dur, bright=0.5, decay=0.995, seed=0):
    """Karplus-Strong via a recursive filter (fast)."""
    n = int(dur * SR)
    p = SR / freq
    pi = int(p)
    frac = p - pi
    rng = np.random.default_rng(seed)
    exc = np.zeros(n)
    burst = rng.uniform(-1, 1, pi)
    burst = signal.lfilter([1 - (1 - bright)], [1, -(1 - bright)], burst)  # soften
    exc[:pi] = burst
    # y[n] = x[n] + decay*((1-frac)/2*y[n-pi] + 0.5*y[n-pi-1] + frac/2*y[n-pi-2])
    a = np.zeros(pi + 3)
    a[0] = 1
    a[pi] -= decay * (1 - frac) * 0.5
    a[pi + 1] -= decay * 0.5
    a[pi + 2] -= decay * frac * 0.5
    y = signal.lfilter([1], a, exc)
    env = np.minimum(1, (n - np.arange(n)) / (0.02 * SR))
    return y * env


def tone_env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


class Track:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, x, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= self.n or i < 0:
            return
        m = min(len(x), self.n - i)
        self.L[i:i + m] += x[:m] * gain * np.sqrt(0.5 * (1 - pan))
        self.R[i:i + m] += x[:m] * gain * np.sqrt(0.5 * (1 + pan))


# ------------------------------------------------------------------ instruments
_rng = np.random.default_rng(7)


def hat(open_=False):
    d = 0.25 if open_ else 0.04
    n = int(d * SR)
    x = _rng.standard_normal(n)
    x = signal.sosfilt(signal.butter(2, 7000, "high", fs=SR, output="sos"), x)
    t = np.arange(n) / SR
    tick = np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.004) * 0.6  # clockwork tick
    return (x * np.exp(-t / (0.08 if open_ else 0.009)) + tick) * 0.5


def wood(f=820):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.025) + 0.5 * np.sin(2 * np.pi * f * 2.6 * t) * np.exp(-t / 0.012)
    return x * 0.6


def soft_kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * 0.9


def sub(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.15 * np.sin(4 * np.pi * freq * t)
    e = np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05)
    return x * e * 0.8


def typeclick():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    x = _rng.standard_normal(n)
    x = signal.sosfilt(signal.butter(2, [1500, 5000], "band", fs=SR, output="sos"), x)
    return x * np.exp(-t / 0.004) * 0.7


def pizz(note, dur=0.35, seed=0, bright=0.45):
    x = ks_pluck(midi(note), dur, bright=bright, decay=0.993, seed=seed)
    return x / (np.max(np.abs(x)) + 1e-9)


# ------------------------------------------------------------------ METER preset
def meter(dur, lift, end):
    bpm = 112
    beat = 60 / bpm
    s16 = beat / 4
    tr = Track(dur)
    # D minor, cheeky: Dm | Dm | Bb | C   (2 beats per chord pair -> 1 bar each)
    chords = [(50, [62, 65, 69]), (50, [62, 65, 69]), (46, [62, 65, 70]), (48, [64, 67, 72])]
    # pizz pattern per bar (16th index, chord tone index, octave)
    patt_a = [(0, 0, 0), (3, 1, 0), (6, 2, 0), (8, 1, 0), (11, 0, 0), (14, 2, 0)]
    patt_b = [(0, 0, 0), (2, 2, 0), (4, 1, 1), (7, 0, 1), (8, 2, 0), (10, 1, 0), (12, 0, 1), (14, 2, 1), (15, 1, 1)]
    groove_end = end - 0.25
    bar_len = beat * 4
    nbars = int(np.ceil(groove_end / bar_len)) + 1
    seed = 0
    for b in range(nbars):
        t0 = b * bar_len
        root, tones = chords[b % 4]
        lifted = t0 >= lift - 0.01
        for k in range(16):
            t = t0 + k * s16
            if t >= groove_end:
                break
            # clockwork hats: every 16th, accents on 8ths
            g = 0.32 if k % 2 == 0 else 0.16
            swing = 0.012 if k % 2 else 0
            tr.add(hat(), t + swing, g, pan=0.25)
            if lifted and k in (6, 14):
                tr.add(hat(True), t, 0.12, pan=0.3)
            # soft kick on 1 and 3 (and the "and" of 3 after lift)
            if k in (0, 8) or (lifted and k == 11):
                tr.add(soft_kick(), t, 0.55)
            # wood percussion, syncopated
            if k in (3, 10) or (lifted and k in (13,)):
                tr.add(wood(820 if k != 10 else 1100), t, 0.22, pan=-0.35)
            # typewriter clicks, sparse
            if (b % 2 == 1 and k in (13, 15)) or (lifted and b % 2 == 0 and k == 5):
                tr.add(typeclick(), t, 0.25, pan=0.5)
        # sub bass: root on 1, octave-ish bounce on the "and" of 2, back on 4
        for k, length, step in [(0, 5, 0), (6, 2, 0), (12, 3, 0 if not lifted else 12)]:
            t = t0 + k * s16
            if t < groove_end:
                tr.add(sub(midi(root - 12 + step), length * s16 * 0.95), t, 0.55)
        # pizzicato plucks
        patt = patt_b if lifted else patt_a
        for k, ti, octv in patt:
            t = t0 + k * s16
            if t >= groove_end:
                continue
            seed += 1
            tr.add(pizz(tones[ti] + 12 * octv, 0.4, seed), t, 0.32, pan=-0.2 + 0.4 * ((k % 4) / 3))
        # lift: a little counter motif every other bar
        if lifted and b % 2 == 1:
            for j, nte in enumerate([74, 72, 69, 72]):
                t = t0 + (8 + j * 2) * s16
                if t < groove_end:
                    seed += 1
                    tr.add(pizz(nte, 0.5, seed, bright=0.6), t, 0.2, pan=0.4)
    # clean ending on a single pluck (tonic, with octave)
    tr.add(pizz(62, 1.8, 99, bright=0.5), end, 0.6)
    tr.add(pizz(50, 1.8, 98, bright=0.4), end, 0.35)
    out = np.stack([tr.L, tr.R], axis=1)
    # gentle room: short stereo slapback
    d1, d2 = int(0.031 * SR), int(0.047 * SR)
    wet = np.zeros_like(out)
    wet[d1:, 0] += out[:-d1, 1] * 0.18
    wet[d2:, 1] += out[:-d2, 0] * 0.18
    out = out + wet
    out /= np.max(np.abs(out)) + 1e-9
    return out * 0.85


# ------------------------------------------------------------------ EXPLAINER preset
def pad_chord(notes, dur, seed=0):
    """Warm pad: detuned saws, low-passed, slow attack/release."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    x = np.zeros(n)
    for nt in notes:
        f = midi(nt)
        for det in (-0.08, 0.0, 0.07):
            ph = rng.uniform(0, 1)
            x += signal.sawtooth(2 * np.pi * f * (1 + det / 100 * 6) * t + ph * 6.28) * 0.33
    x = signal.sosfilt(signal.butter(2, 1400, "low", fs=SR, output="sos"), x)
    a, r = min(1.2, dur / 3), min(1.5, dur / 3)
    env = np.minimum(1, t / a) * np.minimum(1, (dur - t) / r)
    return x * env / max(1, len(notes))


def explainer(dur, lift, end):
    """Calm tech underscore, 92 BPM, Am F C G. Leaves lots of room for narration."""
    bpm = 92
    beat = 60 / bpm
    bar = beat * 4
    tr = Track(dur + 0.5)
    prog = [(57, [57, 60, 64, 69]), (53, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (55, [55, 59, 62, 67])]
    nbars = int(np.ceil(dur / bar))
    seed = 0
    for b in range(nbars):
        t0 = b * bar
        root, tones = prog[b % 4]
        section = (b // 8) % 4  # evolves every 8 bars
        # pad (two bars long chords overlap gently)
        tr.add(pad_chord(tones, bar * 1.05, seed=b), t0, 0.22)
        # sub bass, whole notes with a soft pulse on beat 3
        tr.add(sub(midi(root - 24), bar * 0.48), t0, 0.32)
        tr.add(sub(midi(root - 24), bar * 0.45), t0 + 2 * beat, 0.24)
        # plucked arpeggio (8ths), octave variation by section
        arp = [0, 2, 1, 3, 2, 1, 3, 2] if section % 2 == 0 else [0, 1, 2, 3, 3, 2, 1, 2]
        for k, ti in enumerate(arp):
            seed += 1
            note = tones[ti] + (12 if section in (1, 2) else 0)
            tr.add(pizz(note, 0.5, seed, bright=0.35), t0 + k * beat / 2, 0.11, pan=-0.3 + 0.6 * (k % 2))
        # light beat (not in the first 4 bars, drops out in section 3 for variety)
        if b >= 4 and section != 3:
            for k in range(4):
                if k in (0, 2):
                    tr.add(soft_kick(), t0 + k * beat, 0.35)
                tr.add(hat(), t0 + k * beat + beat / 2, 0.08, pan=0.3)
    # gentle end: a final chord swell
    tr.add(pad_chord([57, 60, 64, 69, 76], 4.0, seed=999), max(0, end), 0.3)
    out = np.stack([tr.L, tr.R], axis=1)[: int(dur * SR)]
    d1, d2 = int(0.043 * SR), int(0.071 * SR)
    wet = np.zeros_like(out)
    wet[d1:, 0] += out[:-d1, 1] * 0.25
    wet[d2:, 1] += out[:-d2, 0] * 0.25
    out = out + wet
    fade = np.minimum(1, np.arange(len(out)) / (1.5 * SR))[:, None]
    out = out * fade
    out /= np.max(np.abs(out)) + 1e-9
    return out * 0.85


def clap():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = _rng.standard_normal(n)
    x = signal.sosfilt(signal.butter(2, [900, 3500], "band", fs=SR, output="sos"), x)
    env = np.exp(-t / 0.05) * (1 + 0.6 * np.exp(-((t - 0.012) ** 2) / 1e-5))
    return x * env * 0.6


def playful(dur, lift, end):
    """Bouncy, cheeky underscore for comedy explainers: 112 BPM, C G Am F, staccato plucks, claps, walking bass."""
    bpm = 112
    beat = 60 / bpm
    bar = beat * 4
    tr = Track(dur + 0.5)
    prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
    nbars = int(np.ceil(dur / bar))
    seed = 0
    for b in range(nbars):
        t0 = b * bar
        root, tones = prog[b % 4]
        section = (b // 8) % 3
        # bouncy bass: root, fifth, octave, fifth (staccato)
        for k, step in enumerate([0, 7, 12, 7]):
            tr.add(sub(midi(root - 12 + step), beat * 0.42), t0 + k * beat, 0.34)
        # off-beat chord stabs (plucks)
        for k in range(4):
            for j, nt in enumerate(tones):
                seed += 1
                tr.add(pizz(nt + 12, 0.25, seed, bright=0.55), t0 + k * beat + beat / 2 + j * 0.008, 0.09, pan=-0.2 + 0.2 * j)
        # little melody hook (two bars out of four, varies by section)
        hook = [[0, 2, 4, 2], [4, 5, 4, 2], [7, 5, 4, 0]][section]
        scale = [72, 74, 76, 77, 79, 81, 83, 84]
        if b % 4 in (1, 3):
            for k, d in enumerate(hook):
                seed += 1
                tr.add(pizz(scale[d], 0.4, seed, bright=0.7), t0 + k * beat, 0.16, pan=0.3)
        # kick on 1 and 3, claps on 2 and 4 (drop out first 2 bars)
        if b >= 2:
            tr.add(soft_kick(), t0, 0.4); tr.add(soft_kick(), t0 + 2 * beat, 0.35)
            tr.add(clap(), t0 + beat, 0.28, pan=0.1); tr.add(clap(), t0 + 3 * beat, 0.28, pan=-0.1)
            for k in range(8):
                tr.add(hat(), t0 + k * beat / 2, 0.07 if k % 2 else 0.04, pan=0.3)
    # ending: a happy chord stab
    for j, nt in enumerate([60, 64, 67, 72]):
        tr.add(pizz(nt, 1.6, 900 + j, bright=0.6), max(0, end) + j * 0.02, 0.25)
    out = np.stack([tr.L, tr.R], axis=1)[: int(dur * SR)]
    d1, d2 = int(0.031 * SR), int(0.047 * SR)
    wet = np.zeros_like(out)
    wet[d1:, 0] += out[:-d1, 1] * 0.18
    wet[d2:, 1] += out[:-d2, 0] * 0.18
    out = out + wet
    out /= np.max(np.abs(out)) + 1e-9
    return out * 0.85


PRESETS = {"meter": meter, "explainer": explainer, "playful": playful}

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2 or a[0] not in PRESETS:
        print(__doc__)
        sys.exit(1)

    def opt(k, d):
        return float(a[a.index(k) + 1]) if k in a else d

    dur = opt("--dur", 45)
    out = PRESETS[a[0]](dur, opt("--lift", dur / 2), opt("--end", dur - 1.5))
    p = Path(a[1]) / "audio" / "music.wav"
    p.parent.mkdir(parents=True, exist_ok=True)
    sf.write(p, out.astype(np.float32), SR)
    print("wrote", p, f"{len(out) / SR:.2f} s")
