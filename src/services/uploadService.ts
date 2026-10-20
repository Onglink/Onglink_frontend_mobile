import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'df48qk6bj';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'onglinkCloud';

export interface UploadFileParam {
  uri: string;
  name?: string;
  type?: string;
}

/**
 * Realiza o upload de uma imagem ou documento (PDF) para o Cloudinary
 * usando o mesmo Cloud Name e Upload Preset da versão Web.
 * Retorna a secure_url (HTTPS pública) do arquivo armazenado.
 */
export const uploadService = async (
  file: string | UploadFileParam | null | undefined
): Promise<string | null> => {
  if (!file) return null;

  try {
    let uri: string = '';
    let name: string = 'arquivo';
    let type: string = 'application/octet-stream';

    if (typeof file === 'string') {
      uri = file;
      const uriLower = uri.toLowerCase();
      const isPdf = uriLower.endsWith('.pdf') || uriLower.includes('.pdf');
      const isPng = uriLower.endsWith('.png');
      name = isPdf ? 'documento.pdf' : isPng ? 'imagem.png' : 'imagem.jpg';
      type = isPdf ? 'application/pdf' : isPng ? 'image/png' : 'image/jpeg';
    } else {
      uri = file.uri;
      const fileNameLower = (file.name || '').toLowerCase();
      const uriLower = (uri || '').toLowerCase();
      const isPdf =
        fileNameLower.endsWith('.pdf') ||
        uriLower.endsWith('.pdf') ||
        (file.type && file.type.includes('pdf'));

      name = file.name || (isPdf ? 'documento.pdf' : 'imagem.jpg');
      type = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');
    }

    if (!uri) return null;

    // Se o arquivo já é uma URL remota do Cloudinary, retorna diretamente
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      if (uri.includes('cloudinary.com') || uri.includes('res.cloudinary')) {
        return uri;
      }
    }

    const formData = new FormData();
    formData.append('upload_preset', UPLOAD_PRESET);

    // Tratamento diferenciado para React Native (Mobile) vs Browser (Web)
    if (Platform.OS === 'web') {
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, name);
      } else {
        formData.append('file', uri);
      }
    } else {
      // React Native nativo (Android e iOS)
      formData.append('file', {
        uri,
        name,
        type,
      } as any);
    }

    // Endpoint /auto/upload aceita tanto imagens (JPEG/PNG) quanto arquivos raw/PDFs
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Falha no upload para o Cloudinary:', response.status, errorText);
      throw new Error(`Falha no upload para o Cloudinary (${response.status})`);
    }

    const data = await response.json();
    const secureUrl = data.secure_url || data.url;

    if (!secureUrl) {
      throw new Error('Cloudinary não retornou URL válida do arquivo');
    }

    return secureUrl;
  } catch (error) {
    console.error('Erro no uploadService:', error);
    throw error;
  }
};

export default uploadService;
