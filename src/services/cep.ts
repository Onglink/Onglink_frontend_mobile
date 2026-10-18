/**
 * Serviço de consulta de CEP integrado com ViaCEP
 */
export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ao buscar CEP: ${response.status}`);
    }
    const data: EnderecoViaCep = await response.json();
    if (data.erro) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('Erro na consulta do CEP:', error);
    return null;
  }
}
