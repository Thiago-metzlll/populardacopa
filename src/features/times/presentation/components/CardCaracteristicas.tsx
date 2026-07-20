import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface StatItemProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={22} color={colors.primary} style={styles.statIcon} />
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
        <StatItem label="Gols" value={goals} icon="football" />
        <StatItem label="Assistências" value={assists} icon="locate" />
        <StatItem label="Partidas" value={matchesPlayed} icon="clipboard" />
        <StatItem label="Copas" value={worldCupsPlayed} icon="trophy" />
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
