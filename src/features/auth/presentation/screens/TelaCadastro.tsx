import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../../shared/presentation/theme/colors';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { typography } from '../../../../shared/presentation/theme/typography';
import { radius } from '../../../../shared/presentation/theme/radius';
import { MoldeInputs } from '../../../../shared/presentation/components/MoldeInputs';
import { useRegister } from '../hooks/useRegister';

export function TelaCadastro() {
  const router = useRouter();
  const { execute, loading, error } = useRegister();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLocalError(null);
    if (!name || !email || !password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    const success = await execute(name, email, password);
    if (success) {
      if(router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  const displayError = localError || error;

  return (
    <LinearGradient
      colors={[colors.background, '#0a0a0c']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao Popular da Copa</Text>
        </View>

        <View style={styles.form}>
          <MoldeInputs
            label="Nome"
            placeholder="Como quer ser chamado?"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <MoldeInputs
            label="E-mail"
            placeholder="Seu melhor e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <MoldeInputs
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <MoldeInputs
            label="Confirmar Senha"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={displayError}
          />

          <TouchableOpacity 
            style={[styles.primaryButton, (!name || !email || !password || !confirmPassword || loading) && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={!name || !email || !password || !confirmPassword || loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.replace('/entrar')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  primaryButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
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
