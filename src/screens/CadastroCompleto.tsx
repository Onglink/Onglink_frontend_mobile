import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';
import { buscarCep } from '../services/cep';
import ongService from '../services/ongService';
import { getUsuarioLogado } from '../services/usuarioService';
import uploadService from '../services/uploadService';

export interface DocumentoAnexo {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'CadastroCompleto'>;

export type CausaSocialItem = {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
};

// Lista completa de causas sociais formatada para seleção em lista modal
const CAUSAS_SOCIAIS: CausaSocialItem[] = [
  {
    id: 'social',
    nome: 'Assistência Social',
    icone: '🤝',
    descricao: 'Apoio a famílias em vulnerabilidade, combate à fome e acolhimento',
  },
  {
    id: 'animal',
    nome: 'Proteção Animal',
    icone: '🐾',
    descricao: 'Resgate, castração, cuidados veterinários e adoção responsável',
  },
  {
    id: 'ambiental',
    nome: 'Meio Ambiente e Sustentabilidade',
    icone: '🌳',
    descricao: 'Preservação ecológica, reflorestamento, reciclagem e hortas',
  },
  {
    id: 'educacao',
    nome: 'Educação e Juventude',
    icone: '🎓',
    descricao: 'Reforço escolar, alfabetização, oficinas e capacitação jovem',
  },
  {
    id: 'saude',
    nome: 'Saúde e Bem-Estar',
    icone: '🏥',
    descricao: 'Apoio a pacientes, reabilitação, saúde mental e doações',
  },
  {
    id: 'cultura',
    nome: 'Cultura, Arte e Esporte',
    icone: '🎭',
    descricao: 'Incentivo à música, teatro, projetos artísticos e esportivos',
  },
  {
    id: 'direitos',
    nome: 'Direitos Humanos e Cidadania',
    icone: '⚖️',
    descricao: 'Defesa de direitos, igualdade racial e inclusão social',
  },
  {
    id: 'comunitario',
    nome: 'Apoio Comunitário',
    icone: '🏘️',
    descricao: 'Desenvolvimento local, reformas solidárias e centros sociais',
  },
  {
    id: 'outra',
    nome: 'Outra Causa Social',
    icone: '💡',
    descricao: 'Outras iniciativas de transformação e impacto social positivo',
  },
];

export default function CadastroCompleto({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado();
    if (!usuarioLogado?._id) {
      Alert.alert(
        'Login Obrigatório',
        'O cadastro completo de ONG é exclusivo para usuários autenticados. Faça seu login para continuar.',
        [
          {
            text: 'Ir para o Login',
            onPress: () => navigation.replace('Login'),
          },
          {
            text: 'Voltar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [navigation]);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [loadingCep, setLoadingCep] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ---------------- ETAPA 1: BÁSICO ----------------
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [repLegal, setRepLegal] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefoneSecundario, setTelefoneSecundario] = useState('');
  const [causaSocial, setCausaSocial] = useState(CAUSAS_SOCIAIS[0].nome);
  const [modalCausaVisivel, setModalCausaVisivel] = useState(false);
  const [descricao, setDescricao] = useState('');

  const causaSelecionadaObj =
    CAUSAS_SOCIAIS.find((c) => c.nome === causaSocial) || CAUSAS_SOCIAIS[0];

  // ---------------- ETAPA 2: ENDEREÇO ----------------
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numeroEnd, setNumeroEnd] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // ---------------- ETAPA 3: REDES SOCIAIS ----------------
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [site, setSite] = useState('');

  // ---------------- ETAPA 4: ANEXOS & DOCUMENTOS ----------------
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [documento1, setDocumento1] = useState<DocumentoAnexo | null>(null);
  const [documento2, setDocumento2] = useState<DocumentoAnexo | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  const steps = ['Básico', 'Endereço', 'Redes', 'Documentos'];

  // Formatação de CNPJ
  const handleCnpjChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 14) valor = valor.substring(0, 14);

    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');

    setCnpj(valor);
  };

  // Formatação de CPF
  const handleCpfChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);

    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    setCpf(valor);
  };

  // Formatação de Telefone
  const formatTelefone = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length > 10) {
      return valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (valor.length > 5) {
      return valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (valor.length > 2) {
      return valor.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    return valor;
  };

  // Formatação e consulta automática de CEP
  const handleCepChange = async (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.substring(0, 8);

    if (valor.length > 5) {
      valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(valor);

    const cepNumerico = valor.replace(/\D/g, '');
    if (cepNumerico.length === 8) {
      setLoadingCep(true);
      const dados = await buscarCep(cepNumerico);
      setLoadingCep(false);
      if (dados) {
        setRua(dados.logradouro || '');
        setBairro(dados.bairro || '');
        setCidade(dados.localidade || '');
        setEstado(dados.uf || '');
      } else {
        Alert.alert('Aviso', 'CEP não encontrado. Preencha os campos manualmente.');
      }
    }
  };

  // Selecionador de Imagem com Expo ImagePicker (Logo da ONG)
  const handlePickLogo = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão necessária',
          'É necessário permitir o acesso à galeria para selecionar a Logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao escolher logo:', error);
      Alert.alert('Erro', 'Não foi possível carregar a imagem selecionada.');
    }
  };

  // Selecionador de Documentos com Expo DocumentPicker (PDF ou imagens)
  const handlePickDocument = async (numero: 1 | 2) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const novoDoc: DocumentoAnexo = {
          uri: asset.uri,
          name: asset.name || (numero === 1 ? 'estatuto_social.pdf' : 'ata_eleicao.pdf'),
          mimeType:
            asset.mimeType ||
            (asset.name?.toLowerCase().endsWith('.pdf')
              ? 'application/pdf'
              : 'image/jpeg'),
          size: asset.size,
        };

        if (numero === 1) {
          setDocumento1(novoDoc);
        } else {
          setDocumento2(novoDoc);
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar documento:', error);
      Alert.alert('Erro', 'Não foi possível carregar o documento selecionado.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validação por etapa
  const validarEtapa = (etapa: number): boolean => {
    if (etapa === 0) {
      if (
        !razaoSocial.trim() ||
        !nomeFantasia.trim() ||
        !cnpj.trim() ||
        !email.trim() ||
        !repLegal.trim() ||
        !cpf.trim() ||
        !telefone.trim() ||
        !causaSocial.trim() ||
        !descricao.trim()
      ) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios (*).');
        return false;
      }
      if (cnpj.replace(/\D/g, '').length !== 14) {
        Alert.alert('Erro', 'Por favor, informe um CNPJ válido com 14 dígitos.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Erro', 'Por favor, informe um e-mail institucional válido.');
        return false;
      }
      if (cpf.replace(/\D/g, '').length !== 11) {
        Alert.alert('Erro', 'Por favor, informe um CPF válido para o representante.');
        return false;
      }
      if (telefone.replace(/\D/g, '').length < 10) {
        Alert.alert('Erro', 'Por favor, informe um telefone de contato válido.');
        return false;
      }
      if (descricao.trim().length < 10) {
        Alert.alert('Atenção', 'Descreva a missão e as atividades da ONG com mais detalhes.');
        return false;
      }
      return true;
    }

    if (etapa === 1) {
      if (
        !cep.trim() ||
        !rua.trim() ||
        !numeroEnd.trim() ||
        !bairro.trim() ||
        !cidade.trim() ||
        !estado.trim()
      ) {
        Alert.alert('Atenção', 'Preencha todos os campos obrigatórios do endereço.');
        return false;
      }
      if (cep.replace(/\D/g, '').length !== 8) {
        Alert.alert('Erro', 'Por favor, digite um CEP válido.');
        return false;
      }
      return true;
    }

    if (etapa === 2) {
      // Redes sociais são opcionais, mas se preenchidas podem ser validadas
      return true;
    }

    if (etapa === 3) {
      if (!logoUri) {
        Alert.alert(
          'Logo obrigatória',
          'Por favor, selecione uma imagem para a Logo da sua ONG.'
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validarEtapa(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinalizar = async () => {
    if (!validarEtapa(3)) return;

    const usuarioLogado = getUsuarioLogado();
    if (!usuarioLogado?._id) {
      Alert.alert(
        'Login Necessário',
        'Para cadastrar sua ONG e vinculá-la ao seu perfil, faça login primeiro.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    setSubmitting(true);
    setUploadStatusText('Enviando arquivos para o Cloudinary...');

    try {
      console.log('🚀 Iniciando uploads para o Cloudinary no mobile...');
      // Upload simultâneo para o Cloudinary para reduzir uso de armazenamento no MongoDB
      const [logoUrl, doc1Url, doc2Url] = await Promise.all([
        uploadService(logoUri),
        documento1 ? uploadService(documento1) : Promise.resolve(null),
        documento2 ? uploadService(documento2) : Promise.resolve(null),
      ]);

      if (!logoUrl) {
        throw new Error('É obrigatório fazer o upload da Logo da ONG.');
      }

      setUploadStatusText('Finalizando cadastro no servidor...');

      const dadosOng = {
        razaoSocial: razaoSocial.trim(),
        nomeFantasia: nomeFantasia.trim(),
        cnpj: cnpj.trim(),
        repLegal: repLegal.trim(),
        cpf: cpf.trim(),
        telefone: telefone.trim(),
        email: email.trim().toLowerCase(),
        causaSocial,
        descricao: descricao.trim(),
        dataFund: new Date().toISOString(),
        endereco: {
          rua: rua.trim(),
          numeroEnd: numeroEnd.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),
          cep: cep.trim(),
        },
        redeSocial: {
          instagram: instagram.trim() || 'N/A',
          facebook: facebook.trim() || 'N/A',
          linkedin: linkedin.trim() || 'N/A',
          site: site.trim() || 'N/A',
        },
        logo: logoUrl,
        arquivosLegais: [doc1Url, doc2Url].filter(
          (url): url is string => typeof url === 'string' && url.length > 0
        ),
        imagens: [logoUrl],
        assignedTo: [usuarioLogado._id],
      };

      console.log('📦 Enviando dados para o backend com URLs do Cloudinary:', {
        logo: dadosOng.logo,
        arquivosLegais: dadosOng.arquivosLegais,
      });

      const response = await ongService.cadastrarOng(dadosOng);
      Alert.alert(
        'Solicitação Enviada!',
        response.message ||
          'O cadastro da sua ONG foi enviado para análise da administração. Assim que for aprovado, seu status mudará de "user" para "ONG" e você poderá criar publicações.',
        [
          {
            text: 'Ir para o Feed',
            onPress: () => navigation.replace('Feed', { usuario: usuarioLogado }),
          },
          {
            text: 'OK',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro no cadastro da ONG:', error);
      Alert.alert(
        'Erro ao cadastrar ONG',
        error.message || 'Não foi possível enviar os arquivos ou salvar a ONG.'
      );
    } finally {
      setSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
          style={[
            styles.card,
            isTablet && { maxWidth: 760, alignSelf: 'center', width: '100%' },
          ]}
        >
          {/* Header */}
          <Text style={styles.titulo}>Cadastro Completo de ONG</Text>
          <Text style={styles.subtitulo}>
            Preencha as informações para certificar sua organização no Onglink
          </Text>

          {/* Stepper Visual */}
          <View style={styles.stepperContainer}>
            {steps.map((step, index) => {
              const isPast = index < activeStep;
              const isCurrent = index === activeStep;
              return (
                <View key={step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isPast && styles.stepCirclePast,
                      isCurrent && styles.stepCircleCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumber,
                        (isPast || isCurrent) && styles.stepNumberActive,
                      ]}
                    >
                      {isPast ? '✓' : index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ---------------- PASSO 0: BÁSICO ---------------- */}
          {activeStep === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>1. Dados da Instituição</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Razão Social <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Associação Esperança e Vida"
                  placeholderTextColor={colors.textMuted}
                  value={razaoSocial}
                  onChangeText={setRazaoSocial}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nome Fantasia <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Instituto Esperança"
                  placeholderTextColor={colors.textMuted}
                  value={nomeFantasia}
                  onChangeText={setNomeFantasia}
                />
              </View>

              <View
                style={[
                  styles.responsiveRow,
                  { flexDirection: isTablet ? 'row' : 'column' },
                ]}
              >
                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    CNPJ <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="00.000.000/0000-00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={18}
                    value={cnpj}
                    onChangeText={handleCnpjChange}
                  />
                </View>

                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    E-mail Institucional <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="contato@ong.org.br"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.responsiveRow,
                  { flexDirection: isTablet ? 'row' : 'column' },
                ]}
              >
                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    Representante Legal <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo do responsável"
                    placeholderTextColor={colors.textMuted}
                    value={repLegal}
                    onChangeText={setRepLegal}
                  />
                </View>

                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    CPF do Responsável <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={14}
                    value={cpf}
                    onChangeText={handleCpfChange}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.responsiveRow,
                  { flexDirection: isTablet ? 'row' : 'column' },
                ]}
              >
                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    Telefone Principal <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={telefone}
                    onChangeText={(t) => setTelefone(formatTelefone(t))}
                  />
                </View>

                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>Telefone Secundário</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 0000-0000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={telefoneSecundario}
                    onChangeText={(t) => setTelefoneSecundario(formatTelefone(t))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Causa Social de Atuação <Text style={styles.asterisk}>*</Text>
                </Text>
                
                {/* Seletor Tipo Lista / Dropdown */}
                <TouchableOpacity
                  style={styles.selectTrigger}
                  activeOpacity={0.8}
                  onPress={() => setModalCausaVisivel(true)}
                >
                  <View style={styles.selectTriggerLeft}>
                    <View style={styles.selectIconBadge}>
                      <Text style={styles.selectIconText}>
                        {causaSelecionadaObj.icone}
                      </Text>
                    </View>
                    <View style={styles.selectInfo}>
                      <Text style={styles.selectValueText}>
                        {causaSocial}
                      </Text>
                      <Text style={styles.selectHelperText}>
                        Toque para selecionar a causa em lista
                      </Text>
                    </View>
                  </View>
                  <View style={styles.selectArrowBadge}>
                    <Text style={styles.selectArrowText}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Sobre a ONG / Descrição das Atividades{' '}
                  <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Conte um pouco sobre a história, propósito e projetos sociais da instituição..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={descricao}
                  onChangeText={setDescricao}
                />
              </View>
            </View>
          )}

          {/* ---------------- PASSO 1: ENDEREÇO ---------------- */}
          {activeStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>2. Localização da Sede</Text>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    CEP <Text style={styles.asterisk}>*</Text>
                  </Text>
                  {loadingCep && (
                    <View style={styles.cepLoadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.cepLoadingText}>Buscando endereço...</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="00000-000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={9}
                  value={cep}
                  onChangeText={handleCepChange}
                />
              </View>

              <View
                style={[
                  styles.responsiveRow,
                  { flexDirection: isTablet ? 'row' : 'column' },
                ]}
              >
                <View style={{ flex: 3 }}>
                  <Text style={styles.label}>
                    Logradouro / Rua <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Av. Brasil"
                    placeholderTextColor={colors.textMuted}
                    value={rua}
                    onChangeText={setRua}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Número <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={numeroEnd}
                    onChangeText={setNumeroEnd}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sala 4, Bloco B"
                  placeholderTextColor={colors.textMuted}
                  value={complemento}
                  onChangeText={setComplemento}
                />
              </View>

              <View
                style={[
                  styles.responsiveRow,
                  { flexDirection: isTablet ? 'row' : 'column' },
                ]}
              >
                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    Bairro <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Bairro"
                    placeholderTextColor={colors.textMuted}
                    value={bairro}
                    onChangeText={setBairro}
                  />
                </View>

                <View style={isTablet ? styles.tabletColumn : styles.mobileColumn}>
                  <Text style={styles.label}>
                    Cidade <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    placeholderTextColor={colors.textMuted}
                    value={cidade}
                    onChangeText={setCidade}
                  />
                </View>

                <View style={{ width: isTablet ? 80 : '100%' }}>
                  <Text style={styles.label}>
                    UF <Text style={styles.asterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                    autoCapitalize="characters"
                    value={estado}
                    onChangeText={(t) => setEstado(t.toUpperCase())}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ---------------- PASSO 2: REDES SOCIAIS ---------------- */}
          {activeStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>3. Presença Digital & Redes</Text>
              <Text style={styles.stepSubtitle}>
                Facilite para que parceiros e apoiadores encontrem a sua ONG na
                internet (opcional).
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                  style={styles.input}
                  placeholder="@ong_exemplo ou https://instagram.com/..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={instagram}
                  onChangeText={setInstagram}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Facebook</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://facebook.com/..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={facebook}
                  onChangeText={setFacebook}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>LinkedIn</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://linkedin.com/company/..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={linkedin}
                  onChangeText={setLinkedin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Site Oficial / Blog</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://suaong.org.br"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={site}
                  onChangeText={setSite}
                />
              </View>
            </View>
          )}

          {/* ---------------- PASSO 3: DOCUMENTOS & LOGO ---------------- */}
          {activeStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>
                4. Logo e Documentos de Validação
              </Text>
              <Text style={styles.stepSubtitle}>
                Envie a logo oficial e os documentos para que os administradores
                possam validar a ONG na plataforma.
              </Text>

              {/* Logo da ONG */}
              <View style={styles.uploadBlock}>
                <Text style={styles.label}>
                  Logo da ONG <Text style={styles.asterisk}>*</Text>
                </Text>
                {logoUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: logoUri }} style={styles.logoPreview} />
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        style={styles.btnChange}
                        onPress={handlePickLogo}
                      >
                        <Text style={styles.btnChangeText}>Trocar Logo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnRemove}
                        onPress={() => setLogoUri(null)}
                      >
                        <Text style={styles.btnRemoveText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    activeOpacity={0.8}
                    onPress={handlePickLogo}
                  >
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.uploadPlaceholderTitle}>
                      Toque para anexar a Logo da ONG
                    </Text>
                    <Text style={styles.uploadPlaceholderSubtitle}>
                      Formatos aceitos: PNG ou JPEG (Upload via Cloudinary)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Documento Legal 1 */}
              <View style={styles.uploadBlock}>
                <Text style={styles.label}>Estatuto Social / Fundação (PDF ou Imagem)</Text>
                {documento1 ? (
                  <View style={styles.docCardContainer}>
                    <View style={styles.docCardIconBadge}>
                      <Text style={styles.docCardIconText}>
                        {documento1.mimeType?.includes('pdf') ||
                        documento1.name.toLowerCase().endsWith('.pdf')
                          ? '📕'
                          : '🖼️'}
                      </Text>
                    </View>
                    <View style={styles.docCardInfo}>
                      <Text
                        style={styles.docCardName}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {documento1.name}
                      </Text>
                      <View style={styles.docCardMetaRow}>
                        <Text style={styles.docCardBadge}>
                          {documento1.mimeType?.includes('pdf') ||
                          documento1.name.toLowerCase().endsWith('.pdf')
                            ? 'PDF'
                            : 'IMAGEM'}
                        </Text>
                        {documento1.size ? (
                          <Text style={styles.docCardSize}>
                            {formatFileSize(documento1.size)}
                          </Text>
                        ) : null}
                        <Text style={styles.docCardCloudinary}>• Cloudinary</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.docCardRemoveBtn}
                      onPress={() => setDocumento1(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.docCardRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholderDoc}
                    activeOpacity={0.8}
                    onPress={() => handlePickDocument(1)}
                  >
                    <Text style={styles.uploadDocIcon}>📄</Text>
                    <View style={styles.uploadDocTextCol}>
                      <Text style={styles.uploadDocTitle}>
                        Anexar Estatuto Social
                      </Text>
                      <Text style={styles.uploadDocSubtitle}>
                        Selecione PDF ou foto do documento
                      </Text>
                    </View>
                    <View style={styles.uploadDocActionBadge}>
                      <Text style={styles.uploadDocActionText}>Escolher</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Documento Legal 2 */}
              <View style={styles.uploadBlock}>
                <Text style={styles.label}>
                  Ata de Eleição / Documento do Responsável (PDF ou Imagem)
                </Text>
                {documento2 ? (
                  <View style={styles.docCardContainer}>
                    <View style={styles.docCardIconBadge}>
                      <Text style={styles.docCardIconText}>
                        {documento2.mimeType?.includes('pdf') ||
                        documento2.name.toLowerCase().endsWith('.pdf')
                          ? '📕'
                          : '🖼️'}
                      </Text>
                    </View>
                    <View style={styles.docCardInfo}>
                      <Text
                        style={styles.docCardName}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {documento2.name}
                      </Text>
                      <View style={styles.docCardMetaRow}>
                        <Text style={styles.docCardBadge}>
                          {documento2.mimeType?.includes('pdf') ||
                          documento2.name.toLowerCase().endsWith('.pdf')
                            ? 'PDF'
                            : 'IMAGEM'}
                        </Text>
                        {documento2.size ? (
                          <Text style={styles.docCardSize}>
                            {formatFileSize(documento2.size)}
                          </Text>
                        ) : null}
                        <Text style={styles.docCardCloudinary}>• Cloudinary</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.docCardRemoveBtn}
                      onPress={() => setDocumento2(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.docCardRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholderDoc}
                    activeOpacity={0.8}
                    onPress={() => handlePickDocument(2)}
                  >
                    <Text style={styles.uploadDocIcon}>📄</Text>
                    <View style={styles.uploadDocTextCol}>
                      <Text style={styles.uploadDocTitle}>
                        Anexar Ata ou Documento
                      </Text>
                      <Text style={styles.uploadDocSubtitle}>
                        Selecione PDF ou foto do documento
                      </Text>
                    </View>
                    <View style={styles.uploadDocActionBadge}>
                      <Text style={styles.uploadDocActionText}>Escolher</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>


            </View>
          )}

          {/* Botões de Ação do Stepper */}
          <View style={styles.actionsContainer}>
            {activeStep > 0 && (
              <TouchableOpacity
                style={styles.btnVoltar}
                activeOpacity={0.8}
                onPress={handlePrevStep}
                disabled={submitting}
              >
                <Text style={styles.btnVoltarText}>Voltar</Text>
              </TouchableOpacity>
            )}

            {activeStep < steps.length - 1 ? (
              <TouchableOpacity
                style={[styles.btnProximo, activeStep === 0 && { flex: 1 }]}
                activeOpacity={0.85}
                onPress={handleNextStep}
              >
                <Text style={styles.btnProximoText}>Próximo Passo →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.btnFinalizar,
                  submitting && styles.btnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleFinalizar}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator color={colors.textLight} size="small" />
                    <Text style={styles.submittingText}>
                      {uploadStatusText || 'Processando...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.btnFinalizarText}>
                    Finalizar Cadastro de ONG
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal com Lista Vertical de Opções de Causas Sociais */}
      <Modal
        visible={modalCausaVisivel}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalCausaVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalCausaVisivel(false)}
        >
          <View
            style={[
              styles.modalSheet,
              isTablet && { maxWidth: 540, width: '90%', alignSelf: 'center' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Área de Atuação da ONG</Text>
                <Text style={styles.modalSubtitle}>
                  Selecione a principal causa social defendida
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalCausaVisivel(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Lista Vertical de Opções */}
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={true}
            >
              {CAUSAS_SOCIAIS.map((item) => {
                const isSelected = causaSocial === item.nome;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setCausaSocial(item.nome);
                      setModalCausaVisivel(false);
                    }}
                  >
                    <View
                      style={[
                        styles.optionIconCircle,
                        isSelected && styles.optionIconCircleSelected,
                      ]}
                    >
                      <Text style={styles.optionIconText}>{item.icone}</Text>
                    </View>

                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {item.nome}
                      </Text>
                      <Text style={styles.optionDescription}>
                        {item.descricao}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 8,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepCirclePast: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreen,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: colors.textLight,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepContent: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.brandGreenDark,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  responsiveRow: {
    gap: 12,
    marginBottom: 14,
  },
  mobileColumn: {
    width: '100%',
  },
  tabletColumn: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cepLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cepLoadingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  asterisk: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F7FCFD',
  },
  selectTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E1F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectIconText: {
    fontSize: 20,
  },
  selectInfo: {
    flex: 1,
  },
  selectValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  selectHelperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectArrowBadge: {
    paddingLeft: 8,
  },
  selectArrowText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    width: '100%',
    maxHeight: '82%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.brandGreenDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 400,
  },
  modalListContent: {
    paddingBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  optionRowSelected: {
    backgroundColor: '#EDF9FA',
    borderColor: colors.primary,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  optionIconCircleSelected: {
    backgroundColor: '#D7F3F6',
    borderColor: colors.primary,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionTitleSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  uploadBlock: {
    marginBottom: 18,
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FB',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadPlaceholderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  uploadPlaceholderSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  uploadPlaceholderSmall: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  uploadPlaceholderTitleSmall: {
    fontSize: 13,
    color: colors.brandGreenDark,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  docPreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnChange: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnChangeText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnRemove: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnRemoveText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnVoltar: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderColor: colors.brandGreen,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnVoltarText: {
    color: colors.brandGreenDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnProximo: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
  },
  btnProximoText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnFinalizar: {
    flex: 2,
    backgroundColor: colors.brandGreen,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.brandGreenDark,
  },
  btnFinalizarText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submittingText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadPlaceholderDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E2E6',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F7FCFD',
  },
  uploadDocIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadDocTextCol: {
    flex: 1,
  },
  uploadDocTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadDocSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  uploadDocActionBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  uploadDocActionText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: 'bold',
  },
  docCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FA',
    borderWidth: 1,
    borderColor: '#C7EAF0',
    borderRadius: 10,
    padding: 12,
  },
  docCardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  docCardIconText: {
    fontSize: 20,
  },
  docCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  docCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  docCardBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: '#E1F6F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docCardSize: {
    fontSize: 11,
    color: colors.textMuted,
  },
  docCardCloudinary: {
    fontSize: 11,
    color: colors.brandGreenDark,
    fontWeight: '500',
  },
  docCardRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  docCardRemoveText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
