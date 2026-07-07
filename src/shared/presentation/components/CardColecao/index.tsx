import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';

interface CardColecaoProps {
  progress: number;
  total?: number;
  title?: string;
}

export const CardColecao: React.FC<CardColecaoProps> = ({ 
  progress, 
  total = 100, 
  title = "Minhas Figurinhas" 
}) => {
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);

  return (
    <LinearGradient
      colors={['#8A9E1F', '#B55A1A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="albums-outline" size={20} color="#1E1E24" />
      </View>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Coleção Atual</Text>
          <Text style={styles.progressValue}>{progress.toFixed(0)}/{total}</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C67A1A',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: '#1E1E24',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: '#1E1E24',
    fontWeight: 'bold',
  },
  progressValue: {
    ...typography.caption,
    color: '#1E1E24',
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
