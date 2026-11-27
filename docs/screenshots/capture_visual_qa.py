"""Screenshot + visual QA otomatis untuk virtour360.

Menjalankan Chrome headless lewat Playwright, mengambil screenshot tiap rute
dalam dark/light (desktop + mobile), lalu mengukur kontras, overflow, gambar rusak,
konsol error, dan statistik piksel. Output: PNG + qa-report.json + qa-report.md.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from statistics import pstdev

from PIL import Image, ImageFilter, ImageStat
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
OUT = Path(__file__).resolve().parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
EMAIL = "awe@gmail.com"
PASSWORD = "asdasd123"

DOM_METRICS = r"""JSON.stringify((() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const parse = c => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return {r:d[0], g:d[1], b:d[2], a:d[3] / 255};
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b);
  };
  const bgOf = el => {
    let e = el;
    while (e) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0.5) return c;
      e = e.parentElement;
    }
    return {r:255, g:255, b:255, a:1};
  };
  const nodes = [...document.querySelectorAll('h1,h2,h3,p,span,button,a,li')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && e.textContent.trim().length > 2; });
  const low = [];
  for (const e of nodes) {
    const cs = getComputedStyle(e);
    const fg = parse(cs.color);
    const bg = bgOf(e);
    if (!fg) continue;
    const a = lum(fg), b = lum(bg);
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    if (ratio < 3) low.push({text:e.textContent.trim().slice(0, 34), ratio:+ratio.toFixed(2)});
  }
  return {
    h1: document.querySelector('h1')?.innerText.slice(0, 60) || null,
    theme: document.documentElement.dataset.theme || null,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brokenImages: [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length,
    textNodes: nodes.length,
    lowContrast: low.sort((a, b) => a.ratio - b.ratio).slice(0, 5),
    lowContrastCount: low.length,
  };
})())"""


def image_metrics(path: Path) -> dict:
    with Image.open(path) as im:
        rgb = im.convert("RGB")
        thumb = rgb.resize((min(320, rgb.width), min(320, rgb.height)))
        gray = thumb.convert("L")
        hist = gray.histogram()
        total = sum(hist)
        mean = sum(i * n for i, n in enumerate(hist)) / total
        dark = sum(hist[:60]) / total
        light = sum(hist[190:]) / total
        edges = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).mean[0]
        # Standar deviasi manual supaya tidak bergantung numpy.
        pixels = list(gray.getdata())
        avg = sum(pixels) / len(pixels)
        sd = math.sqrt(sum((p - avg) ** 2 for p in pixels) / len(pixels))
        return {
            "width": rgb.width,
            "height": rgb.height,
            "meanLuma": round(mean, 1),
            "darkPixelPct": round(dark * 100, 1),
            "lightPixelPct": round(light * 100, 1),
            "lumaStdDev": round(sd, 1),
            "edgeDensity": round(edges, 2),
            "uniqueColors": len(rgb.getcolors(rgb.width * rgb.height) or []),
        }


def make_context(browser, theme: str, width: int, height: int):
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,
        color_scheme="dark" if theme == "dark" else "light",
    )
    context.add_init_script(
        f"try {{ localStorage.setItem('virtour360.theme', '{theme}'); }} catch (e) {{}}"
    )
    return context


def capture(page, name: str, results: list, errors: list) -> dict:
    metrics = json.loads(page.evaluate(DOM_METRICS))
    path = OUT / f"{name}.png"
    page.screenshot(path=str(path), full_page=False)
    visual = image_metrics(path)
    result = {
        "name": name,
        "file": path.name,
        "url": page.url,
        "dom": metrics,
        "image": visual,
        "consoleErrors": errors[:],
    }
    errors.clear()
    results.append(result)
    print(f"captured {name}: luma={visual['meanLuma']} overflow={metrics['overflowX']} errors={len(result['consoleErrors'])}")
    return result


def watch(page, errors: list) -> None:
    page.on("console", lambda msg: errors.append(msg.text[:180]) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(str(err)[:180]))


def login_and_project(page) -> None:
    page.goto(f"{BASE}/#/login", wait_until="domcontentloaded")
    page.wait_for_timeout(900)
    page.get_by_role("button", name="Continue with email").click()
    page.get_by_placeholder("Email").fill(EMAIL)
    page.get_by_placeholder("Password").fill(PASSWORD)
    page.get_by_role("button", name="Masuk").click()
    page.wait_for_timeout(2600)
    page.goto(f"{BASE}/#/dashboard", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    if page.get_by_role("button", name="Buat Project pertama").count():
        page.get_by_role("button", name="Buat Project pertama").click()
    elif page.get_by_role("button", name="New Project", exact=True).count():
        page.get_by_role("button", name="New Project", exact=True).click()
    page.wait_for_timeout(350)
    page.get_by_placeholder("Contoh: The Gallery").fill("Screenshot QA")
    page.get_by_role("button", name="Buat & buka Studio").click()
    page.wait_for_timeout(1600)


def main() -> None:
    results: list[dict] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox"])

        for theme in ("dark", "light"):
            context = make_context(browser, theme, 1280, 900)
            page = context.new_page()
            errors: list[str] = []
            watch(page, errors)

            plain = ["home", "resources", "resources/terms", "customers"]
            for route in plain:
                page.goto(f"{BASE}/#/{route}", wait_until="domcontentloaded")
                page.wait_for_timeout(1500)
                capture(page, f"desktop-{theme}-{route.replace('/', '-')}", results, errors)

            page.goto(f"{BASE}/#/resources/documentation", wait_until="domcontentloaded")
            page.wait_for_timeout(1200)
            page.get_by_role("button", name="Pasang hotspot" if theme == "dark" else "Publish link").click()
            page.wait_for_timeout(400)
            capture(page, f"desktop-{theme}-documentation-workflow", results, errors)

            page.goto(f"{BASE}/#/resources/hotspot-guide", wait_until="domcontentloaded")
            page.wait_for_timeout(1200)
            page.locator("article").get_by_role("button", name="Product" if theme == "dark" else "Video", exact=True).click()
            page.wait_for_timeout(400)
            capture(page, f"desktop-{theme}-hotspot-guide-demo", results, errors)

            login_and_project(page)
            page.goto(f"{BASE}/#/dashboard", wait_until="domcontentloaded")
            page.wait_for_timeout(1400)
            capture(page, f"desktop-{theme}-dashboard", results, errors)
            page.goto(f"{BASE}/#/u/awe-ea8520", wait_until="domcontentloaded")
            page.wait_for_timeout(1600)
            capture(page, f"desktop-{theme}-profile", results, errors)
            page.goto(f"{BASE}/#/studio", wait_until="domcontentloaded")
            page.wait_for_timeout(1400)
            page.get_by_role("button", name="Published", exact=True).click()
            page.wait_for_timeout(700)
            capture(page, f"desktop-{theme}-publish-modal", results, errors)
            context.close()

        # Mobile: memakai viewport nyata supaya breakpoint Tailwind benar-benar aktif.
        for theme in ("dark", "light"):
            context = make_context(browser, theme, 390, 844)
            page = context.new_page()
            errors = []
            watch(page, errors)
            for route in ("home", "resources/documentation", "resources/hotspot-guide", "customers"):
                page.goto(f"{BASE}/#/{route}", wait_until="domcontentloaded")
                page.wait_for_timeout(1400)
                capture(page, f"mobile-{theme}-{route.replace('/', '-')}", results, errors)
            context.close()

        browser.close()

    flags = []
    for r in results:
        expected_min = 150 if "-light" in r["name"] else 5
        expected_max = 250 if "-light" in r["name"] else 90
        if r["image"]["meanLuma"] < expected_min or r["image"]["meanLuma"] > expected_max:
            flags.append(f"{r['name']}: luminansi rata-rata {r['image']['meanLuma']} di luar rentang tema")
        if r["dom"]["overflowX"] > 0:
            flags.append(f"{r['name']}: overflow horizontal {r['dom']['overflowX']}px")
        if r["dom"]["brokenImages"]:
            flags.append(f"{r['name']}: {r['dom']['brokenImages']} gambar rusak")
        if r["dom"]["lowContrastCount"]:
            flags.append(f"{r['name']}: {r['dom']['lowContrastCount']} teks kontras < 3:1")
        if r["consoleErrors"]:
            flags.append(f"{r['name']}: {len(r['consoleErrors'])} error konsol")

    report = {"generatedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"), "base": BASE, "screenshots": results, "flags": flags}
    (OUT / "qa-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Screenshot & Visual QA — virtour360",
        "",
        f"Dibuat: {report['generatedAt']} · sumber: `{BASE}` · {len(results)} screenshot.",
        "",
        "Screenshot diambil dengan Chrome headless (Playwright) pada viewport desktop 1280×900 dan mobile 390×844.",
        "Setiap rute diukur untuk luminansi, kontras teks, overflow horizontal, gambar rusak, dan error konsol.",
        "",
        "## Ringkasan",
        "",
        f"- Screenshot: **{len(results)}** file PNG.",
        f"- Flag visual/teknis: **{len(flags)}**" + ("." if not flags else ":"),
    ]
    lines += [f"  - {f}" for f in flags]
    lines += [
        "",
        "## Detail per screenshot",
        "",
        "| File | Tema | H1 | Luma | Luma SD | Teks <3:1 | Overflow | Gambar rusak | Console error |",
        "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for r in results:
        theme = "light" if "-light-" in r["name"] else "dark"
        h1 = (r["dom"]["h1"] or "—").replace("|", "/")
        lines.append(
            f"| `{r['file']}` | {theme} | {h1[:44]} | {r['image']['meanLuma']} | {r['image']['lumaStdDev']} | "
            f"{r['dom']['lowContrastCount']} | {r['dom']['overflowX']}px | {r['dom']['brokenImages']} | {len(r['consoleErrors'])} |"
        )
    lines += ["", "Flag tidak selalu berarti gagal; setiap flag perlu diverifikasi manual pada PNG terkait.", ""]
    (OUT / "qa-report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"\nDONE: {len(results)} screenshots, {len(flags)} flags -> {OUT / 'qa-report.md'}")


if __name__ == "__main__":
    main()
