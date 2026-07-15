import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMatchDetail } from '../hooks/useMatchDetail';
import { useCreatePrediction } from '../hooks/useCreatePrediction';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const TelaPalpite: React.FC = () => {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  
  const { match, loading: loadingMatch, error: matchError } = useMatchDetail(matchId || '');
  
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const { createPrediction, loading: saving, error: saveError } = useCreatePrediction(() => {
    Alert.alert('Palpite Salvo', 'Seu palpite foi registrado com sucesso!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  });

  if (loadingMatch) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (matchError || !match) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{matchError || 'Partida não encontrada'}</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!user) {
      Alert.alert(
        'Login necessário',
        'Faça login para salvar seu palpite!',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => router.push('/entrar') },
        ]
      );
      return;
    }
    await createPrediction(match.id, homeScore, awayScore);
  };

  const adjustScore = (team: 'home' | 'away', amount: number) => {
    if (team === 'home') {
      setHomeScore(prev => Math.max(0, prev + amount));
    } else {
      setAwayScore(prev => Math.max(0, prev + amount));
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>{match.phase.toUpperCase()}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(match.date)}</Text>
        </View>

        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <MolduraIndividualPais teamId={match.homeTeamId} size="lg" showBorder />
            <Text style={styles.teamName}>{match.homeTeamId.toUpperCase()}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* Away Team */}
          <View style={styles.teamSection}>
            <MolduraIndividualPais teamId={match.awayTeamId} size="lg" showBorder />
            <Text style={styles.teamName}>{match.awayTeamId.toUpperCase()}</Text>
          </View>
        </View>

        {/* Odds Row */}
        {match.odds && (
          <View style={styles.oddsContainer}>
            <Text style={styles.oddsTitle}>Probabilidades (Odds)</Text>
            <View style={styles.oddsRow}>
              <View style={styles.oddsBox}>
                <Text style={styles.oddsLabel}>1</Text>
                <Text style={styles.oddsValue}>{match.odds.homeWin.toFixed(2)}</Text>
              </View>
              <View style={styles.oddsBox}>
                <Text style={styles.oddsLabel}>X</Text>
                <Text style={styles.oddsValue}>{match.odds.draw.toFixed(2)}</Text>
              </View>
              <View style={styles.oddsBox}>
                <Text style={styles.oddsLabel}>2</Text>
                <Text style={styles.oddsValue}>{match.odds.awayWin.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Prediction Controls */}
      <View style={styles.predictionCard}>
        <Text style={styles.predictionTitle}>Seu Palpite</Text>

        <View style={styles.selectorsRow}>
          {/* Home Score Selector */}
          <View style={styles.scoreSelectorContainer}>
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustScore('home', -1)}
            >
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.scoreDisplay}>{homeScore}</Text>
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustScore('home', 1)}
            >
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.selectorDivider}>x</Text>

          {/* Away Score Selector */}
          <View style={styles.scoreSelectorContainer}>
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustScore('away', -1)}
            >
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.scoreDisplay}>{awayScore}</Text>
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustScore('away', 1)}
            >
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Text style={styles.saveButtonText}>Confirmar Palpite</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  phasePill: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  phaseText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  teamSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  vsText: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 24,
    fontStyle: 'italic',
  },
  oddsContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: spacing.md,
  },
  oddsTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  oddsBox: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    minWidth: 60,
  },
  oddsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  oddsValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  predictionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    gap: spacing.md,
  },
  predictionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  selectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  scoreSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  adjustButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2D2D35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreDisplay: {
    ...typography.heading,
    color: colors.textPrimary,
    width: 48,
    textAlign: 'center',
    fontSize: 24,
  },
  selectorDivider: {
    ...typography.heading,
    color: colors.textSecondary,
    fontSize: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.subheading,
    color: '#0D0D0D',
    fontWeight: 'bold',
  },
  saveErrorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
});
