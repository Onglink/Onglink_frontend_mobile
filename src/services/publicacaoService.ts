import api from './api';

export interface PublicacaoCriador {
  _id: string;
  nome: string;
  email: string;
  assignedTo?: {
    _id: string;
    nome?: string;
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

export interface PublicacoesPaginadasResponse {
  publicacoes: PublicacaoResponse[];
  hasMore: boolean;
  nextPage: number | null;
}

export interface CriarPublicacaoPayload {
  titulo: string;
  descricao: string;
  categoria?: string;
  criadoPor: string;
  imagem?: string;
}

export const publicacaoService = {
  listarPublicacoes: async (
    page: number = 1,
    limit: number = 10
  ): Promise<PublicacoesPaginadasResponse> => {
    const data = await api.get<PublicacoesPaginadasResponse | PublicacaoResponse[]>(
      `/publicacoes?page=${page}&limit=${limit}`
    );

    if (Array.isArray(data)) {
      return { publicacoes: data, hasMore: false, nextPage: null };
    }

    return {
      publicacoes: data?.publicacoes ?? [],
      hasMore: Boolean(data?.hasMore),
      nextPage: data?.nextPage ?? null,
    };
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