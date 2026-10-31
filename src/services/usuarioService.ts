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

export interface OngPopulated {
  _id: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
  causaSocial?: string;
  logo?: string;
  situacaoCadastral?: string;
  endereco?: {
    cidade?: string;
    estado?: string;
    bairro?: string;
    rua?: string;
    numeroEnd?: string;
    cep?: string;
  };
  redeSocial?: {
    instagram?: string;
    facebook?: string;
    site?: string;
  };
}

export interface UsuarioResponse {
  _id: string;
  nome: string;
  cpf: string;
  email: string;
  status: 'user' | 'admin' | 'ong';
  assignedTo?: string | OngPopulated | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  usuario: UsuarioResponse;
}

let usuarioLogado: UsuarioResponse | null = null;

export const setUsuarioLogado = (user: UsuarioResponse | null) => {
  usuarioLogado = user;
};

export const getUsuarioLogado = () => usuarioLogado;

export const usuarioService = {
  cadastrarUsuario: async (dados: CadastroUsuarioPayload) => {
    return await api.post<{ message: string; id: string }>('/usuarios/cadastro', dados);
  },

  loginUsuario: async (dados: LoginPayload) => {
    const response = await api.post<LoginResponse>('/usuarios/login', dados);
    if (response?.token) {
      setAuthToken(response.token);
    }
    if (response?.usuario) {
      setUsuarioLogado(response.usuario);
    }
    return response;
  },

  logout: () => {
    setAuthToken(null);
    setUsuarioLogado(null);
  },

  buscarPorId: async (id: string) => {
    const res = await api.get<any>(`/usuarios/${id}`);
    const user = res?.usuario || res;
    // Apenas sincroniza com o usuário logado em sessão se for o próprio perfil
    if (usuarioLogado && user && user._id === usuarioLogado._id) {
      setUsuarioLogado(user);
    }
    return user as UsuarioResponse;
  },

  listarUsuarios: async () => {
    return await api.get<UsuarioResponse[]>('/usuarios');
  },
};

export default usuarioService;
