"""assemble.py — join rendered chapters into one long video with a single continuous music bed.

    python tools/assemble.py reels/phonecall ch1 ch2 ch3 ch4 ch5 ch6 ch7

Each chapter needs render/video.mp4 (silent, 30 fps), render/cues.json and audio/voice.wav.
Output: <project>/final.mp4 (1080p30, AAC, -14 LUFS)
"""
import os
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
import mix  # noqa: E402
import music  # noqa: E402

SR = 48000


def main(project: Path, chapters):
    voice_parts, fx_parts, videos, total = [], [], [], 0.0
    for ch in chapters:
        d = project / ch
        meta = json.loads((d / "render" / "cues.json").read_text())
        dur = meta["duration"]
        n = int(round(dur * SR))
        v = mix.load(d / "audio" / "voice.wav", n)
        fx = np.zeros((n, 2))
        for c in meta["cues"]:
            x = mix.get_sfx(c) * c.get("gain", 0.4) * 0.8
            i = int(c["t"] * SR)
            if i >= n:
                continue
            m = min(len(x), n - i)
            pan = c.get("pan", 0.0)
            fx[i:i + m, 0] += x[:m] * np.sqrt(0.5 * (1 - pan))
            fx[i:i + m, 1] += x[:m] * np.sqrt(0.5 * (1 + pan))
        voice_parts.append(v)
        fx_parts.append(fx)
        videos.append(d / "render" / "video.mp4")
        total += n / SR
        print(f"{ch}: {dur:.2f} s, {len(meta['cues'])} cues")
    voice = np.concatenate(voice_parts)
    fx = np.concatenate(fx_parts)
    N = len(voice)
    print(f"total {N / SR:.1f} s")

    preset = getattr(music, os.environ.get("MUSIC_PRESET", "explainer"))
    mus = preset(N / SR, N / SR / 2, N / SR - 4.0)
    mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
    mus = mus * 0.30
    env = mix.follower(voice)
    nz = env[env > 1e-4]
    env = np.clip(env / (np.percentile(nz, 90) if len(nz) else 1), 0, 1)
    mus *= (1 - 0.6 * env)[:, None]
    t = np.arange(N) / SR
    mus *= (np.clip(t / 1.0, 0, 1) * np.clip((N / SR - t) / 3.0, 0, 1))[:, None]

    out = voice + fx + mus
    out = out / (np.max(np.abs(out)) or 1) * 0.98
    out = np.tanh(out * 1.3) / np.tanh(1.3)
    wav = project / "mix_all.wav"
    sf.write(wav, out.astype(np.float32), SR, subtype="FLOAT")

    lst = project / "videos.txt"
    lst.write_text("\n".join(f"file '{p.resolve().as_posix()}'" for p in videos))
    joined = project / "video_all.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
    final = project / "final.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(joined), "-i", str(wav),
                    "-filter:a", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", "48000",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(final)], check=True)
    print("wrote", final)


if __name__ == "__main__":
    main(Path(sys.argv[1]), sys.argv[2:])
