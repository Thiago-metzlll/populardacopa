import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../../shared/infra/firebase/firebaseConfig';
import { COLLECTIONS, USER_FIELDS } from '../../../../shared/infra/firebase/collections';
import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';
import { AlbumRepository, BuyStickerPackResult } from '../../domain/repositories/AlbumRepository';
import { mockAlbums, mockStickers } from '../seed/AlbumSeed';

/**
 * FirestoreAlbumRepository
 *
 * Dados MUTÁVEIS do usuário (coins, stickerIds, progress) → Firestore
 * Dados ESTÁTICOS do álbum (stickers, albums) → mocks locais
 *
 * Implementa exatamente a mesma interface AlbumRepository — o Domain e a
 * Presentation não sabem qual implementação está sendo usada.
 */
export class FirestoreAlbumRepository implements AlbumRepository {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  private userRef(userId: string) {
    return doc(db, COLLECTIONS.USERS, userId);
  }

  /**
   * Garante que o documento do usuário existe com valores padrão.
   * Usa setDoc + merge:true para não sobrescrever dados existentes.
   */
  private async ensureUserDoc(userId: string): Promise<void> {
    const ref = this.userRef(userId);
    await setDoc(
      ref,
      {
        [USER_FIELDS.COINS]: 200,
        [USER_FIELDS.STICKER_IDS]: [],
        [USER_FIELDS.PROGRESS]: 0,
        [USER_FIELDS.FAVORITE_TEAM_IDS]: [],
        [USER_FIELDS.CREATED_AT]: serverTimestamp(),
      },
      { merge: true },
    );
  }

  // ─── Dados do usuário (Firestore) ────────────────────────────────────────────

  async getUserCollection(userId: string): Promise<UserCollection> {
    await this.ensureUserDoc(userId);
    const snap = await getDoc(this.userRef(userId));
    const data = snap.data()!;
    const stickerIds: string[] = data[USER_FIELDS.STICKER_IDS] ?? [];
    return {
      userId,
      albumId: 'a1',
      stickerIds,
      progress: (stickerIds.length / mockAlbums[0].totalStickers) * 100,
    };
  }

  async getUserCoins(userId: string): Promise<number> {
    await this.ensureUserDoc(userId);
    const snap = await getDoc(this.userRef(userId));
    return snap.data()?.[USER_FIELDS.COINS] ?? 200;
  }

  async deductUserCoins(userId: string, amount: number): Promise<number> {
    const currentCoins = await this.getUserCoins(userId);
    const newBalance = Math.max(0, currentCoins - amount);
    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: newBalance,
    });
    return newBalance;
  }

  // ─── Dados estáticos do álbum (mocks locais) ────────────────────────────────

  async getAlbumById(id: string): Promise<Album> {
    const album = mockAlbums.find((a) => a.id === id);
    if (!album) throw new Error('Album not found');
    return { ...album };
  }

  async getStickersByIds(ids: string[]): Promise<Sticker[]> {
    return mockStickers.filter((s) => ids.includes(s.id));
  }

  async getMarketAlbums(): Promise<Album[]> {
    return mockAlbums.map((a) => ({ ...a }));
  }

  async getStickersByAlbumId(albumId: string): Promise<Sticker[]> {
    return mockStickers.filter((s) => s.albumId === albumId);
  }

  async getAllStickers(): Promise<Sticker[]> {
    return mockStickers;
  }

  // ─── Lógica de negócio (híbrida: sorteio local + persistência Firestore) ───

  async openPackage(packageId: string, userId: string): Promise<Sticker[]> {
    const collection = await this.getUserCollection(userId);
    const notOwned = mockStickers.filter((s) => !collection.stickerIds.includes(s.id));

    const numToDraw = Math.min(3, notOwned.length);
    const shuffled = [...notOwned].sort(() => 0.5 - Math.random());
    const newStickers: Sticker[] = shuffled.slice(0, numToDraw).map((s) => ({
      ...s,
      obtainedAt: new Date().toISOString(),
    }));

    if (newStickers.length > 0) {
      const newIds = newStickers.map((s) => s.id);
      const updatedIds = [...collection.stickerIds, ...newIds];
      const newProgress = (updatedIds.length / mockAlbums[0].totalStickers) * 100;

      await updateDoc(this.userRef(userId), {
        [USER_FIELDS.STICKER_IDS]: arrayUnion(...newIds),
        [USER_FIELDS.PROGRESS]: newProgress,
      });
    }

    return newStickers;
  }

  async buyStickerPack(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult> {
    const coins = await this.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    // Sorteia 3 figurinhas aleatórias do pool estático
    const drawn: Sticker[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * mockStickers.length);
      drawn.push({ ...mockStickers[idx], obtainedAt: new Date().toISOString() });
    }

    // Novas figurinhas únicas para adicionar à coleção
    const newIds = drawn.map((s) => s.id);
    const newBalance = coins - cost;

    const collection = await this.getUserCollection(userId);
    const updatedIds = [...new Set([...collection.stickerIds, ...newIds])];
    const newProgress = (updatedIds.length / mockAlbums[0].totalStickers) * 100;

    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: newBalance,
      [USER_FIELDS.STICKER_IDS]: arrayUnion(...newIds),
      [USER_FIELDS.PROGRESS]: newProgress,
    });

    const packId = `pkg_${Date.now()}`;
    return { packId, stickers: drawn };
  }

  async buyIndividualSticker(userId: string, stickerId: string, cost: number): Promise<Sticker> {
    const sticker = mockStickers.find((s) => s.id === stickerId);
    if (!sticker) throw new Error('Figurinha não encontrada');

    const coins = await this.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    const newBalance = coins - cost;
    const updatedSticker = { ...sticker, obtainedAt: new Date().toISOString() };

    const collection = await this.getUserCollection(userId);
    const album = mockAlbums.find((a) => a.id === sticker.albumId);
    const updatedIds = [...new Set([...collection.stickerIds, stickerId])];
    const ownedInAlbum = updatedIds.filter(
      (id) => mockStickers.find((s) => s.id === id)?.albumId === sticker.albumId
    ).length;
    const newProgress = album ? (ownedInAlbum / album.totalStickers) * 100 : collection.progress;

    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: newBalance,
      [USER_FIELDS.STICKER_IDS]: arrayUnion(stickerId),
      [USER_FIELDS.PROGRESS]: newProgress,
    });

    return updatedSticker;
  }
}
