import { Platform } from 'react-native';

/**
 * CONFIGURAÇÃO DA API ONGLINK (LOCAL OU NUVEM)
 * 
 * Para conectar ao backend na nuvem (ex: Render, Railway, AWS):
 * 1. Cole o endereço do backend na constante REMOTE_API_URL abaixo (ou defina EXPO_PUBLIC_API_URL no .env).
 * 2. Mude USE_REMOTE para true.
 */

// Cole aqui a URL do backend na nuvem (ex: 'https://onglink-backend.onrender.com'):
export const REMOTE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://163.176.72.142:4000/';

// Mude para true quando quiser usar o backend na nuvem, ou false para testar localmente:
export const USE_REMOTE = Boolean(REMOTE_API_URL);

// IP local da sua máquina na rede Wi-Fi para testes locais:
export const LOCAL_IP = '192.168.0.10';

// Determina a baseURL ideal conforme a plataforma e o modo (Local vs Nuvem)
export const getBaseUrl = (): string => {
  if (USE_REMOTE && REMOTE_API_URL) {
    const urlLimpa = REMOTE_API_URL.replace(/\/+$/, '');
    return urlLimpa.endsWith('/api') ? urlLimpa : `${urlLimpa}/api`;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:4000/api';
  }
  // Para celular físico ou emulador na mesma rede local
  return `http://${LOCAL_IP}:4000/api`;
};

export const API_URL = getBaseUrl();

// Chave da API configurada no .env do backend (cabeçalho x-api-key)
export let API_KEY = 'fcf87fe4-7793-477d-b765-620c5cdbcf4f';

// Armazenamento em memória do token JWT de autenticação
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setApiKey = (key: string) => {
  API_KEY = key;
};

/**
 * Cliente HTTP baseado em fetch com tratamento automático de headers e erros
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Se o body for FormData (upload de imagens), o navegador/React Native define o boundary automaticamente
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data.error || data.message || data.details)) ||
        `Erro HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data as T;
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    // Erros de conexão de rede (backend desligado ou IP incorreto)
    console.error(`[API Network Error] Falha ao conectar em ${url}:`, error.message);
    throw new Error(
      `Falha na conexão com o servidor (${API_URL}). Verifique se o backend está rodando no terminal com "npm run dev".`
    );
  }
}

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};

export default api;
