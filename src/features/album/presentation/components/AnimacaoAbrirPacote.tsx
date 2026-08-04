import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
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
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Sticker } from '../../domain/entities/Sticker';
import { CompartilhBtn } from './CompartilhBtn';
import { MolduraIndividualPais } from '../../../../shared/presentation/components/MolduraIndividualPais';
import {
  colors,
  spacing,
  typography,
  radius,
  rarityColors,
} from '../../../../shared/presentation/theme';
import type { Rarity } from '../../../../shared/presentation/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
// Limitado a 48% da altura da tela para sempre sobrar espaço pro botão de ação
// abaixo — em telas pequenas, CARD_WIDTH * 1.4 sozinho já empurrava o botão
// pra fora da viewport, deixando a tela sem nenhuma ação alcançável.
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.4, SCREEN_HEIGHT * 0.48);
// Sem perspective o rotateY em RN achata a carta em vez de girá-la.
const PERSPECTIVE = 900;

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

// Fundo escuro tingido com a cor de cada raridade. As cores de identidade
// (borda, badge, label) vêm de theme/rarityColors — as mesmas usadas no
// StickerCard do álbum, para a carta revelada e a guardada baterem.
const RARITY_GRADIENT: Record<Rarity, [string, string]> = {
  comum: ['#2A2A30', '#1A1A1E'],
  rara: ['#2E3A00', '#1A1A1E'],
  lendaria: ['#2B0E4D', '#1A1A1E'],
};

const RARITY_ICON: Record<Rarity, keyof typeof Ionicons.glyphMap> = {
  comum: 'football',
  rara: 'star',
  lendaria: 'flash',
};

// Duração da "carga" de expectativa antes do reveal — quanto mais rara, mais
// suspense. Nenhuma raridade fica em zero: sem um beat de carga, o reveal de
// figurinha comum (a maioria absoluta) vira um flash sem sensação alguma.
const RARITY_CHARGE_MS: Record<Rarity, number> = {
  comum: 350,
  rara: 700,
  lendaria: 1100,
};

const RARITY_PARTICLES: Record<Rarity, number> = {
  comum: 6,
  rara: 14,
  lendaria: 22,
};

// expo-haptics não existe na web e é ruído em qualquer erro de plataforma —
// a animação nunca deve quebrar por causa do retorno tátil.
const haptic = {
  charge() {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  reveal(rarity: Rarity) {
    if (Platform.OS === 'web') return;
    if (rarity === 'lendaria') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    }
    const style =
      rarity === 'rara' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium;
    Haptics.impactAsync(style).catch(() => {});
  },
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
        // Passa da metade da carta para o estouro sair pelas bordas.
        // eslint-disable-next-line react-hooks/purity
        distance: CARD_WIDTH * 0.55 + Math.random() * 60,
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

/** Verso da carta: o que o usuário vê enquanto a carga acontece. */
const CardBack: React.FC<{ color: string }> = ({ color }) => (
  <LinearGradient colors={['#1E1E2E', '#141419']} style={styles.cardFace}>
    <View style={[styles.cardBackInner, { borderColor: color }]}>
      <Ionicons name="cube" size={72} color={color} />
      <Text style={styles.cardBackText}>POPULAR DA COPA</Text>
    </View>
  </LinearGradient>
);

/** Frente da carta: a figurinha de verdade — foto, nome, país e raridade. */
const CardFront: React.FC<{ sticker: Sticker }> = ({ sticker }) => {
  const rarity = rarityColors[sticker.rarity];

  return (
    <LinearGradient colors={RARITY_GRADIENT[sticker.rarity]} style={styles.cardFace}>
      <View style={[styles.cardFrontInner, { borderColor: rarity.border }]}>
        <View style={styles.photoWrapper}>
          <Image
            source={{ uri: sticker.imageUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />
          {sticker.teamId && (
            <View style={styles.flagBadge}>
              <MolduraIndividualPais teamId={sticker.teamId} size="sm" />
            </View>
          )}
          <View style={[styles.rarityBadge, { backgroundColor: rarity.badgeBg }]}>
            <Ionicons name={RARITY_ICON[sticker.rarity]} size={11} color={rarity.badgeText} />
            <Text style={[styles.rarityText, { color: rarity.badgeText }]}>{rarity.label}</Text>
          </View>
          {sticker.isNew !== undefined && (
            <View
              style={[
                styles.newBadge,
                sticker.isNew ? styles.newBadgeNew : styles.newBadgeRepeated,
              ]}
            >
              <Text style={[styles.newText, !sticker.isNew && styles.newTextRepeated]}>
                {sticker.isNew ? 'NOVA' : 'REPETIDA'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.playerName} numberOfLines={2}>
          {sticker.playerName}
        </Text>

        {sticker.rarity !== 'comum' && (
          <CompartilhBtn stickerImageUrl={sticker.imageUrl} stickerId={sticker.id} />
        )}
      </View>
    </LinearGradient>
  );
};

const StickerRevealCard: React.FC<{
  sticker: Sticker;
  onAdvance: () => void;
  isLast: boolean;
}> = ({ sticker, onAdvance, isLast }) => {
  const [phase, setPhase] = useState<'charging' | 'revealed'>('charging');
  const flip = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const shake = useSharedValue(0);

  // As duas fases moram no mesmo efeito de propósito: `shake` e `scale` são
  // animados nas duas, e a regra react-hooks/immutability proíbe mexer em um
  // shared value que já foi mexido num efeito anterior.
  useEffect(() => {
    if (phase === 'charging') {
      haptic.charge();
      // Tremor de expectativa enquanto a carta ainda está de costas.
      shake.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 90, easing: Easing.inOut(Easing.quad) }),
          withTiming(3, { duration: 90, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      scale.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });

      const timeout = setTimeout(() => setPhase('revealed'), RARITY_CHARGE_MS[sticker.rarity]);
      return () => clearTimeout(timeout);
    }

    haptic.reveal(sticker.rarity);
    shake.value = withTiming(0, { duration: 120 });
    flip.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      // Espera o giro passar da metade para o "pulo" coincidir com a frente
      // aparecendo, e não com a carta ainda de costas.
      withDelay(380, withSpring(1.08, { damping: 8, stiffness: 140 })),
      withSpring(1, { damping: 15, stiffness: 200 }),
    );
  }, [phase]);

  // Duas faces com backfaceVisibility: em flip=0 o verso está a 0° (visível) e a
  // frente a 180° (escondida); em flip=1 elas trocam de papel.
  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: scale.value }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVE }, { rotateY: `${flip.value * 180}deg` }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVE }, { rotateY: `${flip.value * 180 + 180}deg` }],
  }));

  const revealed = phase === 'revealed';
  const glowColor = rarityColors[sticker.rarity].border;

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={revealed ? onAdvance : undefined}
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Avançar para a próxima figurinha' : 'Revelando figurinha'}
      >
        <Animated.View style={[styles.cardStage, { shadowColor: glowColor }, stageStyle]}>
          {revealed && <ParticleBurst count={RARITY_PARTICLES[sticker.rarity]} color={glowColor} />}

          <Animated.View style={[styles.cardSide, backStyle]}>
            <CardBack color={glowColor} />
          </Animated.View>
          <Animated.View style={[styles.cardSide, styles.cardSideAbsolute, frontStyle]}>
            <CardFront sticker={sticker} />
          </Animated.View>
        </Animated.View>
      </Pressable>

      <TouchableOpacity
        style={[styles.nextButton, !revealed && styles.nextButtonHidden]}
        onPress={onAdvance}
        activeOpacity={0.8}
        disabled={!revealed}
      >
        <LinearGradient colors={['#B4FF00', '#88CC00']} style={styles.nextButtonGradient}>
          <Text style={styles.nextButtonText}>{isLast ? 'VER RESUMO' : 'PRÓXIMA'}</Text>
          <Ionicons
            name={isLast ? 'list' : 'arrow-forward'}
            size={18}
            color="#0D0D0D"
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const PackSummary: React.FC<{ stickers: Sticker[]; onDone: () => void }> = ({
  stickers,
  onDone,
}) => {
  // Só quebra entre novas/repetidas quando o sorteio informou isso; fora do
  // fluxo de abertura `isNew` é undefined e a contagem seria inventada.
  const classificadas = stickers.filter((s) => s.isNew !== undefined);
  const novas = classificadas.filter((s) => s.isNew).length;
  const repetidas = classificadas.length - novas;
  const total = `${stickers.length} ${stickers.length === 1 ? 'figurinha' : 'figurinhas'}`;

  return (
    <View style={styles.summaryContainer}>
      <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
      <Text style={styles.summaryTitle}>Pacote aberto!</Text>
      <Text style={styles.summarySubtitle}>
        {total}
        {classificadas.length > 0 && ` · ${novas} ${novas === 1 ? 'nova' : 'novas'}`}
        {repetidas > 0 && ` · ${repetidas} ${repetidas === 1 ? 'repetida' : 'repetidas'}`}
      </Text>

      <View style={styles.summaryList}>
        {stickers.map((sticker, index) => {
          const rarity = rarityColors[sticker.rarity];
          return (
            <View key={`${sticker.id}-${index}`} style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: rarity.border }]} />
              {sticker.teamId && <MolduraIndividualPais teamId={sticker.teamId} size="sm" />}
              <View style={styles.summaryTexts}>
                <Text style={styles.summaryName} numberOfLines={1}>
                  {sticker.playerName}
                </Text>
                <Text style={[styles.summaryRarity, { color: rarity.border }]}>{rarity.label}</Text>
              </View>
              {sticker.isNew !== undefined && (
                <Text style={sticker.isNew ? styles.summaryNew : styles.summaryRepeated}>
                  {sticker.isNew ? 'NOVA' : 'REPETIDA'}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={onDone} activeOpacity={0.8}>
        <LinearGradient colors={['#B4FF00', '#88CC00']} style={styles.nextButtonGradient}>
          <Text style={styles.nextButtonText}>CONCLUIR</Text>
          <Ionicons name="checkmark-circle" size={18} color="#0D0D0D" />
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
    haptic.charge();
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
    burstOpacity.value = withDelay(300, withTiming(0, { duration: 300 }));
    // Dispara via timer do JS thread em vez do callback do worklet: o callback
    // de withTiming depende da ponte UI->JS e, se não disparar (animação
    // interrompida, hiccup do bridge), o botão ficava travado em "bursting"
    // para sempre, sem nenhuma ação possível na tela.
    setTimeout(onStartReveal, 600);
  };

  const packStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ translateX: shakeX.value }, { scale: breathScale.value * burstScale.value }],
  }));

  return (
    <View style={styles.center}>
      <Animated.View style={packStyle}>
        <LinearGradient colors={['#1E1E2E', '#24242B']} style={styles.packContainer}>
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
        <LinearGradient colors={['#B4FF00', '#88CC00']} style={styles.openButtonGradient}>
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
  // O resumo é uma fase só da UI: o hook continua responsável apenas por
  // sortear e navegar entre as cartas.
  const [showSummary, setShowSummary] = useState(false);
  const isLast = currentIndex === stickers.length - 1;

  const handleAdvance = useCallback(() => {
    if (isLast) setShowSummary(true);
    else onAdvanceCard();
  }, [isLast, onAdvanceCard]);

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

  if (showSummary) {
    return (
      <ScrollView
        style={styles.revealContainer}
        contentContainerStyle={styles.revealContent}
        showsVerticalScrollIndicator={false}
      >
        <PackSummary stickers={stickers} onDone={onDone} />
      </ScrollView>
    );
  }

  const currentSticker = stickers[currentIndex];
  if (!currentSticker) return null;

  return (
    <ScrollView
      style={styles.revealContainer}
      contentContainerStyle={styles.revealContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.revealHeader}>
        <Text style={styles.revealTitle}>FIGURINHA REVELADA</Text>
        <Text style={styles.revealCounter}>
          {currentIndex + 1} / {stickers.length}
        </Text>
      </View>

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
        onAdvance={handleAdvance}
        isLast={isLast}
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cardSide: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backfaceVisibility: 'hidden',
  },
  cardSideAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardFace: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 12,
  },
  cardBackInner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  cardBackText: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  cardFrontInner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  photoWrapper: {
    width: '100%',
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#1A1A1E',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  flagBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rarityText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  newBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  newBadgeNew: {
    backgroundColor: colors.primary,
  },
  newBadgeRepeated: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  newText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#0D0D0D',
  },
  newTextRepeated: {
    color: colors.textSecondary,
  },
  playerName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  summaryContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  summaryTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  summarySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryList: {
    width: '100%',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  summaryDot: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  summaryTexts: {
    flex: 1,
  },
  summaryName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  summaryRarity: {
    ...typography.caption,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryNew: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summaryRepeated: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  nextButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  nextButtonHidden: {
    opacity: 0,
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
