import React, { useState, useEffect, useCallback } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	useWindowDimensions,
	RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfilePost, RootStackParamList } from '../../App';
import { colors } from '../utils/theme';
import usuarioService, { getUsuarioLogado, UsuarioResponse, OngPopulated } from '../services/usuarioService';
import publicacaoService from '../services/publicacaoService';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

const DEFAULT_ONG_LOGO = require('../../assets/MUXN_logo1.png');

const DEFAULT_COVER_IMAGE =
	'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

export default function Perfil({ route, navigation }: Props) {
	const { width } = useWindowDimensions();
	const isTablet = width > 600;
	const loggedInUser = getUsuarioLogado();

	const targetUserId = route.params?.userId;
	const initialUser = route.params?.usuario || (!targetUserId ? loggedInUser : null);

	const [currentUser, setCurrentUser] = useState<UsuarioResponse | null>(initialUser);
	const [posts, setPosts] = useState<ProfilePost[]>(route.params?.posts ?? []);
	const [loading, setLoading] = useState<boolean>(!initialUser && Boolean(targetUserId));
	const [refreshing, setRefreshing] = useState(false);
	const [logoLoadError, setLogoLoadError] = useState(false);

	const idToLoad = targetUserId || initialUser?._id || loggedInUser?._id;

	// Carrega dados detalhados do usuário/ONG e suas postagens
	const carregarDadosPerfil = useCallback(async () => {
		if (!idToLoad) {
			setLoading(false);
			return;
		}

		try {
			const usuarioCarregado = await usuarioService.buscarPorId(idToLoad);
			if (usuarioCarregado) {
				setCurrentUser(usuarioCarregado);
			}

			// Carrega as publicações específicas deste usuário/ONG se não vieram nos parâmetros
			if (!route.params?.posts || route.params.posts.length === 0) {
				const todasPublis = await publicacaoService.listarPublicacoes();
				if (Array.isArray(todasPublis)) {
					const filtradas = todasPublis
						.filter((item) => {
							const criadorId = typeof item.criadoPor === 'object' && item.criadoPor !== null
								? item.criadoPor._id
								: (typeof item.criadoPor === 'string' ? item.criadoPor : undefined);
							return criadorId === idToLoad;
						})
						.map((item) => {
							const authorName = item.criadoPor?.assignedTo?.nomeFantasia || item.criadoPor?.nome || 'ONG Parceira';
							const itemCategory: 'Ação' | 'Pedido' = (item.categoria === 'Pedido' || item.categoria === 'Ação')
								? item.categoria
								: 'Ação';

							return {
								id: item._id,
								author: authorName,
								description: item.criadoPor?.assignedTo ? 'ONG Verificada' : 'Membro Onglink',
								initials: (authorName || 'ON').substring(0, 2).toUpperCase(),
								category: itemCategory,
								location: 'Comunidade Onglink',
								time: item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'Recente',
								title: item.titulo || 'Publicação',
								body: item.descricao || '',
								imageUri: item.imagem && item.imagem.length > 0 ? item.imagem[0] : null,
							};
						});
					setPosts(filtradas);
				}
			}
		} catch (error) {
			console.log('Erro ao carregar dados do perfil:', error);
		} finally {
			setLoading(false);
		}
	}, [idToLoad, route.params?.posts]);

	useEffect(() => {
		carregarDadosPerfil();
	}, [carregarDadosPerfil]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await carregarDadosPerfil();
		setRefreshing(false);
	}, [carregarDadosPerfil]);

	const handleLogout = () => {
		Alert.alert(
			'Sair da Conta',
			'Deseja realmente sair da sua conta?',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Sair',
					style: 'destructive',
					onPress: () => {
						usuarioService.logout();
						navigation.reset({
							index: 0,
							routes: [{ name: 'Login' }],
						});
					},
				},
			]
		);
	};

	const handleOpenLink = (url?: string) => {
		if (!url) return;
		const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
		Linking.openURL(fullUrl).catch(() => {
			Alert.alert('Erro', 'Não foi possível abrir o link informado.');
		});
	};

	// Modo visitante e sem perfil selecionado para exibição
	if (!currentUser && !loading) {
		return (
			<ScrollView style={styles.screen} contentContainerStyle={styles.visitorScrollContent}>
				<View style={[styles.content, isTablet && styles.tabletContent]}>
					<View style={styles.visitorCardContainer}>
						<View style={styles.visitorBadgeCircle}>
							<Text style={styles.visitorBadgeIcon}>👤</Text>
						</View>
						<Text style={styles.visitorCardTitle}>Acesse seu Perfil</Text>
						<Text style={styles.visitorCardSubtitle}>
							Você está navegando como visitante. Acesse sua conta ou faça seu cadastro para visualizar e gerenciar seu perfil completo.
						</Text>
						<View style={styles.visitorButtonsContainer}>
							<TouchableOpacity
								style={styles.visitorPrimaryBtn}
								onPress={() => navigation.navigate('Login')}
								activeOpacity={0.85}
							>
								<Text style={styles.visitorPrimaryBtnText}>Fazer Login</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.visitorSecondaryBtn}
								onPress={() => navigation.navigate('Cadastro')}
								activeOpacity={0.85}
							>
								<Text style={styles.visitorSecondaryBtnText}>Criar Nova Conta</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.visitorBackBtn}
								onPress={() => navigation.goBack()}
								activeOpacity={0.7}
							>
								<Text style={styles.visitorBackBtnText}>← Continuar Explorando o Feed</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</ScrollView>
		);
	}

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.brandGreenDark} />
				<Text style={styles.loadingText}>Carregando informações do perfil...</Text>
			</View>
		);
	}

	const isOwnProfile = Boolean(loggedInUser?._id && currentUser?._id && loggedInUser._id === currentUser._id);
	const ongData = typeof currentUser?.assignedTo === 'object' && currentUser?.assignedTo !== null
		? (currentUser.assignedTo as OngPopulated)
		: null;

	const isOng = currentUser?.status === 'ong' || Boolean(ongData);
	const isAdmin = currentUser?.status === 'admin';
	const isUserComum = !isOng && !isAdmin;

	const displayName = ongData?.nomeFantasia || currentUser?.nome || 'Usuário Onglink';
	const displayCausa = ongData?.causaSocial || (isOng ? 'Assistência e Projetos Sociais' : 'Apoiador Social');
	const displayDescricao = ongData?.descricao || (isOng ? 'Organização cadastrada na plataforma Onglink.' : 'Membro engajado na rede colaborativa Onglink.');
	const displayLogo = ongData?.logo || null;

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.scrollContent}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					colors={[colors.primary]}
					tintColor={colors.primary}
				/>
			}
		>
			<View style={[styles.content, isTablet && styles.tabletContent]}>
				{/* Botão de retorno quando visualizando perfil de outro membro/ONG */}
				{!isOwnProfile && (
					<TouchableOpacity
						style={styles.backButton}
						activeOpacity={0.7}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.backButtonText}>← Voltar ao Feed</Text>
					</TouchableOpacity>
				)}

				{/* CARTÃO PRINCIPAL DE PERFIL COM CAPA E AVATAR (ESTILO WEB) */}
				<View style={styles.profileCard}>
					{/* Foto de Capa / Banner */}
					<View style={styles.coverContainer}>
						<Image source={{ uri: DEFAULT_COVER_IMAGE }} style={styles.coverImage} />
					</View>

					{/* Cabeçalho do Perfil (Avatar sobreposto e Informações) */}
					<View style={styles.profileHeaderContent}>
						<View style={styles.avatarWrapper}>
							{isOng ? (
								<Image
									source={displayLogo && !logoLoadError ? { uri: displayLogo } : DEFAULT_ONG_LOGO}
									style={styles.avatarLogoImage}
									resizeMode={displayLogo && !logoLoadError ? 'cover' : 'contain'}
									onError={() => setLogoLoadError(true)}
								/>
							) : displayLogo ? (
								<Image source={{ uri: displayLogo }} style={styles.avatarLogoImage} />
							) : (
								<View style={[styles.avatar, isUserComum && styles.avatarUser]}>
									<Text style={[styles.avatarText, isUserComum && styles.avatarTextUser]}>
										{getInitials(displayName)}
									</Text>
								</View>
							)}
						</View>

						<View style={styles.profileHeadingText}>
							<View style={styles.nameRow}>
								<Text style={styles.name}>{displayName}</Text>
								{isOng && (
									<View style={styles.verifiedBadge}>
										<Text style={styles.verifiedBadgeIcon}>✓</Text>
									</View>
								)}
							</View>

							{ongData?.razaoSocial && (
								<Text style={styles.razaoSocialText}>{ongData.razaoSocial}</Text>
							)}

							<View style={styles.badgeRow}>
								{isOng && (
									<View style={styles.statusBadgeOng}>
										<Text style={styles.statusBadgeOngText}>🏢 ONG Aprovada</Text>
									</View>
								)}
								{isAdmin && (
									<View style={styles.statusBadgeAdmin}>
										<Text style={styles.statusBadgeAdminText}>👑 Administrador</Text>
									</View>
								)}
								{isUserComum && (
									<View style={styles.statusBadgeUser}>
										<Text style={styles.statusBadgeUserText}>🤝 Voluntário (Usuário)</Text>
									</View>
								)}
							</View>
						</View>
					</View>

					{/* Causa Social & Descrição da ONG / Usuário */}
					<View style={styles.bioSection}>
						<Text style={styles.causaTitle}>{displayCausa}</Text>
						<Text style={styles.bioText}>{displayDescricao}</Text>
					</View>

					{/* DADOS DE CONTATO E LOCALIZAÇÃO (PÚBLICOS) */}
					{isOng && (
						<View style={styles.contactSection}>
							<Text style={styles.sectionEyebrow}>CONTATOS & LOCALIZAÇÃO</Text>
							<View style={styles.contactList}>
								{ongData?.telefone && (
									<View style={styles.contactItem}>
										<Text style={styles.contactIcon}>📞</Text>
										<Text style={styles.contactValue}>{ongData.telefone}</Text>
									</View>
								)}
								{(ongData?.email || currentUser?.email) && (
									<View style={styles.contactItem}>
										<Text style={styles.contactIcon}>✉️</Text>
										<Text style={styles.contactValue}>{ongData?.email || currentUser?.email}</Text>
									</View>
								)}
								{ongData?.endereco?.cidade && (
									<View style={styles.contactItem}>
										<Text style={styles.contactIcon}>📍</Text>
										<Text style={styles.contactValue}>
											{ongData.endereco.cidade} - {ongData.endereco.estado}
											{ongData.endereco.bairro ? ` · ${ongData.endereco.bairro}` : ''}
										</Text>
									</View>
								)}
							</View>

							{/* Redes Sociais se houver */}
							{ongData?.redeSocial && (ongData.redeSocial.instagram || ongData.redeSocial.facebook || ongData.redeSocial.site) && (
								<View style={styles.socialButtonsRow}>
									{Boolean(ongData.redeSocial.site) && (
										<TouchableOpacity
											style={styles.socialBtn}
											onPress={() => handleOpenLink(ongData.redeSocial?.site)}
										>
											<Text style={styles.socialBtnText}>🌐 Website</Text>
										</TouchableOpacity>
									)}
									{Boolean(ongData.redeSocial.instagram) && (
										<TouchableOpacity
											style={styles.socialBtn}
											onPress={() => handleOpenLink(`https://instagram.com/${ongData.redeSocial?.instagram?.replace('@', '')}`)}
										>
											<Text style={styles.socialBtnText}>📸 Instagram</Text>
										</TouchableOpacity>
									)}
									{Boolean(ongData.redeSocial.facebook) && (
										<TouchableOpacity
											style={styles.socialBtn}
											onPress={() => handleOpenLink(ongData.redeSocial?.facebook)}
										>
											<Text style={styles.socialBtnText}>📘 Facebook</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
						</View>
					)}

					{/* SE FOR O PRÓPRIO PERFIL: DADOS CADASTRAIS PRIVADOS */}
					{isOwnProfile && currentUser && (
						<View style={styles.privateDetailsSection}>
							<Text style={styles.sectionEyebrow}>DADOS DA SUA CONTA</Text>
							<View style={styles.details}>
								<ProfileDetail label="Nome do Responsável" value={currentUser.nome} />
								<ProfileDetail label="CPF" value={currentUser.cpf || 'Não informado'} />
								<ProfileDetail label="E-mail de Login" value={currentUser.email} />
								<ProfileDetail
									label="Status da Conta"
									value={
										isOng
											? 'ONG Autorizada pela Administração'
											: isAdmin
											? 'Administrador do Sistema'
											: 'Usuário Comum (Cadastro Simples)'
									}
									last
								/>
							</View>
						</View>
					)}
				</View>

				{/* Bloco Explicativo para Usuário Comum no próprio perfil */}
				{isOwnProfile && isUserComum && (
					<View style={styles.infoCard}>
						<Text style={styles.infoCardTitle}>
							{currentUser?.assignedTo
								? '⏳ Cadastro de ONG em Análise'
								: '📢 Quer criar publicações no Feed?'}
						</Text>
						<Text style={styles.infoCardDescription}>
							{currentUser?.assignedTo
								? 'Sua solicitação de ONG foi enviada e está sob análise da equipe. Assim que for aprovada, o status mudará automaticamente para "ONG" e você poderá publicar campanhas no Feed.'
								: 'Usuários com perfil de cadastro simples possuem acesso de visualização e apoio. Para publicar campanhas e ações no Feed, conclua o cadastro completo da sua organização social e aguarde a aprovação.'}
						</Text>

						{!currentUser?.assignedTo && (
							<TouchableOpacity
								style={styles.cadastrarOngBtn}
								activeOpacity={0.85}
								onPress={() => navigation.navigate('CadastroCompleto')}
							>
								<Text style={styles.cadastrarOngBtnText}>🏢 Cadastrar Minha ONG (Completo)</Text>
							</TouchableOpacity>
						)}
					</View>
				)}

				{/* SEÇÃO DE PUBLICAÇÕES */}
				<View style={styles.publicationsHeader}>
					<Text style={styles.publicationsTitle}>
						{isOwnProfile ? 'Minhas publicações' : `Publicações de ${displayName.split(' ')[0]}`}
					</Text>
					<Text style={styles.publicationsCount}>
						{posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
					</Text>
				</View>

				{posts.length > 0 ? (
					<View style={styles.postList}>
						{posts.map((post) => (
							<PublicationCard key={post.id} post={post} />
						))}
					</View>
				) : (
					<View style={styles.emptyState}>
						<View style={styles.emptyIcon}>
							<Text style={styles.emptyIconText}>📝</Text>
						</View>
						<Text style={styles.emptyTitle}>Nenhuma publicação encontrada</Text>
						<Text style={styles.emptyDescription}>
							{isOwnProfile
								? 'Suas postagens divulgadas no feed da comunidade aparecerão listadas aqui.'
								: 'Esta organização ainda não divulgou publicações recentes no Feed.'}
						</Text>
					</View>
				)}

				{/* Botão de Logout exibido exclusivamente no próprio perfil */}
				{isOwnProfile && (
					<TouchableOpacity
						style={styles.logoutButton}
						activeOpacity={0.85}
						onPress={handleLogout}
					>
						<Text style={styles.logoutButtonText}>🚪 Sair da Minha Conta</Text>
					</TouchableOpacity>
				)}
			</View>
		</ScrollView>
	);
}

function ProfileDetail({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
	return (
		<View style={[styles.detailRow, last && styles.lastDetailRow]}>
			<Text style={styles.detailLabel}>{label}</Text>
			<Text style={styles.detailValue}>{value}</Text>
		</View>
	);
}

function PublicationCard({ post }: { post: ProfilePost }) {
	return (
		<View style={styles.postCard}>
			<View style={styles.postHeader}>
				<View style={styles.postAvatar}>
					<Text style={styles.postAvatarText}>{post.initials}</Text>
				</View>
				<View style={styles.postAuthor}>
					<Text style={styles.postAuthorName}>{post.author}</Text>
					<Text style={styles.postMeta}>{post.description} · {post.time}</Text>
				</View>
				
			</View>
			<Text style={styles.postTitle}>{post.title}</Text>
			<Text style={styles.postBody}>{post.body}</Text>
			{post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.postImage} />}
			<Text style={styles.postLocation}>{post.location}</Text>
		</View>
	);
}

function getInitials(name: string) {
	return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

const styles = StyleSheet.create({
	screen: {
		backgroundColor: colors.background,
		flex: 1,
	},
	scrollContent: {
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 16,
		paddingBottom: 40,
	},
	content: {
		width: '100%',
		gap: 16,
	},
	tabletContent: {
		maxWidth: 680,
	},
	loadingContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		backgroundColor: colors.background,
	},
	loadingText: {
		color: colors.textSecondary,
		fontSize: 14,
		marginTop: 12,
	},
	backButton: {
		alignSelf: 'flex-start',
		backgroundColor: colors.cardBackground,
		borderColor: colors.inputBorder,
		borderRadius: 20,
		borderWidth: 1,
		paddingHorizontal: 14,
		paddingVertical: 8,
		marginBottom: 4,
	},
	backButtonText: {
		color: colors.brandGreenDark,
		fontSize: 13,
		fontWeight: '700',
	},
	profileCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 16,
		elevation: 3,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 5,
	},
	coverContainer: {
		height: 120,
		width: '100%',
		backgroundColor: colors.brandGreenLight,
	},
	coverImage: {
		height: '100%',
		width: '100%',
		resizeMode: 'cover',
	},
	profileHeaderContent: {
		paddingHorizontal: 20,
		paddingBottom: 16,
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 14,
	},
	avatarWrapper: {
		marginTop: -42,
		borderRadius: 44,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	avatar: {
		alignItems: 'center',
		backgroundColor: colors.brandGreenLight,
		borderColor: '#FFF',
		borderRadius: 40,
		borderWidth: 3,
		height: 80,
		justifyContent: 'center',
		width: 80,
	},
	avatarLogoImage: {
		borderColor: '#FFF',
		borderRadius: 40,
		borderWidth: 3,
		height: 80,
		width: 80,
		backgroundColor: '#FFF',
	},
	avatarUser: {
		backgroundColor: '#E8F5F8',
		borderColor: '#FFF',
	},
	avatarText: {
		color: colors.brandGreenDark,
		fontSize: 26,
		fontWeight: '700',
	},
	avatarTextUser: {
		color: colors.primary,
	},
	profileHeadingText: {
		flex: 1,
		paddingTop: 8,
		paddingBottom: 4,
	},
	nameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		flexWrap: 'wrap',
	},
	name: {
		color: colors.textPrimary,
		fontSize: 20,
		fontWeight: '700',
	},
	razaoSocialText: {
		color: colors.textMuted,
		fontSize: 12,
		marginTop: 2,
	},
	verifiedBadge: {
		backgroundColor: colors.brandGreenDark,
		borderRadius: 10,
		height: 18,
		width: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	verifiedBadgeIcon: {
		color: '#FFF',
		fontSize: 11,
		fontWeight: 'bold',
	},
	badgeRow: {
		marginTop: 6,
	},
	statusBadgeOng: {
		alignSelf: 'flex-start',
		backgroundColor: '#E8F5E9',
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#A5D6A7',
	},
	statusBadgeOngText: {
		color: '#2E7D32',
		fontSize: 11,
		fontWeight: '700',
	},
	statusBadgeAdmin: {
		alignSelf: 'flex-start',
		backgroundColor: '#EDE7F6',
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#D1C4E9',
	},
	statusBadgeAdminText: {
		color: '#512DA8',
		fontSize: 11,
		fontWeight: '700',
	},
	statusBadgeUser: {
		alignSelf: 'flex-start',
		backgroundColor: '#E1F5FE',
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#B3E5FC',
	},
	statusBadgeUserText: {
		color: '#0277BD',
		fontSize: 11,
		fontWeight: '700',
	},

	bioSection: {
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderTopColor: colors.inputBorder,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	causaTitle: {
		color: colors.brandGreenDark,
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 4,
	},
	bioText: {
		color: colors.textSecondary,
		fontSize: 13,
		lineHeight: 20,
	},

	contactSection: {
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderTopColor: colors.inputBorder,
		borderTopWidth: StyleSheet.hairlineWidth,
		backgroundColor: '#FAFAFA',
	},
	contactList: {
		gap: 8,
		marginTop: 8,
	},
	contactItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	contactIcon: {
		fontSize: 14,
	},
	contactValue: {
		color: colors.textPrimary,
		fontSize: 13,
	},
	socialButtonsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 12,
	},
	socialBtn: {
		backgroundColor: '#FFF',
		borderColor: colors.inputBorder,
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	socialBtnText: {
		color: colors.textPrimary,
		fontSize: 12,
		fontWeight: '600',
	},

	privateDetailsSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopColor: colors.inputBorder,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	sectionEyebrow: {
		color: colors.textMuted,
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 0.8,
	},
	details: {
		marginTop: 6,
	},
	detailRow: {
		borderBottomColor: colors.inputBorder,
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingVertical: 10,
	},
	lastDetailRow: {
		borderBottomWidth: 0,
		paddingBottom: 2,
	},
	detailLabel: {
		color: colors.textMuted,
		fontSize: 11,
		marginBottom: 2,
		fontWeight: '600',
	},
	detailValue: {
		color: colors.textPrimary,
		fontSize: 14,
		fontWeight: '500',
	},

	infoCard: {
		backgroundColor: '#F7FAFC',
		borderColor: '#E2E8F0',
		borderWidth: 1,
		borderRadius: 14,
		padding: 18,
	},
	infoCardTitle: {
		color: colors.textPrimary,
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 6,
	},
	infoCardDescription: {
		color: colors.textSecondary,
		fontSize: 13,
		lineHeight: 19,
	},
	cadastrarOngBtn: {
		backgroundColor: colors.brandGreen,
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
		marginTop: 12,
		borderBottomWidth: 3,
		borderBottomColor: colors.brandGreenDark,
	},
	cadastrarOngBtnText: {
		color: colors.textLight,
		fontSize: 14,
		fontWeight: '700',
	},

	publicationsHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	publicationsTitle: {
		color: colors.textPrimary,
		fontSize: 17,
		fontWeight: '700',
	},
	publicationsCount: {
		color: colors.textMuted,
		fontSize: 12,
	},
	postList: {
		gap: 12,
	},
	postCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 14,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
	},
	postHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		marginBottom: 12,
	},
	postAvatar: {
		alignItems: 'center',
		backgroundColor: colors.brandGreenLight,
		borderRadius: 18,
		height: 36,
		justifyContent: 'center',
		marginRight: 10,
		width: 36,
	},
	postAvatarText: {
		color: colors.brandGreenDark,
		fontSize: 12,
		fontWeight: '700',
	},
	postAuthor: {
		flex: 1,
	},
	postAuthorName: {
		color: colors.textPrimary,
		fontSize: 14,
		fontWeight: '700',
	},
	postMeta: {
		color: colors.textMuted,
		fontSize: 11,
		marginTop: 1,
	},
	
	postTitle: {
		color: colors.textPrimary,
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 4,
	},
	postBody: {
		color: colors.textSecondary,
		fontSize: 13,
		lineHeight: 19,
	},
	postImage: {
		aspectRatio: 4 / 3,
		borderRadius: 8,
		marginTop: 10,
		width: '100%',
	},
	postLocation: {
		color: colors.textMuted,
		fontSize: 11,
		marginTop: 8,
	},

	emptyState: {
		alignItems: 'center',
		backgroundColor: colors.cardBackground,
		borderRadius: 14,
		padding: 24,
	},
	emptyIcon: {
		alignItems: 'center',
		backgroundColor: '#E8F5E9',
		borderRadius: 25,
		height: 50,
		justifyContent: 'center',
		width: 50,
	},
	emptyIconText: {
		fontSize: 24,
	},
	emptyTitle: {
		color: colors.textPrimary,
		fontSize: 15,
		fontWeight: '700',
		marginTop: 10,
		textAlign: 'center',
	},
	emptyDescription: {
		color: colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginTop: 4,
		maxWidth: 320,
		textAlign: 'center',
	},

	logoutButton: {
		backgroundColor: '#FFF5F5',
		borderColor: '#FED7D7',
		borderWidth: 1,
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: 'center',
		marginTop: 8,
	},
	logoutButtonText: {
		color: '#C53030',
		fontSize: 14,
		fontWeight: '700',
	},

	visitorScrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	visitorCardContainer: {
		backgroundColor: colors.cardBackground,
		borderRadius: 20,
		padding: 28,
		alignItems: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		width: '100%',
	},
	visitorBadgeCircle: {
		width: 74,
		height: 74,
		borderRadius: 37,
		backgroundColor: colors.brandGreenLight,
		borderWidth: 2,
		borderColor: colors.brandGreen,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	visitorBadgeIcon: {
		fontSize: 34,
	},
	visitorCardTitle: {
		color: colors.textPrimary,
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 8,
	},
	visitorCardSubtitle: {
		color: colors.textSecondary,
		fontSize: 14,
		lineHeight: 21,
		textAlign: 'center',
		marginBottom: 24,
		maxWidth: 320,
	},
	visitorButtonsContainer: {
		width: '100%',
		gap: 12,
	},
	visitorPrimaryBtn: {
		backgroundColor: colors.primary,
		paddingVertical: 14,
		borderRadius: 12,
		width: '100%',
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	visitorPrimaryBtnText: {
		color: colors.textLight,
		fontSize: 15,
		fontWeight: '700',
	},
	visitorSecondaryBtn: {
		backgroundColor: '#FFF',
		borderColor: colors.brandGreen,
		borderWidth: 1.5,
		paddingVertical: 13,
		borderRadius: 12,
		width: '100%',
		alignItems: 'center',
	},
	visitorSecondaryBtnText: {
		color: colors.brandGreenDark,
		fontSize: 15,
		fontWeight: '700',
	},
	visitorBackBtn: {
		paddingVertical: 10,
		alignItems: 'center',
		marginTop: 4,
	},
	visitorBackBtnText: {
		color: colors.textMuted,
		fontSize: 14,
		fontWeight: '600',
	},
});
