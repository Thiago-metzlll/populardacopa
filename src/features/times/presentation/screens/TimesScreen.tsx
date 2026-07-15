import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTimesScreen } from '../hooks/useTimesScreen';
import { SearchInput } from '../components/SearchInput';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { Team } from '../../domain/entities/Team';

export const TimesScreen = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const { allTeams, favoriteTeams, loading, error, search, toggleFavorite } = useTimesScreen();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      search(query);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const sections = [
    ...(user && favoriteTeams.length > 0
      ? [{ title: 'Meus Times', data: favoriteTeams }]
      : []),
    { title: 'Todos os Times', data: allTeams },
  ];

  const renderItem = ({ item, section }: { item: Team; section: { title: string } }) => {
    const isFavoriteSection = section.title === 'Meus Times';

    return (
      <TouchableOpacity
        style={styles.teamCard}
        onPress={() => router.push(`/times/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          {item.isFavorite && !isFavoriteSection && (
            <Text style={styles.starIcon}>⭐</Text>
          )}
          <Text style={styles.title}>{item.name}</Text>
        </View>
        {user && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavoriteSection ? styles.removeButton : styles.addButton,
            ]}
            onPress={() => toggleFavorite(item.id)}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavoriteSection ? 'Remover' : item.isFavorite ? '⭐ Favorito' : '+ Favoritar'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {section.title === 'Meus Times' ? '⭐ ' : '🌍 '}
        {section.title}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchInput value={query} onChangeText={setQuery} />

      {!user && (
        <TouchableOpacity
          style={styles.loginBanner}
          onPress={() => router.push('/entrar')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBannerText}>
            🔒 Faça login para salvar seus times favoritos
          </Text>
          <Text style={styles.loginBannerCta}>Entrar →</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum time encontrado.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeaderText: {
    ...typography.subheading,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  sectionSeparator: {
    height: spacing.md,
  },
  teamCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  starIcon: {
    fontSize: 14,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  favoriteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  removeButton: {
    backgroundColor: colors.danger,
  },
  addButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  favoriteButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 12,
  },
  loginBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  loginBannerText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  loginBannerCta: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
