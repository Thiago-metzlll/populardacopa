import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useGroups } from '../hooks/useGroups';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const GroupsScreen = () => {
  const { groups, loading, error } = useGroups();

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Error: {error}</Text></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <Text style={styles.title}>{item.name}</Text>
            {item.standings.map(s => (
              <Text key={s.teamId} style={styles.standingText}>
                Time: {s.teamId} | P: {s.points} | J: {s.matchesPlayed} | SG: {s.goalDifference}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  groupCard: { padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  title: { ...typography.subheading, color: colors.primary, marginBottom: spacing.sm },
  standingText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs }
});
