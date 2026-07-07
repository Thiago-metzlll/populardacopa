import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface PalpiteBtnProps {
  onConfirm: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
}

export const PalpiteBtn: React.FC<PalpiteBtnProps> = ({
  onConfirm,
  isLoading = false,
  disabled = false,
  label = "Confirmar Palpite",
}) => {
  return (
    <TouchableOpacity
      onPress={onConfirm}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.button,
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="#1A1A1E" size="small" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1A1A1E',
    letterSpacing: 0.5,
  },
});
