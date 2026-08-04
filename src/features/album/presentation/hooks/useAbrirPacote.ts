import { useState, useCallback } from 'react';
import { Sticker } from '../../domain/entities/Sticker';
import { makeOpenPackage } from '../../main/factories/makeOpenPackage';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { pendingPackStore, FREE_PACK_PREFIX } from '../../infra/stores/pendingPackStore';

export const useAbrirPacote = (packId: string) => {
  const user = useCurrentUser();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const loadPack = useCallback(async () => {
    if (!user || revealed) return;
    try {
      setLoading(true);
      let result: Sticker[];
      if (pendingPackStore.has(packId)) {
        // Figurinhas já sorteadas e persistidas por buyStickerPack; evita double-draw.
        result = pendingPackStore.get(packId);
        pendingPackStore.clear(packId);
      } else if (packId.startsWith(FREE_PACK_PREFIX)) {
        // Pacote grátis já sorteado e cobrado do limite diário: cair no
        // openPackage aqui sortearia um segundo pacote de graça.
        throw new Error('Este pacote grátis já foi aberto.');
      } else {
        const useCase = makeOpenPackage();
        result = await useCase.execute(packId, user.id);
      }
      setStickers(result);
      setRevealed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [packId, user, revealed]);

  const advanceCard = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, stickers.length - 1));
  }, [stickers.length]);

  const startReveal = useCallback(async () => {
    if (stickers.length === 0) {
      await loadPack();
    }
    setIsRevealing(true);
    setCurrentIndex(0);
  }, [stickers.length, loadPack]);

  return {
    stickers,
    isRevealing,
    currentIndex,
    loading,
    error,
    startReveal,
    advanceCard,
  };
};
