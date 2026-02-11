// Pokemon Types
export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

// Basic Pokemon info from list endpoint
export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

// Pokemon Type Details
export interface TypeSlot {
  slot: number;
  type: {
    name: PokemonType;
    url: string;
  };
}

// Pokemon Stats
export interface StatInfo {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

// Pokemon Abilities
export interface AbilitySlot {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

// Pokemon Moves
export interface MoveSlot {
  move: {
    name: string;
    url: string;
  };
}

// Pokemon Sprites
export interface Sprites {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  back_shiny: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    dream_world: {
      front_default: string | null;
    };
    home: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

// Full Pokemon Details
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: TypeSlot[];
  stats: StatInfo[];
  abilities: AbilitySlot[];
  moves: MoveSlot[];
  sprites: Sprites;
  species: {
    name: string;
    url: string;
  };
}

// Pokemon Species (for evolution chain)
export interface PokemonSpecies {
  id: number;
  name: string;
  evolution_chain: {
    url: string;
  };
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
    };
    version: {
      name: string;
    };
  }[];
  genera: {
    genus: string;
    language: {
      name: string;
    };
  }[];
  color: {
    name: string;
  };
}

// Evolution Chain
export interface EvolutionChainLink {
  species: {
    name: string;
    url: string;
  };
  evolution_details: {
    min_level: number | null;
    trigger: {
      name: string;
    };
    item: {
      name: string;
    } | null;
  }[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionChainLink;
}

// Processed Evolution for UI
export interface ProcessedEvolution {
  id: number;
  name: string;
  sprite: string;
  minLevel?: number;
  trigger?: string;
  item?: string;
}

// Card data for FlashList
export interface PokemonCardData {
  id: number;
  name: string;
  sprite: string;
  shinySprite: string;
  types: PokemonType[];
  isLegendary?: boolean;
  isMythical?: boolean;
}
