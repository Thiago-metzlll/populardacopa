import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../domain/entities/Sticker';
import { colors, spacing, typography, radius, rarityColors } from '../../../../shared/presentation/theme';

interface StickerCardProps {
  sticker: Sticker;
  owned: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StickerCard: React.FC<StickerCardProps> = ({ sticker, owned, onPress, style }) => {
  const rarity = rarityColors[sticker.rarity];

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: rarity.border }, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: sticker.imageUrl }} style={styles.image} contentFit="cover" />
        {!owned && (
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={20} color={colors.textPrimary} />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: rarity.badgeBg }]}>
          <Text style={[styles.badgeText, { color: rarity.badgeText }]}>{rarity.label}</Text>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>{sticker.playerName}</Text>

      {!owned && (
        <View style={styles.priceRow}>
          <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.priceText}>{sticker.price} moedas</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#1A1A1E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    marginTop: 2,
  },
  priceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
