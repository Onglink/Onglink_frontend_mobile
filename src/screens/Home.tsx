import React from 'react';
import { useState } from 'react';
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


export default function Home({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (
    values: LoginFormValues, 
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
  setLoginError(null);
  try {
    const response = await usuarioService.loginUsuario(values);  
    console.log("Login bem-sucedido:", response);

          // Salva os dados do usuário no localStorage
          await AsyncStorage.setItem('authToken', response.token); // O token      
          await AsyncStorage.setItem('usuarioLogado', JSON.stringify(response.usuario));
          await AsyncStorage.setItem('user_status', response.usuario.status);
          await AsyncStorage.setItem('userId', response.usuario._id);
          
          // Redireciona para o Feed
          //navigation.navigate('Feed');

      } catch (error:any) {
          console.error("Erro no login:", error);
          const mensagem = error.response?.data?.error ||
          error.response?.data?.message ||
          "Falha ao realizar login.";

          setLoginError(mensagem);
      } finally {
          setSubmitting(false);
      }
  };

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
          
          <Text style={styles.label}> Email </Text>
          {errors.email && touched.email && (<Text style={styles.errorText}>{errors.email}</Text>)}
          <TextInput
            style={[styles.input]}
            placeholder="exemplo@email.com"
            placeholderTextColor={colors.textMuted}
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
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
          />
        
          <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
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
});


