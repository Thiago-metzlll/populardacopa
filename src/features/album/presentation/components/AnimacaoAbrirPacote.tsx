import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../domain/entities/Sticker';
import { CompartilhBtn } from './CompartilhBtn';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface AnimacaoAbrirPacoteProps {
  stickers: Sticker[];
  isRevealing: boolean;
  currentIndex: number;
  loading: boolean;
  error: string | null;
  onStartReveal: () => void;
  onAdvanceCard: () => void;
  onDone: () => void;
}

const RARITY_COLORS: Record<Sticker['rarity'], [string, string]> = {
  comum: ['#24242B', '#1A1A1E'],
  rara: ['#1a1a4e', '#24242B'],
  lendaria: ['#3d2000', '#24242B'],
};

const RARITY_GLOW: Record<Sticker['rarity'], string> = {
  comum: '#444',
  rara: '#4488FF',
  lendaria: '#FFD700',
};

const RARITY_LABEL: Record<Sticker['rarity'], string> = {
  comum: 'COMUM',
  rara: '★ RARA',
  lendaria: '⚡ LENDÁRIA',
};

const StickerRevealCard: React.FC<{
  sticker: Sticker;
  onAdvance: () => void;
  isLast: boolean;
  onDone: () => void;
}> = ({ sticker, onAdvance, isLast, onDone }) => {
  const scale = useSharedValue(0);
  const rotateY = useSharedValue(90);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    rotateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSequence(
      withSpring(1.08, { damping: 8, stiffness: 120 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      {
        rotateY: `${interpolate(
          rotateY.value,
          [0, 90],
          [0, 90],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));

  const glowColor = RARITY_GLOW[sticker.rarity];

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.stickerCardOuter, { shadowColor: glowColor }, animStyle]}>
        <LinearGradient
          colors={RARITY_COLORS[sticker.rarity]}
          style={styles.stickerCard}
        >
          {/* Glow border */}
          <View style={[styles.glowBorder, { borderColor: glowColor }]}>
            {/* Sticker emoji avatar */}
            <View style={styles.stickerImageContainer}>
              <Text style={styles.stickerEmoji}>
                {sticker.rarity === 'lendaria' ? '⚡' : sticker.rarity === 'rara' ? '★' : '⚽'}
              </Text>
            </View>

            {/* Rarity Badge */}
            <View style={[styles.rarityBadge, { borderColor: glowColor }]}>
              <Text style={[styles.rarityText, { color: glowColor }]}>
                {RARITY_LABEL[sticker.rarity]}
              </Text>
            </View>

            {/* Sticker ID */}
            <Text style={styles.stickerIdText}>Figurinha #{sticker.id}</Text>

            {/* Share button for rare/legendary */}
            {sticker.rarity !== 'comum' && (
              <CompartilhBtn
                stickerImageUrl={sticker.imageUrl}
                stickerId={sticker.id}
              />
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={isLast ? onDone : onAdvance}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#B4FF00', '#88CC00']}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'CONCLUIR' : 'PRÓXIMA'}
          </Text>
          <Ionicons
            name={isLast ? 'checkmark-circle' : 'arrow-forward'}
            size={18}
            color="#0D0D0D"
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Progress dots */}
    </View>
  );
};

export const AnimacaoAbrirPacote: React.FC<AnimacaoAbrirPacoteProps> = ({
  stickers,
  isRevealing,
  currentIndex,
  loading,
  error,
  onStartReveal,
  onAdvanceCard,
  onDone,
}) => {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Abrindo pacote...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isRevealing) {
    return (
      <View style={styles.center}>
        <LinearGradient
          colors={['#1E1E2E', '#24242B']}
          style={styles.packContainer}
        >
          <Text style={styles.packEmoji}>📦</Text>
          <Text style={styles.packTitle}>Pacote de Figurinhas</Text>
          <Text style={styles.packSubtitle}>3 figurinhas aguardando reveal!</Text>
        </LinearGradient>

        <TouchableOpacity style={styles.openButton} onPress={onStartReveal} activeOpacity={0.8}>
          <LinearGradient
            colors={['#B4FF00', '#88CC00']}
            style={styles.openButtonGradient}
          >
            <Text style={styles.openButtonText}>ABRIR PACOTE</Text>
            <Ionicons name="sparkles" size={20} color="#0D0D0D" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSticker = stickers[currentIndex];
  if (!currentSticker) return null;

  return (
    <View style={styles.revealContainer}>
      {/* Header */}
      <View style={styles.revealHeader}>
        <Text style={styles.revealTitle}>FIGURINHA REVELADA</Text>
        <Text style={styles.revealCounter}>
          {currentIndex + 1} / {stickers.length}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {stickers.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === currentIndex && styles.dotActive,
              idx < currentIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <StickerRevealCard
        key={currentIndex}
        sticker={currentSticker}
        onAdvance={onAdvanceCard}
        isLast={currentIndex === stickers.length - 1}
        onDone={onDone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  packContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.7,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: spacing.xl,
  },
  packEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  packTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  packSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  openButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  openButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  openButtonText: {
    ...typography.subheading,
    color: '#0D0D0D',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  revealContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  revealHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  revealTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  revealCounter: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  dotDone: {
    backgroundColor: '#555',
  },
  cardWrapper: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  stickerCardOuter: {
    borderRadius: radius.xl,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  stickerCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    padding: 12,
  },
  glowBorder: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  stickerImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: {
    fontSize: 64,
  },
  rarityBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  rarityText: {
    ...typography.caption,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  stickerIdText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonText: {
    ...typography.subheading,
    color: '#0D0D0D',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
