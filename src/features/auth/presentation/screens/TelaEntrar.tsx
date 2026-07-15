import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../../shared/presentation/theme/colors';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { typography } from '../../../../shared/presentation/theme/typography';
import { radius } from '../../../../shared/presentation/theme/radius';
import { MoldeInputs } from '../../../../shared/presentation/components/MoldeInputs';
import { useLogin } from '../hooks/useLogin';

export function TelaEntrar() {
  const router = useRouter();
  const { execute, loading, error } = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    const success = await execute(email, password);
    if (success) {
      if(router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
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
              <Text style={styles.title}>Bem-vindo de volta!</Text>
              <Text style={styles.subtitle}>Faça login para continuar</Text>
            </View>

            <View style={styles.form}>
              <MoldeInputs
                label="E-mail"
                placeholder="Seu e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <MoldeInputs
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={error}
              />

              <TouchableOpacity 
                onPress={() => router.push('/esqueci-senha')}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryButton, (!email || !password || loading) && styles.primaryButtonDisabled]}
                onPress={handleLogin}
                disabled={!email || !password || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.skipButtonText}>Continuar sem login</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Ainda não tem conta?</Text>
                <TouchableOpacity onPress={() => router.replace('/cadastro')}>
                  <Text style={styles.footerLink}>Cadastre-se</Text>
                </TouchableOpacity>
              </View>
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
