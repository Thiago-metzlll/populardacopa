import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CardMinhaColecaoProps {
  progress: number;
}

export const CardMinhaColecao: React.FC<CardMinhaColecaoProps> = ({ progress }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Minhas Figurinhas</Text>
      <Text style={styles.progress}>{progress.toFixed(0)}/100</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold' },
  progress: { fontSize: 24, marginTop: 8 }
});
