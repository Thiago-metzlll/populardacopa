import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAlbumStickers } from '../hooks/useAlbumStickers';
import { StickerCard } from '../components/StickerCard';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';

export const TelaCompraColecao: React.FC = () => {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const router = useRouter();
  const { album, stickers, ownedIds, loading, error } = useAlbumStickers(albumId || '');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !album) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {error ?? 'Álbum não encontrado'}</Text>
      </View>
    );
  }

  const ownedCount = stickers.filter((s) => ownedIds.has(s.id)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.albumName}>{album.name}</Text>
        <Text style={styles.progress}>{ownedCount}/{stickers.length} coletados</Text>
      </View>

      <FlatList
        data={stickers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StickerCard
            sticker={item}
            owned={ownedIds.has(item.id)}
            onPress={() => router.push(`/figurinha/${item.id}`)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  header: { padding: spacing.md },
  albumName: { ...typography.heading, color: colors.textPrimary },
  progress: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  listContent: { padding: spacing.md, gap: spacing.md },
  row: { gap: spacing.md },
});
