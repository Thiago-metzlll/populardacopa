import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import { BotaoHistorico } from '../components/BotaoHistorico';
import { ContainerAposta } from '../components/ContainerAposta';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';

export const ApostasScreen = () => {
  const { matches, loading: matchesLoading, error: matchesError } = useUpcomingMatches();
  const { history, loading: historyLoading } = usePredictionHistory();

  const handleHistoricoPress = () => {
    Alert.alert('Histórico', `Você tem ${history?.predictions.length || 0} palpites feitos.`);
  };

  if (matchesLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (matchesError) return <View style={styles.center}><Text style={styles.errorText}>Error: {matchesError}</Text></View>;

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
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  title: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md }
});
