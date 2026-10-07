import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

const defaultUrl = Platform.OS === 'android' 
  ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

// Garante que baseURL nunca seja undefined ou string vazia
const baseURL = process.env.EXPO_PUBLIC_API_URL || defaultUrl;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
  }
});
api.interceptors.request.use(
    async (config) => {
        
        // 'authToken' deve ser a mesma chave que você usou no login!
        const token = await AsyncStorage.getItem('authToken');

        // Se tiver token, adiciona no cabeçalho Authorization
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
