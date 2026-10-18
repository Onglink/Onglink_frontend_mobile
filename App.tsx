import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import CadastroSimples from './src/screens/CadastroSimples';
import CadastroCompleto from './src/screens/CadastroCompleto';
import Feed from './src/screens/Feed';
import Perfil from './src/screens/Perfil';
import { colors } from './src/utils/theme';

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
  Cadastro: undefined;
  CadastroCompleto: undefined;
  Feed: undefined;
  Perfil: { posts?: ProfilePost[] } | undefined;
};

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
          options={{ title: 'ONGLink' }}
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
          options={{ title: 'Feed da comunidade' }}
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
