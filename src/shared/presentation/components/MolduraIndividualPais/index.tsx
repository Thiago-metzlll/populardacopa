import React from 'react';
import { View, StyleSheet } from 'react-native';
import { flagMap } from '../../utils/flagMap';
import { colors } from '../../theme';

interface MolduraIndividualPaisProps {
  teamId: string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
}

const teamToCountryMap: Record<string, string> = {
  t1: 'br',
  t2: 'ar',
  t3: 'fr',
  t4: 'de',
  t5: 'es',
  t6: 'gb',
  t7: 'pt',
  t8: 'it',
  t9: 'uy',
};

export const MolduraIndividualPais: React.FC<MolduraIndividualPaisProps> = ({
  teamId,
  size = 'md',
  showBorder = false,
}) => {
  const normalizedId = teamId.toLowerCase();
  const countryId = teamToCountryMap[normalizedId] || normalizedId;
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
