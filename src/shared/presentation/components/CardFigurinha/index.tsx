import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from '../../../../features/album/domain/entities/Sticker';
import { MolduraIndividualPais } from '../MolduraIndividualPais';
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
    rarityGradient = ['#B55A1A', '#C67A1A'];
    rarityBorder = '#FFB84D';
  } else if (sticker.rarity === 'lendaria') {
    rarityGradient = ['#3A1C71', '#D76D77', '#FFAF7B'];
    rarityBorder = colors.primary;
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
            {sticker.rarity.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.idText}>#{sticker.id.replace('s', '')}</Text>
      </View>

      {isFull ? (
        <View style={styles.bodyFull}>
          {sticker.teamId && (
            <MolduraIndividualPais teamId={sticker.teamId} size="md" showBorder={sticker.rarity === 'lendaria'} />
          )}
          <Text style={styles.stickerTitle}>Figurinha Especial</Text>
          <Text style={styles.dateText}>
            {sticker.obtainedAt ? new Date(sticker.obtainedAt).toLocaleDateString('pt-BR') : 'N/A'}
          </Text>
        </View>
      ) : (
        <View style={styles.bodyCompact}>
          {sticker.teamId && (
            <MolduraIndividualPais teamId={sticker.teamId} size="sm" />
          )}
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
    height: 160,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  cardCompact: {
    width: 80,
    height: 110,
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
    fontSize: 8,
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
  },
  bodyCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stickerTitle: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 9,
    color: '#A0A0A0',
    marginTop: 2,
  },
});
