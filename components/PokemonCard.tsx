import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TYPE_GRADIENTS } from '../constants/pokemon';
import { PokemonCardData } from '../types/pokemon';
import TypeBadge from './TypeBadge';

interface PokemonCardProps {
  pokemon: PokemonCardData;
  isShiny?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, isShiny = false }) => {
  const router = useRouter();
  const primaryType = pokemon.types[0];
  const gradientColors = TYPE_GRADIENTS[primaryType] || ['#A8A878', '#98D8A8'];

  const handlePress = () => {
    // Pass shiny status to details page
    router.push({
      pathname: '/pokemon/[id]',
      params: { id: pokemon.id, shiny: isShiny ? 'true' : 'false' }
    });
  };

  const spriteUrl = (isShiny && pokemon.shinySprite) ? pokemon.shinySprite : pokemon.sprite;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Pokeball background decoration */}
        <View style={styles.pokeballDecoration}>
          <View style={styles.pokeballInner} />
        </View>

        {/* Pokemon ID */}
        <Text style={styles.pokemonId}>
          #{pokemon.id.toString().padStart(3, '0')}
        </Text>

        {/* Pokemon Image */}
        <Image
          source={{ uri: spriteUrl }}
          style={styles.pokemonImage}
          contentFit="contain"
          transition={300}
          cachePolicy="memory-disk"
        />

        {/* Pokemon Name */}
        <Text style={styles.pokemonName}>
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </Text>

        {/* Type Badges */}
        <View style={styles.typesContainer}>
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} size="small" />
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 235,
    position: 'relative',
    overflow: 'hidden',
  },
  pokeballDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pokemonId: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  pokemonImage: {
    width: '100%',
    height: 90,
    marginVertical: 4,
  },
  pokemonName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 6,
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export default memo(PokemonCard);
