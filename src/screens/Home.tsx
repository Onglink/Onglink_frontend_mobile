import React from 'react';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator
 } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../utils/theme';
import { Field, Form, Formik, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from 'yup';
import usuarioService from '../services/usuarioService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Campo obrigatório'),
    senha: Yup.string().required('Campo obrigatório')
});
type LoginFormValues = Yup.InferType<typeof validationSchema>;

const initialValues: LoginFormValues = {
  email: '',
  senha: ''
};

// Tempos de bloqueio em segundos: 1ª penalidade = 5s, 2ª = 15s, 3ª = 30s, 4ª em diante = 60s
const LOCKOUT_DELAYS = [5, 15, 30, 60];
const MAX_FAILED_ATTEMPTS = 5;

export default function Home({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [loginError, setLoginError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTime, setLockoutTime] = useState<number>(0);

  // Timer para o lockout progressivo
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);


  const handleLogin = async (
    values: LoginFormValues, 
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
  setLoginError(null);
  try {
    const response = await usuarioService.loginUsuario(values);  
    console.log("Login bem-sucedido:", response);

          // Zera o contador de falhas após um login bem-sucedido
          setFailedAttempts(0);

          // Salva os dados do usuário no localStorage
          await AsyncStorage.setItem('authToken', response.token); // O token      
          await AsyncStorage.setItem('usuarioLogado', JSON.stringify(response.usuario));
          await AsyncStorage.setItem('user_status', response.usuario.status);
          await AsyncStorage.setItem('userId', response.usuario._id);
          
          // Redireciona para o Feed
          //navigation.navigate('Feed');

      } catch (error:any) {
     console.error('Erro no login:', error);

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      // Aplica o lockout se atingiu o limite de 5 tentativas falhas
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const penaltyIndex = newFailedAttempts - MAX_FAILED_ATTEMPTS;
        // Pega o tempo da lista ou mantém o último valor (60s) para penalidades adicionais
        const delay = LOCKOUT_DELAYS[penaltyIndex] || LOCKOUT_DELAYS[LOCKOUT_DELAYS.length - 1];

        setLockoutTime(delay);
        setLoginError(`Muitas tentativas incorretas. Aguarde ${delay} segundos.`);
      } else {
        const mensagem =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Falha ao realizar login.';
        setLoginError(`${mensagem} (Tentativa ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS})`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormDisabled = lockoutTime > 0;

  return (
    <View style={styles.container}>


    <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
        }) => (
        <View style={[styles.card, isTablet && { maxWidth: 600, width: '100%' }]}>
          <Text style={styles.title}>Bem-vindo ao ONGLink!</Text>

          {/* Alerta de erro e contador de bloqueio */}
            {isFormDisabled ? (
              <View style={styles.lockoutBox}>
                <Text style={styles.lockoutText}>
                  Acesso bloqueado por segurança.
                </Text>
                <Text style={styles.timerText}>
                  Tente novamente em {lockoutTime}s
                </Text>
              </View>
            ) : (
              loginError && <Text style={styles.errorText}>{loginError}</Text>
            )}
          
          <Text style={styles.label}> Email </Text>
          {errors.email && touched.email && (<Text style={styles.errorText}>{errors.email}</Text>)}
          <TextInput
            style={[styles.input]}
            placeholder="exemplo@email.com"
            placeholderTextColor={colors.textMuted}
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            editable={!isFormDisabled}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}> Senha </Text>
          {errors.senha && touched.senha && (<Text style={styles.errorText}>{errors.senha}</Text>)}
          <TextInput
            style={[styles.input]}
            placeholder="••••••"
            placeholderTextColor={colors.textMuted}
            value={values.senha}
            onChangeText={handleChange('senha')}
            onBlur={handleBlur('senha')}
            secureTextEntry
            editable={!isFormDisabled}
          />
        
          <TouchableOpacity
                  onPress={() => navigation.navigate('RecuperarSenha')}
                >
                  <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Botão Entrar */}
          
          <TouchableOpacity
            style={[
              styles.button,
              (isSubmitting || isFormDisabled) && styles.buttonDisabled,
            ]}
            onPress={() => handleSubmit()}
            disabled={isSubmitting || isFormDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isFormDisabled ? `Aguarde (${lockoutTime}s)` : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

        </View>
        )}
      </Formik>


      <View style={[styles.card, isTablet && { maxWidth: 600, width: '100%', marginTop: 30 }]}>
          
        <Text style={styles.title}>Não tem uma conta?</Text>
        <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cadastro')}
          >
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  lockoutBox: {
    backgroundColor: '#ffebe9',
    borderColor: colors.error,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  lockoutText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.cardBackground,
    width: '100%',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    color: colors.primaryDark,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10
  },
  input :{
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
    width: '100%',
    marginBottom: 30,
    },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  forgotPassword: {
    color: colors.brandGreen,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 20,
  }
});


