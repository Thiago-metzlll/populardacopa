import { computeWinRate } from './ranking';

describe('computeWinRate', () => {
  it('retorna 0.5 quando não há ranking (0 ou negativo)', () => {
    expect(computeWinRate(0)).toBe(0.5);
    expect(computeWinRate(-1)).toBe(0.5);
  });

  it('calcula 1 - ranking/100 para rankings dentro da faixa normal', () => {
    expect(computeWinRate(10)).toBeCloseTo(0.9);
    expect(computeWinRate(50)).toBeCloseTo(0.5);
  });

  it('nunca fica abaixo do piso de 0.3, mesmo com ranking muito alto', () => {
    expect(computeWinRate(100)).toBe(0.3);
    expect(computeWinRate(500)).toBe(0.3);
  });

  it('respeita o limite exato do piso em ranking = 70', () => {
    expect(computeWinRate(70)).toBeCloseTo(0.3);
  });
});
