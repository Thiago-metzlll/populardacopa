import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeamDetail } from '../hooks/useTeamDetail';
import { CardConquistas } from '../components/CardConquistas';
import { MoldeJogadores } from '../components/MoldeJogadores';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const TelaTime: React.FC = () => {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const { team, players, loading, error } = useTeamDetail(teamId || '');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Time não encontrado'}</Text>
      </View>
    );
  }

  const handlePlayerPress = (playerId: string) => {
    // Navigate to Player Detail (Phase 3)
    router.push(`/players/${playerId}`);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.infoRow}>
        <MolduraIndividualPais teamId={team.id} size="lg" showBorder />
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{team.name}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Ranking</Text>
              <Text style={styles.badgeValue}>#{team.ranking}</Text>
            </View>
            <View style={[styles.badge, styles.secondaryBadge]}>
              <Text style={styles.badgeLabel}>Aprov.</Text>
              <Text style={styles.badgeValue}>{(team.winRate * 100).toFixed(0)}%</Text>
            </View>
            {team.isUnbeaten && (
              <View style={[styles.badge, styles.unbeatenBadge]}>
                <Text style={styles.unbeatenText}>INVÍCTO</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description}>{team.description}</Text>

      <CardConquistas 
        worldCupWins={team.worldCupWins} 
        titles={team.titles} 
      />

      <Text style={styles.sectionTitle}>Elenco Principal</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <MoldeJogadores 
            player={item} 
            onPress={() => handlePlayerPress(item.id)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum jogador cadastrado para esta seleção.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
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
  headerContainer: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.heading,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333',
    gap: 4,
  },
  secondaryBadge: {
    borderColor: colors.secondary,
  },
  unbeatenBadge: {
    backgroundColor: 'rgba(180, 255, 0, 0.1)',
    borderColor: colors.primary,
  },
  unbeatenText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  badgeValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
