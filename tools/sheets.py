"""sheets.py — combine a reel's stills into 2x2 contact sheets for review.

    python tools/sheets.py reels/meter   -> reels/meter/render/sheets/sheetN.jpg
"""
import subprocess
import sys
from pathlib import Path

reel = Path(sys.argv[1])
stills = sorted((reel / "render" / "stills").glob("*.jpg"))
out = reel / "render" / "sheets"
out.mkdir(parents=True, exist_ok=True)
for old in out.glob("sheet*.jpg"):
    old.unlink()
for n in range(0, len(stills), 4):
    group = stills[n:n + 4]
    while len(group) < 4:
        group.append(group[-1])
    args, parts = [], []
    for i, p in enumerate(group):
        args += ["-i", str(p)]
        label = p.stem.replace(":", "")
        parts.append(f"[{i}]scale=960:540,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{label}':x=10:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black[v{i}]")
    fc = ";".join(parts) + ";[v0][v1]hstack[t];[v2][v3]hstack[u];[t][u]vstack"
    dst = out / f"sheet{n // 4}.jpg"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args, "-filter_complex", fc, "-q:v", "3", str(dst)], check=True)
    print(dst)
