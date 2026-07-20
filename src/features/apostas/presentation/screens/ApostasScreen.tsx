import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import { useSettlePendingPredictions } from '../hooks/useSettlePendingPredictions';
import { BotaoHistorico } from '../components/BotaoHistorico';
import { ContainerAposta } from '../components/ContainerAposta';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';

export const ApostasScreen = () => {
  const router = useRouter();
  const { matches, loading: matchesLoading, error: matchesError } = useUpcomingMatches();
  const { history, loading: historyLoading, refetch: refetchHistory } = usePredictionHistory();

  useSettlePendingPredictions((settled) => {
    refetchHistory();
    const won = settled.filter((p) => p.status === 'won');
    if (won.length > 0) {
      const summary = won.map((p) => `• ${p.reward.description}`).join('\n');
      Alert.alert('Seus palpites foram resolvidos!', `Você ganhou:\n${summary}`);
    }
  });

  const handleHistoricoPress = () => {
    router.push('/apostas/historico');
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
        renderItem={({ item }) => (
          <ContainerAposta 
            match={item} 
            onPress={() => router.push(`/palpite/${item.id}`)}
          />
        )}
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
