import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProcessedEvolution } from '../types/pokemon';

interface EvolutionChainProps {
  evolutions: ProcessedEvolution[];
  currentPokemonId: number;
}

const EvolutionChain: React.FC<EvolutionChainProps> = ({
  evolutions,
  currentPokemonId,
}) => {
  const router = useRouter();

  if (evolutions.length <= 1) {
    return (
      <View style={styles.noEvolutionContainer}>
        <Text style={styles.noEvolutionText}>
          This Pokémon does not evolve.
        </Text>
      </View>
    );
  }

  const handlePress = (id: number) => {
    if (id !== currentPokemonId) {
      router.push(`/pokemon/${id}`);
    }
  };

  return (
    <View style={styles.container}>
      {evolutions.map((evolution, index) => (
        <React.Fragment key={evolution.id}>
          {index > 0 && (
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color="#666" />
              {evolution.minLevel && (
                <Text style={styles.levelText}>Lv. {evolution.minLevel}</Text>
              )}
              {evolution.item && (
                <Text style={styles.levelText}>{evolution.item}</Text>
              )}
            </View>
          )}
          <Pressable
            onPress={() => handlePress(evolution.id)}
            style={[
              styles.evolutionItem,
              evolution.id === currentPokemonId && styles.currentEvolution,
            ]}
          >
            <Image
              source={{ uri: evolution.sprite }}
              style={styles.evolutionImage}
              contentFit="contain"
              transition={200}
            />
            <Text style={styles.evolutionName}>
              {evolution.name.charAt(0).toUpperCase() + evolution.name.slice(1)}
            </Text>
            <Text style={styles.evolutionId}>
              #{evolution.id.toString().padStart(3, '0')}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 16,
    gap: 8,
  },
  noEvolutionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEvolutionText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  evolutionItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 90,
  },
  currentEvolution: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  evolutionImage: {
    width: 70,
    height: 70,
  },
  evolutionName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  evolutionId: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
});

export default memo(EvolutionChain);
