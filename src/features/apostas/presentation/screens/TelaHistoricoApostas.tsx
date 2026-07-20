import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import { CardResumoApostas } from '../components/CardResumoApostas';
import { CardVitoria } from '../components/CardVitoria';
import { CardDerrota } from '../components/CardDerrota';
import { Prediction } from '../../domain/entities/Prediction';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';

// Map matchId -> phase label for display (mock lookup)
const PHASE_BY_MATCH: Record<string, string> = {
  m1: 'Fase de Grupos',
  m2: 'Fase de Grupos',
  m3: 'Fase de Grupos',
  m4: 'Fase de Grupos',
  m5: 'Oitavas de Final',
  m6: 'Quartas-de-Final',
  m7: 'Semifinal',
  m8: 'Final',
  m9: 'Fase de Grupos',
};

const MATCH_LABEL_BY_ID: Record<string, string> = {
  m1: 'Brasil vs Argentina',
  m2: 'Brasil vs EUA',
  m3: 'França vs Alemanha',
  m4: 'Espanha vs Itália',
  m5: 'Brasil vs Portugal',
  m6: 'Argentina vs França',
  m7: 'Brasil vs França',
  m8: 'Argentina vs Portugal',
  m9: 'Brasil vs Espanha',
};

const PendingCard: React.FC<{ prediction: Prediction }> = ({ prediction }) => (
  <View style={styles.pendingCard}>
    <View style={styles.pendingSeal}>
      <Text style={styles.pendingSealText}>EM ANDAMENTO</Text>
    </View>
    <View style={styles.pendingHeader}>
      <Text style={styles.pendingPhase}>{PHASE_BY_MATCH[prediction.matchId] ?? 'Copa do Mundo'}</Text>
      <Text style={styles.pendingMatch}>{MATCH_LABEL_BY_ID[prediction.matchId] ?? 'Partida'}</Text>
    </View>
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>SEU PALPITE</Text>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreText}>
          {prediction.predictedHomeScore} × {prediction.predictedAwayScore}
        </Text>
      </View>
    </View>
    <Text style={styles.pendingDate}>
      {new Date(prediction.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })}
    </Text>
  </View>
);

export const TelaHistoricoApostas: React.FC = () => {
  const { history, loading, error } = usePredictionHistory();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !history) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Erro ao carregar histórico.'}</Text>
      </View>
    );
  }

  const { predictions, successRate } = history;
  const nonPendingCount = predictions.filter(p => p.status !== 'pending').length;

  const renderItem = ({ item }: { item: Prediction }) => {
    const matchLabel = MATCH_LABEL_BY_ID[item.matchId] ?? 'Partida';
    const phase = PHASE_BY_MATCH[item.matchId] ?? 'Copa do Mundo';

    if (item.status === 'won') {
      return <CardVitoria prediction={item} matchLabel={matchLabel} phase={phase} />;
    }
    if (item.status === 'lost') {
      return <CardDerrota prediction={item} matchLabel={matchLabel} phase={phase} />;
    }
    return <PendingCard prediction={item} />;
  };

  const ListHeader = () => (
    <View>
      <CardResumoApostas
        totalPalpites={nonPendingCount}
        winPercentage={nonPendingCount > 0 ? successRate : 0}
      />
      <Text style={styles.sectionTitle}>Seus Palpites</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[...predictions].reverse()}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Você ainda não fez nenhum palpite.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Pending card styles
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(160, 160, 160, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#A0A0A0',
  },
  pendingSeal: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(160, 160, 160, 0.1)',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
  pendingSealText: {
    ...typography.caption,
    color: '#A0A0A0',
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  pendingHeader: {
    marginBottom: spacing.sm,
    paddingRight: 110,
  },
  pendingPhase: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  pendingMatch: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreBox: {
    backgroundColor: '#1E1E24',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
  scoreText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  pendingDate: {
    ...typography.caption,
    color: '#555',
    marginTop: 2,
  },
});
