import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import { SearchInput } from '../components/SearchInput';

export const TimesScreen = () => {
  const { teams, loading, error, search, toggleFavorite } = useFavoriteTeams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      search(query);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <View style={styles.container}>
      <SearchInput value={query} onChangeText={setQuery} />
      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={styles.center}>Error: {error}</Text>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.teamCard}>
              <Text style={styles.title}>{item.name}</Text>
              <Button title="Remover" onPress={() => toggleFavorite(item.id)} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  teamCard: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold' }
});
