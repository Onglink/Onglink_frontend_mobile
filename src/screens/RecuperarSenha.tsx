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

type Props = NativeStackScreenProps<RootStackParamList, 'RecuperarSenha'>;

type ModoRecuperacao = 'email' | 'telefone';

export default function RecuperarSenha({ navigation }: Props) {
  const [modo, setModo] = useState<ModoRecuperacao>('email');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Formatação de Telefone com máscara (00) 00000-0000
  const handleTelefoneChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (valor.length > 5) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    setTelefone(valor);
  };

  const handleEnviar = () => {
    if (modo === 'email') {
      const emailLimpo = email.trim();
      if (!emailLimpo) {
        Alert.alert('Campo obrigatório', 'Por favor, informe seu e-mail cadastrado.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLimpo)) {
        Alert.alert('E-mail inválido', 'Por favor, digite um endereço de e-mail válido.');
        return;
      }
    } else {
      const rawTelefone = telefone.replace(/\D/g, '');
      if (rawTelefone.length < 10) {
        Alert.alert('Telefone inválido', 'Por favor, informe um número de telefone válido com DDD (mínimo 10 dígitos).');
        return;
      }
    }

    setLoading(true);

    // Simulação do envio de e-mail/SMS com feedback visual
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
    }, 1200);
  };

  const handleResetar = () => {
    setEnviado(false);
    setEmail('');
    setTelefone('');
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
            <Text style={styles.titulo}>Recuperar Senha</Text>
            <Text style={styles.subtitulo}>
              {modo === 'email'
                ? 'Digite o e-mail de sua conta para que possamos enviar um link de definição de nova senha.'
                : 'Digite o número de telefone cadastrado para que possamos enviar o código de redefinição de senha.'}
            </Text>
          </View>

          {enviado ? (
            /* Estado de Sucesso */
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIconText}>✉️</Text>
              </View>
              <Text style={styles.successTitle}>Instruções Enviadas!</Text>
              <Text style={styles.successSubtitle}>
                Se houver uma conta cadastrada com{' '}
                <Text style={styles.boldText}>
                  {modo === 'email' ? email.trim() : telefone}
                </Text>
                , você receberá as instruções para cadastrar uma nova senha em instantes.
              </Text>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Voltar para o Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={handleResetar}
              >
                <Text style={styles.secondaryButtonText}>Tentar outro e-mail ou telefone</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Formulário */
            <View>
              {/* Abas de Seleção de Modo */}
              <View style={styles.modeTabsContainer}>
                <TouchableOpacity
                  style={[styles.modeTab, modo === 'email' && styles.modeTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setModo('email')}
                >
                  <Text style={[styles.modeTabText, modo === 'email' && styles.modeTabTextActive]}>
                    📧 Por E-mail
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, modo === 'telefone' && styles.modeTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setModo('telefone')}
                >
                  <Text style={[styles.modeTabText, modo === 'telefone' && styles.modeTabTextActive]}>
                    📱 Por Telefone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Campo E-mail */}
              {modo === 'email' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-mail cadastrado</Text>
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
                  <TouchableOpacity
                    onPress={() => setModo('telefone')}
                    activeOpacity={0.7}
                    style={styles.switchModeLinkContainer}
                  >
                    <Text style={styles.switchModeLinkText}>Não lembro meu e-mail</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Campo Telefone */
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Telefone com DDD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={telefone}
                    onChangeText={handleTelefoneChange}
                  />
                  <TouchableOpacity
                    onPress={() => setModo('email')}
                    activeOpacity={0.7}
                    style={styles.switchModeLinkContainer}
                  >
                    <Text style={styles.switchModeLinkText}>Prefiro recuperar usando meu e-mail</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Botão Enviar */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleEnviar}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <Text style={styles.buttonText}>Enviar Instruções</Text>
                )}
              </TouchableOpacity>

              {/* Divisor */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>lembrou sua senha?</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Retornar ao Login */}
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.secondaryButtonText}>Voltar para o Login</Text>
              </TouchableOpacity>
            </View>
          )}
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
  modeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F2',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.brandGreenDark,
    fontWeight: 'bold',
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
  switchModeLinkContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  switchModeLinkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brandGreenDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});

