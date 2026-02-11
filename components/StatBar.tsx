import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { STAT_COLORS, STAT_NAMES } from '../constants/pokemon';

interface StatBarProps {
  statName: string;
  value: number;
  maxValue?: number;
  delay?: number;
}

const StatBar: React.FC<StatBarProps> = ({
  statName,
  value,
  maxValue = 255,
  delay = 0,
}) => {
  const progress = useSharedValue(0);
  const percentage = Math.min((value / maxValue) * 100, 100);
  const color = STAT_COLORS[statName] || '#888';
  const displayName = STAT_NAMES[statName] || statName;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(percentage, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const animatedValueStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0 ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.statName}>{displayName}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.barContainer}>
        <View style={styles.barBackground} />
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.barShine,
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 12,
  },
  statName: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    width: 35,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  barShine: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    position: 'absolute',
    left: 0,
    top: 2,
  },
});

export default memo(StatBar);
