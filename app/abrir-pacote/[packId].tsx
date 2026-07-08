import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnimacaoAbrirPacote } from '../../src/features/album/presentation/components/AnimacaoAbrirPacote';
import { useAbrirPacote } from '../../src/features/album/presentation/hooks/useAbrirPacote';
import { colors } from '../../src/shared/presentation/theme';

export default function AbrirPacoteScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const router = useRouter();

  const {
    stickers,
    isRevealing,
    currentIndex,
    loading,
    error,
    startReveal,
    advanceCard,
  } = useAbrirPacote(packId || '');

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AnimacaoAbrirPacote
        stickers={stickers}
        isRevealing={isRevealing}
        currentIndex={currentIndex}
        loading={loading}
        error={error}
        onStartReveal={startReveal}
        onAdvanceCard={advanceCard}
        onDone={handleDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
