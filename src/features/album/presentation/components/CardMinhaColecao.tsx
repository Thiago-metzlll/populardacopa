import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface CardMinhaColecaoProps {
  progress: number;
}

export const CardMinhaColecao: React.FC<CardMinhaColecaoProps> = ({ progress }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Minhas Figurinhas</Text>
      <Text style={styles.progress}>{progress.toFixed(0)}/100</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
  title: { ...typography.subheading, color: colors.textPrimary },
  progress: { ...typography.heading, color: colors.primary, marginTop: spacing.sm }
});
