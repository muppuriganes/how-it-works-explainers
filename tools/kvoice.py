"""kvoice.py — natural voiceover with Kokoro (free, open source, runs locally) + exact word timings.

Run with the TTS venv (short path, see README):
    <tts-python> tools/kvoice.py reels/upi/ch1 --voice am_michael --models <dir with kokoro-v1.0.onnx + voices-v1.0.bin>
        [--speed 1.0] [--lead 0.3] [--keep 0.6]

Reads <reel>/audio/script.txt ([tags] stripped), writes <reel>/audio/voice.wav and <reel>/words.js.
Word timings: Whisper listens to the generated audio, then the result is aligned back onto the
script's own words (so "ten rupees" stays "ten rupees" even if Whisper hears "10 rupees").
"""
import difflib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR = 48000


def opt(a, k, d):
    return a[a.index(k) + 1] if k in a else d


NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "20": "twenty", "100": "hundred"}


def norm(w):
    w = re.sub(r"[^a-z0-9]", "", w.lower())
    return NUM.get(w, w)


def cut_pauses(x, sr, keep):
    hop = int(0.01 * sr)
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    silent = 20 * np.log10(rms / (rms.max() + 1e-12)) < -42
    cuts, i = [], 0
    while i < n:
        if silent[i]:
            j = i
            while j < n and silent[j]:
                j += 1
            k = 0.05 if i == 0 else (0.25 if j >= n else keep)
            if (j - i) * hop / sr > k:
                a = i * hop + (int(k / 2 * sr) if i else 0)
                b = j * hop - (int(k / 2 * sr) if i else int(k * sr))
                if b > a:
                    cuts.append((a, b))
            i = j
        else:
            i += 1
    segs, pos = [], 0
    for a, b in cuts:
        segs.append(x[pos:a]); pos = b
    segs.append(x[pos:])
    y = np.concatenate(segs)

    def tmap(t):
        s, removed = t * sr, 0
        for a, b in cuts:
            if s >= b:
                removed += b - a
            elif s > a:
                removed += s - a; break
            else:
                break
        return (s - removed) / sr
    return y, tmap


def main():
    a = sys.argv[1:]
    reel = Path(a[0])
    models = Path(opt(a, "--models", "."))
    voice = opt(a, "--voice", "am_michael")
    speed = float(opt(a, "--speed", 1.0))
    lead = float(opt(a, "--lead", 0.3))
    keep = float(opt(a, "--keep", 0.6))
    raw = (reel / "audio" / "script.txt").read_text(encoding="utf-8")
    text = re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", raw)).strip()

    from kokoro_onnx import Kokoro
    k = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
    audio, sr = k.create(text, voice=voice, speed=speed, lang="en-gb" if voice.startswith("b") else "en-us")
    audio = np.asarray(audio, dtype=np.float32)

    # word timings from Whisper
    from faster_whisper import WhisperModel
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    a16 = resample_poly(audio, 16000, sr).astype("float32")
    segs, _ = m.transcribe(a16, word_timestamps=True)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]

    # align heard words onto the script words
    script_words = [w for w in re.findall(r"[A-Za-z0-9'₹]+", text)]
    A = [norm(w) for w in script_words]
    B = [norm(w[0]) for w in heard]
    times = [None] * len(A)
    for blk in difflib.SequenceMatcher(a=A, b=B, autojunk=False).get_matching_blocks():
        for i in range(blk.size):
            times[blk.a + i] = (heard[blk.b + i][1], heard[blk.b + i][2])
    # fill unmatched words by interpolating between neighbours (by character length)
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None:
                j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0
            t1 = times[j][0] if j < len(times) else len(audio) / sr
            lens = [max(1, len(script_words[q])) for q in range(i, j)]
            tot, acc = sum(lens), 0
            for q, L in zip(range(i, j), lens):
                s = t0 + (t1 - t0) * acc / tot; acc += L
                times[q] = (s, t0 + (t1 - t0) * acc / tot)
            i = j
        else:
            i += 1

    # tidy pauses, loudness, lead-in
    y, tmap = cut_pauses(audio, sr, keep)
    y = resample_poly(y, SR, sr).astype(np.float32)
    with tempfile.TemporaryDirectory() as td:
        t1, t2 = Path(td) / "a.wav", Path(td) / "b.wav"
        sf.write(t1, y, SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(t1), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", str(SR), "-ac", "1", str(t2)], check=True)
        v, _ = sf.read(t2)
    v = np.concatenate([np.zeros(int(lead * SR)), v])
    (reel / "audio").mkdir(parents=True, exist_ok=True)
    sf.write(reel / "audio" / "voice.wav", v.astype(np.float32), SR)
    words = [{"w": w, "s": round(tmap(s) + lead, 3), "e": round(tmap(e) + lead, 3)} for w, (s, e) in zip(script_words, times)]
    (reel / "words.js").write_text("window.WORDS = " + json.dumps(words).replace(" ", "") + ";\n", encoding="utf-8")
    matched = sum(1 for blk in difflib.SequenceMatcher(a=A, b=B, autojunk=False).get_matching_blocks() for _ in range(blk.size))
    print(f"{voice}: {len(v) / SR:.2f} s, {len(words)} words ({matched} matched by ear, rest interpolated), last ends {words[-1]['e']:.2f} s")


if __name__ == "__main__":
    main()
