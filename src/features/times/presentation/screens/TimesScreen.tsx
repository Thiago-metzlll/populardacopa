import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import { SearchInput } from '../components/SearchInput';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

export const TimesScreen = () => {
  const router = useRouter();
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
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>Error: {error}</Text></View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.teamCard} 
              onPress={() => router.push(`/times/${item.id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.title}>{item.name}</Text>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => toggleFavorite(item.id)}
              >
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.body, color: colors.danger },
  teamCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.subheading, color: colors.textPrimary },
  removeButton: { backgroundColor: colors.danger, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  removeButtonText: { ...typography.body, color: colors.textPrimary }
});
