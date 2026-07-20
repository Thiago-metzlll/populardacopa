import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { useDailyCoinsReward } from '../hooks/useDailyCoinsReward';

function formatCountdown(nextAvailableAt: string): string {
  const diffMs = new Date(nextAvailableAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Disponível agora';
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export const CardRecompensaDiaria: React.FC = () => {
  const { status, loading, claiming, error, claim } = useDailyCoinsReward();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) return null;

  return (
    <LinearGradient
      colors={status.available ? ['#2A2600', '#1E1E24'] : ['#1E1E24', '#1E1E24']}
      style={[styles.card, status.available && styles.cardAvailable]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Ionicons
            name="gift"
            size={26}
            color={status.available ? '#FFD700' : colors.textSecondary}
          />
          <View style={styles.texts}>
            <Text style={styles.title}>Recompensa Diária</Text>
            <Text style={styles.subtitle}>
              {status.available
                ? `+${status.amount} moedas grátis!`
                : `Volte em ${formatCountdown(status.nextAvailableAt!)}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.claimButton, !status.available && styles.claimButtonDisabled]}
          onPress={claim}
          disabled={!status.available || claiming}
        >
          {claiming ? (
            <ActivityIndicator color="#0D0D0D" size="small" />
          ) : (
            <Text style={styles.claimButtonText}>
              {status.available ? 'Resgatar' : 'Aguarde'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardAvailable: {
    borderColor: '#FFD700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  texts: {
    flex: 1,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  claimButtonDisabled: {
    backgroundColor: '#333',
  },
  claimButtonText: {
    ...typography.caption,
    color: '#0D0D0D',
    fontWeight: 'bold',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
