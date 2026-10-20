import api from './api';

export interface PublicacaoCriador {
  _id: string;
  nome: string;
  email: string;
  assignedTo?: {
    _id: string;
    nomeFantasia?: string;
    logo?: string;
  };
}

export interface PublicacaoResponse {
  _id: string;
  titulo: string;
  descricao: string;
  categoria?: 'Ação' | 'Pedido' | string;
  imagem: string[];
  criadoPor: PublicacaoCriador;
  createdAt: string;
  updatedAt?: string;
}

export interface CriarPublicacaoPayload {
  titulo: string;
  descricao: string;
  categoria?: string;
  criadoPor: string;
  imagem?: string;
}

export const publicacaoService = {
  listarPublicacoes: async () => {
    return await api.get<PublicacaoResponse[]>('/publicacoes');
  },

  buscarPorId: async (id: string) => {
    return await api.get<PublicacaoResponse>(`/publicacoes/${id}`);
  },

  criarPublicacao: async (formDataOrJson: FormData | CriarPublicacaoPayload) => {
    return await api.post<PublicacaoResponse>('/publicacoes', formDataOrJson);
  },

  deletarPublicacao: async (id: string) => {
    return await api.delete<{ message: string }>(`/publicacoes/${id}`);
  },
};

export default publicacaoService;
