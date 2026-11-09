import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import Login from './src/screens/Login';
import CadastroSimples from './src/screens/CadastroSimples';
import CadastroCompleto from './src/screens/CadastroCompleto';
import RecuperarSenha from './src/screens/RecuperarSenha';
import Feed from './src/screens/Feed';
import Perfil from './src/screens/Perfil';
import Parceiros from './src/screens/Parceiros';
import { colors } from './src/utils/theme';
import { UsuarioResponse } from './src/services/usuarioService';

export type ProfilePost = {
  id: string;
  author: string;
  description: string;
  initials: string;
  category?: 'Ação' | 'Pedido' | string;
  location: string;
  time: string;
  title: string;
  body: string;
  imageUri: string | null;
  criadorId?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
};

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Cadastro: undefined;
  CadastroCompleto: undefined;
  RecuperarSenha: undefined;
  Feed: { usuario?: UsuarioResponse } | undefined;
  Perfil: { posts?: ProfilePost[]; usuario?: UsuarioResponse; userId?: string } | undefined;
  Parceiros: undefined;
};

import { TouchableOpacity, Text, Image, View } from 'react-native';
import { getUsuarioLogado } from './src/services/usuarioService';

const Stack = createNativeStackNavigator<RootStackParamList, 'root'>();

export default function App() {
  useEffect(() => {
    // Força o encerramento imediato da Splash Screen assim que a Home for montada
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <NavigationContainer onReady={() => { SplashScreen.hideAsync().catch(() => {}); }}>
      <StatusBar style="light" />
      <Stack.Navigator
        id="root"
        initialRouteName="Login"
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
          name="Login"
          component={Login}
          options={{
            headerShown: false,
          }}
        />
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
          name="Cadastro"
          component={CadastroSimples}
          options={{ title: 'Criar Conta' }}
        />
        <Stack.Screen
          name="RecuperarSenha"
          component={RecuperarSenha}
          options={{ title: 'Recuperar Senha' }}
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
                    />
                  )
                : () => null,
              headerRight: () => {
                if (!usuario) {
                  return (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Login')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.18)',
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 16,
                        gap: 6,
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
                        Visitante
                      </Text>
                    </TouchableOpacity>
                  );
                }

                const ongLogo =
                  typeof usuario.assignedTo === 'object' && usuario.assignedTo !== null
                    ? usuario.assignedTo.logo
                    : null;
                const photoUri = ongLogo || (usuario as any).avatar || null;
                const initials = (usuario.nome || 'ON')
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? '')
                  .join('');

                return (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Perfil', { usuario })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      paddingVertical: 4,
                      paddingHorizontal: 9,
                      borderRadius: 18,
                      gap: 7,
                    }}
                    activeOpacity={0.8}
                  >
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#FFF',
                          borderWidth: 1,
                          borderColor: '#FFF',
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#FFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: colors.brandGreenDark,
                            fontSize: 10,
                            fontWeight: 'bold',
                          }}
                        >
                          {initials}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={{
                        color: colors.textLight,
                        fontWeight: 'bold',
                        fontSize: 13,
                      }}
                    >
                      {usuario.nome.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              },
            };
          }}
        />
        <Stack.Screen
          name="Perfil"
          component={Perfil}
          options={({ route }) => {
            const logged = getUsuarioLogado();
            const isVisitor = !logged && !route.params?.userId;
            const isOther = Boolean(route.params?.userId && logged?._id && route.params.userId !== logged._id);
            return {
              title: isVisitor ? 'Acesse seu Perfil' : isOther ? 'Perfil' : 'Meu perfil',
            };
          }}
        />
        <Stack.Screen
          name="Parceiros"
          component={Parceiros}
          options={{ title: 'ONGs Parceiras' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
