# 🔴 Pokédex App

A beautiful, high-performance Pokédex application built with React Native (Expo) and the PokeAPI.

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## ✨ Features

- **📱 Home Screen**: Grid view with Pokemon cards showing ID, Name, Image, and Type badges
- **♾️ Infinite Scroll**: Smooth loading of 1000+ Pokemon (20 at a time)
- **🔍 Search**: Search Pokemon by name
- **✨ Shiny Mode**: Toggle to view shiny sprites for all Pokemon
- **🏷️ Filters**: Filter by **Type** (Fire, Water, etc.) and **Region** (Kanto, Johto, etc.)
- **📄 Details Screen**:
  - High-res official artwork
  - Base stats with animated progress bars
  - Evolution chain with navigation
  - Moves list
  - Abilities (including hidden ones)
- **🎨 Dynamic Theming**: Background colors based on Pokemon's primary type

## 🛠️ Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **State Management**: TanStack Query (React Query)
- **Navigation**: Expo Router (Stack Navigator)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **List Performance**: FlashList by Shopify
- **Type Safety**: TypeScript

## 📁 Project Structure

```
pokedex/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Home screen with Pokemon grid
│   └── pokemon/
│       └── [id].tsx         # Pokemon details screen
├── components/               # Reusable UI components
│   ├── EvolutionChain.tsx   # Evolution chain display
│   ├── LoadingSpinner.tsx   # Pokeball-themed loading
│   ├── MovesList.tsx        # Scrollable moves grid
│   ├── PokemonCard.tsx      # Pokemon grid card
│   ├── SearchBar.tsx        # Search with type filter modal
│   ├── StatBar.tsx          # Animated stat progress bar
│   └── TypeBadge.tsx        # Type indicator badge
├── constants/
│   └── pokemon.ts           # Type colors, gradients, stat names
├── hooks/
│   └── usePokemon.ts        # TanStack Query hooks
├── services/
│   └── pokeApi.ts           # PokeAPI service functions
├── types/
│   └── pokemon.ts           # TypeScript interfaces
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler config
├── tailwind.config.js       # Tailwind/NativeWind config
└── global.css               # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd pokedex
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device or simulator:
- Press `a` for Android
- Press `i` for iOS
- Press `w` for Web

## 📦 Key Dependencies

```json
{
  "@tanstack/react-query": "^5.x",
  "@shopify/flash-list": "^1.x",
  "nativewind": "^4.x",
  "tailwindcss": "^3.x",
  "expo-linear-gradient": "^14.x",
  "expo-router": "^6.x",
  "expo-image": "^3.x",
  "react-native-reanimated": "^4.x"
}
```

## 🎨 Design Features

- **Gradient Cards**: Each Pokemon card has a gradient based on its primary type
- **Pokeball Decorations**: Subtle pokeball patterns in UI elements
- **Smooth Animations**: Stat bars animate when entering the details screen
- **Dark Theme**: Modern dark interface optimized for OLED displays
- **Responsive Grid**: 2-column grid adapts to different screen sizes

## 📡 API

This app uses the [PokeAPI](https://pokeapi.co/) - a free RESTful Pokemon API.

### Endpoints Used:
- `GET /pokemon` - List Pokemon with pagination
- `GET /pokemon/{id}` - Get Pokemon details
- `GET /pokemon-species/{id}` - Get species info (for evolution chain)
- `GET /evolution-chain/{id}` - Get evolution chain
- `GET /type/{type}` - Get Pokemon by type

## 🔧 Performance Optimizations

- **FlashList**: Efficiently renders 1000+ items with recycling
- **TanStack Query**: Aggressive caching (30min stale time)
- **Image Caching**: expo-image with memory+disk cache
- **Memoization**: React.memo on all list components
- **Lazy Loading**: Infinite scroll loads only what's needed

## 📄 License

MIT License - Feel free to use this project for learning and personal use!

---

Made with ❤️ and ⚡ by a Pokémon fan
