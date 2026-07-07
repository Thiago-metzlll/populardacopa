import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';
import { useOpenPackage } from '../hooks/useOpenPackage';
import { CardColecao } from '../../../../shared/presentation/components/CardColecao';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const ProfileScreen = () => {
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
      
      <TouchableOpacity 
        style={[styles.button, opening && styles.buttonDisabled]} 
        onPress={handleOpenPackage} 
        disabled={opening}
      >
        <Text style={styles.buttonText}>{opening ? "Abrindo..." : "Abrir Pacotinho"}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recentes</Text>
      <FlatList
        data={profile?.recentStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.stickerCard}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Raras</Text>
      <FlatList
        data={profile?.rareStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.stickerCard, styles.stickerCardRare]}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
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
  button: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', marginBottom: spacing.md },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.subheading, color: '#0D0D0D' },
  sectionTitle: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  stickerCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginRight: spacing.sm, minWidth: 100, alignItems: 'center' },
  stickerCardRare: { borderColor: colors.secondary, borderWidth: 1 },
  stickerText: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  badge: { backgroundColor: colors.secondary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  badgeText: { ...typography.caption, color: colors.textPrimary }
});
