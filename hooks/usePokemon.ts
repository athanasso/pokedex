import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchEvolutionChain,
  fetchLegendaryPokemon,
  fetchMythicalPokemon,
  fetchPokemonById,
  fetchPokemonByType,
  fetchPokemonList,
  fetchPokemonSpecies,
  processEvolutionChain,
} from '../services/pokeApi';
import { PokemonType } from '../types/pokemon';

// Query keys for caching
export const pokemonKeys = {
  all: ['pokemon'] as const,
  lists: () => [...pokemonKeys.all, 'list'] as const,
  list: (filters: string) => [...pokemonKeys.lists(), { filters }] as const,
  details: () => [...pokemonKeys.all, 'detail'] as const,
  detail: (id: number) => [...pokemonKeys.details(), id] as const,
  species: (id: number) => [...pokemonKeys.all, 'species', id] as const,
  evolution: (id: number) => [...pokemonKeys.all, 'evolution', id] as const,
  byType: (type: PokemonType) => [...pokemonKeys.all, 'type', type] as const,
  byRegion: (id: number) => [...pokemonKeys.all, 'region', id] as const,
  legendary: () => [...pokemonKeys.all, 'legendary'] as const,
  mythical: () => [...pokemonKeys.all, 'mythical'] as const,
};

// Infinite query for Pokemon list with pagination
export const usePokemonList = () => {
  return useInfiniteQuery({
    queryKey: pokemonKeys.lists(),
    queryFn: fetchPokemonList,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Query for single Pokemon details
export const usePokemonDetails = (id: number) => {
  return useQuery({
    queryKey: pokemonKeys.detail(id),
    queryFn: () => fetchPokemonById(id),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: id > 0,
  });
};

// Query for Pokemon species (for evolution chain)
export const usePokemonSpecies = (id: number) => {
  return useQuery({
    queryKey: pokemonKeys.species(id),
    queryFn: () => fetchPokemonSpecies(id),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: id > 0,
  });
};

// Query for evolution chain
export const useEvolutionChain = (id: number) => {
  const speciesQuery = usePokemonSpecies(id);

  return useQuery({
    queryKey: pokemonKeys.evolution(id),
    queryFn: async () => {
      if (!speciesQuery.data?.evolution_chain?.url) {
        throw new Error('No evolution chain URL');
      }
      const chain = await fetchEvolutionChain(speciesQuery.data.evolution_chain.url);
      return processEvolutionChain(chain.chain);
    },
    enabled: !!speciesQuery.data?.evolution_chain?.url,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Query for Pokemon by type
export const usePokemonByType = (type: PokemonType | null) => {
  return useQuery({
    queryKey: type ? pokemonKeys.byType(type) : ['empty'],
    queryFn: () => (type ? fetchPokemonByType(type) : Promise.resolve([])),
    enabled: !!type,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Query for Pokemon by region
export const usePokemonByRegion = (startId: number, endId: number, regionId: number | null) => {
  return useQuery({
    queryKey: regionId ? pokemonKeys.byRegion(regionId) : ['empty-region'],
    queryFn: () => (regionId ? import('../services/pokeApi').then(mod => mod.fetchPokemonByRange(startId, endId)) : Promise.resolve([])),
    enabled: !!regionId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (regions don't change often)
  });
};
// Infinite query for Legendary Pokemon
export const useLegendaryPokemon = () => {
  return useInfiniteQuery({
    queryKey: pokemonKeys.legendary(),
    queryFn: fetchLegendaryPokemon,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Infinite query for Mythical Pokemon
export const useMythicalPokemon = () => {
  return useInfiniteQuery({
    queryKey: pokemonKeys.mythical(),
    queryFn: fetchMythicalPokemon,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
