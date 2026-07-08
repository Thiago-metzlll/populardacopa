import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMarketAlbums } from '../hooks/useMarketAlbums';
import { useBuyStickerPack } from '../hooks/useBuyStickerPack';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { Ionicons } from '@expo/vector-icons';

export const TelaMercado: React.FC = () => {
  const router = useRouter();
  const { albums, coins, loading: loadingMarket, error: marketError, refetch } = useMarketAlbums();
  
  const { buyPack, loading: buying, error: buyError } = useBuyStickerPack((result) => {
    refetch();
    Alert.alert(
      'Compra Realizada!',
      'Você adquiriu um pacotinho com 3 figurinhas. Deseja abrir agora?',
      [
        {
          text: 'Mais Tarde',
          style: 'cancel',
        },
        {
          text: 'Abrir Pacote',
          onPress: () => {
            // Navigate to packet opening screen (Phase 3)
            router.push(`/abrir-pacote/${result.packId}`);
          },
        },
      ]
    );
  });

  const handleBuy = async (albumId: string, cost: number) => {
    if (coins < cost) {
      Alert.alert('Saldo Insuficiente', 'Você não tem moedas suficientes para comprar este pacote.');
      return;
    }
    await buyPack(albumId, cost);
  };

  if (loadingMarket) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (marketError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {marketError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Coins Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.bannerTitle}>Mercado de Pacotes</Text>
        <View style={styles.coinsContainer}>
          <Ionicons name="wallet-outline" size={18} color="#FFD700" />
          <Text style={styles.coinsText}>{coins} moedas</Text>
        </View>
      </View>

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const progressPercent = item.totalStickers > 0 
            ? ((item.ownedStickersCount / item.totalStickers) * 100).toFixed(0)
            : '0';

          return (
            <View style={styles.albumCard}>
              <View style={styles.albumHeader}>
                <Ionicons name="albums-outline" size={24} color={colors.primary} />
                <View style={styles.albumTitleContainer}>
                  <Text style={styles.albumName}>{item.name}</Text>
                  <Text style={styles.albumProgress}>
                    Progresso: {item.ownedStickersCount}/{item.totalStickers} ({progressPercent}%)
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(100, Math.max(0, parseFloat(progressPercent)))}%` }
                  ]} 
                />
              </View>

              <View style={styles.purchaseRow}>
                <View style={styles.priceContainer}>
                  <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.priceText}>{item.price || 50} moedas</Text>
                </View>

                <TouchableOpacity
                  style={[styles.buyButton, buying && styles.buyButtonDisabled]}
                  onPress={() => handleBuy(item.id, item.price || 50)}
                  disabled={buying}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyButtonText}>COMPRAR PACOTE</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum álbum disponível no mercado.</Text>
        }
      />
      {buyError && <Text style={styles.buyErrorText}>{buyError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bannerTitle: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  coinsText: {
    ...typography.body,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  albumCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  albumTitleContainer: {
    flex: 1,
  },
  albumName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  albumProgress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#1E1E24',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#333',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    ...typography.caption,
    color: '#0D0D0D',
    fontWeight: 'bold',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  buyErrorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    padding: spacing.md,
  },
});
