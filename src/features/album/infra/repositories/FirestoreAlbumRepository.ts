import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS, USER_FIELDS } from '../../../../shared/infra/firebase/collections';
import { db } from '../../../../shared/infra/firebase/firebaseConfig';
import { computeDailyCoinsStatus, computeFreePackStatus, DailyClaimStatus, DailyCoinsStatus } from '../../domain/constants/rewards';
import { Album } from '../../domain/entities/Album';
import { Sticker } from '../../domain/entities/Sticker';
import { UserCollection } from '../../domain/entities/UserCollection';
import { AlbumRepository, BuyStickerPackResult, ClaimDailyCoinsResult } from '../../domain/repositories/AlbumRepository';
import { SQLiteAlbumCatalogRepository } from './SQLiteAlbumCatalogRepository';

/**
 * FirestoreAlbumRepository
 *
 * Dados MUTÁVEIS do usuário (coins, stickerIds, progress) → Firestore
 * Dados ESTÁTICOS do álbum (stickers, albums) → SQLite local
 *
 * Implementa exatamente a mesma interface AlbumRepository — o Domain e a
 * Presentation não sabem qual implementação está sendo usada.
 */
export class FirestoreAlbumRepository implements AlbumRepository {
  constructor(private readonly catalogRepository: SQLiteAlbumCatalogRepository) { }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private userRef(userId: string) {
    return doc(db, COLLECTIONS.USERS, userId);
  }

  /**
   * Garante que o documento do usuário existe com valores padrão.
   * Só grava se o documento ainda não existir — setDoc com merge:true
   * substitui o valor de cada campo listado, então chamá-lo incondicionalmente
   * em toda leitura resetava coins/stickerIds/progress para o padrão a cada vez.
   */
  private async ensureUserDoc(userId: string): Promise<void> {
    const ref = this.userRef(userId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    await setDoc(ref, {
      [USER_FIELDS.COINS]: 200,
      [USER_FIELDS.STICKER_IDS]: [],
      [USER_FIELDS.STICKER_OBTAINED_AT]: {},
      [USER_FIELDS.PROGRESS]: 0,
      [USER_FIELDS.FAVORITE_TEAM_IDS]: [],
      [USER_FIELDS.CREATED_AT]: serverTimestamp(),
    });
  }

  /**
   * Monta um objeto de update com dot-notation para gravar a data de obtenção
   * de cada sticker dentro do mapa stickerObtainedAt, sem sobrescrever os demais.
   */
  private obtainedAtUpdate(ids: string[], iso: string): Record<string, string> {
    const update: Record<string, string> = {};
    for (const id of ids) {
      update[`${USER_FIELDS.STICKER_OBTAINED_AT}.${id}`] = iso;
    }
    return update;
  }

  // ─── Dados do usuário (Firestore) ────────────────────────────────────────────

  async getUserCollection(userId: string): Promise<UserCollection> {
    await this.ensureUserDoc(userId);
    const snap = await getDoc(this.userRef(userId));
    const data = snap.data()!;
    const stickerIds: string[] = data[USER_FIELDS.STICKER_IDS] ?? [];
    const stickerObtainedAt: Record<string, string> = data[USER_FIELDS.STICKER_OBTAINED_AT] ?? {};

    // Busca informações do álbum a1 no catálogo SQLite para ver o total
    const album = await this.catalogRepository.getAlbumById('a1');

    return {
      userId,
      albumId: 'a1',
      stickerIds,
      stickerObtainedAt,
      progress: (stickerIds.length / album.totalStickers) * 100,
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

  async addUserCoins(userId: string, amount: number): Promise<number> {
    await this.ensureUserDoc(userId);
    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: increment(amount),
    });
    return this.getUserCoins(userId);
  }

  async getDailyCoinsStatus(userId: string): Promise<DailyCoinsStatus> {
    await this.ensureUserDoc(userId);
    const snap = await getDoc(this.userRef(userId));
    const lastClaim = snap.data()?.[USER_FIELDS.LAST_DAILY_COINS_CLAIM_AT];
    const lastClaimIso = lastClaim?.toDate ? lastClaim.toDate().toISOString() : null;
    return computeDailyCoinsStatus(lastClaimIso);
  }

  async claimDailyCoins(userId: string): Promise<ClaimDailyCoinsResult> {
    const status = await this.getDailyCoinsStatus(userId);
    if (!status.available) {
      throw new Error('Recompensa diária ainda não disponível.');
    }
    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: increment(status.amount),
      [USER_FIELDS.LAST_DAILY_COINS_CLAIM_AT]: serverTimestamp(),
    });
    const coins = await this.getUserCoins(userId);
    return { coins, amount: status.amount };
  }

  // ─── Dados estáticos do álbum (Catálogo local do SQLite) ───────────────────

  async getAlbumById(id: string): Promise<Album> {
    return this.catalogRepository.getAlbumById(id);
  }

  async getStickersByIds(ids: string[]): Promise<Sticker[]> {
    return this.catalogRepository.getStickersByIds(ids);
  }

  async getMarketAlbums(userId: string): Promise<Album[]> {
    // O catálogo (SQLite) é estático e sempre devolve ownedStickersCount:0 —
    // aqui cruzamos com a coleção real do usuário (Firestore) pra calcular
    // a contagem por álbum exibida no Mercado.
    const [albums, collection, allStickers] = await Promise.all([
      this.catalogRepository.getMarketAlbums(),
      this.getUserCollection(userId),
      this.catalogRepository.getAllStickers(),
    ]);

    const albumIdByStickerId = new Map(allStickers.map((s) => [s.id, s.albumId]));
    const ownedCountByAlbum = new Map<string, number>();
    for (const stickerId of collection.stickerIds) {
      const albumId = albumIdByStickerId.get(stickerId);
      if (albumId) ownedCountByAlbum.set(albumId, (ownedCountByAlbum.get(albumId) ?? 0) + 1);
    }

    return albums.map((album) => ({
      ...album,
      ownedStickersCount: ownedCountByAlbum.get(album.id) ?? 0,
    }));
  }

  async getStickersByAlbumId(albumId: string): Promise<Sticker[]> {
    return this.catalogRepository.getStickersByAlbumId(albumId);
  }

  async getAllStickers(): Promise<Sticker[]> {
    return this.catalogRepository.getAllStickers();
  }

  // ─── Lógica de negócio (híbrida: sorteio local + persistência Firestore) ───
  // TODO arquitetura: o sorteio (aqui e em buyStickerPack) é regra de negócio pura,
  // independente de Firestore/SQLite — candidato a virar usecase/serviço de domínio
  // testável sem infra, em vez de ficar duplicado dentro do repository concreto.

  /**
   * Sorteia até 3 figurinhas não possuídas e grava na coleção do usuário.
   * Compartilhado por openPackage (fluxo legado) e claimFreePackage (pacote grátis diário).
   */
  private async drawAndGrantStickers(userId: string): Promise<Sticker[]> {
    const collection = await this.getUserCollection(userId);
    const allStickers = await this.catalogRepository.getAllStickers();
    const notOwned = allStickers.filter((s) => !collection.stickerIds.includes(s.id));

    const numToDraw = Math.min(3, notOwned.length);
    const shuffled = [...notOwned].sort(() => 0.5 - Math.random());
    const now = new Date().toISOString();
    const newStickers: Sticker[] = shuffled.slice(0, numToDraw).map((s) => ({
      ...s,
      obtainedAt: now,
    }));

    if (newStickers.length > 0) {
      const newIds = newStickers.map((s) => s.id);
      const updatedIds = [...collection.stickerIds, ...newIds];
      const album = await this.catalogRepository.getAlbumById('a1');
      const newProgress = (updatedIds.length / album.totalStickers) * 100;

      await updateDoc(this.userRef(userId), {
        [USER_FIELDS.STICKER_IDS]: arrayUnion(...newIds),
        [USER_FIELDS.PROGRESS]: newProgress,
        ...this.obtainedAtUpdate(newIds, now),
      });
    }

    return newStickers;
  }

  async openPackage(packageId: string, userId: string): Promise<Sticker[]> {
    return this.drawAndGrantStickers(userId);
  }

  async getFreePackStatus(userId: string): Promise<DailyClaimStatus> {
    await this.ensureUserDoc(userId);
    const snap = await getDoc(this.userRef(userId));
    const lastClaim = snap.data()?.[USER_FIELDS.LAST_FREE_PACK_CLAIM_AT];
    const lastClaimIso = lastClaim?.toDate ? lastClaim.toDate().toISOString() : null;
    return computeFreePackStatus(lastClaimIso);
  }

  async claimFreePackage(userId: string): Promise<Sticker[]> {
    const status = await this.getFreePackStatus(userId);
    if (!status.available) {
      throw new Error('Pacote grátis ainda não disponível.');
    }
    const stickers = await this.drawAndGrantStickers(userId);
    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.LAST_FREE_PACK_CLAIM_AT]: serverTimestamp(),
    });
    return stickers;
  }

  async grantStickers(userId: string, stickerIds: string[]): Promise<Sticker[]> {
    await this.ensureUserDoc(userId);
    const collection = await this.getUserCollection(userId);
    const newIds = stickerIds.filter((id) => !collection.stickerIds.includes(id));

    const dbStickers = await this.catalogRepository.getStickersByIds(newIds);
    const now = new Date().toISOString();
    const granted = dbStickers.map((s) => ({ ...s, obtainedAt: now }));

    if (granted.length > 0) {
      const updatedIds = [...collection.stickerIds, ...newIds];
      const album = await this.catalogRepository.getAlbumById('a1');
      const newProgress = (updatedIds.length / album.totalStickers) * 100;
      await updateDoc(this.userRef(userId), {
        [USER_FIELDS.STICKER_IDS]: arrayUnion(...newIds),
        [USER_FIELDS.PROGRESS]: newProgress,
        ...this.obtainedAtUpdate(newIds, now),
      });
    }

    return granted;
  }

  async buyStickerPack(userId: string, albumId: string, cost: number): Promise<BuyStickerPackResult> {
    const coins = await this.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    // Sorteia 3 figurinhas aleatórias do pool estático do SQLite
    const allStickers = await this.catalogRepository.getAllStickers();
    const now = new Date().toISOString();
    const drawn: Sticker[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * allStickers.length);
      drawn.push({ ...allStickers[idx], obtainedAt: now });
    }

    // Novas figurinhas únicas para adicionar à coleção
    const newIds = drawn.map((s) => s.id);
    const newBalance = coins - cost;

    const collection = await this.getUserCollection(userId);
    const updatedIds = [...new Set([...collection.stickerIds, ...newIds])];
    const album = await this.catalogRepository.getAlbumById('a1');
    const newProgress = (updatedIds.length / album.totalStickers) * 100;

    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: newBalance,
      [USER_FIELDS.STICKER_IDS]: arrayUnion(...newIds),
      [USER_FIELDS.PROGRESS]: newProgress,
      ...this.obtainedAtUpdate(newIds, now),
    });

    const packId = `pkg_${Date.now()}`;
    return { packId, stickers: drawn };
  }

  async buyIndividualSticker(userId: string, stickerId: string, cost: number): Promise<Sticker> {
    const dbStickers = await this.catalogRepository.getStickersByIds([stickerId]);
    const sticker = dbStickers[0];
    if (!sticker) throw new Error('Figurinha não encontrada');

    const coins = await this.getUserCoins(userId);
    if (coins < cost) throw new Error('Saldo de moedas insuficiente');

    const newBalance = coins - cost;
    const now = new Date().toISOString();
    const updatedSticker = { ...sticker, obtainedAt: now };

    const collection = await this.getUserCollection(userId);
    const updatedIds = [...new Set([...collection.stickerIds, stickerId])];

    // Progress é sempre relativo ao álbum 'a1', igual em getUserCollection/buyStickerPack/
    // drawAndGrantStickers — evita que o valor persistido flutue conforme a última ação.
    const album = await this.catalogRepository.getAlbumById('a1');
    const newProgress = (updatedIds.length / album.totalStickers) * 100;

    await updateDoc(this.userRef(userId), {
      [USER_FIELDS.COINS]: newBalance,
      [USER_FIELDS.STICKER_IDS]: arrayUnion(stickerId),
      [USER_FIELDS.PROGRESS]: newProgress,
      ...this.obtainedAtUpdate([stickerId], now),
    });

    return updatedSticker;
  }
}

