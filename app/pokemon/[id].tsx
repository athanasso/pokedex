import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import EvolutionChain from '../../components/EvolutionChain';
import LoadingSpinner from '../../components/LoadingSpinner';
import MovesList from '../../components/MovesList';
import StatBar from '../../components/StatBar';
import TypeBadge from '../../components/TypeBadge';
import { TYPE_COLORS, TYPE_GRADIENTS } from '../../constants/pokemon';
import { useEvolutionChain, usePokemonDetails, usePokemonSpecies } from '../../hooks/usePokemon';
import { PokemonType } from '../../types/pokemon';

const { width } = Dimensions.get('window');

export default function PokemonDetailsScreen() {
  const { id, shiny } = useLocalSearchParams<{ id: string; shiny?: string }>();
  const router = useRouter();
  const pokemonId = parseInt(id || '1');
  const isShiny = shiny === 'true';

  const { data: pokemon, isLoading, isError } = usePokemonDetails(pokemonId);
  const { data: species } = usePokemonSpecies(pokemonId);
  const { data: evolutions, isLoading: isLoadingEvolutions } = useEvolutionChain(pokemonId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Loading Pokémon data..." />
      </View>
    );
  }

  if (isError || !pokemon) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😢</Text>
        <Text style={styles.errorTitle}>Pokémon Not Found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const primaryType = pokemon.types[0]?.type.name as PokemonType;
  const gradientColors = TYPE_GRADIENTS[primaryType] || ['#A8A878', '#98D8A8'];
  const primaryColor = TYPE_COLORS[primaryType] || '#A8A878';

  // Get English flavor text
  const flavorText = species?.flavor_text_entries
    .find((entry) => entry.language.name === 'en')
    ?.flavor_text.replace(/\f/g, ' ')
    .replace(/\n/g, ' ');

  // Get English genus
  const genus = species?.genera.find((g) => g.language.name === 'en')?.genus;

  // Get artwork URL
  const artworkUrl = (isShiny
    ? pokemon.sprites.other['official-artwork'].front_shiny ||
      pokemon.sprites.front_shiny
    : pokemon.sprites.other['official-artwork'].front_default ||
      pokemon.sprites.other.home.front_default ||
      pokemon.sprites.front_default) || '';

  // Calculate total stats
  const totalStats = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} bounces={false}>
        {/* Hero Section with Gradient Background */}
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1], '#1a1a2e']}
          style={styles.heroSection}
          locations={[0, 0.6, 1]}
        >
          {/* Pokeball Background Decoration */}
          <View style={styles.pokeballDecoration}>
            <View style={styles.pokeballInner} />
          </View>

          {/* Pokemon ID */}
          <Animated.Text
            entering={FadeIn.delay(100)}
            style={styles.pokemonId}
          >
            #{pokemon.id.toString().padStart(3, '0')}
          </Animated.Text>

          {/* Pokemon Image */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <Image
              source={{ uri: artworkUrl }}
              style={styles.pokemonImage}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>

          {/* Pokemon Name */}
          <Animated.Text
            entering={FadeInDown.delay(300)}
            style={styles.pokemonName}
          >
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </Animated.Text>

          {/* Genus */}
          {genus && (
            <Animated.Text
              entering={FadeInDown.delay(350)}
              style={styles.genus}
            >
              {genus}
            </Animated.Text>
          )}

          {/* Type Badges */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.typesContainer}
          >
            {pokemon.types.map((type) => (
              <TypeBadge
                key={type.type.name}
                type={type.type.name as PokemonType}
                size="large"
                showIcon
              />
            ))}
          </Animated.View>
        </LinearGradient>

        {/* Info Cards */}
        <View style={styles.contentSection}>
          {/* Basic Info Card */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            style={styles.infoCard}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="resize" size={24} color={primaryColor} />
                <Text style={styles.infoValue}>
                  {(pokemon.height / 10).toFixed(1)} m
                </Text>
                <Text style={styles.infoLabel}>Height</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Ionicons name="barbell" size={24} color={primaryColor} />
                <Text style={styles.infoValue}>
                  {(pokemon.weight / 10).toFixed(1)} kg
                </Text>
                <Text style={styles.infoLabel}>Weight</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Ionicons name="flash" size={24} color={primaryColor} />
                <Text style={styles.infoValue}>{pokemon.base_experience}</Text>
                <Text style={styles.infoLabel}>Base XP</Text>
              </View>
            </View>
          </Animated.View>

          {/* Description */}
          {flavorText && (
            <Animated.View
              entering={FadeInDown.delay(550)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{flavorText}</Text>
            </Animated.View>
          )}

          {/* Abilities */}
          <Animated.View
            entering={FadeInDown.delay(600)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Abilities</Text>
            <View style={styles.abilitiesContainer}>
              {pokemon.abilities.map((ability) => (
                <View
                  key={ability.ability.name}
                  style={[
                    styles.abilityBadge,
                    ability.is_hidden && styles.hiddenAbility,
                  ]}
                >
                  <Text style={styles.abilityText}>
                    {ability.ability.name
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </Text>
                  {ability.is_hidden && (
                    <Text style={styles.hiddenLabel}>Hidden</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Base Stats */}
          <Animated.View
            entering={FadeInDown.delay(650)}
            style={styles.section}
          >
            <View style={styles.statsTitleRow}>
              <Text style={styles.sectionTitle}>Base Stats</Text>
              <Text style={styles.totalStats}>Total: {totalStats}</Text>
            </View>
            {pokemon.stats.map((stat, index) => (
              <StatBar
                key={stat.stat.name}
                statName={stat.stat.name}
                value={stat.base_stat}
                delay={100 * index}
              />
            ))}
          </Animated.View>

          {/* Evolution Chain */}
          <Animated.View
            entering={FadeInDown.delay(700)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Evolution Chain</Text>
            {isLoadingEvolutions ? (
              <View style={styles.evolutionLoading}>
                <Text style={styles.loadingText}>Loading evolutions...</Text>
              </View>
            ) : evolutions ? (
              <EvolutionChain
                evolutions={evolutions}
                currentPokemonId={pokemonId}
              />
            ) : (
              <Text style={styles.noDataText}>Evolution data unavailable</Text>
            )}
          </Animated.View>

          {/* Moves */}
          <Animated.View
            entering={FadeInDown.delay(750)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              Moves ({pokemon.moves.length})
            </Text>
            <MovesList moves={pokemon.moves} maxMoves={30} />
          </Animated.View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    paddingTop: 100,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pokeballDecoration: {
    position: 'absolute',
    right: -60,
    top: 60,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pokemonId: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pokemonImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 280,
    maxHeight: 280,
  },
  pokemonName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  genus: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  contentSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    marginTop: -20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalStats: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  abilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  abilityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hiddenAbility: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  abilityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  evolutionLoading: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  noDataText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
