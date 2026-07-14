import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useStickerDetail } from '../hooks/useStickerDetail';
import { useBuyIndividualSticker } from '../hooks/useBuyIndividualSticker';
import { colors, spacing, typography, radius, rarityColors } from '../../../../shared/presentation/theme';

export const TelaCompraFigurinha: React.FC = () => {
  const { stickerId } = useLocalSearchParams<{ stickerId: string }>();
  const { sticker, owned, loading, error, refetch } = useStickerDetail(stickerId || '');
  const { buySticker, loading: buying, error: buyError } = useBuyIndividualSticker(() => {
    refetch();
    Alert.alert('Compra realizada!', 'A figurinha foi adicionada à sua coleção.');
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !sticker) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {error ?? 'Figurinha não encontrada'}</Text>
      </View>
    );
  }

  const rarity = rarityColors[sticker.rarity];

  const handleBuy = () => {
    buySticker(sticker.id, sticker.price);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: rarity.border }]}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: sticker.imageUrl }} style={styles.image} contentFit="cover" />
          <View style={[styles.badge, { backgroundColor: rarity.badgeBg }]}>
            <Text style={[styles.badgeText, { color: rarity.badgeText }]}>{rarity.label}</Text>
          </View>
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.name}>{sticker.playerName}</Text>

          {owned ? (
            <View style={styles.ownedRow}>
              <Text style={styles.ownedText}>Já está na sua coleção</Text>
            </View>
          ) : (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>PREÇO ATUAL</Text>
                <Text style={styles.priceValue}>{sticker.price}</Text>
              </View>

              <TouchableOpacity
                style={[styles.buyButton, buying && styles.buyButtonDisabled]}
                onPress={handleBuy}
                disabled={buying}
                activeOpacity={0.85}
              >
                <Text style={styles.buyButtonText}>{buying ? 'Comprando...' : 'Comprar Agora'}</Text>
              </TouchableOpacity>
            </>
          )}

          {buyError && <Text style={styles.buyErrorText}>{buyError}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 3,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1A1A1E',
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  badgeText: { ...typography.caption, fontWeight: 'bold', textTransform: 'uppercase' },
  infoArea: { padding: spacing.lg, gap: spacing.md },
  name: { ...typography.heading, fontSize: 28, color: colors.textPrimary },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { ...typography.caption, color: colors.secondary, fontWeight: 'bold' },
  priceValue: { ...typography.heading, fontSize: 32, color: colors.secondary },
  buyButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buyButtonDisabled: { opacity: 0.5 },
  buyButtonText: { ...typography.subheading, color: '#1A1A1E', fontWeight: 'bold', textTransform: 'uppercase' },
  ownedRow: { alignItems: 'center', paddingVertical: spacing.md },
  ownedText: { ...typography.subheading, color: colors.primary, fontWeight: 'bold' },
  buyErrorText: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
