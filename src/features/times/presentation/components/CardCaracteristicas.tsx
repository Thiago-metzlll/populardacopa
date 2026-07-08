import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <View style={styles.statItem}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface CardCaracteristicasProps {
  goals: number;
  assists: number;
  matchesPlayed: number;
  worldCupsPlayed: number;
}

export const CardCaracteristicas: React.FC<CardCaracteristicasProps> = ({
  goals,
  assists,
  matchesPlayed,
  worldCupsPlayed,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>ESTATÍSTICAS</Text>
      <View style={styles.grid}>
        <StatItem label="Gols" value={goals} icon="⚽" />
        <StatItem label="Assistências" value={assists} icon="🎯" />
        <StatItem label="Partidas" value={matchesPlayed} icon="📋" />
        <StatItem label="Copas" value={worldCupsPlayed} icon="🏆" />
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#1E1E24',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
