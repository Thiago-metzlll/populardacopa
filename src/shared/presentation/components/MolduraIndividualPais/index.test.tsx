import React from 'react';
import { Image } from 'expo-image';
import { render, screen } from '@testing-library/react-native';
import { colors } from '../../theme';
import { flattenStyle } from '../../../../../test/styleHelpers';
import { MolduraIndividualPais } from './index';

/**
 * Lógica testável: normalização do teamId, mapeamento ISO-3 -> ISO-2 e a
 * escolha entre bandeira SVG local e fallback pelo CDN.
 * Os imports de .svg são mockados por test/svgMock.tsx (testID svg-flag).
 */
const cdnUri = () => screen.UNSAFE_getByType(Image).props.source.uri;

describe('MolduraIndividualPais', () => {
  describe('bandeiras SVG locais', () => {
    it.each(['br', 'ar', 'fr', 'de', 'es', 'gb', 'pt', 'it', 'uy'])(
      'renderiza o SVG local para %s',
      (code) => {
        render(<MolduraIndividualPais teamId={code} />);

        expect(screen.getByTestId('svg-flag')).toBeTruthy();
        expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
      },
    );

    it('normaliza o teamId para minúsculas antes de buscar a bandeira', () => {
      render(<MolduraIndividualPais teamId="BRA" />);

      expect(screen.getByTestId('svg-flag')).toBeTruthy();
    });

    it.each([
      ['bra', 'br'],
      ['arg', 'ar'],
      ['ger', 'de'],
      ['esp', 'es'],
      ['por', 'pt'],
      ['uru', 'uy'],
      ['fra', 'fr'],
    ])('converte o ISO-3 %s para o SVG de %s', (iso3) => {
      render(<MolduraIndividualPais teamId={iso3} />);

      expect(screen.getByTestId('svg-flag')).toBeTruthy();
    });

    it.each([
      ['t1', 'br'],
      ['t2', 'ar'],
      ['t9', 'uy'],
    ])('mantém compatibilidade com o id mockado %s', (mockId) => {
      render(<MolduraIndividualPais teamId={mockId} />);

      expect(screen.getByTestId('svg-flag')).toBeTruthy();
    });
  });

  describe('fallback pelo CDN', () => {
    it.each([
      ['mex', 'mx'],
      ['kor', 'kr'],
      ['rsa', 'za'],
      ['sui', 'ch'],
      ['ksa', 'sa'],
      ['ned', 'nl'],
      ['cod', 'cd'],
      ['alg', 'dz'],
    ])('mapeia o ISO-3 %s para o código %s na URL do CDN', (iso3, iso2) => {
      render(<MolduraIndividualPais teamId={iso3} />);

      expect(cdnUri()).toBe(`https://flagcdn.com/w160/${iso2}.png`);
      expect(screen.queryByTestId('svg-flag')).toBeNull();
    });

    it.each([
      ['sco', 'gb-sct'],
      ['eng', 'gb-eng'],
    ])('usa o código de sub-região para %s', (iso3, expected) => {
      render(<MolduraIndividualPais teamId={iso3} />);

      expect(cdnUri()).toBe(`https://flagcdn.com/w160/${expected}.png`);
    });

    it('usa o próprio id quando ele não está no mapa ISO-3', () => {
      render(<MolduraIndividualPais teamId="jp" />);

      expect(cdnUri()).toBe('https://flagcdn.com/w160/jp.png');
    });

    it('normaliza para minúsculas também no fallback', () => {
      render(<MolduraIndividualPais teamId="MEX" />);

      expect(cdnUri()).toBe('https://flagcdn.com/w160/mx.png');
    });
  });

  describe('dimensões e borda', () => {
    it.each([
      ['sm', 32],
      ['md', 48],
      ['lg', 64],
    ] as const)('o tamanho %s vira um círculo de %ipx', (size, expected) => {
      const tree = render(<MolduraIndividualPais teamId="mex" size={size} />).toJSON();

      const style = flattenStyle((tree as any).props.style);
      expect(style.width).toBe(expected);
      expect(style.height).toBe(expected);
      expect(style.borderRadius).toBe(expected / 2);
    });

    it('usa md como tamanho padrão', () => {
      const tree = render(<MolduraIndividualPais teamId="mex" />).toJSON();

      expect(flattenStyle((tree as any).props.style).width).toBe(48);
    });

    it('destaca com a cor primária quando showBorder é true', () => {
      const tree = render(<MolduraIndividualPais teamId="mex" showBorder />).toJSON();

      const style = flattenStyle((tree as any).props.style);
      expect(style.borderColor).toBe(colors.primary);
      expect(style.borderWidth).toBe(2);
    });

    it('usa a borda neutra por padrão', () => {
      const tree = render(<MolduraIndividualPais teamId="mex" />).toJSON();

      const style = flattenStyle((tree as any).props.style);
      expect(style.borderColor).toBe('#555');
      expect(style.borderWidth).toBe(1);
    });
  });
});
