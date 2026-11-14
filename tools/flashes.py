"""flashes.py — detect one-frame flashes (a frame unlike both neighbours) in a rendered video.

    python tools/flashes.py reels/atm/ch1/render/video.mp4
"""
# find single-frame flashes in a video: frame i differs strongly from BOTH neighbours,
# while the neighbours are similar to each other (i.e. frame i is an outlier).
# usage: python flashes.py video.mp4 [offset_seconds]
import subprocess, sys
import numpy as np

path = sys.argv[1]
off = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
W, H = 96, 54
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
fps = 30.0
hits = []
for i in range(1, len(f) - 1):
    a = np.abs(f[i] - f[i - 1]).mean()
    b = np.abs(f[i + 1] - f[i]).mean()
    c = np.abs(f[i + 1] - f[i - 1]).mean()
    if min(a, b) > 12 and c < 0.45 * min(a, b):
        hits.append((i, a, b, c))
for i, a, b, c in hits:
    t = i / fps + off
    print(f"FLASH frame {i}  t={t:.2f}s ({int(t // 60)}:{t % 60:05.2f})  diff prev={a:.1f} next={b:.1f} prev-vs-next={c:.1f}")
print(f"{len(f)} frames, {len(hits)} flashes")
