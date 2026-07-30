import { makeSticker } from '../../../../../test/fixtures';
import { pendingPackStore } from './pendingPackStore';

/**
 * Store em memória compartilhado entre módulos: os testes limpam as chaves que
 * usam para não vazar estado entre casos.
 */
const PACKS = ['pack-1', 'pack-2'];

afterEach(() => {
  PACKS.forEach((packId) => pendingPackStore.clear(packId));
});

describe('pendingPackStore', () => {
  it('guarda e devolve as figurinhas de um pacote', () => {
    const stickers = [makeSticker({ id: 's1' }), makeSticker({ id: 's2' })];

    pendingPackStore.set('pack-1', stickers);

    expect(pendingPackStore.has('pack-1')).toBe(true);
    expect(pendingPackStore.get('pack-1')).toBe(stickers);
  });

  it('devolve lista vazia para um pacote desconhecido', () => {
    expect(pendingPackStore.get('pack-inexistente')).toEqual([]);
    expect(pendingPackStore.has('pack-inexistente')).toBe(false);
  });

  it('diferencia has() de get() para uma lista vazia gravada', () => {
    pendingPackStore.set('pack-1', []);

    expect(pendingPackStore.has('pack-1')).toBe(true);
    expect(pendingPackStore.get('pack-1')).toEqual([]);
  });

  it('clear remove apenas o pacote informado', () => {
    pendingPackStore.set('pack-1', [makeSticker({ id: 's1' })]);
    pendingPackStore.set('pack-2', [makeSticker({ id: 's2' })]);

    pendingPackStore.clear('pack-1');

    expect(pendingPackStore.has('pack-1')).toBe(false);
    expect(pendingPackStore.has('pack-2')).toBe(true);
  });

  it('clear de um pacote inexistente não quebra', () => {
    expect(() => pendingPackStore.clear('pack-inexistente')).not.toThrow();
  });

  it('sobrescreve as figurinhas ao gravar o mesmo packId de novo', () => {
    pendingPackStore.set('pack-1', [makeSticker({ id: 's1' })]);
    pendingPackStore.set('pack-1', [makeSticker({ id: 's9' })]);

    expect(pendingPackStore.get('pack-1').map((s) => s.id)).toEqual(['s9']);
  });
});
