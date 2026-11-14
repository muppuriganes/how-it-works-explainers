"""voice.py — make the voiceover and the word timings (words.js).

Two ways in:
  1) Generate with free Microsoft neural TTS (edge-tts), exact word timings from the TTS:
       python tools/voice.py tts reels/meter --voice en-GB-RyanNeural --rate -4%
     reads reels/meter/audio/script.txt ([tags] like [dry] are stripped)
  2) Bring your own recording (ElevenLabs, your own voice...), timings from Whisper:
       python tools/voice.py file reels/meter path/to/voice.mp3

Both: remove long pauses (keep ~0.35 s), normalise loudness, write
  <reel>/audio/voice.wav  and  <reel>/words.js  (window.WORDS = [{w, s, e}])
"""
import asyncio
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
KEEP_PAUSE = 0.35


def to_wav(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", str(SR), str(dst)], check=True)


def cut_pauses(x, keep=KEEP_PAUSE, thresh_db=-42):
    """Shrink every silence longer than `keep` to `keep`. Returns new audio + time-map function."""
    hop = int(0.01 * SR)
    frames = len(x) // hop
    rms = np.sqrt(np.mean(x[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
    silent = db < thresh_db
    # find silent runs
    cuts = []  # (start_sample, end_sample) to remove
    i = 0
    while i < frames:
        if silent[i]:
            j = i
            while j < frames and silent[j]:
                j += 1
            run = (j - i) * hop / SR
            # leading silence: trim to 0.05 s; inner: shrink to keep; trailing: trim to 0.2
            if i == 0:
                k = 0.05
            elif j >= frames:
                k = 0.2
            else:
                k = keep
            if run > k:
                half = k / 2
                a = i * hop + int((half if i else 0) * SR)
                b = j * hop - int((half if i else k) * SR)
                if b > a:
                    cuts.append((a, b))
            i = j
        else:
            i += 1
    keep_segs = []
    pos = 0
    for a, b in cuts:
        keep_segs.append((pos, a))
        pos = b
    keep_segs.append((pos, len(x)))
    fade = int(0.004 * SR)
    out = []
    for a, b in keep_segs:
        seg = x[a:b].copy()
        if len(seg) > 2 * fade:
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg)
    y = np.concatenate(out) if out else x

    def tmap(t):
        s = t * SR
        removed = 0
        for a, b in cuts:
            if s >= b:
                removed += b - a
            elif s > a:
                removed += s - a
                break
            else:
                break
        return (s - removed) / SR

    total_cut = sum(b - a for a, b in cuts) / SR
    return y, tmap, total_cut


def normalise(src_wav, dst_wav):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src_wav), "-af", "loudnorm=I=-16:TP=-1.5:LRA=7",
                    "-ar", str(SR), "-ac", "1", str(dst_wav)], check=True)


def write_words(reel, words):
    js = "window.WORDS = " + json.dumps(words, indent=0).replace("\n", "") + ";\n"
    (reel / "words.js").write_text(js, encoding="utf-8")
    print(f"wrote words.js: {len(words)} words, last ends {words[-1]['e']:.2f} s")
    print(" ".join(f"{i}:{w['w']}" for i, w in enumerate(words)))


OPTS = {"keep": KEEP_PAUSE, "lead": 0.0}


def finish(reel, raw_wav, words):
    x, sr = sf.read(raw_wav)
    if x.ndim > 1:
        x = x.mean(axis=1)
    y, tmap, cut = cut_pauses(x, keep=OPTS["keep"])
    print(f"removed {cut:.2f} s of pauses, {len(x) / SR:.2f} s -> {len(y) / SR:.2f} s")
    lead = OPTS["lead"]
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "cut.wav"
        sf.write(tmp, y.astype(np.float32), SR)
        normed = Path(td) / "norm.wav"
        normalise(tmp, normed)
        v, _ = sf.read(normed)
        # lead-in silence (room for a title card before the narration starts)
        v = np.concatenate([np.zeros(int(lead * SR)), v])
        sf.write(reel / "audio" / "voice.wav", v.astype(np.float32), SR)
    words = [{"w": w["w"], "s": round(tmap(w["s"]) + lead, 3), "e": round(tmap(w["e"]) + lead, 3)} for w in words]
    write_words(reel, words)


async def tts(reel, voice, rate, pitch):
    import edge_tts
    text = (reel / "audio" / "script.txt").read_text(encoding="utf-8")
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    audio = bytearray()
    words = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            s = chunk["offset"] / 1e7
            e = s + chunk["duration"] / 1e7
            words.append({"w": chunk["text"], "s": s, "e": e})
    adir = reel / "audio"
    (adir / "voice_raw.mp3").write_bytes(bytes(audio))
    to_wav(adir / "voice_raw.mp3", adir / "voice_raw.wav")
    finish(reel, adir / "voice_raw.wav", words)


def from_file(reel, src):
    from faster_whisper import WhisperModel
    adir = reel / "audio"
    to_wav(src, adir / "voice_raw.wav")
    script = adir / "script.txt"
    prompt = re.sub(r"\[[^\]]*\]", "", script.read_text(encoding="utf-8")) if script.exists() else None
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(str(adir / "voice_raw.wav"), word_timestamps=True, initial_prompt=prompt, vad_filter=False)
    words = []
    for seg in segs:
        for w in seg.words:
            words.append({"w": w.word.strip(), "s": w.start, "e": w.end})
    finish(reel, adir / "voice_raw.wav", words)


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__)
        sys.exit(1)

    def opt(k, d):
        return a[a.index(k) + 1] if k in a else d

    reel = Path(a[1])
    (reel / "audio").mkdir(parents=True, exist_ok=True)
    OPTS["keep"] = float(opt("--keep", KEEP_PAUSE))
    OPTS["lead"] = float(opt("--lead", 0))
    if a[0] == "tts":
        asyncio.run(tts(reel, opt("--voice", "en-GB-RyanNeural"), opt("--rate", "+0%"), opt("--pitch", "+0Hz")))
    elif a[0] == "file":
        from_file(reel, Path(a[2]))
    else:
        print(__doc__)
