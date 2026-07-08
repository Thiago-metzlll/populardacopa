import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Prediction } from '../../domain/entities/Prediction';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardVitoriaProps {
  prediction: Prediction;
  matchLabel?: string;
  phase?: string;
}

export const CardVitoria: React.FC<CardVitoriaProps> = ({
  prediction,
  matchLabel = 'Partida',
  phase = 'Copa do Mundo',
}) => {
  return (
    <View style={styles.card}>
      {/* Result Seal */}
      <View style={styles.sealContainer}>
        <View style={styles.seal}>
          <Text style={styles.sealText}>VITÓRIA</Text>
        </View>
      </View>

      {/* Match Label & Phase */}
      <View style={styles.header}>
        <Text style={styles.phase}>{phase}</Text>
        <Text style={styles.matchLabel}>{matchLabel}</Text>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>SEU PALPITE</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            {prediction.predictedHomeScore} × {prediction.predictedAwayScore}
          </Text>
        </View>
      </View>

      {/* Reward */}
      <View style={styles.rewardRow}>
        <Text style={styles.rewardIcon}>🎁</Text>
        <Text style={styles.rewardText}>{prediction.reward.description}</Text>
      </View>

      {/* Date */}
      <Text style={styles.dateText}>
        {new Date(prediction.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(180, 255, 0, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sealContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  seal: {
    backgroundColor: 'rgba(180, 255, 0, 0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sealText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  header: {
    marginBottom: spacing.sm,
    paddingRight: 80,
  },
  phase: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  matchLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreBox: {
    backgroundColor: '#1E1E24',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.caption,
    color: '#555',
    marginTop: 2,
  },
});
