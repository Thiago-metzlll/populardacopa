import React from 'react';
import { SvgProps } from 'react-native-svg';

import BR from '../../../../assets/flags/br.svg';
import AR from '../../../../assets/flags/ar.svg';
import FR from '../../../../assets/flags/fr.svg';
import DE from '../../../../assets/flags/de.svg';
import ES from '../../../../assets/flags/es.svg';
import GB from '../../../../assets/flags/gb.svg';
import PT from '../../../../assets/flags/pt.svg';
import IT from '../../../../assets/flags/it.svg';
import UY from '../../../../assets/flags/uy.svg';

export const flagMap: Record<string, React.FC<SvgProps>> = {
  br: BR,
  ar: AR,
  fr: FR,
  de: DE,
  es: ES,
  gb: GB,
  pt: PT,
  it: IT,
  uy: UY,
};
