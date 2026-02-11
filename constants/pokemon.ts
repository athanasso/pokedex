import { PokemonType } from '../types/pokemon';

// Type colors for backgrounds and badges
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

// Gradient colors for type backgrounds
export const TYPE_GRADIENTS: Record<PokemonType, [string, string]> = {
  normal: ['#C6C6A7', '#A8A878'],
  fire: ['#F5AC78', '#F08030'],
  water: ['#9DB7F5', '#6890F0'],
  electric: ['#FAE078', '#F8D030'],
  grass: ['#A7DB8D', '#78C850'],
  ice: ['#BCE6E6', '#98D8D8'],
  fighting: ['#D67873', '#C03028'],
  poison: ['#C183C1', '#A040A0'],
  ground: ['#EBD69D', '#E0C068'],
  flying: ['#C6B7F5', '#A890F0'],
  psychic: ['#FA92B2', '#F85888'],
  bug: ['#C6D16E', '#A8B820'],
  rock: ['#D1C17D', '#B8A038'],
  ghost: ['#A292BC', '#705898'],
  dragon: ['#A27DFA', '#7038F8'],
  dark: ['#A29288', '#705848'],
  steel: ['#D1D1E0', '#B8B8D0'],
  fairy: ['#F4BDC9', '#EE99AC'],
};

export interface Region {
  id: number;
  name: string;
  startId: number;
  endId: number;
  generation: string;
}

export const REGIONS: Region[] = [
  { id: 1, name: 'Kanto', startId: 1, endId: 151, generation: 'Gen I' },
  { id: 2, name: 'Johto', startId: 152, endId: 251, generation: 'Gen II' },
  { id: 3, name: 'Hoenn', startId: 252, endId: 386, generation: 'Gen III' },
  { id: 4, name: 'Sinnoh', startId: 387, endId: 493, generation: 'Gen IV' },
  { id: 5, name: 'Unova', startId: 494, endId: 649, generation: 'Gen V' },
  { id: 6, name: 'Kalos', startId: 650, endId: 721, generation: 'Gen VI' },
  { id: 7, name: 'Alola', startId: 722, endId: 809, generation: 'Gen VII' },
  { id: 8, name: 'Galar', startId: 810, endId: 905, generation: 'Gen VIII' },
  { id: 9, name: 'Paldea', startId: 906, endId: 1025, generation: 'Gen IX' },
];

export interface Game {
  id: string;
  name: string;
  generation: string;
  startId: number;
  endId: number;
}

export const GAMES: Game[] = [
  { id: 'red-blue', name: 'Red & Blue', generation: 'Gen I', startId: 1, endId: 151 },
  { id: 'yellow', name: 'Yellow', generation: 'Gen I', startId: 1, endId: 151 },
  { id: 'gold-silver', name: 'Gold & Silver', generation: 'Gen II', startId: 152, endId: 251 },
  { id: 'crystal', name: 'Crystal', generation: 'Gen II', startId: 152, endId: 251 },
  { id: 'ruby-sapphire', name: 'Ruby & Sapphire', generation: 'Gen III', startId: 252, endId: 386 },
  { id: 'emerald', name: 'Emerald', generation: 'Gen III', startId: 252, endId: 386 },
  { id: 'firered-leafgreen', name: 'FireRed & LeafGreen', generation: 'Gen III', startId: 1, endId: 151 },
  { id: 'diamond-pearl', name: 'Diamond & Pearl', generation: 'Gen IV', startId: 387, endId: 493 },
  { id: 'platinum', name: 'Platinum', generation: 'Gen IV', startId: 387, endId: 493 },
  { id: 'heartgold-soulsilver', name: 'HeartGold & SoulSilver', generation: 'Gen IV', startId: 1, endId: 251 },
  { id: 'black-white', name: 'Black & White', generation: 'Gen V', startId: 494, endId: 649 },
  { id: 'black2-white2', name: 'Black 2 & White 2', generation: 'Gen V', startId: 494, endId: 649 },
  { id: 'xy', name: 'X & Y', generation: 'Gen VI', startId: 650, endId: 721 },
  { id: 'omega-ruby-alpha-sapphire', name: 'Omega Ruby & Alpha Sapphire', generation: 'Gen VI', startId: 1, endId: 386 },
  { id: 'sun-moon', name: 'Sun & Moon', generation: 'Gen VII', startId: 722, endId: 809 },
  { id: 'ultra-sun-ultra-moon', name: 'Ultra Sun & Ultra Moon', generation: 'Gen VII', startId: 722, endId: 809 },
  { id: 'sword-shield', name: 'Sword & Shield', generation: 'Gen VIII', startId: 810, endId: 905 },
  { id: 'scarlet-violet', name: 'Scarlet & Violet', generation: 'Gen IX', startId: 906, endId: 1025 },
];

// Stat names for display
export const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

// Stat colors for progress bars
export const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
};

// Type icons (emoji representation)
export const TYPE_ICONS: Record<PokemonType, string> = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🏔️',
  flying: '🦅',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
};

export const LEGENDARY_IDS = [
  144, 145, 146, 150, // Gen 1
  243, 244, 245, 249, 250, // Gen 2
  377, 378, 379, 380, 381, 382, 383, 384, // Gen 3
  480, 481, 482, 483, 484, 485, 486, 487, 488, // Gen 4
  638, 639, 640, 641, 642, 643, 644, 645, 646, // Gen 5
  716, 717, 718, // Gen 6
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, // Gen 7
  888, 889, 890, 891, 892, 894, 895, 896, 897, 898, // Gen 8
  1001, 1002, 1003, 1004, 1007, 1008 // Gen 9
];

export const MYTHICAL_IDS = [
  151, // Gen 1
  251, // Gen 2
  385, 386, // Gen 3
  489, 490, 491, 492, 493, // Gen 4
  494, 647, 648, 649, // Gen 5
  719, 720, 721, // Gen 6
  801, 802, 807, 808, 809, // Gen 7
  893 // Gen 8
];
