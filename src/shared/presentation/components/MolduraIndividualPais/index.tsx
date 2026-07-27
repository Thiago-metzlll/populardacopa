import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { flagMap } from '../../utils/flagMap';
import { colors } from '../../theme';

interface MolduraIndividualPaisProps {
  teamId: string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
}

const countryCodeMap: Record<string, string> = {
  // Mocks antigos
  t1: 'br',
  t2: 'ar',
  t3: 'fr',
  t4: 'de',
  t5: 'es',
  t6: 'gb',
  t7: 'pt',
  t8: 'it',
  t9: 'uy',
  t10: 'us',
  
  // Mapeamentos ISO-3 para ISO-2 das 48 seleções reais
  mex: 'mx',
  rsa: 'za',
  kor: 'kr',
  cze: 'cz',
  can: 'ca',
  sui: 'ch',
  qat: 'qa',
  bih: 'ba',
  bra: 'br',
  mar: 'ma',
  sco: 'gb-sct',
  hai: 'ht',
  usa: 'us',
  par: 'py',
  aus: 'au',
  tur: 'tr',
  ger: 'de',
  ecu: 'ec',
  civ: 'ci',
  cuw: 'cw',
  ned: 'nl',
  jpn: 'jp',
  tun: 'tn',
  swe: 'se',
  bel: 'be',
  irn: 'ir',
  egy: 'eg',
  nzl: 'nz',
  esp: 'es',
  uru: 'uy',
  ksa: 'sa',
  cpv: 'cv',
  fra: 'fr',
  sen: 'sn',
  nor: 'no',
  irq: 'iq',
  arg: 'ar',
  aut: 'at',
  alg: 'dz',
  jor: 'jo',
  por: 'pt',
  col: 'co',
  uzb: 'uz',
  cod: 'cd',
  eng: 'gb-eng',
  cro: 'hr',
  pan: 'pa',
  gha: 'gh',
};

export const MolduraIndividualPais: React.FC<MolduraIndividualPaisProps> = ({
  teamId,
  size = 'md',
  showBorder = false,
}) => {
  const normalizedId = teamId.toLowerCase();
  const countryId = countryCodeMap[normalizedId] || normalizedId;
  const FlagComponent = flagMap[countryId];

  const dimensions = {
    sm: 32,
    md: 48,
    lg: 64,
  }[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions,
          height: dimensions,
          borderRadius: dimensions / 2,
        },
        showBorder && styles.activeBorder,
      ]}
    >
      {FlagComponent ? (
        <FlagComponent width="100%" height="100%" />
      ) : countryId ? (
        <Image
          source={{ uri: `https://flagcdn.com/w160/${countryId}.png` }}
          style={[styles.flagImage, { borderRadius: dimensions / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: dimensions / 2 }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  activeBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
  },
});

