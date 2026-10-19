import React, { useState, useEffect } from 'react';
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

  // Estados para o Lockout Progressivo
  const [tentativas, setTentativas] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0); // Tempo restante em segundos

  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Efeito para rodar o cronômetro regressivo quando houver lockout
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleLogin = async () => {
    if (lockoutTimer > 0) return; // Segurança extra caso o botão seja clicado

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

      // Sucesso: reseta as tentativas e o lockout
      setTentativas(0);
      setLockoutTimer(0);

      const usuario = response.usuario;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Feed', params: { usuario } }],
      });
    } catch (error: any) {
      console.error('Erro no login mobile:', error);

      // Incrementa as tentativas locais (o ideal é que o back-end retorne se está bloqueado e por quanto tempo)
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);

      // Lógica de cálculo do tempo de bloqueio progressivo (em segundos)
      let tempoDeBloqueio = 0;
      if (novasTentativas >= 6) {
        tempoDeBloqueio = 300; // 5 minutos
      } else if (novasTentativas === 5) {
        tempoDeBloqueio = 60;  // 1 minuto
      } else if (novasTentativas === 4) {
        tempoDeBloqueio = 30;  // 30 segundos
      }

      if (tempoDeBloqueio > 0) {
        setLockoutTimer(tempoDeBloqueio);
        Alert.alert(
          'Login temporariamente bloqueado',
          `Muitas tentativas incorretas. Aguarde ${tempoDeBloqueio} segundos para tentar novamente.`
        );
      } else {
        const mensagemErro =
          error.message ||
          'Falha ao autenticar. Verifique seu e-mail, senha e conexão com o servidor.';
        Alert.alert('Erro ao entrar', `${mensagemErro} (Tentativa ${novasTentativas}/4)`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Formata os segundos restantes para o formato MM:SS
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    if (mins > 0) {
      return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${secs}s`;
  };

  const estaBloqueado = lockoutTimer > 0;

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

          {/* Aviso visual de Bloqueio Progressivo */}
          {estaBloqueado && (
            <View style={styles.lockoutBox}>
              <Text style={styles.lockoutText}>
                ⚠️ Acesso temporariamente restrito devido a excesso de tentativas. Tente novamente em{' '}
                <Text style={styles.lockoutTimerBold}>{formatarTempo(lockoutTimer)}</Text>.
              </Text>
            </View>
          )}

          {/* Campo E-mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, estaBloqueado && styles.inputDisabled]}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!estaBloqueado}
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Senha</Text>
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
                disabled={estaBloqueado}
              >
                <Text style={[styles.togglePasswordText, estaBloqueado && { opacity: 0.5 }]}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, estaBloqueado && styles.inputDisabled]}
              placeholder="Sua senha de acesso"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={senha}
              onChangeText={setSenha}
              editable={!estaBloqueado}
            />
          </View>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || estaBloqueado) && styles.buttonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading || estaBloqueado}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>
                {estaBloqueado ? `Aguarde ${formatarTempo(lockoutTimer)}` : 'Entrar'}
              </Text>
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
  lockoutBox: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  lockoutText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  lockoutTimerBold: {
    fontWeight: 'bold',
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
  inputDisabled: {
    backgroundColor: '#E9ECEF',
    color: '#6C757D',
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
    backgroundColor: '#6C757D',
    borderBottomColor: '#495057',
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
});