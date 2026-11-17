"""srt_join.py — one caption file for a multi-chapter video.
    python tools/srt_join.py reels/plane ch1 ch2 ch3 ch4 ch5  ->  reels/plane/captions.srt
Runs srt.py per chapter, then shifts each chapter by the rendered length of the chapters before it."""
import subprocess, sys
from pathlib import Path
reel, chs = Path(sys.argv[1]), sys.argv[2:]
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())
def p2(s): h, m, r = s.split(":"); s2, ms = r.split(","); return int(h) * 3600 + int(m) * 60 + int(s2) + int(ms) / 1000
def f2(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)) % 1000:03}"
off, out, n = 0.0, [], 0
for c in chs:
    d = reel / c
    subprocess.run([sys.executable, str(Path(__file__).with_name("srt.py")), str(d)], check=True, capture_output=True)
    for blk in (d / "render/captions.srt").read_text(encoding="utf8").strip().split("\n\n"):
        L = blk.split("\n"); a, b = L[1].split(" --> "); n += 1
        out.append(f"{n}\n{f2(p2(a) + off)} --> {f2(p2(b) + off)}\n" + "\n".join(L[2:]) + "\n")
    off += dur(d / "render/video.mp4")
(reel / "captions.srt").write_text("\n".join(out), encoding="utf8")
print(reel.name, n, "cues", round(off, 1), "s")
