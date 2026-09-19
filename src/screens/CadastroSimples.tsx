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
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

export default function Cadastro({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Máscara automática de CPF
  const handleCpfChange = (texto: string) => {
    let valorFormatado = texto.replace(/\D/g, '');

    valorFormatado = valorFormatado.replace(/(\d{3})(\d)/, '$1.$2');
    valorFormatado = valorFormatado.replace(/(\d{3})(\d)/, '$1.$2');
    valorFormatado = valorFormatado.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    setCpf(valorFormatado);
  };

  // Validação dos dados
  const handleEnviar = () => {
    if (!nome || !cpf || !email || !senha || !confirmaSenha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cpf.length < 14) {
      Alert.alert('Erro', 'Por favor, digite um CPF válido.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'As senhas devem ser iguais. Digite novamente.');
      return;
    }

    console.log('Dados validados para a API:', { nome, cpf, email, senha });

    Alert.alert(
      'Sucesso', 
      'Cadastro realizado com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.card, isTablet && { maxWidth: 700, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.titulo}>Criar Conta</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo <Text style={styles.asterisk}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João da Silva"
              placeholderTextColor={colors.textMuted}
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={[styles.responsiveRow, { flexDirection: isTablet ? 'row' : 'column' }]}>
            <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
              <Text style={styles.label}>CPF <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="___.___.___-__"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={14}
                value={cpf}
                onChangeText={handleCpfChange}
              />
            </View>

            <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
              <Text style={styles.label}>Email <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={[styles.responsiveRow, { flexDirection: isTablet ? 'row' : 'column' }]}>
            <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
              <Text style={styles.label}>Senha <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />
            </View>

            <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
              <Text style={styles.label}>Confirmar Senha <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={confirmaSenha}
                onChangeText={setConfirmaSenha}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleEnviar}
          >
            <Text style={styles.buttonText}>Enviar</Text>
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
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 15,
  },
  responsiveRow: {
    gap: 15,
    marginBottom: 15,
  },
  mobileColumn: {
    width: '100%',
  },
  tabletColumn: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  asterisk: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
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
  buttonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  }
});

//