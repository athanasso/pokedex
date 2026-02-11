import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MoveSlot } from '../types/pokemon';

interface MovesListProps {
  moves: MoveSlot[];
  maxMoves?: number;
}

const MovesList: React.FC<MovesListProps> = ({ moves, maxMoves = 20 }) => {
  const displayMoves = moves.slice(0, maxMoves);

  const formatMoveName = (name: string) => {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.movesGrid}>
          {displayMoves.map((moveSlot, index) => (
            <View key={moveSlot.move.name} style={styles.moveItem}>
              <Text style={styles.moveName}>
                {formatMoveName(moveSlot.move.name)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      {moves.length > maxMoves && (
        <Text style={styles.moreText}>
          +{moves.length - maxMoves} more moves
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  movesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 700,
  },
  moveItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moveName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default memo(MovesList);
