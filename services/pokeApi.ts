import { LEGENDARY_IDS, MYTHICAL_IDS } from '../constants/pokemon';
import {
  EvolutionChain,
  Pokemon,
  PokemonCardData,
  PokemonListResponse,
  PokemonSpecies,
  PokemonType,
  ProcessedEvolution,
} from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';
const ITEMS_PER_PAGE = 20;

// Helper to format Pokemon details into simpler card data
const formatPokemonCard = (details: Pokemon): PokemonCardData => ({
  id: details.id,
  name: details.name,
  sprite:
    details.sprites.other['official-artwork'].front_default ||
    details.sprites.front_default ||
    '',
  shinySprite:
    details.sprites.other['official-artwork'].front_shiny ||
    details.sprites.front_shiny ||
    '',
  types: details.types.map((t) => t.type.name),
  isLegendary: LEGENDARY_IDS.includes(details.id),
  isMythical: MYTHICAL_IDS.includes(details.id),
});

// Fetch paginated Pokemon list
export const fetchPokemonList = async ({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{ data: PokemonCardData[]; nextPage: number | null }> => {
  const offset = pageParam * ITEMS_PER_PAGE;
  const response = await fetch(
    `${BASE_URL}/pokemon?limit=${ITEMS_PER_PAGE}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon list');
  }

  const data: PokemonListResponse = await response.json();

  // Fetch details for each Pokemon in parallel
  const pokemonDetails = await Promise.all(
    data.results.map(async (pokemon) => {
      const id = parseInt(pokemon.url.split('/').filter(Boolean).pop() || '0');
      try {
        const details = await fetchPokemonById(id);
        return formatPokemonCard(details);
      } catch {
        return null;
      }
    })
  );

  return {
    data: pokemonDetails.filter(Boolean) as PokemonCardData[],
    nextPage: data.next ? pageParam + 1 : null,
  };
};

// Fetch Legendary Pokemon
export const fetchLegendaryPokemon = async ({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{ data: PokemonCardData[]; nextPage: number | null }> => {
  const start = pageParam * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const ids = LEGENDARY_IDS.slice(start, end);

  if (ids.length === 0) {
    return { data: [], nextPage: null };
  }

  const pokemonDetails = await Promise.all(
    ids.map(async (id) => {
      try {
        const details = await fetchPokemonById(id);
        return formatPokemonCard(details);
      } catch {
        return null;
      }
    })
  );

  return {
    data: pokemonDetails.filter(Boolean) as PokemonCardData[],
    nextPage: end < LEGENDARY_IDS.length ? pageParam + 1 : null,
  };
};

// Fetch Mythical Pokemon
export const fetchMythicalPokemon = async ({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{ data: PokemonCardData[]; nextPage: number | null }> => {
  const start = pageParam * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const ids = MYTHICAL_IDS.slice(start, end);

  if (ids.length === 0) {
    return { data: [], nextPage: null };
  }

  const pokemonDetails = await Promise.all(
    ids.map(async (id) => {
      try {
        const details = await fetchPokemonById(id);
        return formatPokemonCard(details);
      } catch {
        return null;
      }
    })
  );

  return {
    data: pokemonDetails.filter(Boolean) as PokemonCardData[],
    nextPage: end < MYTHICAL_IDS.length ? pageParam + 1 : null,
  };
};

// Fetch Pokemon by ID
export const fetchPokemonById = async (id: number): Promise<Pokemon> => {
  const response = await fetch(`${BASE_URL}/pokemon/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon #${id}`);
  }

  return response.json();
};

// Fetch Pokemon by Name
export const fetchPokemonByName = async (name: string): Promise<Pokemon> => {
  const response = await fetch(`${BASE_URL}/pokemon/${name.toLowerCase()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon: ${name}`);
  }

  return response.json();
};

// Fetch Pokemon Species
export const fetchPokemonSpecies = async (id: number): Promise<PokemonSpecies> => {
  const response = await fetch(`${BASE_URL}/pokemon-species/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch species for Pokemon #${id}`);
  }

  return response.json();
};

// Fetch Evolution Chain
export const fetchEvolutionChain = async (url: string): Promise<EvolutionChain> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch evolution chain');
  }

  return response.json();
};

// Process evolution chain into flat array
export const processEvolutionChain = async (
  chain: EvolutionChain['chain']
): Promise<ProcessedEvolution[]> => {
  const evolutions: ProcessedEvolution[] = [];

  const traverse = async (link: EvolutionChain['chain'], prevEvolutionDetails?: any) => {
    const id = parseInt(link.species.url.split('/').filter(Boolean).pop() || '0');

    // Fetch sprite for this Pokemon
    try {
      const pokemon = await fetchPokemonById(id);
      evolutions.push({
        id,
        name: link.species.name,
        sprite:
          pokemon.sprites.other['official-artwork'].front_default ||
          pokemon.sprites.front_default ||
          '',
        minLevel: prevEvolutionDetails?.min_level,
        trigger: prevEvolutionDetails?.trigger?.name,
        item: prevEvolutionDetails?.item?.name,
      });
    } catch {
      evolutions.push({
        id,
        name: link.species.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      });
    }

    for (const evolution of link.evolves_to) {
      await traverse(evolution, evolution.evolution_details[0]);
    }
  };

  await traverse(chain);
  return evolutions;
};

// Search Pokemon by name
export const searchPokemon = async (query: string): Promise<PokemonCardData[]> => {
  if (!query.trim()) return [];

  try {
    // First, try exact match
    const pokemon = await fetchPokemonByName(query);
    return [formatPokemonCard(pokemon)];
  } catch {
    // If exact match fails, fetch all and filter locally
    // This is a fallback since PokeAPI doesn't support partial search
    return [];
  }
};

// Fetch Pokemon by type
export const fetchPokemonByType = async (type: PokemonType): Promise<PokemonCardData[]> => {
  const response = await fetch(`${BASE_URL}/type/${type}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon of type: ${type}`);
  }

  const data = await response.json();

  // Get first 40 Pokemon of this type
  const pokemonList = data.pokemon.slice(0, 40);

  const pokemonDetails = await Promise.all(
    pokemonList.map(async (p: { pokemon: { name: string; url: string } }) => {
      const id = parseInt(p.pokemon.url.split('/').filter(Boolean).pop() || '0');
      try {
        const details = await fetchPokemonById(id);
        return formatPokemonCard(details);
      } catch {
        return null;
      }
    })
  );

  return pokemonDetails.filter(Boolean) as PokemonCardData[];
};

// Fetch Pokemon by range (for region filter)
export const fetchPokemonByRange = async (
  startId: number,
  endId: number
): Promise<PokemonCardData[]> => {
  const limit = endId - startId + 1;
  const offset = startId - 1;

  const response = await fetch(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon range: ${startId} - ${endId}`);
  }

  const data: PokemonListResponse = await response.json();

  const pokemonDetails = await Promise.all(
    data.results.map(async (pokemon) => {
      const id = parseInt(pokemon.url.split('/').filter(Boolean).pop() || '0');
      try {
        const details = await fetchPokemonById(id);
        return formatPokemonCard(details);
      } catch {
        return null;
      }
    })
  );

  return pokemonDetails.filter(Boolean) as PokemonCardData[];
};

// Get all Pokemon types
export const getAllTypes = (): PokemonType[] => [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];
