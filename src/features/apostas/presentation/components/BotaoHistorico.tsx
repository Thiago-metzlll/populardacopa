import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
  button: { padding: 12, backgroundColor: '#007bff', borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  text: { color: '#fff', fontWeight: 'bold' }
});
