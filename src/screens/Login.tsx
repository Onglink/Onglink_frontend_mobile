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
  Image,
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

  const handleEsqueciSenha = () => {
    navigation.navigate('RecuperarSenha');
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
          {/* Logotipo e Cabeçalho */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/LOGO_ONGLINK.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>Bem-vindo ao ONGLink</Text>
            <Text style={styles.subtitulo}>
              Conectando pessoas a causas sociais e fortalecendo o impacto das ONGs.
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
            <TouchableOpacity
              onPress={handleEsqueciSenha}
              activeOpacity={0.7}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Principal: Entrar */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>🔑 Entrar na Minha Conta</Text>
            )}
          </TouchableOpacity>

          {/* Divisor 1: Criar Conta */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>novo por aqui?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botão: Cadastro */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cadastro')}
          >
            <Text style={styles.secondaryButtonText}>Criar Conta de Usuário</Text>
          </TouchableOpacity>

          {/* Divisor 2: Acesso sem Login */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou explore sem login</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botões de Acesso Livre */}
          <View style={styles.guestActionsRow}>
            <TouchableOpacity
              style={styles.guestButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Feed')}
            >
              <Text style={styles.guestButtonText}>👀 Ver Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ongButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Parceiros')}
            >
              <Text style={styles.ongButtonText}>🏢 Ver ONGs</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 32,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 130,
    height: 75,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  togglePasswordText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6EAE8',
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#F3FAF6',
    borderColor: colors.brandGreen,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.brandGreenDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  guestActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guestButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: '#D0D7DE',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  guestButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  ongButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D0D7DE',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ongButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
