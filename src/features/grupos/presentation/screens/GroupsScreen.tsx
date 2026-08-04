import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Group, GroupStanding } from '../../domain/entities/Group';
import { useGroups } from '../hooks/useGroups';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

// Os dois primeiros de cada grupo avançam de fase.
const QUALIFYING_SPOTS = 2;

const StandingRow: React.FC<{ standing: GroupStanding; position: number }> = ({
  standing,
  position,
}) => {
  const router = useRouter();
  const qualified = position <= QUALIFYING_SPOTS;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/times/${standing.teamId}`)}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${position}º lugar, ${standing.teamName}, ${standing.points} pontos`}
    >
      <View style={[styles.qualifyBar, qualified && styles.qualifyBarActive]} />
      <Text style={styles.position}>{position}</Text>
      <MolduraIndividualPais teamId={standing.teamId} size="sm" />
      <Text style={styles.teamName} numberOfLines={1}>
        {standing.teamName}
      </Text>
      <Text style={styles.stat}>{standing.matchesPlayed}</Text>
      <Text style={styles.stat}>{standing.wins}</Text>
      <Text style={styles.stat}>{standing.draws}</Text>
      <Text style={styles.stat}>{standing.losses}</Text>
      <Text style={styles.statWide}>
        {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
      </Text>
      <Text style={styles.points}>{standing.points}</Text>
    </TouchableOpacity>
  );
};

const GroupCard: React.FC<{ group: Group }> = ({ group }) => (
  <View style={styles.groupCard}>
    <Text style={styles.groupTitle}>{group.name}</Text>

    <View style={styles.headerRow}>
      <View style={styles.qualifyBar} />
      <Text style={styles.position} />
      <View style={styles.headerFlagSpacer} />
      <Text style={styles.headerLabelTeam}>TIME</Text>
      <Text style={styles.headerLabel}>J</Text>
      <Text style={styles.headerLabel}>V</Text>
      <Text style={styles.headerLabel}>E</Text>
      <Text style={styles.headerLabel}>D</Text>
      <Text style={styles.headerLabelWide}>SG</Text>
      <Text style={styles.headerLabelPoints}>P</Text>
    </View>

    {group.standings.map((standing, index) => (
      <StandingRow key={standing.teamId} standing={standing} position={index + 1} />
    ))}
  </View>
);

const Legend = () => (
  <View style={styles.legend}>
    <View style={[styles.qualifyBar, styles.qualifyBarActive, styles.legendBar]} />
    <Text style={styles.legendText}>Classificados para a próxima fase</Text>
  </View>
);

const EmptyState = () => (
  <View style={styles.center}>
    <Text style={styles.emptyText}>Nenhum grupo disponível ainda.</Text>
  </View>
);

export const GroupsScreen = () => {
  const { groups, loading, refreshing, error, refetch } = useGroups();

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
        <Text style={styles.errorText}>Não foi possível carregar os grupos.</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.8}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GroupCard group={item} />}
      ListHeaderComponent={groups.length > 0 ? <Legend /> : null}
      ListEmptyComponent={<EmptyState />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
};

// Larguras fixas mantêm o cabeçalho e as linhas alinhados na mesma grade —
// sem isso as colunas dançam conforme o número de dígitos de cada time.
const STAT_WIDTH = 22;
const STAT_WIDE_WIDTH = 30;
const POINTS_WIDTH = 26;
const FLAG_SIZE = 32;

const statBase = {
  ...typography.body,
  width: STAT_WIDTH,
  textAlign: 'center' as const,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorText: { ...typography.subheading, color: colors.textPrimary, textAlign: 'center' },
  errorDetail: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: { ...typography.body, color: '#0D0D0D', fontWeight: 'bold' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legendBar: { height: 12 },
  legendText: { ...typography.caption, color: colors.textSecondary },

  groupCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  groupTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerFlagSpacer: { width: FLAG_SIZE },
  headerLabelTeam: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    letterSpacing: 1,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: STAT_WIDTH,
    textAlign: 'center',
  },
  headerLabelWide: {
    ...typography.caption,
    color: colors.textSecondary,
    width: STAT_WIDE_WIDTH,
    textAlign: 'center',
  },
  headerLabelPoints: {
    ...typography.caption,
    color: colors.primary,
    width: POINTS_WIDTH,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  qualifyBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  qualifyBarActive: { backgroundColor: colors.primary },
  position: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 14,
    textAlign: 'center',
  },
  teamName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  stat: { ...statBase, color: colors.textSecondary },
  statWide: { ...statBase, color: colors.textSecondary, width: STAT_WIDE_WIDTH },
  points: {
    ...statBase,
    width: POINTS_WIDTH,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
