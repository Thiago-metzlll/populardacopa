import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, typography } from '../../../../shared/presentation/theme';
import { Ionicons } from '@expo/vector-icons';

interface CompartilhBtnProps {
  stickerImageUrl: string;
  stickerId: string;
}

export const CompartilhBtn: React.FC<CompartilhBtnProps> = ({ stickerImageUrl, stickerId }) => {
  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Try sharing the image directly
        await Sharing.shareAsync(stickerImageUrl);
      } else {
        // Fallback to text sharing
        await Share.share({
          message: `Confira minha figurinha #${stickerId} da Copa: ${stickerImageUrl}`,
        });
      }
    } catch (error) {
      try {
        // Fallback to text sharing if Direct file sharing fails due to URL parsing
        await Share.share({
          message: `Confira minha figurinha #${stickerId} da Copa: ${stickerImageUrl}`,
        });
      } catch (err: any) {
        Alert.alert('Erro', 'Não foi possível compartilhar a figurinha.');
      }
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleShare} activeOpacity={0.7}>
      <Ionicons name="share-social-outline" size={14} color={colors.primary} />
      <Text style={styles.text}>Compartilhar</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#444',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
