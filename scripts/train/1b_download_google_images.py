"""
Step 1b — Download extra Pokémon images from reliable CDNs
===========================================================
Uses pokemondb.net, pokemon.com, and other known CDN sources.
No scraping, no search engines, no API keys — just direct URLs.

Adds ~12–18 new images per Pokémon on top of the sprites from step 1.

Install deps (same as step 1):
    py -m pip install requests pillow

Usage:
    py 1b_download_google_images.py
"""

import json
import io
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────────
LABELS_FILE     = Path("labels.json")
DATASET_DIR     = Path("dataset")
MAX_WORKERS     = 12
REQUEST_TIMEOUT = 10
MIN_SIZE        = 64
# ─────────────────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
}

# Sources using Pokémon name (lowercase with hyphens — matches PokeAPI format)
NAME_SOURCES = [
    # PokemonDB artwork (high quality, official art)
    "https://img.pokemondb.net/artwork/large/{name}.jpg",
    # PokemonDB HOME sprites (3D renders, great for training)
    "https://img.pokemondb.net/sprites/home/normal/{name}.png",
    "https://img.pokemondb.net/sprites/home/shiny/{name}.png",
    "https://img.pokemondb.net/sprites/home/normal/female/{name}.png",
    # Scarlet/Violet sprites
    "https://img.pokemondb.net/sprites/scarlet-violet/normal/{name}.png",
    "https://img.pokemondb.net/sprites/scarlet-violet/shiny/{name}.png",
    # Sword/Shield sprites
    "https://img.pokemondb.net/sprites/sword-shield/normal/{name}.png",
    "https://img.pokemondb.net/sprites/sword-shield/shiny/{name}.png",
    # Animated Black/White sprites (great variety)
    "https://img.pokemondb.net/sprites/black-white/anim/normal/{name}.gif",
    "https://img.pokemondb.net/sprites/black-white/anim/shiny/{name}.gif",
    # X/Y sprites
    "https://img.pokemondb.net/sprites/x-y/normal/{name}.png",
    "https://img.pokemondb.net/sprites/x-y/shiny/{name}.png",
    # HeartGold/SoulSilver
    "https://img.pokemondb.net/sprites/heartgold-soulsilver/normal/{name}.png",
    "https://img.pokemondb.net/sprites/heartgold-soulsilver/shiny/{name}.png",
    # Ruby/Sapphire
    "https://img.pokemondb.net/sprites/ruby-sapphire/normal/{name}.png",
]

# Sources using numeric Pokémon ID (padded to 3 digits)
ID_SOURCES = [
    # Official Pokémon.com full artwork
    "https://assets.pokemon.com/assets/cms2/img/pokedex/full/{id:03d}.png",
    # Official Pokémon.com detail artwork
    "https://assets.pokemon.com/assets/cms2/img/pokedex/detail/{id:03d}.png",
]


def download_image(url: str, dest: Path) -> bool:
    """Download one URL → save as PNG. Returns True on success."""
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


def process_pokemon(pokemon_id: int, name: str) -> int:
    folder = DATASET_DIR / name
    folder.mkdir(parents=True, exist_ok=True)

    existing_files = set(f.name for f in folder.iterdir() if f.is_file())
    saved = 0

    # Build all candidate URLs
    urls = []
    for template in NAME_SOURCES:
        urls.append(template.format(name=name))
    for template in ID_SOURCES:
        urls.append(template.format(id=pokemon_id))

    for i, url in enumerate(urls):
        dest = folder / f"cdn_{i:03d}.png"
        if dest.name in existing_files:
            continue  # already downloaded
        if download_image(url, dest):
            saved += 1

    return saved


def main():
    if not LABELS_FILE.exists():
        print(f"ERROR: {LABELS_FILE} not found. Run 1_download_sprites.py first.")
        return

    with open(LABELS_FILE) as f:
        labels = json.load(f)

    print("=" * 60)
    print(f"Downloading CDN images for {len(labels)} Pokémon")
    print("Sources: pokemondb.net + pokemon.com (no scraping, no API key)")
    print(f"~{len(NAME_SOURCES) + len(ID_SOURCES)} images per Pokémon")
    print("=" * 60)

    total_saved = 0
    done = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {
            ex.submit(process_pokemon, idx + 1, name): name
            for idx, name in enumerate(labels)
        }
        for future in as_completed(futures):
            name = futures[future]
            count = future.result()
            total_saved += count
            done += 1
            if done % 50 == 0 or done == len(labels):
                print(f"  [{done}/{len(labels)}] {total_saved} images so far…")
            time.sleep(0.01)

    print()
    print("=" * 60)
    print(f"✅ Done!  {total_saved} new images downloaded")
    print()
    # Show per-pokemon totals
    total_in_dataset = 0
    for name in labels:
        folder = DATASET_DIR / name
        if folder.exists():
            total_in_dataset += len(list(folder.glob("*.*")))
    print(f"   Total images in dataset now: {total_in_dataset}")
    print(f"   Avg per Pokémon: {total_in_dataset // len(labels)}")
    print()
    print("Next steps:")
    print("  Compress-Archive -Path dataset -DestinationPath dataset.zip -Force")
    print("  → Upload to Google Colab and run 2_train_model.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
