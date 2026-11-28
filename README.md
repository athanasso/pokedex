# 🔴 Pokédex App

A beautiful, high-performance Pokédex built with **React Native (Expo)** featuring an **on-device AI Pokémon scanner** that identifies Pokémon using your camera — no internet required at scan time.

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![TFLite](https://img.shields.io/badge/TFLite-On--device%20AI-orange)

---

## ✨ Features

### Pokédex
- **📱 Home Screen** — Grid of all 1,025 Pokémon with type badges and shiny toggle
- **♾️ Infinite Scroll** — Smooth loading with FlashList
- **🔍 Search** — By name in real time
- **🏷️ Filters** — By Type (Fire, Water…) and Region (Kanto, Johto…)
- **📄 Details Screen** — Official artwork, base stats with animated bars, evolution chain, moves, abilities
- **🎨 Dynamic Theming** — Background colors adapt to each Pokémon's primary type

### Pokéscanner 🎯
- **📷 On-device AI** — Runs a custom-trained MobileNetV2 TFLite model locally
- **⚡ Real-time scanning** — Processes camera frames every 0.8s using `react-native-vision-camera`
- **🗳️ Multi-frame voting** — Accumulates scores across 5 frames for reliable results
- **🔴 Pokéball button** — Tap to force an instant scan, or let it auto-scan
- **➡️ Auto-navigate** — Automatically opens the Pokédex entry 1.5s after detection

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router |
| Camera | react-native-vision-camera |
| On-device AI | react-native-fast-tflite (MobileNetV2) |
| Frame processing | vision-camera-resize-plugin |
| Worklets | react-native-worklets-core |
| Data fetching | PokeAPI (REST) |
| Type safety | TypeScript |

---

## 📁 Project Structure

```
pokedex/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Home screen (Pokémon grid + Pokéball FAB)
│   ├── scanner.tsx          # AI Pokéscanner screen
│   └── pokemon/
│       └── [id].tsx         # Pokémon details screen
├── assets/
│   ├── model.tflite         # Custom-trained MobileNetV2 (1,025 classes)
│   └── labels.json          # 1,025 Pokémon names (must match model order)
├── components/
│   ├── EvolutionChain.tsx
│   ├── PokemonCard.tsx
│   ├── StatBar.tsx
│   ├── TypeBadge.tsx
│   └── ...
├── scripts/
│   └── train/               # Model training pipeline
│       ├── 1_download_sprites.py           # PokeAPI sprites
│       ├── 1b_download_google_images.py    # CDN images (pokemondb, pokemon.com)
│       ├── 1c_google_images_playwright.py  # Google Images via browser
│       ├── 2_train_model.py                # MobileNetV2 training → TFLite
│       └── GUIDE.md                        # Full training guide
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Android device or emulator (physical device recommended for camera)
- Java 17+ (for native build)

### Installation

```bash
git clone <repo-url>
cd pokedex
npm install
```

### Run (development)

```bash
# Native build required (uses native camera + TFLite modules)
npx expo run:android
```

> ⚠️ `npx expo start` (Expo Go) won't work — `react-native-vision-camera` and `react-native-fast-tflite` require a native build.

---

## 🤖 Training the AI Model

The scanner uses a custom **MobileNetV2** model trained on 1,025 Pokémon classes. A placeholder model is included — replace it with a properly trained one for best accuracy.

See **[`scripts/train/GUIDE.md`](scripts/train/GUIDE.md)** for the full pipeline.

### Quick summary

```bash
cd scripts/train

# 1. Download training images (locally)
py -m pip install requests pillow playwright
py -m playwright install chromium

py 1_download_sprites.py           # ~15 min — PokeAPI sprites
py 1b_download_google_images.py    # ~5 min  — CDN art
py 1c_google_images_playwright.py  # ~30 min — Google Images

# 2. Zip dataset
Compress-Archive -Path dataset -DestinationPath dataset.zip -Force

# 3. Train on Google Colab (free T4 GPU) — ~60–90 min
#    Upload dataset.zip + 2_train_model.py → Runtime: T4 GPU → run 2_train_model.py

# 4. Copy outputs to app
#    model.tflite → assets/model.tflite
#    labels.json  → assets/labels.json

# 5. Rebuild
npx expo run:android
```

### Expected accuracy

| Dataset size | val_accuracy |
|-------------|--------------|
| Sprites only (~15 imgs/class) | 45–55% |
| Sprites + CDN (~32 imgs/class) | 55–65% |
| All sources (~70 imgs/class) | 65–80% |

---

## 📡 PokeAPI Endpoints Used

- `GET /pokemon` — paginated list
- `GET /pokemon/{id}` — details (stats, types, sprites, moves)
- `GET /pokemon-species/{id}` — species info
- `GET /evolution-chain/{id}` — evolution data

---

## 📄 License

MIT — free to use for learning and personal projects.

---

*Made with ❤️ and way too many Pokémon sprites*
