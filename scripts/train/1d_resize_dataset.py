"""
Step 1d — Pre-resize all dataset images to 224×224
====================================================
Resizes every image in dataset/ to exactly 224×224 (MobileNetV2 input size).
This shrinks the zip from ~30 GB → ~2 GB with zero quality loss for training.

Run this BEFORE zipping.

Usage:
    py 1d_resize_dataset.py
"""

import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_DIR = Path("dataset")
IMG_SIZE    = 224
WORKERS     = 8
EXTS        = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
# ─────────────────────────────────────────────────────────────────────────────


def resize_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            # Skip if already the right size
            if img.size == (IMG_SIZE, IMG_SIZE):
                return False
            resized = img.convert("RGB").resize(
                (IMG_SIZE, IMG_SIZE), Image.LANCZOS
            )
        # Always save as PNG (consistent format, lossless)
        png_path = path.with_suffix(".png")
        resized.save(png_path, "PNG", optimize=True)
        # Remove original if it was a different format
        if path.suffix.lower() != ".png":
            path.unlink()
        return True
    except Exception as e:
        print(f"  ✗ {path.name}: {e}")
        return False


def main():
    if not DATASET_DIR.exists():
        print(f"ERROR: {DATASET_DIR} not found.")
        return

    # Collect all image files
    all_files = [
        f for f in DATASET_DIR.rglob("*")
        if f.is_file() and f.suffix.lower() in EXTS
    ]

    total = len(all_files)
    print("=" * 60)
    print(f"Resizing {total:,} images to {IMG_SIZE}×{IMG_SIZE}")
    print(f"Using {WORKERS} parallel workers")

    # Estimate size before
    size_before = sum(f.stat().st_size for f in all_files)
    print(f"Current size: {size_before / 1e9:.1f} GB")
    print("=" * 60)

    done = 0
    resized = 0

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(resize_image, f): f for f in all_files}
        for future in as_completed(futures):
            if future.result():
                resized += 1
            done += 1
            if done % 5000 == 0:
                print(f"  {done:,}/{total:,} processed…")

    # Estimate size after
    new_files = [
        f for f in DATASET_DIR.rglob("*.png")
    ]
    size_after = sum(f.stat().st_size for f in new_files)

    print()
    print("=" * 60)
    print(f"✅ Done! {resized:,} images resized")
    print(f"   Before: {size_before / 1e9:.1f} GB")
    print(f"   After:  {size_after / 1e9:.1f} GB")
    print(f"   Saved:  {(size_before - size_after) / 1e9:.1f} GB")
    print()
    print("Now zip:")
    print("  Compress-Archive -Path dataset -DestinationPath dataset.zip -Force")
    print("=" * 60)


if __name__ == "__main__":
    main()
