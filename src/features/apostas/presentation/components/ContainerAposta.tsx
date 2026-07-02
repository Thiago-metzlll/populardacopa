import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Match } from '../../domain/entities/Match';

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
          <Text>1: {match.odds.homeWin}</Text>
          <Text>X: {match.odds.draw}</Text>
          <Text>2: {match.odds.awayWin}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  teams: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  date: { fontSize: 12, color: '#666', textAlign: 'center', marginVertical: 4 },
  oddsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }
});
