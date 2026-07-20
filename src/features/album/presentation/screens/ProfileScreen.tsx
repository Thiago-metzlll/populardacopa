import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';
import { CompartilhBtn } from '../components/CompartilhBtn';
import { CardColecao } from '../../../../shared/presentation/components/CardColecao';
import { CardRecompensaDiaria } from '../components/CardRecompensaDiaria';
import { CardPacoteGratis } from '../components/CardPacoteGratis';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { makeSignOut } from '../../../auth/main/factories/makeAuth';

export const ProfileScreen = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const { profile, loading, error, refetch } = useUserProfile();

  const handleLogout = async () => {
    try {
      await makeSignOut().execute();
      router.replace('/entrar');
    } catch (err: any) {
      Alert.alert('Erro ao sair', err?.message || 'Ocorreu um erro ao deslogar.');
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.noUserText}>Faça login para ver sua coleção e abrir pacotes!</Text>
        <TouchableOpacity 
          style={[styles.button, styles.loginCTAButton]} 
          onPress={() => router.push('/entrar')}
        >
          <Text style={styles.loginCTAButtonText}>Entrar na Conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !profile) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Error: {error}</Text></View>;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.coinsRow}>
        <Ionicons name="wallet-outline" size={18} color="#FFD700" />
        <Text style={styles.coinsText}>{user.coins} moedas</Text>
      </View>

      {profile && <CardColecao progress={profile.collection.stickerIds.length} />}

      <CardRecompensaDiaria />

      <CardPacoteGratis onClaimed={refetch} />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.flexButton, styles.marketButton]}
          onPress={() => router.push('/mercado')}
        >
          <Text style={styles.marketButtonText}>Ir ao Mercado</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recentes</Text>
      <FlatList
        data={profile?.recentStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stickersList}
        renderItem={({ item }) => (
          <View style={styles.stickerCard}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
            <CompartilhBtn stickerImageUrl={item.imageUrl} stickerId={item.id} />
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Raras</Text>
      <FlatList
        data={profile?.rareStickers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stickersList}
        renderItem={({ item }) => (
          <View style={[styles.stickerCard, styles.stickerCardRare]}>
            <Text style={styles.stickerText}>Sticker {item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.rarity}</Text></View>
            <CompartilhBtn stickerImageUrl={item.imageUrl} stickerId={item.id} />
          </View>
        )}
      />

      <TouchableOpacity style={styles.viewAllLink} onPress={() => router.push('/figurinhas')}>
        <Text style={styles.viewAllLinkText}>Ver todas as figurinhas →</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  coinsText: { ...typography.body, color: '#FFD700', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  flexButton: { flex: 1 },
  button: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.subheading, color: '#0D0D0D', fontWeight: 'bold' },
  marketButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  marketButtonText: { ...typography.subheading, color: colors.primary, fontWeight: 'bold' },
  sectionTitle: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  viewAllLink: { alignItems: 'center', marginTop: spacing.lg },
  viewAllLinkText: { ...typography.subheading, color: colors.primary, fontWeight: 'bold' },
  stickersList: { paddingBottom: spacing.sm },
  stickerCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginRight: spacing.sm, minWidth: 120, alignItems: 'center', justifyContent: 'space-between' },
  stickerCardRare: { borderColor: colors.secondary, borderWidth: 1 },
  stickerText: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  badge: { backgroundColor: colors.secondary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  badgeText: { ...typography.caption, color: colors.textPrimary },
  noUserText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  loginCTAButton: {
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
  },
  loginCTAButtonText: {
    ...typography.subheading,
    color: '#0D0D0D',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.subheading,
    color: colors.danger,
    fontWeight: 'bold',
  },
});
