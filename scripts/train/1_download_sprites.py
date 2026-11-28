"""
Step 1 — Download Pokémon sprites
==================================
Downloads sprites for all 1,025 Pokémon from the PokeAPI sprites repo.
Each Pokémon gets up to 6 images (official art, default sprite, shiny,
female, shiny female variants) which are used as training data.

Run this on your local machine OR on Google Colab.

Usage:
    pip install requests pillow tqdm
    python 1_download_sprites.py

Output:
    dataset/
        bulbasaur/   ← folder per Pokémon (PokeAPI name)
            001.png
            002.png
            ...
        ivysaur/
            ...
"""

import os
import time
import json
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
from io import BytesIO

# ── Config ────────────────────────────────────────────────────────────────────
TOTAL_POKEMON = 1025          # Gens 1-9
DATASET_DIR   = Path("dataset")
LABELS_OUT    = Path("labels.json")
MAX_WORKERS   = 12            # parallel downloads
RESIZE_TO     = (224, 224)    # resize all images to model input size
# ─────────────────────────────────────────────────────────────────────────────

BASE_SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
SOURCES = [
    # Official artwork — highest quality, best for training
    "{base}/other/official-artwork/{id}.png",
    "{base}/other/official-artwork/shiny/{id}.png",
    # HOME 3D renders — most realistic, great variety
    "{base}/other/home/{id}.png",
    "{base}/other/home/shiny/{id}.png",
    "{base}/other/home/female/{id}.png",
    "{base}/other/home/shiny/female/{id}.png",
    # Default game sprites
    "{base}/{id}.png",
    "{base}/shiny/{id}.png",
    "{base}/female/{id}.png",
    "{base}/shiny/female/{id}.png",
    # Dream World SVG-based art (clean white bg, great for training)
    "{base}/other/dream-world/{id}.svg",
    # Showdown animated sprites (different art style)
    "{base}/versions/generation-v/black-white/animated/{id}.gif",
    # Gen 8 game sprites
    "{base}/versions/generation-viii/icons/{id}.png",
    # Older gen sprites (more variety = better generalization)
    "{base}/versions/generation-vii/ultra-sun-ultra-moon/{id}.png",
    "{base}/versions/generation-vii/ultra-sun-ultra-moon/shiny/{id}.png",
]


def fetch_pokemon_name(pokemon_id: int) -> str | None:
    """Fetch the canonical PokeAPI name for a given ID."""
    try:
        r = requests.get(
            f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}",
            timeout=10
        )
        if r.status_code == 200:
            return r.json()["name"]
    except Exception:
        pass
    return None


def download_image(url: str, save_path: Path) -> bool:
    """Download a single image, resize it, and save as PNG."""
    if save_path.exists():
        return True  # already downloaded
    try:
        r = requests.get(url, timeout=15)
        if r.status_code != 200:
            return False
        img = Image.open(BytesIO(r.content)).convert("RGB")
        img = img.resize(RESIZE_TO, Image.LANCZOS)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(save_path, "PNG")
        return True
    except Exception:
        return False


def process_pokemon(pokemon_id: int, name: str) -> int:
    """Download all sprite variants for one Pokémon. Returns saved count."""
    folder = DATASET_DIR / name
    folder.mkdir(parents=True, exist_ok=True)

    saved = 0
    for idx, template in enumerate(SOURCES):
        url = template.format(base=BASE_SPRITE, id=pokemon_id)
        dest = folder / f"{idx:02d}.png"
        if download_image(url, dest):
            saved += 1

    return saved


def main():
    print("=" * 60)
    print(f"Downloading sprites for {TOTAL_POKEMON} Pokémon...")
    print("=" * 60)

    # Step 1: Fetch all Pokémon names from PokeAPI
    print("\n[1/3] Fetching Pokémon names from PokeAPI...")
    names = {}  # id → name

    def fetch_name(pid):
        name = fetch_pokemon_name(pid)
        return pid, name

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(fetch_name, pid): pid for pid in range(1, TOTAL_POKEMON + 1)}
        done = 0
        for future in as_completed(futures):
            pid, name = future.result()
            if name:
                names[pid] = name
            done += 1
            if done % 100 == 0:
                print(f"  Fetched {done}/{TOTAL_POKEMON} names...")

    # Sort by ID and build labels list
    ordered = [names[i] for i in range(1, TOTAL_POKEMON + 1) if i in names]
    print(f"  Got {len(ordered)} Pokémon names.")

    # Save labels.json (copy to assets/ when done)
    with open(LABELS_OUT, "w") as f:
        json.dump(ordered, f, indent=2)
    print(f"  Saved labels → {LABELS_OUT}")

    # Step 2: Download sprites
    print(f"\n[2/3] Downloading sprites into {DATASET_DIR}/...")
    total_saved = 0
    done = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {
            ex.submit(process_pokemon, pid, name): name
            for pid, name in names.items()
        }
        for future in as_completed(futures):
            count = future.result()
            total_saved += count
            done += 1
            if done % 50 == 0:
                print(f"  {done}/{len(names)} Pokémon done, {total_saved} images saved...")
            time.sleep(0.01)  # small delay to be kind to GitHub CDN

    # Step 3: Summary
    print(f"\n[3/3] Done!")
    print(f"  Total Pokémon: {done}")
    print(f"  Total images:  {total_saved}")
    print(f"  Dataset dir:   {DATASET_DIR.absolute()}")
    print(f"  Labels file:   {LABELS_OUT.absolute()}")
    print()
    print("Next step → run:  python 2_train_model.py")


if __name__ == "__main__":
    main()
