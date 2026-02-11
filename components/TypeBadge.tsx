import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TYPE_COLORS, TYPE_ICONS } from '../constants/pokemon';
import { PokemonType } from '../types/pokemon';

interface TypeBadgeProps {
  type: PokemonType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  size = 'small',
  showIcon = false,
}) => {
  const backgroundColor = TYPE_COLORS[type];
  
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10 },
    medium: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12 },
    large: { paddingHorizontal: 16, paddingVertical: 7, fontSize: 14 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      {showIcon && <Text style={styles.icon}>{TYPE_ICONS[type]}</Text>}
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {type.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    fontSize: 12,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default memo(TypeBadge);
