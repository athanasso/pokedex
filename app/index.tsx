
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import LoadingSpinner from '../components/LoadingSpinner';
import PokemonCard from '../components/PokemonCard';
import SearchBar from '../components/SearchBar';
import { Game, Region } from '../constants/pokemon';
import {
  useLegendaryPokemon,
  useMythicalPokemon,
  usePokemonByRegion,
  usePokemonByType,
  usePokemonList,
} from '../hooks/usePokemon';
import { searchPokemon } from '../services/pokeApi';
import { PokemonCardData, PokemonType } from '../types/pokemon';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonCardData[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<PokemonType | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isShiny, setIsShiny] = useState(false);
  const [showLegendary, setShowLegendary] = useState(false);
  const [showMythical, setShowMythical] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Infinite query for Pokemon list (default view)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = usePokemonList();

  // Infinite query for Legendary Pokemon
  const {
    data: legendaryData,
    fetchNextPage: fetchNextPageLegendary,
    hasNextPage: hasNextLegendary,
    isFetchingNextPage: isFetchingLegendary,
    isLoading: isLoadingLegendary,
  } = useLegendaryPokemon();

  // Infinite query for Mythical Pokemon
  const {
    data: mythicalData,
    fetchNextPage: fetchNextPageMythical,
    hasNextPage: hasNextMythical,
    isFetchingNextPage: isFetchingMythical,
    isLoading: isLoadingMythical,
  } = useMythicalPokemon();

  // Query for filtered Pokemon by type
  const { data: filteredByType, isLoading: isLoadingType } = usePokemonByType(selectedType);

  // Helper to determine start/end IDs based on Region OR Game
  const startId = selectedRegion?.startId || selectedGame?.startId || 1;
  const endId = selectedRegion?.endId || selectedGame?.endId || 151;
  const regionOrGameId = selectedRegion?.id || (selectedGame ? 999 : null); // 999 to trigger query if game selected

  // Query for filtered Pokemon by region/game
  // We reuse the region hook since "Game" also just maps to an ID range
  const { data: filteredByRegion, isLoading: isLoadingRegion } = usePokemonByRegion(
    startId,
    endId,
    regionOrGameId
  );

  // Flatten all pages into single array for infinite list
  const allPokemon = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const allLegendary = useMemo(() => {
    if (!legendaryData?.pages) return [];
    return legendaryData.pages.flatMap((page) => page.data);
  }, [legendaryData]);

  const allMythical = useMemo(() => {
    if (!mythicalData?.pages) return [];
    return mythicalData.pages.flatMap((page) => page.data);
  }, [mythicalData]);

  // Determine which data to display
  const displayData = useMemo(() => {
    if (searchResults !== null) return searchResults;

    let baseData = allPokemon;
    let isRarityMode = false;

    if (showLegendary && showMythical) {
      // Basic dedup by ID just in case, though sets are disjoint usually
      const combined = [...allLegendary, ...allMythical];
      baseData = Array.from(new Map(combined.map(item => [item.id, item])).values()).sort((a, b) => a.id - b.id);
      isRarityMode = true;
    } else if (showLegendary) {
      baseData = allLegendary;
      isRarityMode = true;
    } else if (showMythical) {
      baseData = allMythical;
      isRarityMode = true;
    }

    if (isRarityMode) {
      // Apply filters on top of Rarity list
      let filtered = baseData;
      if (selectedType) {
        filtered = filtered.filter((p) => p.types.includes(selectedType));
      }
      // Filter by Region OR Game range
      if (selectedRegion) {
        filtered = filtered.filter(
          (p) => p.id >= selectedRegion.startId && p.id <= selectedRegion.endId
        );
      } else if (selectedGame) {
        filtered = filtered.filter(
            (p) => p.id >= selectedGame.startId && p.id <= selectedGame.endId
        );
      }
      return filtered;
    }

    // Complex filtering: Type AND (Region OR Game) (Standard Flow)
    // Note: SearchBar logic enforces mutual exclusivity between Region and Game
    const activeRangeFilter = selectedRegion || selectedGame;
    
    if (selectedType && activeRangeFilter && filteredByRegion) {
      return filteredByRegion.filter((p) => p.types.includes(selectedType));
    }

    if (selectedType && filteredByType) return filteredByType;
    if (activeRangeFilter && filteredByRegion) return filteredByRegion;

    return allPokemon;
  }, [
    searchResults,
    selectedType,
    selectedRegion,
    selectedGame,
    filteredByType,
    filteredByRegion,
    allPokemon,
    allLegendary,
    allMythical,
    showLegendary,
    showMythical,
  ]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPokemon(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Clear search when query is empty
  const handleSearchQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults(null);
    }
  }, []);

  // Handle type filter selection
  const handleTypeSelect = useCallback((type: PokemonType | null) => {
    setSelectedType(type);
    setSearchResults(null);
    setSearchQuery('');
  }, []);

  // Handle Region filter selection
  const handleRegionSelect = useCallback((region: Region | null) => {
    setSelectedRegion(region);
    setSelectedGame(null); // Mutual exclusive
    setSearchResults(null);
    setSearchQuery('');
  }, []);

  // Handle Game filter selection
  const handleGameSelect = useCallback((game: Game | null) => {
    setSelectedGame(game);
    setSelectedRegion(null); // Mutual exclusive
    setSearchResults(null);
    setSearchQuery('');
  }, []);

  // Handle shiny toggle
  const handleShinyToggle = useCallback((value: boolean) => {
    setIsShiny(value);
  }, []);

  // Handle legendary toggle
  const handleLegendaryToggle = useCallback((value: boolean) => {
    setShowLegendary(value);
    setSearchResults(null);
  }, []);

  // Handle mythical toggle
  const handleMythicalToggle = useCallback((value: boolean) => {
    setShowMythical(value);
    setSearchResults(null);
  }, []);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (searchResults) return;

    if (showLegendary) {
      if (hasNextLegendary && !isFetchingLegendary) fetchNextPageLegendary();
    } else if (showMythical) {
      if (hasNextMythical && !isFetchingMythical) fetchNextPageMythical();
    } else if (
      hasNextPage &&
      !isFetchingNextPage &&
      !selectedType &&
      !selectedRegion &&
      !selectedGame
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    selectedType,
    selectedRegion,
    selectedGame,
    searchResults,
    showLegendary,
    hasNextLegendary,
    isFetchingLegendary,
    fetchNextPageLegendary,
    showMythical,
    hasNextMythical,
    isFetchingMythical,
    fetchNextPageMythical,
  ]);

  // Render Pokemon card
  const renderItem = useCallback(
    ({ item }: { item: PokemonCardData }) => (
      <PokemonCard pokemon={item} isShiny={isShiny} />
    ),
    [isShiny]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: PokemonCardData) => item.id.toString(),
    []
  );

  // Footer component
  const ListFooterComponent = useCallback(() => {
    if (isFetchingNextPage || isFetchingLegendary || isFetchingMythical) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.footerText}>Loading more Pokémon...</Text>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, isFetchingLegendary, isFetchingMythical]);

  // Empty component
  const ListEmptyComponent = useCallback(() => {
    if (
      isSearching ||
      isLoadingType ||
      isLoadingRegion ||
      isLoadingLegendary ||
      isLoadingMythical
    ) {
      return <LoadingSpinner message="Catching 'em all..." />;
    }
    if (searchResults !== null && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No Pokémon Found</Text>
          <Text style={styles.emptyText}>
            Try a different search term or filter
          </Text>
        </View>
      );
    }
    // Handle case where intersection of filters returns nothing
    if (
      (selectedType || selectedRegion || selectedGame || showLegendary || showMythical) &&
      displayData.length === 0
    ) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🚫</Text>
          <Text style={styles.emptyTitle}>No Matches</Text>
          <Text style={styles.emptyText}>
            No Pokémon found matching current filters.
          </Text>
        </View>
      );
    }

    return null;
  }, [
    isSearching,
    isLoadingType,
    isLoadingRegion,
    isLoadingLegendary,
    isLoadingMythical,
    searchResults,
    selectedType,
    selectedRegion,
    selectedGame,
    showLegendary,
    showMythical,
    displayData.length,
  ]);

  // Header component
  const ListHeaderComponent = useCallback(() => {
    if (selectedType || selectedRegion || selectedGame || showLegendary || showMythical) {
      let text = 'Showing ';
      const parts = [];
      if (showLegendary) parts.push('Legendary');
      if (showMythical) parts.push('Mythical');
      if (selectedType) parts.push(`${selectedType}-type`);
      
      text += parts.join(' & ');
      
      if (parts.length > 0) text += ' Pokémon';
      else text += 'Pokémon'; // Fallback

      if (selectedRegion) {
        text += ` from ${selectedRegion.name}`;
      } else if (selectedGame) {
        text += ` from ${selectedGame.name}`;
      }

      return (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>
            {text} ({displayData.length})
          </Text>
        </View>
      );
    }
    return null;
  }, [selectedType, selectedRegion, showLegendary, showMythical, displayData.length]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading Pokédex..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😢</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            {(error as Error)?.message || 'Failed to load Pokémon'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchQueryChange}
        onSearch={handleSearch}
        selectedType={selectedType}
        onTypeSelect={handleTypeSelect}
        selectedRegion={selectedRegion}
        onRegionSelect={handleRegionSelect}
        isShiny={isShiny}
        onToggleShiny={handleShinyToggle}
        showLegendary={showLegendary}
        onToggleLegendary={handleLegendaryToggle}
        showMythical={showMythical}
        onToggleMythical={handleMythicalToggle}
        selectedGame={selectedGame}
        onGameSelect={handleGameSelect}
      />

      <FlashList
        data={displayData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  filterIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
