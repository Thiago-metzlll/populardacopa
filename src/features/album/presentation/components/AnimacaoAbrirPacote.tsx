import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../domain/entities/Sticker';
import { CompartilhBtn } from './CompartilhBtn';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
// Limitado a 48% da altura da tela para sempre sobrar espaço pro botão de ação
// abaixo — em telas pequenas, CARD_WIDTH * 1.4 sozinho já empurrava o botão
// pra fora da viewport, deixando a tela sem nenhuma ação alcançável.
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.4, SCREEN_HEIGHT * 0.48);

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
  rara: 'RARA',
  lendaria: 'LENDÁRIA',
};

const RARITY_ICON: Record<Sticker['rarity'], keyof typeof Ionicons.glyphMap | null> = {
  comum: null,
  rara: 'star',
  lendaria: 'flash',
};

// Duração da "carga" de expectativa antes do reveal — quanto mais rara, mais suspense.
const RARITY_CHARGE_MS: Record<Sticker['rarity'], number> = {
  comum: 100,
  rara: 500,
  lendaria: 900,
};

const RARITY_PARTICLES: Record<Sticker['rarity'], number> = {
  comum: 0,
  rara: 10,
  lendaria: 16,
};

const Particle: React.FC<{ angle: number; distance: number; delay: number; color: string }> = ({
  angle,
  distance,
  delay,
  color,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const dist = progress.value * distance;
    return {
      opacity: interpolate(progress.value, [0, 0.15, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: interpolate(progress.value, [0, 1], [0.5, 1]) },
      ],
    };
  });

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
};

const ParticleBurst: React.FC<{ count: number; color: string }> = ({ count, color }) => {
  // O sorteio de distance/delay é memoizado para acontecer uma única vez por
  // burst — sem isso, as partículas "pulariam" de posição caso o componente
  // re-renderize antes da animação terminar. react-hooks/purity (regra
  // experimental do React Compiler) ainda acusa Math.random aqui mesmo
  // memoizado, pois teoricamente o React pode descartar e refazer o cálculo
  // de um useMemo (Strict Mode / Suspense); para esta animação decorativa
  // isso é aceitável — o pior caso é um novo sorteio visualmente equivalente.
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        // eslint-disable-next-line react-hooks/purity
        distance: 60 + Math.random() * 50,
        // eslint-disable-next-line react-hooks/purity
        delay: Math.random() * 120,
      })),
    [count],
  );

  if (count === 0) return null;
  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} angle={p.angle} distance={p.distance} delay={p.delay} color={color} />
      ))}
    </View>
  );
};

const ChargeGlow: React.FC<{ color: string }> = ({ color }) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(0.9, { duration: 260, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 260 }), withTiming(0.25, { duration: 260 })),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.chargeGlow, { borderColor: color, shadowColor: color }, style]} />;
};

const StickerRevealCard: React.FC<{
  sticker: Sticker;
  onAdvance: () => void;
  isLast: boolean;
  onDone: () => void;
}> = ({ sticker, onAdvance, isLast, onDone }) => {
  const [phase, setPhase] = useState<'charging' | 'revealed'>(
    sticker.rarity === 'comum' ? 'revealed' : 'charging',
  );
  const scale = useSharedValue(0);
  const rotateY = useSharedValue(90);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (phase !== 'charging') return;
    const timeout = setTimeout(() => setPhase('revealed'), RARITY_CHARGE_MS[sticker.rarity]);
    return () => clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'revealed') return;
    opacity.value = withTiming(1, { duration: 200 });
    rotateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 120 }),
      withSpring(1, { damping: 15, stiffness: 200 }),
    );
  }, [phase]);

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
  const particleCount = phase === 'revealed' ? RARITY_PARTICLES[sticker.rarity] : 0;

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardStage}>
        {phase === 'charging' && <ChargeGlow color={glowColor} />}
        {phase === 'revealed' && <ParticleBurst count={particleCount} color={glowColor} />}

        <Animated.View style={[styles.stickerCardOuter, { shadowColor: glowColor }, animStyle]}>
          <LinearGradient
            colors={RARITY_COLORS[sticker.rarity]}
            style={styles.stickerCard}
          >
            {/* Glow border */}
            <View style={[styles.glowBorder, { borderColor: glowColor }]}>
              {/* Sticker rarity avatar */}
              <View style={styles.stickerImageContainer}>
                <Ionicons
                  name={RARITY_ICON[sticker.rarity] ?? 'football'}
                  size={64}
                  color={glowColor}
                />
              </View>

              {/* Rarity Badge */}
              <View style={[styles.rarityBadge, { borderColor: glowColor }]}>
                {RARITY_ICON[sticker.rarity] && (
                  <Ionicons name={RARITY_ICON[sticker.rarity]!} size={12} color={glowColor} />
                )}
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
      </View>

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
    </View>
  );
};

const IdlePackCard: React.FC<{ onStartReveal: () => void }> = ({ onStartReveal }) => {
  const breathScale = useSharedValue(1);
  const burstScale = useSharedValue(1);
  const burstOpacity = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const [bursting, setBursting] = useState(false);

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, []);

  const handlePress = () => {
    if (bursting) return;
    setBursting(true);
    shakeX.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
    burstScale.value = withDelay(
      300,
      withTiming(1.4, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    burstOpacity.value = withDelay(
      300,
      withTiming(0, { duration: 300 }),
    );
    // Dispara via timer do JS thread em vez do callback do worklet: o callback
    // de withTiming depende da ponte UI->JS e, se não disparar (animação
    // interrompida, hiccup do bridge), o botão ficava travado em "bursting"
    // para sempre, sem nenhuma ação possível na tela.
    setTimeout(onStartReveal, 600);
  };

  const packStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [
      { translateX: shakeX.value },
      { scale: breathScale.value * burstScale.value },
    ],
  }));

  return (
    <View style={styles.center}>
      <Animated.View style={packStyle}>
        <LinearGradient
          colors={['#1E1E2E', '#24242B']}
          style={styles.packContainer}
        >
          <View style={styles.packGlowRing} />
          <Ionicons name="cube" size={72} color={colors.primary} style={styles.packIcon} />
          <Text style={styles.packTitle}>Pacote de Figurinhas</Text>
          <Text style={styles.packSubtitle}>3 figurinhas aguardando reveal!</Text>
        </LinearGradient>
      </Animated.View>

      <TouchableOpacity
        style={styles.openButton}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={bursting}
      >
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
    return <IdlePackCard onStartReveal={onStartReveal} />;
  }

  const currentSticker = stickers[currentIndex];
  if (!currentSticker) return null;

  return (
    <ScrollView
      style={styles.revealContainer}
      contentContainerStyle={styles.revealContent}
      showsVerticalScrollIndicator={false}
    >
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
    </ScrollView>
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
    overflow: 'hidden',
  },
  packGlowRing: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    borderRadius: 999,
    backgroundColor: 'rgba(180, 255, 0, 0.06)',
  },
  packIcon: {
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
  },
  revealContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
  cardStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  particleContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: '35%',
    alignSelf: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
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
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
