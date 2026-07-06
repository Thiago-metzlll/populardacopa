import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../../features/album/presentation/hooks/useUserProfile';
import { CardMinhaColecao } from '../../../features/album/presentation/components/CardMinhaColecao';
import { useUpcomingMatches } from '../../../features/apostas/presentation/hooks/useUpcomingMatches';
import { ContainerAposta } from '../../../features/apostas/presentation/components/ContainerAposta';
import { colors, spacing, typography, radius } from '../theme';

export const HomeScreen = () => {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const { matches, loading: matchesLoading } = useUpcomingMatches();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Partidas Atuais</Text>

      <TouchableOpacity onPress={() => router.push('/apostas' as any)} style={styles.matchCardWrapper}>
        {matchesLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : matches.length > 0 ? (
          <ContainerAposta match={matches[0]} />
        ) : (
          <Text style={styles.placeholderText}>Nenhuma partida no momento</Text>
        )}
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.navCardWrapper} onPress={() => router.push('/times' as any)}>
          <LinearGradient
            colors={['#583D9E', '#3D2576']}
            style={styles.navCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.navIconBox}>
              <Ionicons name="people" size={24} color={colors.textPrimary} />
            </View>
            <Text style={styles.navText}>Times</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCardWrapper} onPress={() => router.push('/grupos' as any)}>
          <LinearGradient
            colors={['#B85C50', '#8D3A30']}
            style={styles.navCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.navIconBox}>
              <Ionicons name="grid" size={24} color={colors.textPrimary} />
            </View>
            <Text style={styles.navText}>Grupos</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {profileLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : profile ? (
        <CardMinhaColecao progress={profile.collection.stickerIds.length} />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: { 
    ...typography.heading, 
    color: colors.textPrimary, 
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.md 
  },
  matchCardWrapper: {
    marginBottom: spacing.lg,
  },
  loaderContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  placeholderText: { 
    ...typography.body, 
    color: colors.textSecondary, 
    padding: spacing.md,
    textAlign: 'center',
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.lg 
  },
  navCardWrapper: { 
    flex: 1, 
    marginHorizontal: spacing.xs,
  },
  navCardGradient: {
    padding: spacing.lg,
    borderRadius: radius.md,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { 
    ...typography.heading, 
    color: colors.textPrimary,
    fontSize: 22,
    marginTop: spacing.md,
  },
  loader: { 
    marginVertical: spacing.lg 
  }
});
