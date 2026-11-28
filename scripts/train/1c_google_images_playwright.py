"""
Step 1c — Fast Google Images downloader (async Playwright)
===========================================================
Uses asyncio + async Playwright so multiple browser pages run truly in
parallel without thread-safety issues.

Install (one time):
    py -m pip install playwright pillow requests
    py -m playwright install chromium

Usage:
    py 1c_google_images_playwright.py
"""

import asyncio
import json
import re
import io
import time
import random
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("ERROR:\n  py -m pip install playwright\n  py -m playwright install chromium")
    exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
LABELS_FILE        = Path("labels.json")
DATASET_DIR        = Path("dataset")
IMAGES_PER_POKEMON = 40
START_FROM         = 0
PARALLEL_PAGES     = 4       # lower = less likely to trigger rate limits
DOWNLOAD_WORKERS   = 16
REQUEST_TIMEOUT    = 6
MIN_SIZE           = 80
HEADLESS           = False   # ← watch the browser to see if blocked
DEBUG_HTML         = True    # prints page snippet when 0 results found
RUN_ONLY           = []  # ← set to [] to run all from START_FROM
# ─────────────────────────────────────────────────────────────────────────────

# Patches injected into every new page before any navigation.
# Removes all headless-Chrome fingerprinting signals.
STEALTH_JS = """
// Remove webdriver flag
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
// Fake plugins (real Chrome has many)
Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
// Fake languages
Object.defineProperty(navigator, 'languages', {get: () => ['en-US','en']});
// Add chrome object that headless Chrome is missing
window.chrome = {runtime: {}};
// Fake permission query
const origQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (params) => (
  params.name === 'notifications'
    ? Promise.resolve({state: Notification.permission})
    : origQuery(params)
);
"""

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}

# Shared thread pool for image downloads (CPU/IO bound — kept outside async)
_dl_pool = ThreadPoolExecutor(max_workers=DOWNLOAD_WORKERS)
# Progress counter
_done = 0
_total_saved = 0
_label_count = 0


def extract_image_urls(html: str, count: int) -> list[str]:
    """
    Google embeds original image URLs as  "ou":"<url>"  in the page source.
    Extract them without ever clicking a thumbnail.
    """
    urls = re.findall(r'"ou":"(https?://[^"]+)"', html)

    # Fallback: bare https image URLs that look like full-size originals
    if len(urls) < count // 2:
        extra = re.findall(
            r'"(https?://(?!encrypted)[^"]{60,}\.(?:jpg|jpeg|png|webp))(?:"|\?)',
            html
        )
        seen = set(urls)
        for u in extra:
            if u not in seen:
                urls.append(u)
                seen.add(u)

    # Drop google/gstatic proxy URLs (thumbnails)
    clean = [u for u in urls if "gstatic.com" not in u and "google.com" not in u]
    return clean[:count]


def _download_one(url: str, dest: Path) -> bool:
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers=HEADERS)
        if resp.status_code != 200:
            return False
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        if img.width < MIN_SIZE or img.height < MIN_SIZE:
            return False
        img.save(dest, "PNG")
        return True
    except Exception:
        return False


async def download_all_async(urls: list[str], folder: Path, existing: int) -> int:
    """Schedule all image downloads in the thread pool, await results."""
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(
            _dl_pool,
            _download_one,
            url,
            folder / f"goog_{existing + i:04d}.png",
        )
        for i, url in enumerate(urls)
    ]
    results = await asyncio.gather(*tasks)
    return sum(results)


async def fetch_google(page, name: str) -> list[str]:
    """Load Google Images for one Pokémon and extract original-size URLs."""
    query = f"{name} pokemon"
    url = (
        f"https://www.google.com/search"
        f"?q={query.replace(' ', '+')}&tbm=isch&safe=off&num=100"
    )
    try:
        await page.goto(url, timeout=20000)
        await page.wait_for_load_state("domcontentloaded")
        await page.keyboard.press("End")
        await asyncio.sleep(1.0)
        await page.keyboard.press("End")
        await asyncio.sleep(0.8)
        html = await page.content()
        urls = extract_image_urls(html, IMAGES_PER_POKEMON)
        if not urls and DEBUG_HTML:
            snippet = html[:800].replace('\n', ' ')
            print(f"    [DEBUG google/{name}] 0 urls. Page snippet:\n    {snippet}\n")
        return urls
    except Exception as e:
        print(f"    [google/{name}] error: {e}")
        return []


async def fetch_bing(page, name: str) -> list[str]:
    """Search Bing Images, wait for JS to render, extract URLs from DOM."""
    query = f"{name} pokemon"
    url = (
        f"https://www.bing.com/images/search"
        f"?q={query.replace(' ', '+')}&count=80&form=HDRSC2"
    )
    try:
        await page.goto(url, timeout=20000)
        # Bing loads images via JS — wait for the image grid to appear
        try:
            await page.wait_for_selector('a.iusc', timeout=8000)
        except Exception:
            pass  # continue anyway, maybe some loaded

        # Scroll to load more images
        await page.keyboard.press("End")
        await asyncio.sleep(1.2)
        await page.keyboard.press("End")
        await asyncio.sleep(0.8)

        # Extract imgurl from each link's 'm' attribute (JSON-encoded)
        urls = await page.evaluate("""
            () => {
                const links = document.querySelectorAll('a.iusc');
                return Array.from(links).map(a => {
                    try {
                        const m = JSON.parse(a.getAttribute('m'));
                        return m.imgurl || m.murl || null;
                    } catch { return null; }
                }).filter(u => u && u.startsWith('http'));
            }
        """)

        if not urls and DEBUG_HTML:
            snippet = (await page.content())[:600].replace('\n', ' ')
            print(f"    [DEBUG bing/{name}] 0 links found. Snippet:\n    {snippet}\n")

        return urls[:IMAGES_PER_POKEMON]

    except Exception as e:
        print(f"    [bing/{name}] error: {e}")
        return []

async def fetch_pokemon(sem: asyncio.Semaphore, page, idx: int, name: str, total: int):
    global _done, _total_saved

    async with sem:
        folder = DATASET_DIR / name
        folder.mkdir(parents=True, exist_ok=True)
        existing = len(list(folder.glob("*.*")))

        # Google is IP-blocked for automation — use Bing directly
        urls = await fetch_bing(page, name)
        source = "Bing" if urls else "--"

        saved = await download_all_async(urls, folder, existing) if urls else 0

        _done += 1
        _total_saved += saved
        print(f"  [{_done}/{total}] {name}: {saved} saved [{source}]  (total: {_total_saved})")

        await asyncio.sleep(random.uniform(0.8, 1.8))


async def accept_consent(page):
    try:
        await page.goto("https://www.google.com", timeout=10000)
        await asyncio.sleep(1.5)
        for text in ["Accept all", "I agree", "Agree", "Reject all"]:
            btn = page.locator(f"button:has-text('{text}')")
            if await btn.count() > 0:
                await btn.first.click()
                await asyncio.sleep(1)
                break
    except Exception:
        pass


async def main():
    global _label_count

    if not LABELS_FILE.exists():
        print(f"ERROR: {LABELS_FILE} not found. Run 1_download_sprites.py first.")
        return

    with open(LABELS_FILE) as f:
        labels = json.load(f)

    remaining = [
        (i, name) for i, name in enumerate(labels)
        if (not RUN_ONLY and i >= START_FROM) or (RUN_ONLY and name in RUN_ONLY)
    ]
    _label_count = len(labels)

    print("=" * 60)
    print(f"Google Images scraper — {len(remaining)} Pokémon")
    print(f"Parallel pages: {PARALLEL_PAGES} | Download threads: {DOWNLOAD_WORKERS}")
    print(f"Target: {IMAGES_PER_POKEMON} images/Pokémon | Headless: {HEADLESS}")
    est = len(remaining) * 2 // PARALLEL_PAGES // 60
    print(f"Estimated time: ~{est} min")
    print("=" * 60)

    sem = asyncio.Semaphore(PARALLEL_PAGES)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=HEADLESS,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )

        # One persistent context + page per parallel slot
        pages = []
        for _ in range(PARALLEL_PAGES):
            ctx = await browser.new_context(
                user_agent=HEADERS["User-Agent"],
                viewport={"width": 1280, "height": 800},
                locale="en-US",
                # Extra headers to look more like a real browser
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
            )
            p = await ctx.new_page()
            # Inject stealth patches before ANY navigation
            await p.add_init_script(STEALTH_JS)
            await accept_consent(p)
            pages.append(p)

        # Assign pages round-robin to each task
        tasks = [
            fetch_pokemon(
                sem,
                pages[i % PARALLEL_PAGES],
                idx,
                name,
                len(remaining),
            )
            for i, (idx, name) in enumerate(remaining)
        ]

        await asyncio.gather(*tasks)

        for p in pages:
            try:
                await p.close()
            except Exception:
                pass
        await browser.close()

    print()
    print("=" * 60)
    print(f"✅ Done! {_total_saved} images downloaded from Google")
    print()
    print("Next — zip and retrain on Colab:")
    print("  Compress-Archive -Path dataset -DestinationPath dataset.zip -Force")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
