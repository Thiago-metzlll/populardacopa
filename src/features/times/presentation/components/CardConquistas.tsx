import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardConquistasProps {
  worldCupWins: number;
  titles: string[];
}

export const CardConquistas: React.FC<CardConquistasProps> = ({ worldCupWins, titles }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Títulos Mundiais</Text>
        <Text style={styles.count}>{worldCupWins}</Text>
      </View>
      {titles.length > 0 && (
        <View style={styles.yearsContainer}>
          {titles.map((year, index) => (
            <View key={index} style={styles.yearChip}>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  count: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
  },
  yearsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  yearChip: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#444',
  },
  yearText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
});
