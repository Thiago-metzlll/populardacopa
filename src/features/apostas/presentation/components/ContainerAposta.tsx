import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Match } from '../../domain/entities/Match';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface ContainerApostaProps {
  match: Match;
}

export const ContainerAposta: React.FC<ContainerApostaProps> = ({ match }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.teams}>{match.homeTeamId} x {match.awayTeamId}</Text>
      <Text style={styles.date}>{new Date(match.date).toLocaleString()}</Text>
      {match.odds && (
        <View style={styles.oddsContainer}>
          <View style={styles.oddBox}><Text style={styles.oddText}>1: {match.odds.homeWin}</Text></View>
          <View style={styles.oddBox}><Text style={styles.oddText}>X: {match.odds.draw}</Text></View>
          <View style={styles.oddBox}><Text style={styles.oddText}>2: {match.odds.awayWin}</Text></View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
  teams: { ...typography.subheading, color: colors.textPrimary, textAlign: 'center' },
  date: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.xs },
  oddsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  oddBox: { backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  oddText: { ...typography.body, color: colors.primary, fontWeight: 'bold' }
});
