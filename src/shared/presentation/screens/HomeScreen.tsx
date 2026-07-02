import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../../../features/album/presentation/hooks/useUserProfile';
import { CardMinhaColecao } from '../../../features/album/presentation/components/CardMinhaColecao';
import { useUpcomingMatches } from '../../../features/apostas/presentation/hooks/useUpcomingMatches';
import { ContainerAposta } from '../../../features/apostas/presentation/components/ContainerAposta';
import { colors, spacing, typography, radius } from '../theme';

export const HomeScreen = () => {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const { matches, loading: matchesLoading } = useUpcomingMatches();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bem-vindo!</Text>

      <TouchableOpacity onPress={() => router.push('/apostas' as any)} style={styles.touchableCard}>
        <Text style={styles.cardTitle}>Partidas Atuais</Text>
        {matchesLoading ? (
          <ActivityIndicator style={{ padding: spacing.md }} color={colors.primary} />
        ) : matches.length > 0 ? (
          <ContainerAposta match={matches[0]} />
        ) : (
          <Text style={styles.placeholderText}>Nenhuma partida no momento</Text>
        )}
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/times' as any)}>
          <Text style={styles.navText}>Times</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/grupos' as any)}>
          <Text style={styles.navText}>Grupos</Text>
        </TouchableOpacity>
      </View>

      {profileLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : profile ? (
        <CardMinhaColecao progress={profile.collection.stickerIds.length} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  header: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  touchableCard: { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
  cardTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm, padding: spacing.md, paddingBottom: 0 },
  placeholderText: { ...typography.body, color: colors.textSecondary, padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  navCard: { flex: 1, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, marginHorizontal: spacing.xs, alignItems: 'center' },
  navText: { ...typography.subheading, color: colors.textPrimary },
  loader: { marginVertical: spacing.lg }
});
