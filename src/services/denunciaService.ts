import api from './api';

export interface DenunciaPayload {
  tipoDenuncia: string;
  motivo: string;
  assignedTo: string[];
}

export interface DenunciaResponse {
  message: string;
  id: string;
}

export const denunciaService = {
  cadastrarDenuncia: async (payload: DenunciaPayload) => {
    return await api.post<DenunciaResponse>('/denuncia', payload);
  },

  listarDenuncias: async () => {
    return await api.get('/denuncia');
  },

  buscarPorId: async (id: string) => {
    return await api.get(`/denuncia/${id}`);
  },

  deletarDenuncia: async (id: string) => {
    return await api.delete(`/denuncia/${id}`);
  },
};

export default denunciaService;

