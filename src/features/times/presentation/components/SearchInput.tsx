import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../../../shared/presentation/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChangeText }) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Buscar times..."
      placeholderTextColor={colors.textSecondary}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    ...typography.body
  }
});
