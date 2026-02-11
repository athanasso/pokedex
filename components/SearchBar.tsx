
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GAMES, Game, REGIONS, Region, TYPE_COLORS, TYPE_ICONS } from '../constants/pokemon';
import { getAllTypes } from '../services/pokeApi';
import { PokemonType } from '../types/pokemon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  selectedType: PokemonType | null;
  onTypeSelect: (type: PokemonType | null) => void;
  selectedRegion: Region | null;
  onRegionSelect: (region: Region | null) => void;
  isShiny: boolean;
  onToggleShiny: (value: boolean) => void;
  showLegendary: boolean;
  onToggleLegendary: (value: boolean) => void;
  showMythical: boolean;
  onToggleMythical: (value: boolean) => void;
  selectedGame: Game | null;
  onGameSelect: (game: Game | null) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  selectedType,
  onTypeSelect,
  selectedRegion,
  onRegionSelect,
  isShiny,
  onToggleShiny,
  showLegendary,
  onToggleLegendary,
  showMythical,
  onToggleMythical,
  selectedGame,
  onGameSelect,
}) => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'type' | 'region' | 'game'>('type');
  const types = getAllTypes();

  const handleTypePress = useCallback(
    (type: PokemonType) => {
      onTypeSelect(selectedType === type ? null : type);
      // Don't close modal immediately to allow multiple selections if we wanted, 
      // but for single select UX, maybe keeping it open is better or closing it.
      // Let's keep it open so they can switch to region if they want.
    },
    [selectedType, onTypeSelect]
  );

  const handleRegionPress = useCallback(
    (region: Region) => {
      onRegionSelect(selectedRegion?.id === region.id ? null : region);
      onGameSelect(null); // Clear game if region is selected
    },
    [selectedRegion, onRegionSelect, onGameSelect]
  );

  const handleGamePress = useCallback(
    (game: Game) => {
      onGameSelect(selectedGame?.id === game.id ? null : game);
      onRegionSelect(null); // Clear region if game is selected
    },
    [selectedGame, onGameSelect, onRegionSelect]
  );

  const clearAllFilters = useCallback(() => {
    onTypeSelect(null);
    onTypeSelect(null);
    onRegionSelect(null);
    onGameSelect(null);
    setFilterModalVisible(false);
  }, [onTypeSelect, onRegionSelect, onGameSelect]);

  const hasActiveFilters = selectedType || selectedRegion || selectedGame;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search Pokémon..."
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => setFilterModalVisible(true)}
        style={[
          styles.filterButton,
          hasActiveFilters && { backgroundColor: selectedType ? TYPE_COLORS[selectedType] : '#6890F0' },
        ]}
      >
        <Ionicons
          name="options"
          size={22}
          color={hasActiveFilters ? '#fff' : '#666'}
        />
      </Pressable>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Filter Pokémon</Text>

            {/* Toggles Container */}
            <View style={styles.togglesContainer}>
              {/* Shiny Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleIcon}>✨</Text>
                  <Text style={styles.toggleLabel}>Shiny Mode</Text>
                </View>
                <Switch
                  trackColor={{ false: '#767577', true: '#F8D030' }}
                  thumbColor={isShiny ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={onToggleShiny}
                  value={isShiny}
                />
              </View>

              {/* Legendary Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleIcon}>🏆</Text>
                  <Text style={styles.toggleLabel}>Legendary Only</Text>
                </View>
                <Switch
                  trackColor={{ false: '#767577', true: '#F8D030' }}
                  thumbColor={showLegendary ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={onToggleLegendary}
                  value={showLegendary}
                />
              </View>

              {/* Mythical Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleIcon}>🔮</Text>
                  <Text style={styles.toggleLabel}>Mythical Only</Text>
                </View>
                <Switch
                  trackColor={{ false: '#767577', true: '#F8D030' }}
                  thumbColor={showMythical ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={onToggleMythical}
                  value={showMythical}
                />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tab, activeTab === 'type' && styles.activeTab]}
                onPress={() => setActiveTab('type')}
              >
                <Text style={[styles.tabText, activeTab === 'type' && styles.activeTabText]}>By Type</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'region' && styles.activeTab]}
                onPress={() => setActiveTab('region')}
              >
                <Text style={[styles.tabText, activeTab === 'region' && styles.activeTabText]}>By Region</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'game' && styles.activeTab]}
                onPress={() => setActiveTab('game')}
              >
                <Text style={[styles.tabText, activeTab === 'game' && styles.activeTabText]}>By Game</Text>
              </Pressable>
            </View>
            
            {hasActiveFilters && (
              <Pressable
                style={styles.clearFilterButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFilterText}>Clear All Filters</Text>
              </Pressable>
            )}

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'type' ? (
                <View style={styles.typesGrid}>
                  {types.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeButton,
                        { backgroundColor: TYPE_COLORS[type] },
                        selectedType === type && styles.selectedItem,
                        selectedType && selectedType !== type && styles.dimmedItem,
                      ]}
                      onPress={() => handleTypePress(type)}
                    >
                      <Text style={styles.typeIcon}>{TYPE_ICONS[type]}</Text>
                      <Text style={styles.typeText}>{type}</Text>
                      {selectedType === type && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.checkIcon} />
                      )}
                    </Pressable>
                  ))}
                </View>
              ) : activeTab === 'region' ? (
                <View style={styles.regionsList}>
                  {REGIONS.map((region) => (
                    <Pressable
                      key={region.id}
                      style={[
                        styles.regionButton,
                        selectedRegion?.id === region.id && styles.selectedRegionButton,
                      ]}
                      onPress={() => handleRegionPress(region)}
                    >
                      <View>
                        <Text style={[styles.regionName, selectedRegion?.id === region.id && styles.selectedRegionText]}>
                          {region.name}
                        </Text>
                        <Text style={[styles.regionGen, selectedRegion?.id === region.id && styles.selectedRegionSubText]}>
                          {region.generation}
                        </Text>
                      </View>
                      {selectedRegion?.id === region.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#6890F0" />
                      )}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.regionsList}>
                  {GAMES.map((game) => (
                    <Pressable
                      key={game.id}
                      style={[
                        styles.regionButton,
                        selectedGame?.id === game.id && styles.selectedRegionButton,
                      ]}
                      onPress={() => handleGamePress(game)}
                    >
                      <View>
                        <Text style={[styles.regionName, selectedGame?.id === game.id && styles.selectedRegionText]}>
                          {game.name}
                        </Text>
                        <Text style={[styles.regionGen, selectedGame?.id === game.id && styles.selectedRegionSubText]}>
                          {game.generation}
                        </Text>
                      </View>
                      {selectedGame?.id === game.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#6890F0" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <Pressable
              style={styles.closeButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#1a1a2e',
    zIndex: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  togglesContainer: {
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleIcon: {
    fontSize: 20,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3d3d5c',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  clearFilterButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  clearFilterText: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  dimmedItem: {
    opacity: 0.5,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  regionsList: {
    gap: 10,
  },
  regionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedRegionButton: {
    borderColor: '#6890F0',
    backgroundColor: 'rgba(104, 144, 240, 0.1)',
  },
  regionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  selectedRegionText: {
    color: '#6890F0',
  },
  regionGen: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  selectedRegionSubText: {
    color: '#6890F0',
  },
  closeButton: {
    backgroundColor: '#6890F0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default memo(SearchBar);
