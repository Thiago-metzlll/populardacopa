import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from '../../../../features/album/domain/entities/Sticker';
import { colors, spacing, typography, radius } from '../../theme';

interface CardFigurinhaProps {
  sticker: Sticker;
  onPress?: () => void;
  size?: 'compact' | 'full';
  selected?: boolean;
}

export const CardFigurinha: React.FC<CardFigurinhaProps> = ({
  sticker,
  onPress,
  size = 'full',
  selected = false,
}) => {
  const isFull = size === 'full';
  
  let rarityGradient: [string, string, ...string[]] = ['#3A3A40', '#24242B'];
  let rarityBorder = '#555';

  if (sticker.rarity === 'rara') {
    rarityGradient = ['#1a1a4e', '#24242B'];
    rarityBorder = '#4488FF';
  } else if (sticker.rarity === 'lendaria') {
    rarityGradient = ['#3d2000', '#24242B'];
    rarityBorder = '#FFD700';
  }

  const cardContent = (
    <LinearGradient
      colors={rarityGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        isFull ? styles.cardFull : styles.cardCompact,
        { borderColor: rarityBorder },
        selected && styles.selectedBorder,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.rarityBadge, { backgroundColor: rarityBorder }]}>
          <Text style={[styles.rarityText, { color: sticker.rarity === 'lendaria' ? '#1A1A1E' : '#FFF' }]}>
            {sticker.rarity === 'lendaria' ? '★' : sticker.rarity === 'rara' ? '●' : '○'}
          </Text>
        </View>
        <Text style={styles.idText}>#{sticker.id.replace('s', '')}</Text>
      </View>

      {isFull ? (
        <View style={styles.bodyFull}>
          <View style={[styles.imageContainer, { borderColor: rarityBorder }]}>
            <Image
              source={{ uri: sticker.imageUrl }}
              style={styles.playerImage}
              contentFit="cover"
              transition={200}
            />
          </View>
          <Text style={styles.stickerTitle} numberOfLines={2}>{sticker.playerName}</Text>
          <Text style={styles.dateText}>
            {sticker.obtainedAt ? new Date(sticker.obtainedAt).toLocaleDateString('pt-BR') : 'N/A'}
          </Text>
        </View>
      ) : (
        <View style={styles.bodyCompact}>
          <View style={styles.imageContainerCompact}>
            <Image
              source={{ uri: sticker.imageUrl }}
              style={styles.playerImage}
              contentFit="cover"
              transition={200}
            />
          </View>
          <Text style={styles.stickerTitleCompact} numberOfLines={1}>{sticker.playerName}</Text>
        </View>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cardFull: {
    width: 120,
    height: 170,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  cardCompact: {
    width: 80,
    height: 115,
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  selectedBorder: {
    borderColor: '#B4FF00',
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  idText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  bodyFull: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: spacing.xs,
    gap: 4,
  },
  bodyCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
  },
  imageContainer: {
    width: 70,
    height: 80,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#1A1A1E',
  },
  imageContainerCompact: {
    width: 46,
    height: 52,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#1A1A1E',
  },
  playerImage: {
    width: '100%',
    height: '100%',
  },
  stickerTitle: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  stickerTitleCompact: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 7,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 8,
    color: '#A0A0A0',
  },
});
