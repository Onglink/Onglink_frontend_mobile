import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import CadastroSimples from './src/screens/CadastroSimples';
import { colors } from './src/utils/theme';

export type RootStackParamList = {
  Home: undefined;
  Cadastro: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
