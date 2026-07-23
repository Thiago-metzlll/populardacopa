import React, { useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAllStickers } from '../hooks/useAllStickers';
import { StickerCard } from '../components/StickerCard';
import { colors, spacing, typography, rarityColors } from '../../../../shared/presentation/theme';

export const TelaTodasFigurinhas: React.FC = () => {
  const router = useRouter();
  const { sections, ownedIds, loading, error, refetch } = useAllStickers();

  // Recarrega ao voltar de outra tela (ex.: após abrir um pacote)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sections.map((section) => {
        const rarity = rarityColors[section.rarity];
        return (
          <View key={section.rarity} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionBar, { backgroundColor: rarity.border }]} />
                <Text style={[styles.sectionTitle, { color: rarity.border }]}>{rarity.label}s</Text>
              </View>
              <Text style={styles.sectionCount}>{section.ownedCount}/{section.totalCount}</Text>
            </View>

            <FlatList
              data={section.stickers}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stickerList}
              renderItem={({ item }) => (
                <StickerCard
                  sticker={item}
                  owned={ownedIds.has(item.id)}
                  onPress={() => router.push(`/figurinha/${item.id}`)}
                  style={styles.stickerCard}
                />
              )}
            />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  content: { paddingVertical: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionBar: { width: 6, height: 22, borderRadius: 3 },
  sectionTitle: { ...typography.heading, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  sectionCount: { ...typography.caption, color: colors.textSecondary, fontWeight: 'bold' },
  stickerList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  stickerCard: { width: 130 },
});
