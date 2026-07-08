import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../hooks/useUserProfile';
import { useOpenPackage } from '../hooks/useOpenPackage';
import { CompartilhBtn } from '../components/CompartilhBtn';
import { CardColecao } from '../../../../shared/presentation/components/CardColecao';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const ProfileScreen = () => {
  const router = useRouter();
  const { profile, loading, error, refetch } = useUserProfile();
  const { openPackage, loading: opening } = useOpenPackage(() => refetch());

  if (loading && !profile) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Error: {error}</Text></View>;

  const handleOpenPackage = () => {
    openPackage('pkg_1');
  };

  return (
    <View style={styles.container}>
      {profile && <CardColecao progress={profile.collection.stickerIds.length} />}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.flexButton, opening && styles.buttonDisabled]} 
          onPress={handleOpenPackage} 
          disabled={opening}
        >
          <Text style={styles.buttonText}>{opening ? "Abrindo..." : "Abrir Pacote"}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.flexButton, styles.marketButton]} 
          onPress={() => router.push('/mercado')}
        >
          <Text style={styles.marketButtonText}>Ir ao Mercado</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recentes</Text>
      <FlatList
        data={profile?.recentStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stickersList}
        renderItem={({ item }) => (
          <View style={styles.stickerCard}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
            <CompartilhBtn stickerImageUrl={item.imageUrl} stickerId={item.id} />
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Raras</Text>
      <FlatList
        data={profile?.rareStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stickersList}
        renderItem={({ item }) => (
          <View style={[styles.stickerCard, styles.stickerCardRare]}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
            <CompartilhBtn stickerImageUrl={item.imageUrl} stickerId={item.id} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  flexButton: { flex: 1 },
  button: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.subheading, color: '#0D0D0D', fontWeight: 'bold' },
  marketButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  marketButtonText: { ...typography.subheading, color: colors.primary, fontWeight: 'bold' },
  sectionTitle: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  stickersList: { paddingBottom: spacing.sm },
  stickerCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginRight: spacing.sm, minWidth: 120, alignItems: 'center', justifyContent: 'space-between' },
  stickerCardRare: { borderColor: colors.secondary, borderWidth: 1 },
  stickerText: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  badge: { backgroundColor: colors.secondary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  badgeText: { ...typography.caption, color: colors.textPrimary }
});
