import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerDetail } from '../hooks/usePlayerDetail';
import { CardCaracteristicas } from '../components/CardCaracteristicas';
import { CardHistoricoMundial } from '../components/CardHistoricoMundial';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

const AWARD_COLORS: Record<string, string> = {
  'ARTILHEIRO': '#FF6B35',
  'MVP': '#B4FF00',
  'MELHOR JOGADOR': '#FFD700',
  'MELHOR GOLEIRO': '#4FC3F7',
  'MELHOR JOVEM': '#CE93D8',
  'MELHOR JOVEM': '#CE93D8',
};

export const TelaJogador: React.FC = () => {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { player, loading, error } = usePlayerDetail(playerId || '');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Jogador não encontrado'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <LinearGradient
        colors={['#1E1E2E', '#24242B']}
        style={styles.heroSection}
      >
        {/* Avatar / Photo */}
        <View style={styles.avatarContainer}>
          {player.photoUrl ? (
            <Image
              source={{ uri: player.photoUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>#{player.number}</Text>
          </View>
        </View>

        {/* Name & Position */}
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>

        {/* Country Flag Row */}
        <View style={styles.countryRow}>
          <MolduraIndividualPais teamId={player.teamId} size="sm" showBorder />
        </View>

        {/* Awards Badges */}
        {player.awards && player.awards.length > 0 && (
          <View style={styles.awardsRow}>
            {player.awards.map((award) => (
              <View
                key={award}
                style={[
                  styles.awardBadge,
                  { borderColor: AWARD_COLORS[award] || colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.awardText,
                    { color: AWARD_COLORS[award] || colors.primary },
                  ]}
                >
                  {award}
                </Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Stats & History */}
      <View style={styles.content}>
        <CardCaracteristicas
          goals={player.stats.goals}
          assists={player.stats.assists}
          matchesPlayed={player.stats.matchesPlayed}
          worldCupsPlayed={player.stats.worldCupsPlayed}
        />

        <CardHistoricoMundial history={player.worldCupHistory || []} />
      </View>
    </ScrollView>
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
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    color: colors.primary,
    fontWeight: 'bold',
  },
  numberBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  numberText: {
    ...typography.caption,
    color: '#0D0D0D',
    fontWeight: 'bold',
  },
  playerName: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerPosition: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  countryRow: {
    marginBottom: spacing.md,
  },
  awardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  awardBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  awardText: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  content: {
    padding: spacing.md,
  },
});
