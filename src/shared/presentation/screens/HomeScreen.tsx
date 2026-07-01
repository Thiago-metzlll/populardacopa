import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../../../features/album/presentation/hooks/useUserProfile';
import { CardMinhaColecao } from '../../../features/album/presentation/components/CardMinhaColecao';

export const HomeScreen = () => {
  const router = useRouter();
  const { profile, loading } = useUserProfile();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bem-vindo!</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Partidas Atuais</Text>
        <Text style={styles.placeholderText}>Nenhuma partida no momento</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/times' as any)}>
          <Text style={styles.navText}>Times</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/grupos' as any)}>
          <Text style={styles.navText}>Grupos</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
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
  card: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  placeholderText: { color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  navCard: { flex: 1, padding: 24, backgroundColor: '#e0e0e0', borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  navText: { fontSize: 16, fontWeight: 'bold' },
  loader: { marginVertical: 20 }
});
