import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';
import usuarioService from '../services/usuarioService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const handleLogin = async () => {
    const emailLimpo = email.trim();
    if (!emailLimpo || !senha) {
      Alert.alert('Campos obrigatórios', 'Por favor, informe seu e-mail e senha.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpo)) {
      Alert.alert('E-mail inválido', 'Por favor, digite um endereço de e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await usuarioService.loginUsuario({
        email: emailLimpo.toLowerCase(),
        senha,
      });

      const usuario = response.usuario;
      // Reseta a navegação tornando o Feed a tela raiz, sem botão de voltar para o Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Feed', params: { usuario } }],
      });
    } catch (error: any) {
      console.error('Erro no login mobile:', error);
      const mensagemErro =
        error.message ||
        'Falha ao autenticar. Verifique seu e-mail, senha e conexão com o servidor.';
      Alert.alert('Erro ao entrar', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.background}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isTablet && { maxWidth: 520, alignSelf: 'center', width: '100%' }]}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <Text style={styles.badgeText}>🔐</Text>
            </View>
            <Text style={styles.titulo}>Acesse sua Conta</Text>
            <Text style={styles.subtitulo}>
              Entre para acompanhar ações, apoiar causas e interagir com a comunidade Onglink.
            </Text>
          </View>

          {/* Campo E-mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Senha</Text>
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.togglePasswordText}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Sua senha de acesso"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Link para Cadastro Simples */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cadastro')}
          >
            <Text style={styles.secondaryButtonText}>Criar nova conta de usuário</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 26,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  togglePasswordText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.textMuted,
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.brandGreen,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.brandGreenDark,
    fontSize: 15,
    fontWeight: 'bold',
  },
  ongLinkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  ongLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ongLinkTextBold: {
    color: colors.brandGreenDark,
    fontWeight: 'bold',
  },
});
