import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../../shared/presentation/theme/colors';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { typography } from '../../../../shared/presentation/theme/typography';
import { radius } from '../../../../shared/presentation/theme/radius';
import { MoldeInputs } from '../../../../shared/presentation/components/MoldeInputs';
import { useForgotPassword } from '../hooks/useForgotPassword';

export function TelaEsqueciSenha() {
  const router = useRouter();
  const { execute, loading, error, sent } = useForgotPassword();
  
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) return;
    await execute(email);
  };

  return (
    <LinearGradient
      colors={[colors.background, '#0a0a0c']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Recuperar Senha</Text>
              <Text style={styles.subtitle}>Enviaremos um link de recuperação</Text>
            </View>

            <View style={styles.form}>
              {sent ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    Email de recuperação enviado! Verifique sua caixa de entrada (e o spam).
                  </Text>
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => router.replace('/entrar')}
                  >
                    <Text style={styles.primaryButtonText}>Voltar para o Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <MoldeInputs
                    label="E-mail"
                    placeholder="Seu e-mail cadastrado"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={error}
                  />

                  <TouchableOpacity 
                    style={[styles.primaryButton, (!email || loading) && styles.primaryButtonDisabled]}
                    onPress={handleReset}
                    disabled={!email || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Enviar Link</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#333',
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
