import api from './api';

export interface EnderecoOng {
  rua: string;
  numeroEnd: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface RedeSocialOng {
  instagram: string;
  facebook: string;
  site: string;
  linkedin?: string;
}

export interface CadastrarOngPayload {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cpf: string;
  repLegal: string;
  telefone: string;
  email: string;
  endereco: EnderecoOng;
  redeSocial: RedeSocialOng;
  logo: string;
  descricao: string;
  causaSocial: string;
  dataFund?: string;
  arquivosLegais: string[];
  imagens: string[];
  assignedTo?: string[];
}

export interface OngResponse {
  _id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  repLegal: string;
  email: string;
  telefone: string;
  causaSocial: string;
  descricao: string;
  logo: string;
  situacaoCadastral: 'em analise' | 'aprovada' | 'rejeitada';
  endereco: EnderecoOng;
  redeSocial: RedeSocialOng;
  arquivosLegais: string[];
  imagens: string[];
  assignedTo?: any[];
  createdAt: string;
}

export const ongService = {
  cadastrarOng: async (dados: CadastrarOngPayload) => {
    return await api.post<{ message: string; id: string }>('/ongs', dados);
  },

  listarOngs: async () => {
    return await api.get<OngResponse[]>('/ongs');
  },

  buscarOngPorId: async (id: string) => {
    return await api.get<OngResponse>(`/ongs/${id}`);
  },

  listarParceiros: async () => {
    return await api.get<OngResponse[]>('/parceiros');
  },
};

export default ongService;
