#!/usr/bin/env python3
"""Fetch a URL, strip HTML, cache plain text under docs/v3-research/webcache/.
Usage: fetch_text.py URL [grep-regex ...]
Prints char count, plus matching lines (with 0-based offsets) if regexes given, else head.
"""
import hashlib, html, os, re, subprocess, sys

CACHE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "webcache")

def get(url):
    key = hashlib.sha1(url.encode()).hexdigest()[:16] + ".txt"
    p = os.path.join(CACHE, key)
    if not os.path.exists(p):
        raw = subprocess.run(["curl", "-sL", "--max-time", "45", "-A",
                              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", url],
                             capture_output=True).stdout.decode("utf-8", "ignore")
        if url.endswith(".md") or "<html" not in raw.lower()[:4000]:
            t = raw
        else:
            s = re.sub(r"<script.*?</script>", " ", raw, flags=re.S | re.I)
            s = re.sub(r"<style.*?</style>", " ", s, flags=re.S | re.I)
            s = re.sub(r"<(p|div|li|br|h[1-6]|tr|pre)[^>]*>", "\n", s, flags=re.I)
            t = html.unescape(re.sub(r"<[^>]+>", " ", s))
            t = re.sub(r"[ \t]+", " ", t)
            t = re.sub(r"\n\s*\n+", "\n", t)
        open(p, "w").write(t)
    return p, open(p).read()

if __name__ == "__main__":
    url = sys.argv[1]
    p, t = get(url)
    print(f"# {url}\n# cache={p} chars={len(t)}")
    pats = sys.argv[2:]
    if pats:
        lines = t.split("\n")
        for i, ln in enumerate(lines):
            for pat in pats:
                if re.search(pat, ln, re.I):
                    print(f"{i}: {ln.strip()[:1200]}")
                    break
    else:
        print(t[:4000])
