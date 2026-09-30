import React from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Home({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  return (
    <View style={styles.container}>
      <View style={[styles.card, isTablet && { maxWidth: 600, width: '100%' }]}>
        <Text style={styles.title}>Bem-vindo ao ONGLink!</Text>
        
        <Text style={styles.label}> Email </Text>
        <TextInput
          style={[styles.input]}
        />

        <Text style={styles.label}> Senha </Text>
        <TextInput
          style={[styles.input]}
        />

        <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.85}
            // onPress={() => navigation.navigate('Feed')}
          >
          <Text style={styles.buttonText}>Acessar</Text>
        </TouchableOpacity>

      </View>

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
  buttonText: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: 'bold',
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


