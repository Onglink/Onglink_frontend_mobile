import React, { useState, useEffect, useCallback } from 'react';
import {
	Alert,
	Image,
	Pressable,
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
import usuarioService, { getUsuarioLogado, UsuarioResponse } from '../services/usuarioService';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

export default function Perfil({ route, navigation }: Props) {
	const { width } = useWindowDimensions();
	const isTablet = width > 600;
	const posts = route.params?.posts ?? [];
	const initialUser = route.params?.usuario || getUsuarioLogado();

	const [currentUser, setCurrentUser] = useState<UsuarioResponse | null>(initialUser);
	const [refreshing, setRefreshing] = useState(false);

	// Consulta o backend para checar se a administração alterou o status do usuário (ex: de 'user' para 'ong')
	const carregarDadosAtualizados = useCallback(async () => {
		if (!initialUser?._id) return;
		try {
			const atualizado = await usuarioService.buscarPorId(initialUser._id);
			if (atualizado) {
				setCurrentUser(atualizado);
			}
		} catch {
			// Mantém os dados da sessão se estiver sem rede
		}
	}, [initialUser?._id]);

	useEffect(() => {
		carregarDadosAtualizados();
	}, [carregarDadosAtualizados]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await carregarDadosAtualizados();
		setRefreshing(false);
	}, [carregarDadosAtualizados]);

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
							routes: [{ name: 'Home' }],
						});
					},
				},
			]
		);
	};

	// Caso não esteja logado (modo visitante)
	if (!currentUser) {
		return (
			<ScrollView
				style={styles.screen}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={[styles.content, isTablet && styles.tabletContent]}>
					<View style={styles.profileCard}>
						<View style={styles.emptyIcon}>
							<Text style={styles.emptyIconText}>👤</Text>
						</View>
						<Text style={styles.emptyTitle}>Nenhum usuário conectado</Text>
						<Text style={styles.emptyDescription}>
							Você está navegando como visitante. Acesse sua conta ou faça seu cadastro para visualizar seu perfil.
						</Text>
						<TouchableOpacity
							style={styles.loginActionBtn}
							onPress={() => navigation.navigate('Login')}
							activeOpacity={0.85}
						>
							<Text style={styles.loginActionText}>Fazer Login</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.registerActionBtn}
							onPress={() => navigation.navigate('Cadastro')}
							activeOpacity={0.85}
						>
							<Text style={styles.registerActionText}>Criar Nova Conta</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		);
	}

	const isUserComum = currentUser.status === 'user';
	const isOng = currentUser.status === 'ong';
	const isAdmin = currentUser.status === 'admin';

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
				{/* Cartão de Informações Básicas do Usuário */}
				<View style={styles.profileCard}>
					<View style={styles.profileHeading}>
						<View style={[styles.avatar, isUserComum && styles.avatarUser]}>
							<Text style={[styles.avatarText, isUserComum && styles.avatarTextUser]}>
								{getInitials(currentUser.nome || 'ON')}
							</Text>
						</View>
						<View style={styles.profileHeadingText}>
							<Text style={styles.name}>{currentUser.nome}</Text>
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

					{/* Título da Seção */}
					<View style={styles.profileActions}>
						<Text style={styles.sectionEyebrow}>DADOS DO CADASTRO SIMPLES</Text>
					</View>

					{/* Apenas informações básicas cadastradas */}
					<View style={styles.details}>
						<ProfileDetail label="Nome Completo" value={currentUser.nome} />
						<ProfileDetail label="CPF" value={currentUser.cpf || 'Não informado'} />
						<ProfileDetail label="E-mail" value={currentUser.email} />
						<ProfileDetail
							label="Status da Conta"
							value={
								isOng
									? 'ONG Autorizada pela Administração'
									: isAdmin
									? 'Administrador do Sistema'
									: 'Usuário Comum (Aguardando Aprovação de ONG)'
							}
							last
						/>
					</View>
				</View>

				{/* Bloco Explicativo para Usuário Comum ("user") */}
				{isUserComum && (
					<View style={styles.infoCard}>
						<Text style={styles.infoCardTitle}>
							{currentUser.assignedTo
								? '⏳ Cadastro de ONG em Análise'
								: '📢 Quer criar publicações no Feed?'}
						</Text>
						<Text style={styles.infoCardDescription}>
							{currentUser.assignedTo
								? 'Sua solicitação de ONG foi enviada e está sob análise da administração do sistema. Assim que for autorizada pela equipe, seu status mudará automaticamente para "ONG" e a postagem no Feed será liberada.'
								: 'Usuários com perfil de cadastro simples possuem acesso de visualização e apoio. Para publicar campanhas e ações no Feed, conclua o cadastro completo da sua organização social e aguarde a aprovação da administração.'}
						</Text>

						{!currentUser.assignedTo && (
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

				{/* Seção de Publicações exclusiva para contas autorizadas como ONG */}
				{(isOng || isAdmin) && (
					<>
						<View style={styles.publicationsHeader}>
							<Text style={styles.publicationsTitle}>Minhas publicações</Text>
							<Text style={styles.publicationsCount}>
								{posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
							</Text>
						</View>

						{posts.length ? (
							<View style={styles.postList}>
								{posts.map((post) => <PublicationCard key={post.id} post={post} />)}
							</View>
						) : (
							<View style={styles.emptyState}>
								<View style={styles.emptyIcon}><Text style={styles.emptyIconText}>📝</Text></View>
								<Text style={styles.emptyTitle}>Nenhuma publicação ativa</Text>
								<Text style={styles.emptyDescription}>
									Suas postagens divulgadas no feed da comunidade aparecerão listadas aqui.
								</Text>
							</View>
						)}
					</>
				)}

				{/* Botão de Logout */}
				<TouchableOpacity
					style={styles.logoutButton}
					activeOpacity={0.85}
					onPress={handleLogout}
				>
					<Text style={styles.logoutButtonText}>🚪 Sair da Minha Conta</Text>
				</TouchableOpacity>
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
				<View style={styles.postAvatar}><Text style={styles.postAvatarText}>{post.initials}</Text></View>
				<View style={styles.postAuthor}>
					<Text style={styles.postAuthorName}>{post.author}</Text>
					<Text style={styles.postMeta}>{post.description} · {post.time}</Text>
				</View>
				<View style={[styles.categoryTag, post.category === 'Pedido' && styles.requestTag]}>
					<Text style={styles.categoryText}>{post.category}</Text>
				</View>
			</View>
			<Text style={styles.postTitle}>{post.title}</Text>
			<Text style={styles.postBody}>{post.body}</Text>
			{post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.postImage} />}
			<Text style={styles.postLocation}>{post.location}</Text>
			<View style={styles.postFooter}>
				<Text style={styles.postStat}>♡ {post.likes + Number(post.isLiked)} curtidas</Text>
				<Text style={styles.postStat}>
					{post.comments} {post.comments === 1 ? 'comentário' : 'comentários'}
				</Text>
			</View>
		</View>
	);
}

function getInitials(name: string) {
	return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1 },
	scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
	content: { width: '100%', gap: 16 },
	tabletContent: { maxWidth: 680 },
	profileCard: {
		backgroundColor: colors.cardBackground, borderRadius: 16, elevation: 3, padding: 22,
		shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
	},
	profileHeading: {
		alignItems: 'center', borderBottomColor: colors.inputBorder,
		borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingBottom: 18,
	},
	avatar: {
		alignItems: 'center', backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen,
		borderRadius: 34, borderWidth: 2, height: 68, justifyContent: 'center', marginRight: 16, width: 68,
	},
	avatarUser: {
		backgroundColor: '#E8F5F8',
		borderColor: colors.primary,
	},
	avatarText: { color: colors.brandGreenDark, fontSize: 22, fontWeight: '700' },
	avatarTextUser: { color: colors.primary },
	profileHeadingText: { flex: 1 },
	name: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
	badgeRow: { marginTop: 6 },
	statusBadgeOng: {
		alignSelf: 'flex-start',
		backgroundColor: '#E8F5E9',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#A5D6A7',
	},
	statusBadgeOngText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
	statusBadgeAdmin: {
		alignSelf: 'flex-start',
		backgroundColor: '#EDE7F6',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#D1C4E9',
	},
	statusBadgeAdminText: { color: '#512DA8', fontSize: 12, fontWeight: '700' },
	statusBadgeUser: {
		alignSelf: 'flex-start',
		backgroundColor: '#E1F5FE',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#B3E5FC',
	},
	statusBadgeUserText: { color: '#0277BD', fontSize: 12, fontWeight: '700' },
	profileActions: {
		marginBottom: 8, marginTop: 16,
	},
	sectionEyebrow: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
	details: { marginTop: 4 },
	detailRow: {
		borderBottomColor: colors.inputBorder, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12,
	},
	lastDetailRow: { borderBottomWidth: 0, paddingBottom: 2 },
	detailLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4, fontWeight: '600' },
	detailValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },

	infoCard: {
		backgroundColor: '#F7FAFC',
		borderColor: '#E2E8F0',
		borderWidth: 1,
		borderRadius: 14,
		padding: 18,
	},
	infoCardTitle: {
		color: colors.textPrimary,
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 8,
	},
	infoCardDescription: {
		color: colors.textSecondary,
		fontSize: 13,
		lineHeight: 20,
	},
	cadastrarOngBtn: {
		backgroundColor: colors.brandGreen,
		borderRadius: 8,
		paddingVertical: 13,
		alignItems: 'center',
		marginTop: 14,
		borderBottomWidth: 3,
		borderBottomColor: colors.brandGreenDark,
	},
	cadastrarOngBtnText: {
		color: colors.textLight,
		fontSize: 14,
		fontWeight: '700',
	},

	publicationsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
	publicationsTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
	publicationsCount: { color: colors.textMuted, fontSize: 13 },
	postList: { gap: 12 },
	postCard: {
		backgroundColor: colors.cardBackground, borderRadius: 15, elevation: 3, padding: 16,
		shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
	},
	postHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
	postAvatar: {
		alignItems: 'center', backgroundColor: colors.brandGreenLight, borderRadius: 20,
		height: 40, justifyContent: 'center', marginRight: 10, width: 40,
	},
	postAvatarText: { color: colors.brandGreenDark, fontSize: 13, fontWeight: '700' },
	postAuthor: { flex: 1 },
	postAuthorName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
	postMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
	categoryTag: { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
	requestTag: { backgroundColor: colors.brandGreen },
	categoryText: { color: colors.textLight, fontSize: 11, fontWeight: '700' },
	postTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 },
	postBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
	postImage: { aspectRatio: 4 / 3, borderRadius: 8, marginTop: 10, width: '100%' },
	postLocation: { color: colors.brandGreenDark, fontSize: 12, fontWeight: '600', marginTop: 10 },
	postFooter: {
		borderTopColor: colors.inputBorder, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row',
		justifyContent: 'space-between', marginTop: 14, paddingTop: 12,
	},
	postStat: { color: colors.textMuted, fontSize: 12 },
	emptyState: { alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 15, padding: 26 },
	emptyIcon: {
		alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 25,
		height: 50, justifyContent: 'center', width: 50,
	},
	emptyIconText: { fontSize: 24 },
	emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
	emptyDescription: {
		color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 360, textAlign: 'center',
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
		fontSize: 15,
		fontWeight: '700',
	},

	loginActionBtn: {
		backgroundColor: colors.primary,
		paddingVertical: 13,
		borderRadius: 8,
		width: '100%',
		alignItems: 'center',
		marginTop: 18,
	},
	loginActionText: {
		color: colors.textLight,
		fontSize: 15,
		fontWeight: '700',
	},
	registerActionBtn: {
		borderColor: colors.brandGreen,
		borderWidth: 1.5,
		paddingVertical: 12,
		borderRadius: 8,
		width: '100%',
		alignItems: 'center',
		marginTop: 10,
	},
	registerActionText: {
		color: colors.brandGreenDark,
		fontSize: 15,
		fontWeight: '700',
	},
});