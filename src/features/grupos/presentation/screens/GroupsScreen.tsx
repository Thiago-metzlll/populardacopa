import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useGroups } from '../hooks/useGroups';

export const GroupsScreen = () => {
  const { groups, loading, error } = useGroups();

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.center}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <Text style={styles.title}>{item.name}</Text>
            {item.standings.map(s => (
              <Text key={s.teamId}>
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
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  groupCard: { padding: 16, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 }
});
