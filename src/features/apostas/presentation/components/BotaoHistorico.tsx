import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface BotaoHistoricoProps {
  onPress: () => void;
}

export const BotaoHistorico: React.FC<BotaoHistoricoProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Meu Histórico de Palpites</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', marginBottom: spacing.md },
  text: { ...typography.subheading, color: '#0D0D0D' }
});
