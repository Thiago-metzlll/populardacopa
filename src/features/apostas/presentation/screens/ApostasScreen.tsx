import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import { BotaoHistorico } from '../components/BotaoHistorico';
import { ContainerAposta } from '../components/ContainerAposta';

export const ApostasScreen = () => {
  const { matches, loading: matchesLoading, error: matchesError } = useUpcomingMatches();
  const { history, loading: historyLoading } = usePredictionHistory();

  const handleHistoricoPress = () => {
    Alert.alert('Histórico', `Você tem ${history?.predictions.length || 0} palpites feitos.`);
  };

  if (matchesLoading) return <ActivityIndicator style={styles.center} />;
  if (matchesError) return <Text style={styles.center}>Error: {matchesError}</Text>;

  return (
    <View style={styles.container}>
      <BotaoHistorico onPress={handleHistoricoPress} />
      
      <Text style={styles.title}>Próximas Partidas</Text>
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ContainerAposta match={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }
});
