import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#fff',
  message,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.pokeballContainer}>
        <View style={[styles.pokeballTop, { borderColor: color }]} />
        <View style={[styles.pokeballLine, { backgroundColor: color }]} />
        <View style={[styles.pokeballBottom, { borderColor: color }]} />
        <View style={[styles.pokeballCenter, { borderColor: color }]}>
          <ActivityIndicator size={size} color={color} />
        </View>
      </View>
      {message && <Text style={[styles.message, { color }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pokeballContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballTop: {
    position: 'absolute',
    top: 0,
    width: 100,
    height: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 4,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  pokeballLine: {
    position: 'absolute',
    width: 100,
    height: 4,
  },
  pokeballBottom: {
    position: 'absolute',
    bottom: 0,
    width: 100,
    height: 50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderWidth: 4,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  pokeballCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default memo(LoadingSpinner);
