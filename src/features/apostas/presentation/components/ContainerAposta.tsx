import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Match } from '../../domain/entities/Match';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';

interface ContainerApostaProps {
  match: Match;
  onPress?: () => void;
}

export const ContainerAposta: React.FC<ContainerApostaProps> = ({ match, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      console.log('Dar Palpite clicado para a partida:', match.id);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.phasePill}>
          <Text style={styles.phaseText}>{match.phase.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.palpiteButton} onPress={handlePress}>
          <Text style={styles.palpiteButtonText}>Dar Palpite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.teamContainer}>
          <MolduraIndividualPais teamId={match.homeTeamId} size="md" />
          <Text style={styles.teamName}>{match.homeTeamId.substring(0, 3).toUpperCase()}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>? - ?</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Próximo Jogo</Text>
          </View>
        </View>

        <View style={styles.teamContainer}>
          <MolduraIndividualPais teamId={match.awayTeamId} size="md" />
          <Text style={styles.teamName}>{match.awayTeamId.substring(0, 3).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerRow: {
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
  palpiteButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  palpiteButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  flagPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#555',
  },
  teamName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
});
