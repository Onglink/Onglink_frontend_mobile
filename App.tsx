import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import Login from './src/screens/Login';
import CadastroSimples from './src/screens/CadastroSimples';
import CadastroCompleto from './src/screens/CadastroCompleto';
import Feed from './src/screens/Feed';
import Perfil from './src/screens/Perfil';
import { colors } from './src/utils/theme';
import { UsuarioResponse } from './src/services/usuarioService';

export type ProfilePost = {
  id: string;
  author: string;
  description: string;
  initials: string;
  category: 'Ação' | 'Pedido';
  location: string;
  time: string;
  title: string;
  body: string;
  imageUri: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
};

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Cadastro: undefined;
  CadastroCompleto: undefined;
  Feed: { usuario?: UsuarioResponse } | undefined;
  Perfil: { posts?: ProfilePost[]; usuario?: UsuarioResponse } | undefined;
};

import { TouchableOpacity, Text, View } from 'react-native';
import { getUsuarioLogado } from './src/services/usuarioService';

const Stack = createNativeStackNavigator<RootStackParamList, 'root'>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        id="root"
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.brandGreenDark,
          },
          headerTintColor: colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: 'ONGLink',
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Entrar no ONGLink' }}
        />
        <Stack.Screen
          name="Cadastro"
          component={CadastroSimples}
          options={{ title: 'Criar Conta' }}
        />
        <Stack.Screen
          name="CadastroCompleto"
          component={CadastroCompleto}
          options={{ title: 'Cadastro de ONG' }}
        />
        <Stack.Screen
          name="Feed"
          component={Feed}
          options={({ navigation, route }) => {
            const usuario = route.params?.usuario || getUsuarioLogado();
            const isVisitante = !usuario;
            return {
              title: isVisitante ? 'Explorar ONGLink' : 'Feed da comunidade',
              headerBackVisible: isVisitante,
              headerLeft: isVisitante
                ? () => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Home')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 10,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: colors.textLight,
                          fontSize: 15,
                          fontWeight: 'bold',
                        }}
                      >
                        
                      </Text>
                    </TouchableOpacity>
                  )
                : () => null,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => {
                    if (usuario) {
                      navigation.navigate('Perfil', { usuario });
                    } else {
                      navigation.navigate('Login');
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: colors.textLight,
                      fontWeight: 'bold',
                      fontSize: 13,
                    }}
                  >
                    {usuario ? `👤 ${usuario.nome.split(' ')[0]}` : ''}
                  </Text>
                </TouchableOpacity>
              ),
            };
          }}
        />
        <Stack.Screen
          name="Perfil"
          component={Perfil}
          options={{ title: 'Meu perfil' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
