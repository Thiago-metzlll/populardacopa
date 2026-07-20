import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTimesScreen } from '../hooks/useTimesScreen';
import { SearchInput } from '../components/SearchInput';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { Team } from '../../domain/entities/Team';

interface TeamCardProps {
  team: Team;
  showLoggedIn: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, showLoggedIn, onPress, onToggleFavorite }) => (
  <TouchableOpacity style={styles.teamCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankBadgeText}>#{team.ranking}</Text>
    </View>

    {showLoggedIn && (
      <TouchableOpacity
        style={styles.favoriteToggle}
        onPress={onToggleFavorite}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={team.isFavorite ? 'star' : 'star-outline'}
          size={18}
          color={team.isFavorite ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    )}

    <MolduraIndividualPais teamId={team.id} size="lg" showBorder={team.isFavorite} />
    <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>

    {team.worldCupWins > 0 && (
      <View style={styles.titlesRow}>
        <Ionicons name="trophy" size={11} color={colors.textSecondary} />
        <Text style={styles.titlesText}>{team.worldCupWins}x campeão</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const TimesScreen = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const { allTeams, favoriteTeams, loading, error, search, toggleFavorite } = useTimesScreen();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      search(query);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const renderGrid = (teams: Team[]) => (
    <View style={styles.grid}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          showLoggedIn={!!user}
          onPress={() => router.push(`/times/${team.id}`)}
          onToggleFavorite={() => toggleFavorite(team.id)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchInput value={query} onChangeText={setQuery} />

      {!user && (
        <TouchableOpacity
          style={styles.loginBanner}
          onPress={() => router.push('/entrar')}
          activeOpacity={0.85}
        >
          <View style={styles.loginBannerLeft}>
            <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
            <Text style={styles.loginBannerText}>
              Faça login para salvar seus times favoritos
            </Text>
          </View>
          <View style={styles.loginBannerCtaRow}>
            <Text style={styles.loginBannerCta}>Entrar</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {user && favoriteTeams.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="star" size={13} color={colors.textSecondary} />
                <Text style={styles.sectionHeaderText}>Meus Times</Text>
              </View>
              {renderGrid(favoriteTeams)}
            </>
          )}

          <View style={styles.sectionHeaderRow}>
            <Ionicons name="earth" size={13} color={colors.textSecondary} />
            <Text style={styles.sectionHeaderText}>Todos os Times</Text>
          </View>

          {allTeams.length > 0 ? (
            renderGrid(allTeams)
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum time encontrado.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeaderText: {
    ...typography.subheading,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teamCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E38',
    gap: spacing.sm,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 10,
  },
  favoriteToggle: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  teamName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  titlesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titlesText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  loginBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  loginBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  loginBannerCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: spacing.sm,
  },
  loginBannerText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  loginBannerCta: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '700',
  },
});
