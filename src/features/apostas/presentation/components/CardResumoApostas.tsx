import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardResumoApostasProps {
  totalPalpites: number;
  winPercentage: number;
}

export const CardResumoApostas: React.FC<CardResumoApostasProps> = ({
  totalPalpites,
  winPercentage,
}) => {
  return (
    <View style={styles.row}>
      {/* Total de Palpites */}
      <View style={[styles.card, styles.cardLeft]}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.value}>{totalPalpites}</Text>
        <Text style={styles.label}>TOTAL DE{'\n'}PALPITES</Text>
      </View>

      {/* % de Vitórias */}
      <View style={[styles.card, styles.cardRight]}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={[styles.value, { color: winPercentage >= 50 ? colors.primary : colors.secondary }]}>
          {winPercentage}%
        </Text>
        <Text style={styles.label}>% DE{'\n'}VITÓRIAS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E38',
  },
  cardLeft: {
    borderTopColor: colors.primary,
    borderTopWidth: 2,
  },
  cardRight: {
    borderTopColor: colors.secondary,
    borderTopWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.8,
    fontWeight: 'bold',
  },
});
