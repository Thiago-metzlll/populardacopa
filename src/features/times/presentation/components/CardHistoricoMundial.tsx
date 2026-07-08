import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerEditionRecord } from '../../domain/entities/Player';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardHistoricoMundialProps {
  history: PlayerEditionRecord[];
}

const resultColor = (result: string): string => {
  const lower = result.toLowerCase();
  if (lower.includes('campeão')) return '#FFD700';
  if (lower.includes('vice')) return '#C0C0C0';
  if (lower.includes('semi')) return colors.secondary;
  return colors.textSecondary;
};

export const CardHistoricoMundial: React.FC<CardHistoricoMundialProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>WORLD CUP HISTORY</Text>
        <Text style={styles.emptyText}>Nenhuma participação em Copas registrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>WORLD CUP HISTORY</Text>
      {history.map((record, index) => (
        <View
          key={`${record.edition}-${index}`}
          style={[styles.row, index < history.length - 1 && styles.rowBorder]}
        >
          <View style={styles.editionBadge}>
            <Text style={styles.editionText}>{record.edition}</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.teamText}>{record.team}</Text>
            <Text style={[styles.resultText, { color: resultColor(record.result) }]}>
              {record.result}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#2E2E38',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E38',
  },
  editionBadge: {
    backgroundColor: '#1E1E24',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 110,
  },
  editionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rowRight: {
    flex: 1,
  },
  teamText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  resultText: {
    ...typography.caption,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
