import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { pendingPackStore, FREE_PACK_PREFIX } from '../../infra/stores/pendingPackStore';
import { useFreePackage } from '../hooks/useFreePackage';

function formatCountdown(nextAvailableAt: string): string {
  const diffMs = new Date(nextAvailableAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Disponível agora';
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

interface CardPacoteGratisProps {
  onClaimed?: () => void;
}

export const CardPacoteGratis: React.FC<CardPacoteGratisProps> = ({ onClaimed }) => {
  const router = useRouter();
  const { status, loading, claiming, error, claim } = useFreePackage();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) return null;

  const handleClaim = async () => {
    const stickers = await claim();
    if (stickers && stickers.length > 0) {
      onClaimed?.();
      // O pacote grátis reaproveita a tela de reveal do pacote comprado: as
      // figurinhas já foram sorteadas e persistidas pelo claim, então vão para
      // o pendingPackStore e a tela apenas as revela (sem sortear de novo).
      const packId = `${FREE_PACK_PREFIX}${Date.now()}`;
      pendingPackStore.set(packId, stickers);
      router.push(`/abrir-pacote/${packId}`);
    }
  };

  return (
    <LinearGradient
      colors={status.available ? ['#0A2A1E', '#1E1E24'] : ['#1E1E24', '#1E1E24']}
      style={[styles.card, status.available && styles.cardAvailable]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Ionicons
            name="cube"
            size={26}
            color={status.available ? colors.primary : colors.textSecondary}
          />
          <View style={styles.texts}>
            <Text style={styles.title}>Pacote Grátis</Text>
            <Text style={styles.subtitle}>
              {status.available
                ? '3 figurinhas te esperando!'
                : `Volte em ${formatCountdown(status.nextAvailableAt!)}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.claimButton, !status.available && styles.claimButtonDisabled]}
          onPress={handleClaim}
          disabled={!status.available || claiming}
        >
          {claiming ? (
            <ActivityIndicator color="#0D0D0D" size="small" />
          ) : (
            <Text style={styles.claimButtonText}>
              {status.available ? 'Abrir' : 'Aguarde'}
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
    borderColor: colors.primary,
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
    backgroundColor: colors.primary,
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
