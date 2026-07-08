import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player } from '../../domain/entities/Player';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface MoldeJogadoresProps {
  player: Player;
  onPress?: () => void;
}

export const MoldeJogadores: React.FC<MoldeJogadoresProps> = ({ player, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.numberContainer}>
        <Text style={styles.numberText}>{player.number}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{player.name}</Text>
        <Text style={styles.positionText}>{player.position}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  numberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  numberText: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  positionText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
