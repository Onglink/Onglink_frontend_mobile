import api, { setAuthToken } from './api';

export interface CadastroUsuarioPayload {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status?: 'user' | 'admin' | 'ong';
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface UsuarioResponse {
  _id: string;
  nome: string;
  cpf: string;
  email: string;
  status: 'user' | 'admin' | 'ong';
  assignedTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  usuario: UsuarioResponse;
}

export const usuarioService = {
  cadastrarUsuario: async (dados: CadastroUsuarioPayload) => {
    return await api.post<{ message: string; id: string }>('/usuarios/cadastro', dados);
  },

  loginUsuario: async (dados: LoginPayload) => {
    const response = await api.post<LoginResponse>('/usuarios/login', dados);
    if (response?.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  buscarPorId: async (id: string) => {
    return await api.get<UsuarioResponse>(`/usuarios/${id}`);
  },

  listarUsuarios: async () => {
    return await api.get<UsuarioResponse[]>('/usuarios');
  },
};

export default usuarioService;
