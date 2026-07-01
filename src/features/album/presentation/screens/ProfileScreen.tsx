import React from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';
import { useOpenPackage } from '../hooks/useOpenPackage';
import { CardMinhaColecao } from '../components/CardMinhaColecao';

export const ProfileScreen = () => {
  const { profile, loading, error, refetch } = useUserProfile();
  const { openPackage, loading: opening } = useOpenPackage(() => refetch());

  if (loading && !profile) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.center}>Error: {error}</Text>;

  const handleOpenPackage = () => {
    openPackage('pkg_1');
  };

  return (
    <View style={styles.container}>
      {profile && <CardMinhaColecao progress={profile.collection.stickerIds.length} />}
      
      <Button 
        title={opening ? "Abrindo..." : "Abrir Pacotinho"} 
        onPress={handleOpenPackage} 
        disabled={opening} 
      />

      <Text style={styles.sectionTitle}>Recentes</Text>
      <FlatList
        data={profile?.recentStickers}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={({ item }) => (
          <View style={styles.stickerCard}>
            <Text>Sticker {item.id}</Text>
            <Text>{item.rarity}</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Raras</Text>
      <FlatList
        data={profile?.rareStickers}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={({ item }) => (
          <View style={styles.stickerCard}>
            <Text>Sticker {item.id}</Text>
            <Text>{item.rarity}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  stickerCard: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginRight: 8 }
});
