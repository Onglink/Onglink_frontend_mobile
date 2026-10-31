import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';
import ongService, { OngResponse } from '../services/ongService';

type Props = NativeStackScreenProps<RootStackParamList, 'Parceiros'>;

// Imagem padrão de fallback da MUXN (mantenedora do projeto Onglink)
const DEFAULT_LOGO = require('../../assets/MUXN_logo1.png');

// Lista de categorias válidas sincronizada com o Web (parceiros/page.tsx)
const CATEGORIAS_VALIDAS = [
  'Todas',
  'Ambiental',
  'Animal',
  'Educação',
  'Saúde',
  'Social',
];

// Mapeamento de cores padronizado com o Web
const CATEGORY_COLORS: Record<string, string> = {
  Ambiental: '#28A745', // Verde
  Animal: '#D97706',    // Dourado / Âmbar
  'Educação': '#007BFF',// Azul
  Educacao: '#007BFF',
  'Saúde': '#DC3545',   // Vermelho
  Saude: '#DC3545',
  Social: '#6F42C1',    // Roxo
};

function normalizeString(str: string = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCategoryColor(category: string = ''): string {
  const norm = normalizeString(category);
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (normalizeString(key) === norm) {
      return color;
    }
  }
  return colors.brandGreen;
}

/**
 * Componente de Logo com fallback para MUXN caso a URL da imagem esteja vazia,
 * inválida ou ocorra erro de carregamento (ex: 404 ou formato corrompido).
 */
interface OngLogoProps {
  uri?: string;
  size: number;
  borderColor?: string;
}

function OngLogo({ uri, size, borderColor }: OngLogoProps) {
  const [loadError, setLoadError] = useState(false);

  const isValidUrl =
    typeof uri === 'string' &&
    uri.trim().length > 0 &&
    (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image'));

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: borderColor || '#E2E8F0',
    overflow: 'hidden' as const,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (!isValidUrl || loadError) {
    return (
      <View style={containerStyle}>
        <Image
          source={DEFAULT_LOGO}
          style={{ width: '82%', height: '82%' }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: uri.trim() }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={() => setLoadError(true)}
      />
    </View>
  );
}

export default function Parceiros({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [parceiros, setParceiros] = useState<OngResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('Todas');
  const [selectedPartner, setSelectedPartner] = useState<OngResponse | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Carrega as ONGs cadastradas e aprovadas
  const carregarParceiros = useCallback(async () => {
    try {
      let dados: any = await ongService.listarParceiros();
      let lista: OngResponse[] = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (dados && typeof dados === 'object') {
        lista = dados.parceiros || dados.data || [];
      }

      // Se /parceiros retornou vazio, tenta listar todas via /ongs
      if (lista.length === 0) {
        const todasOngs = await ongService.listarOngs();
        if (Array.isArray(todasOngs)) {
          lista = todasOngs.filter(
            (o) => !o.situacaoCadastral || /aprovad/i.test(o.situacaoCadastral)
          );
        }
      }

      setParceiros(lista);
    } catch (err: any) {
      console.warn('Erro ao carregar parceiros:', err?.message || err);
      // Fallback para /ongs se /parceiros falhou
      try {
        const todasOngs = await ongService.listarOngs();
        if (Array.isArray(todasOngs)) {
          setParceiros(todasOngs);
        }
      } catch (err2) {
        console.error('Falha geral ao carregar ONGs:', err2);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarParceiros();
  }, [carregarParceiros]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarParceiros();
  };

  // Abre link externo com validação
  const abrirLinkExterno = async (url: string) => {
    if (!url) return;
    try {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (canOpen) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Atenção', 'Não foi possível abrir o link: ' + finalUrl);
      }
    } catch {
      Alert.alert('Erro', 'Link inválido ou inacessível.');
    }
  };

  const fazerLigacao = (telefone: string) => {
    if (!telefone) return;
    const numeros = telefone.replace(/\D/g, '');
    Linking.openURL(`tel:${numeros}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível discar para o número informado.');
    });
  };

  const enviarEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email.trim()}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
    });
  };

  // Contagem por categoria
  const contagemCategorias = useMemo(() => {
    const counts: Record<string, number> = { Todas: parceiros.length };
    CATEGORIAS_VALIDAS.forEach((cat) => {
      if (cat !== 'Todas') {
        const normCat = normalizeString(cat);
        counts[cat] = parceiros.filter((p) =>
          normalizeString(p.causaSocial || '').includes(normCat)
        ).length;
      }
    });
    return counts;
  }, [parceiros]);

  // Filtra as ONGs por categoria selecionada e texto de busca
  const parceirosFiltrados = useMemo(() => {
    const buscaNorm = normalizeString(busca);
    const catNorm = normalizeString(categoriaSelecionada);

    return parceiros.filter((p) => {
      const nomeMatch = normalizeString(p.nomeFantasia || '').includes(buscaNorm);
      const razaoMatch = normalizeString(p.razaoSocial || '').includes(buscaNorm);
      const causaMatch = normalizeString(p.causaSocial || '').includes(buscaNorm);
      const descMatch = normalizeString(p.descricao || '').includes(buscaNorm);
      const cidadeMatch = normalizeString(p.endereco?.cidade || '').includes(buscaNorm);

      const bateBusca = !busca || nomeMatch || razaoMatch || causaMatch || descMatch || cidadeMatch;

      const bateCategoria =
        categoriaSelecionada === 'Todas' ||
        normalizeString(p.causaSocial || '').includes(catNorm);

      return bateBusca && bateCategoria;
    });
  }, [parceiros, busca, categoriaSelecionada]);

  // Se 'Todas' estiver selecionado e sem busca, agrupa por categoria como na web
  const categoriasParaExibir = useMemo(() => {
    if (busca || categoriaSelecionada !== 'Todas') {
      return null;
    }
    // Agrupa apenas categorias que possuem parceiros
    const grupos: { categoria: string; lista: OngResponse[]; cor: string }[] = [];
    CATEGORIAS_VALIDAS.forEach((cat) => {
      if (cat !== 'Todas') {
        const normCat = normalizeString(cat);
        const filtradas = parceiros.filter((p) =>
          normalizeString(p.causaSocial || '').includes(normCat)
        );
        if (filtradas.length > 0) {
          grupos.push({
            categoria: cat,
            lista: filtradas,
            cor: getCategoryColor(cat),
          });
        }
      }
    });

    // ONGs sem categoria padrão
    const outras = parceiros.filter((p) => {
      const pNorm = normalizeString(p.causaSocial || '');
      return !CATEGORIAS_VALIDAS.some(
        (cat) => cat !== 'Todas' && pNorm.includes(normalizeString(cat))
      );
    });

    if (outras.length > 0) {
      grupos.push({
        categoria: 'Outras Causas',
        lista: outras,
        cor: colors.brandGreen,
      });
    }

    return grupos;
  }, [parceiros, busca, categoriaSelecionada]);

  const abrirDetalhes = (ong: OngResponse) => {
    setSelectedPartner(ong);
    setModalVisible(true);
  };

  // Render do Card de ONG
  const renderCardOng = (ong: OngResponse) => {
    const corCategoria = getCategoryColor(ong.causaSocial);

    const cidadeEstado = [ong.endereco?.cidade, ong.endereco?.estado]
      .filter(Boolean)
      .join(' - ');

    return (
      <View key={ong._id || ong.nomeFantasia} style={[styles.card, { borderTopColor: corCategoria }]}>
        <View style={styles.cardHeader}>
          {/* Logo com Fallback para MUXN */}
          <OngLogo
            uri={ong.logo}
            size={60}
            borderColor={corCategoria}
          />

          <View style={styles.cardHeaderInfo}>
            <Text style={styles.ongName} numberOfLines={2}>
              {ong.nomeFantasia || 'ONG Parceira'}
            </Text>
            {ong.causaSocial ? (
              <View style={[styles.badge, { backgroundColor: `${corCategoria}1A`, borderColor: corCategoria }]}>
                <Text style={[styles.badgeText, { color: corCategoria }]}>
                  {ong.causaSocial}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Informações Rápidas */}
        <View style={styles.cardBody}>
          {ong.telefone ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoText}>{ong.telefone}</Text>
            </View>
          ) : null}

          {cidadeEstado ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{cidadeEstado}</Text>
            </View>
          ) : null}

          {ong.descricao ? (
            <Text style={styles.descricaoCurta} numberOfLines={2}>
              {ong.descricao}
            </Text>
          ) : null}
        </View>

        {/* Botão de Ação */}
        <TouchableOpacity
          style={[styles.visitarButton, { backgroundColor: corCategoria }]}
          activeOpacity={0.85}
          onPress={() => abrirDetalhes(ong)}
        >
          <Text style={styles.visitarButtonText}>Ver Detalhes do Parceiro</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de Busca Superior */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Procurar ONG por nome, causa ou cidade..."
            placeholderTextColor="#888"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
          />
          {busca ? (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Carrossel de Categorias / Chips */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIAS_VALIDAS.map((cat) => {
            const isSelected = categoriaSelecionada === cat;
            const count = contagemCategorias[cat] ?? 0;
            const cor = cat === 'Todas' ? colors.brandGreenDark : getCategoryColor(cat);

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && { backgroundColor: cor, borderColor: cor },
                ]}
                activeOpacity={0.8}
                onPress={() => setCategoriaSelecionada(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: colors.textLight, fontWeight: 'bold' },
                  ]}
                >
                  {cat} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Conteúdo Principal */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando parceiros cadastrados...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && { alignSelf: 'center', width: '100%', maxWidth: 700 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Banner explicativo */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>NOSSOS PARCEIROS</Text>
            <Text style={styles.bannerSubtitle}>
              Organizações da sociedade civil engajadas em transformar comunidades.
            </Text>
          </View>

          {/* Listagem agrupada por seções (quando categoria for 'Todas' e sem busca ativa) */}
          {categoriasParaExibir ? (
            categoriasParaExibir.map((grupo) => (
              <View key={grupo.categoria} style={styles.groupSection}>
                <View style={[styles.groupHeader, { borderLeftColor: grupo.cor }]}>
                  <Text style={[styles.groupTitle, { color: grupo.cor }]}>
                    PARCEIROS {grupo.categoria.toUpperCase()} ({grupo.lista.length})
                  </Text>
                </View>
                {grupo.lista.map(renderCardOng)}
              </View>
            ))
          ) : (
            /* Listagem filtrada simples */
            <>
              {parceirosFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏢</Text>
                  <Text style={styles.emptyTitle}>Nenhuma ONG encontrada</Text>
                  <Text style={styles.emptySubtitle}>
                    {busca
                      ? `Não encontramos resultados para "${busca}". Tente outros termos.`
                      : 'Nenhuma ONG cadastrada nesta categoria no momento.'}
                  </Text>
                </View>
              ) : (
                parceirosFiltrados.map(renderCardOng)
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* MODAL DE DETALHES COMPLETO DA ONG (Modelado no Web) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isTablet && { maxWidth: 580 }]}>
            {/* Cabeçalho do Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedPartner?.nomeFantasia || 'Detalhes do Parceiro'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {selectedPartner && (
                <>
                  {/* Foto/Logo Grande com Fallback para MUXN */}
                  <View style={styles.modalLogoContainer}>
                    <OngLogo
                      uri={selectedPartner.logo}
                      size={96}
                      borderColor={getCategoryColor(selectedPartner.causaSocial)}
                    />

                    <Text style={styles.modalOngTitle}>
                      {selectedPartner.nomeFantasia}
                    </Text>

                    {selectedPartner.razaoSocial &&
                    selectedPartner.razaoSocial !== selectedPartner.nomeFantasia ? (
                      <Text style={styles.modalOngRazao}>
                        {selectedPartner.razaoSocial}
                      </Text>
                    ) : null}

                    {selectedPartner.causaSocial ? (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: `${getCategoryColor(
                              selectedPartner.causaSocial
                            )}22`,
                            borderColor: getCategoryColor(selectedPartner.causaSocial),
                            marginTop: 6,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: getCategoryColor(selectedPartner.causaSocial) },
                          ]}
                        >
                          Causa: {selectedPartner.causaSocial}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.modalDivider} />

                  {/* Informações de Contato e Sede */}
                  <Text style={styles.modalSectionTitle}>Contato & Sede</Text>

                  {selectedPartner.telefone ? (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => fazerLigacao(selectedPartner.telefone)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.contactIcon}>📞</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactLabel}>Telefone (toque para ligar):</Text>
                        <Text style={styles.contactValueLink}>{selectedPartner.telefone}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {selectedPartner.email ? (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => enviarEmail(selectedPartner.email)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.contactIcon}>✉️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactLabel}>E-mail:</Text>
                        <Text style={styles.contactValueLink}>{selectedPartner.email}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {selectedPartner.endereco && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactIcon}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactLabel}>Endereço:</Text>
                        <Text style={styles.contactValue}>
                          {[
                            selectedPartner.endereco.rua,
                            selectedPartner.endereco.numeroEnd
                              ? `nº ${selectedPartner.endereco.numeroEnd}`
                              : '',
                            selectedPartner.endereco.complemento,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                        <Text style={styles.contactSubValue}>
                          {[
                            selectedPartner.endereco.bairro,
                            selectedPartner.endereco.cidade
                              ? `${selectedPartner.endereco.cidade}/${selectedPartner.endereco.estado || ''}`
                              : '',
                            selectedPartner.endereco.cep ? `CEP: ${selectedPartner.endereco.cep}` : '',
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalDivider} />

                  {/* Redes Sociais e Website */}
                  <Text style={styles.modalSectionTitle}>Redes e Site Oficial</Text>
                  <View style={styles.socialButtonsRow}>
                    {selectedPartner.redeSocial?.site ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#007BFF' }]}
                        activeOpacity={0.8}
                        onPress={() => abrirLinkExterno(selectedPartner.redeSocial.site)}
                      >
                        <Text style={styles.socialButtonText}>🌐 Site Oficial</Text>
                      </TouchableOpacity>
                    ) : null}

                    {selectedPartner.redeSocial?.instagram ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#E1306C' }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const insta = selectedPartner.redeSocial.instagram.trim();
                          const url = insta.startsWith('http')
                            ? insta
                            : `https://instagram.com/${insta.replace('@', '')}`;
                          abrirLinkExterno(url);
                        }}
                      >
                        <Text style={styles.socialButtonText}>📷 Instagram</Text>
                      </TouchableOpacity>
                    ) : null}

                    {selectedPartner.redeSocial?.facebook ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const fb = selectedPartner.redeSocial.facebook.trim();
                          const url = fb.startsWith('http')
                            ? fb
                            : `https://facebook.com/${fb}`;
                          abrirLinkExterno(url);
                        }}
                      >
                        <Text style={styles.socialButtonText}>👥 Facebook</Text>
                      </TouchableOpacity>
                    ) : null}

                    {!selectedPartner.redeSocial?.site &&
                    !selectedPartner.redeSocial?.instagram &&
                    !selectedPartner.redeSocial?.facebook ? (
                      <Text style={styles.emptySocialText}>Nenhuma rede social informada.</Text>
                    ) : null}
                  </View>

                  <View style={styles.modalDivider} />

                  {/* Descrição da ONG */}
                  <Text style={styles.modalSectionTitle}>Sobre a Organização</Text>
                  <Text style={styles.descricaoCompleta}>
                    {selectedPartner.descricao || 'Nenhuma descrição detalhada informada.'}
                  </Text>
                </>
              )}
            </ScrollView>

            {/* Rodapé do Modal com Botão Fechar */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                activeOpacity={0.85}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  searchContainer: {
    backgroundColor: colors.brandGreenDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoriesWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.brandGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.brandGreenDark,
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    borderLeftWidth: 4,
    paddingLeft: 10,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderTopWidth: 4,
    borderTopColor: colors.brandGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  ongName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  descricaoCurta: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  visitarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  visitarButtonText: {
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandGreenDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalLogoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalOngTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOngRazao: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandGreenDark,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  contactIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 1,
  },
  contactValueLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  contactSubValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptySocialText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  descricaoCompleta: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  closeModalButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
