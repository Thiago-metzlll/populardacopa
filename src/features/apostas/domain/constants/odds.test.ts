import { computeMatchOdds } from './odds';

describe('computeMatchOdds', () => {
  it('é determinístico: o mesmo id sempre gera as mesmas odds', () => {
    expect(computeMatchOdds('match-1')).toEqual(computeMatchOdds('match-1'));
  });

  it('calcula as odds a partir do hash de soma dos char codes do id', () => {
    // 'match-1' -> soma dos charCodeAt = 619 -> hash%10=9, hash%5=4, hash%8=3
    expect(computeMatchOdds('match-1')).toEqual({ homeWin: 3.3, draw: 3.4, awayWin: 2.75 });

    // 'a' -> charCode 97 -> hash%10=7, hash%5=2, hash%8=1
    expect(computeMatchOdds('a')).toEqual({ homeWin: 2.9, draw: 3.1, awayWin: 2.25 });
  });

  it('ids diferentes tendem a gerar odds diferentes', () => {
    expect(computeMatchOdds('match-1')).not.toEqual(computeMatchOdds('a'));
  });
});
