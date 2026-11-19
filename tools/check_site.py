#!/usr/bin/env python3
"""Pre-publish checks for this site.

Run from the project folder:
    python3 tools/check_site.py            (content rules, internal links, Reimagine link)
    python3 tools/check_site.py --online   (also tests every external link)

The banned patterns below are assembled from pieces so this file never contains
the literal strings it searches for.
"""
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_EXT = {".html", ".css", ".js", ".md", ".svg", ".txt", ".py", ".json", ".yml", ".yaml"}
SKIP_DIRS = {".git", "node_modules"}

LONG_DASH = chr(0x2014)
CONTENT_RULES = [
    ("long dash character", re.compile(LONG_DASH)),
    ("long dash HTML entity", re.compile("&" + "mdash;|&#" + "8212;|&#x" + "2014;", re.I)),
    ("long dash JS escape", re.compile(r"\\u" + "2014", re.I)),
    ("banned word (hon...ly)", re.compile(r"\bhon" + r"estly\b", re.I)),
    ("banned phrase (hallucination...free)", re.compile(r"hallucin" + r"ation[\s-]*free", re.I)),
    ("banned reference (I-C-D 203)", re.compile(r"\bIC" + r"D[\s-]*203\b", re.I)),
    ("pipeline detail (pass count)", re.compile(r"\b15\s+pas" + r"ses\b", re.I)),
    ("pipeline detail (sub agents)", re.compile(r"\bsub-?ag" + r"ents?\b", re.I)),
    ("pipeline detail (validation cards)", re.compile(r"\btest\s+ca" + r"rds?\b", re.I)),
    ("pipeline detail (event database scripts)", re.compile(r"\bGDE" + r"LT\b", re.I)),
    ("pipeline detail (prompt files)", re.compile(r"\bskill\s+pro" + r"mpts?\b", re.I)),
    ("pipeline detail (data file layouts)", re.compile(r"\bCSV\s+sche" + r"mas?\b", re.I)),
    ("phone number pattern", re.compile(r"(?<![\d.])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)")),
    ("full email address in plain text", re.compile(r"larson\.paulrichard" + "@", re.I)),
]

results = {"fail": [], "warn": [], "pass": []}


def rel(path):
    return os.path.relpath(path, ROOT)


def all_files():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            yield os.path.join(base, f)


# ---------------------------------------------------------------- content rules
def check_content():
    hits = 0
    for path in all_files():
        if os.path.splitext(path)[1].lower() not in SCAN_EXT:
            continue
        with open(path, encoding="utf-8", errors="replace") as fh:
            for n, line in enumerate(fh, 1):
                for label, rx in CONTENT_RULES:
                    if rx.search(line):
                        hits += 1
                        results["fail"].append(f"{label}: {rel(path)} line {n}")
    if not hits:
        results["pass"].append("Content rules: no long dashes, banned words, pipeline details, phone numbers, or plain-text email address")


# ---------------------------------------------------------------- internal links
class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids, self.base = [], set(), None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "base" and a.get("href"):
            self.base = a["href"]
        for key in ("href", "src"):
            if a.get(key):
                self.links.append(a[key])


def parse(path):
    p = LinkParser()
    with open(path, encoding="utf-8") as fh:
        p.feed(fh.read())
    return p


def check_links():
    html_files = [p for p in all_files() if p.endswith(".html")]
    parsed = {p: parse(p) for p in html_files}
    external, bad = set(), 0
    for path, p in parsed.items():
        for link in p.links:
            if link.startswith(("http://", "https://")):
                external.add(link)
                continue
            if link.startswith(("mailto:", "tel:", "data:", "javascript:")) or link == "#":
                continue
            target, _, frag = link.partition("#")
            target = target.split("?")[0]
            if p.base == "/" or target.startswith("/"):
                base_dir = ROOT
                target = target.lstrip("/")
            else:
                base_dir = os.path.dirname(path)
            dest = os.path.normpath(os.path.join(base_dir, target)) if target else path
            if not os.path.exists(dest):
                bad += 1
                results["fail"].append(f"Broken internal link in {rel(path)}: {link}")
                continue
            if frag and dest.endswith(".html"):
                ids = parsed[dest].ids if dest in parsed else parse(dest).ids
                if frag not in ids:
                    bad += 1
                    results["fail"].append(f"Missing anchor in {rel(path)}: {link}")
    if not bad:
        results["pass"].append(f"Internal links: all links and anchors resolve across {len(html_files)} HTML files")
    return external


# ---------------------------------------------------------------- config
def read_config():
    with open(os.path.join(ROOT, "site-config.js"), encoding="utf-8") as fh:
        return fh.read()


def config_value(src, key):
    m = re.search(key + r'\s*:\s*"([^"]*)"', src)
    return m.group(1) if m else None


def url_status(url):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0 (site link check)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:  # offline or DNS failure
        return f"unreachable ({e.__class__.__name__})"


def check_config(external, online):
    src = read_config()
    for key in ("seriesName", "youtubeUrl", "substackUrl", "linkedinUrl"):
        if not config_value(src, key):
            results["fail"].append(f"site-config.js: {key} is empty")
    for vid in re.findall(r'youtubeId\s*:\s*"([^"]*)"', src):
        if not re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
            results["fail"].append(f"site-config.js: youtubeId '{vid}' does not look like a YouTube video ID")
    config_urls = set(re.findall(r'"(https://[^"]+)"', src))
    config_urls |= {"https://www.youtube.com/watch?v=" + v for v in re.findall(r'youtubeId\s*:\s*"([^"]+)"', src)}
    external |= config_urls

    reimagine = config_value(src, "reimagineUrl")
    if not reimagine:
        results["warn"].append("Reimagine Task Force link is not set (reimagineUrl in site-config.js is empty), so the phrase shows as plain text")
    else:
        status = url_status(reimagine)
        if status == 200:
            results["pass"].append(f"Reimagine Task Force link resolves: {reimagine}")
        elif status in (401, 403, 429, 999) or not isinstance(status, int):
            results["warn"].append(f"Reimagine Task Force link could not be checked automatically ({status}); open it by hand: {reimagine}")
        else:
            results["fail"].append(f"Reimagine Task Force link returned {status}: {reimagine}")

    if online:
        for url in sorted(external):
            if "fonts.g" in url:
                continue
            status = url_status(url)
            if status == 200:
                results["pass"].append(f"External link OK: {url}")
            elif status in (401, 403, 429, 999) or not isinstance(status, int):
                results["warn"].append(f"External link could not be checked automatically ({status}, normal for LinkedIn and some news sites); open it by hand: {url}")
            else:
                results["warn"].append(f"External link returned {status}: {url}")
    else:
        results["warn"].append(f"{len(external)} external links not tested (run with --online to test them)")


def check_files():
    for name in ("index.html", "methodology.html", "briefings.html", "about.html", "contact.html", "site-config.js", ".nojekyll"):
        if not os.path.exists(os.path.join(ROOT, name)):
            results["fail"].append(f"Missing required file: {name}")


def main():
    online = "--online" in sys.argv
    check_files()
    check_content()
    external = check_links()
    check_config(external, online)
    for kind, label in (("pass", "PASS"), ("warn", "WARN"), ("fail", "FAIL")):
        for msg in results[kind]:
            print(f"{label}  {msg}")
    print()
    print(f"{len(results['pass'])} passed, {len(results['warn'])} warnings, {len(results['fail'])} failures")
    sys.exit(1 if results["fail"] else 0)


if __name__ == "__main__":
    main()
