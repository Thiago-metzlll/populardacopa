import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prediction } from '../../domain/entities/Prediction';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardDerrotaProps {
  prediction: Prediction;
  matchLabel?: string;
  phase?: string;
}

export const CardDerrota: React.FC<CardDerrotaProps> = ({
  prediction,
  matchLabel = 'Partida',
  phase = 'Copa do Mundo',
}) => {
  return (
    <View style={styles.card}>
      {/* Result Seal */}
      <View style={styles.sealContainer}>
        <View style={styles.seal}>
          <Text style={styles.sealText}>DERROTA</Text>
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

      {/* Reward (pending/not earned) */}
      <View style={styles.rewardRow}>
        <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
        <Text style={styles.rewardText}>Recompensa não obtida</Text>
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
    borderColor: 'rgba(255, 107, 53, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  sealContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  seal: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  sealText: {
    ...typography.caption,
    color: colors.secondary,
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
    borderColor: colors.secondary,
  },
  scoreText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
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
