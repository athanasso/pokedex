"""
Step 2 — Train EfficientNetV2B0 and export to TFLite
=====================================================
Optimized pipeline:
  • AdamW + CosineDecay learning rate schedule
  • Label Smoothing (0.1) — robust to noisy web-scraped labels
  • Dynamic-range quantization for smaller, faster TFLite model
  • Cache before augmentation so each epoch sees fresh random transforms

Usage:
    pip install tensorflow pillow numpy
    python 2_train_model.py

Output:
    model.tflite   ← copy to assets/model.tflite
    labels.json    ← copy to assets/labels.json
"""

import json
import os
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetV2B0
from tensorflow.keras.optimizers import AdamW
from tensorflow.keras.optimizers.schedules import CosineDecay
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.losses import CategoricalCrossentropy

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_DIR   = Path("dataset")
IMG_SIZE      = 224
BATCH_SIZE    = 32
EPOCHS_FROZEN = 10
EPOCHS_FINE   = 20
LEARNING_RATE = 1e-3
FINE_LR       = 1e-4         # Larger than before; CosineDecay handles the warmdown
VAL_SPLIT     = 0.15
SEED          = 42

# ── Resume config (set these to continue after Ctrl+C) ───────────────────────
RESUME             = False
RESUME_CHECKPOINT  = "best_weights.keras"
RESUME_PHASE       = 2       # 1 = frozen head, 2 = fine-tune
RESUME_EPOCH       = 0       # epoch number you stopped at
# ─────────────────────────────────────────────────────────────────────────────


def build_dataset(dataset_dir: Path):
    print("[1/4] Loading dataset...")

    # Skip hidden dirs (.config, .git, etc.) and junk folders
    class_names = sorted([
        d.name for d in dataset_dir.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    ])
    num_classes = len(class_names)
    print(f"  Classes found: {num_classes}")

    total = sum(
        len([f for f in (dataset_dir / c).iterdir()
             if f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.bmp')])
        for c in class_names
    )
    print(f"  Total images:  {total:,}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir, validation_split=VAL_SPLIT, subset="training",
        seed=SEED, image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE,
        label_mode="int", class_names=class_names,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir, validation_split=VAL_SPLIT, subset="validation",
        seed=SEED, image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE,
        label_mode="int", class_names=class_names,
    )

    # Convert sparse int labels → one-hot (required for label smoothing loss)
    def to_onehot(x, y):
        return x, tf.one_hot(y, depth=num_classes)

    # Augmentation applied AFTER caching so each epoch gets fresh randomness
    augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomBrightness(0.3),
        layers.RandomContrast(0.3),
    ])

    AUTOTUNE = tf.data.AUTOTUNE

    train_ds = (
        train_ds
        .map(to_onehot, num_parallel_calls=AUTOTUNE)
        .cache()                              # cache raw images first
        .shuffle(1000)
        .map(lambda x, y: (augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)
        .prefetch(AUTOTUNE)
    )
    val_ds = (
        val_ds
        .map(to_onehot, num_parallel_calls=AUTOTUNE)
        .cache()
        .prefetch(AUTOTUNE)
    )

    return train_ds, val_ds, class_names


def build_model(num_classes: int):
    print("[2/4] Building EfficientNetV2B0 model...")

    base = EfficientNetV2B0(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(512, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = Model(inputs, outputs)
    model.summary()
    return model, base


def train(model: Model, base_model, train_ds, val_ds, steps_per_epoch,
          start_phase: int = 1, start_epoch_p2: int = 0):
    """Two-phase training. start_phase/start_epoch_p2 for resume support."""

    loss_fn = CategoricalCrossentropy(label_smoothing=0.1)

    callbacks = [
        EarlyStopping(patience=6, restore_best_weights=True, monitor="val_loss"),
        ModelCheckpoint("best_weights.keras", save_best_only=True, monitor="val_loss"),
    ]

    # ── Phase 1: Train head only ───────────────────────────────────────────────
    if start_phase == 1:
        print(f"\n[3/4] Phase 1 — training head ({EPOCHS_FROZEN} epochs)...")
        schedule_1 = CosineDecay(LEARNING_RATE, decay_steps=EPOCHS_FROZEN * steps_per_epoch)
        model.compile(
            optimizer=AdamW(learning_rate=schedule_1, weight_decay=1e-4),
            loss=loss_fn,
            metrics=["accuracy"],
        )
        model.fit(train_ds, validation_data=val_ds,
                  epochs=EPOCHS_FROZEN, callbacks=callbacks)

    # ── Phase 2: Fine-tune top layers ─────────────────────────────────────────
    print(f"\n       Phase 2 — fine-tuning top layers ({EPOCHS_FINE} epochs)...")
    base_model.trainable = True
    for layer in base_model.layers[:-50]:
        layer.trainable = False

    schedule_2 = CosineDecay(FINE_LR, decay_steps=EPOCHS_FINE * steps_per_epoch)
    model.compile(
        optimizer=AdamW(learning_rate=schedule_2, weight_decay=1e-5),
        loss=loss_fn,
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds,
              epochs=EPOCHS_FINE,
              initial_epoch=start_epoch_p2,
              callbacks=callbacks)

    return model


def export_tflite(model: Model, output_path: str = "model.tflite"):
    print("\n[4/4] Exporting to TFLite (dynamic-range quantized)...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Dynamic-range quantization: weights → INT8, activations stay float32
    # Inputs/outputs remain float32 — no change needed in scanner.tsx
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    with open(output_path, "wb") as f:
        f.write(tflite_model)
    print(f"  Saved → {output_path} ({len(tflite_model) / 1e6:.1f} MB)")


def main():
    print("=" * 60)
    print("Pokémon Classifier Training (Optimized)")
    print(f"TensorFlow {tf.__version__}")
    gpu = tf.config.list_physical_devices("GPU")
    print(f"GPU: {[g.name for g in gpu] if gpu else 'None (CPU — will be slow!)'}")
    print("=" * 60)

    train_ds, val_ds, class_names = build_dataset(DATASET_DIR)
    num_classes   = len(class_names)
    steps_per_epoch = len(train_ds)

    with open("labels.json", "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"  Saved class list → labels.json ({num_classes} classes)")

    callbacks_shared = [
        EarlyStopping(patience=6, restore_best_weights=True, monitor="val_loss"),
        ModelCheckpoint("best_weights.keras", save_best_only=True, monitor="val_loss"),
    ]

    if RESUME and Path(RESUME_CHECKPOINT).exists():
        print(f"\n▶ Resuming from '{RESUME_CHECKPOINT}' (Phase {RESUME_PHASE}, epoch {RESUME_EPOCH})")
        model = tf.keras.models.load_model(RESUME_CHECKPOINT)
        base_model = next(
            (l for l in model.layers if isinstance(l, tf.keras.Model)), None
        )
        if base_model is None:
            raise ValueError("Could not find base model in checkpoint.")
        print(f"  Found base model: {base_model.name}")
        model = train(model, base_model, train_ds, val_ds, steps_per_epoch,
                      start_phase=RESUME_PHASE,
                      start_epoch_p2=RESUME_EPOCH if RESUME_PHASE == 2 else 0)
    else:
        model, base_model = build_model(num_classes)
        model = train(model, base_model, train_ds, val_ds, steps_per_epoch)

    export_tflite(model, "model.tflite")

    print()
    print("=" * 60)
    print("✅ Done! Next steps:")
    print("   1. copy model.tflite  → assets/model.tflite")
    print("   2. copy labels.json   → assets/labels.json")
    print("   3. npx expo run:android")
    print("=" * 60)


if __name__ == "__main__":
    main()
