"""srt.py — exact YouTube captions from a chapter's words.js (and the script text for punctuation).
    python tools/srt.py reels/rocket/ch1  ->  reels/rocket/ch1/render/captions.srt"""
import json, re, sys
from pathlib import Path
d = Path(sys.argv[1])
W = json.loads(re.search(r"=\s*(\[.*\])", (d / "words.js").read_text(encoding="utf8"), re.S).group(1))
toks = (d / "audio/script.txt").read_text(encoding="utf8").split()
words = [dict(w, t=toks[i] if i < len(toks) else w["w"]) for i, w in enumerate(W)] if len(toks) == len(W) else [dict(w, t=w["w"]) for w in W]
def ts(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)) % 1000:03}"
cues, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    gap = words[i + 1]["s"] - w["e"] if i + 1 < len(words) else 9
    if len(" ".join(x["t"] for x in cur)) > 38 or w["t"][-1] in ".?!" or gap > 0.6 or i == len(words) - 1:
        cues.append(cur); cur = []
out = [f"{n + 1}\n{ts(c[0]['s'])} --> {ts(min(max(c[-1]['e'], c[0]['s'] + 0.8), cues[n + 1][0]['s'] - 0.02) if n + 1 < len(cues) else max(c[-1]['e'], c[0]['s'] + 0.8))}\n{' '.join(x['t'] for x in c)}\n" for n, c in enumerate(cues)]
(d / "render").mkdir(exist_ok=True); (d / "render/captions.srt").write_text("\n".join(out), encoding="utf8")
print(len(cues), "cues")
