import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../../../features/album/presentation/hooks/useUserProfile';
import { CardMinhaColecao } from '../../../features/album/presentation/components/CardMinhaColecao';
import { useUpcomingMatches } from '../../../features/apostas/presentation/hooks/useUpcomingMatches';
import { ContainerAposta } from '../../../features/apostas/presentation/components/ContainerAposta';

export const HomeScreen = () => {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const { matches, loading: matchesLoading } = useUpcomingMatches();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bem-vindo!</Text>

      <TouchableOpacity onPress={() => router.push('/apostas' as any)} style={styles.touchableCard}>
        <Text style={styles.cardTitle}>Partidas Atuais</Text>
        {matchesLoading ? (
          <ActivityIndicator style={{ padding: 16 }} />
        ) : matches.length > 0 ? (
          <ContainerAposta match={matches[0]} />
        ) : (
          <Text style={styles.placeholderText}>Nenhuma partida no momento</Text>
        )}
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/times' as any)}>
          <Text style={styles.navText}>Times</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/grupos' as any)}>
          <Text style={styles.navText}>Grupos</Text>
        </TouchableOpacity>
      </View>

      {profileLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : profile ? (
        <CardMinhaColecao progress={profile.collection.stickerIds.length} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  touchableCard: { backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, padding: 16, paddingBottom: 0 },
  placeholderText: { color: '#666', padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  navCard: { flex: 1, padding: 24, backgroundColor: '#e0e0e0', borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  navText: { fontSize: 16, fontWeight: 'bold' },
  loader: { marginVertical: 20 }
});
