import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	useWindowDimensions,
	RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfilePost, RootStackParamList } from '../../App';
import { colors } from '../utils/theme';
import publicacaoService from '../services/publicacaoService';
import { getUsuarioLogado } from '../services/usuarioService';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

type FeedPost = ProfilePost;

export default function Feed({ navigation, route }: Props) {
	const { width } = useWindowDimensions();
	const isTablet = width > 600;
	const usuario = route.params?.usuario || getUsuarioLogado();
	const isOngOrAdmin = usuario?.status === 'ong' || usuario?.status === 'admin';
	const [posts, setPosts] = useState<FeedPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPublishing, setIsPublishing] = useState(false);
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState<'Ação' | 'Pedido'>('Ação');
	const [draft, setDraft] = useState('');
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isComposerVisible, setIsComposerVisible] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const canPublish = title.trim().length > 0 && (draft.trim().length > 0 || selectedImage !== null);
	const scrollViewRef = useRef<ScrollView>(null);

	// Carrega as publicações reais do backend da nuvem
	const loadPosts = useCallback(async () => {
		try {
			const data = await publicacaoService.listarPublicacoes();
			if (Array.isArray(data)) {
				const mapped: FeedPost[] = data.map((item) => {
					const authorName = item.criadoPor?.assignedTo?.nomeFantasia || item.criadoPor?.nome || 'ONG Parceira';
					const itemCategory = (item.categoria === 'Pedido' || item.categoria === 'Ação')
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
						likes: 0,
						comments: 0,
						isLiked: false,
					};
				});
				setPosts(mapped);
			}
		} catch (error) {
			console.log('Erro ao carregar publicações da nuvem:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPosts();
	}, [loadPosts]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadPosts();
		setRefreshing(false);
	}, [loadPosts]);

	const chooseImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsEditing: true,
				quality: 0.8,
			});

			if (!result.canceled) setSelectedImage(result.assets[0].uri);
		} catch {
			Alert.alert('Não foi possível abrir a galeria', 'Tente novamente.');
		}
	};

	const takePhoto = async () => {
		try {
			const permission = await ImagePicker.requestCameraPermissionsAsync();
			if (!permission.granted) {
				Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar uma foto.');
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ['images'],
				allowsEditing: true,
				quality: 0.8,
			});

			if (!result.canceled) setSelectedImage(result.assets[0].uri);
		} catch {
			Alert.alert('Não foi possível abrir a câmera', 'Tente novamente.');
		}
	};

	const toggleLike = (postId: string) => {
		setPosts((currentPosts) => currentPosts.map((post) => (
			post.id === postId ? { ...post, isLiked: !post.isLiked } : post
		)));
	};

	const handleHomePress = () => {
		if (!usuario) {
			// Modo visitante: volta para a tela inicial Home da aplicação
			navigation.navigate('Home');
		} else {
			// Modo logado: rola para o início da tela e atualiza as postagens
			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			loadPosts();
		}
	};

	const handleOpenComposer = () => {
		if (!usuario) {
			Alert.alert(
				'Login Necessário',
				'Você precisa estar conectado em uma conta de ONG para fazer publicações.',
				[
					{ text: 'Cancelar', style: 'cancel' },
					{ text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
				]
			);
			return;
		}

		if (usuario.status === 'user') {
			Alert.alert(
				'Apenas ONGs Podem Publicar',
				'Seu usuário atual possui o perfil "Voluntário/Comum". Para publicar no Feed, é necessário cadastrar sua ONG e aguardar a aprovação da administração.',
				[
					{ text: 'Entendi', style: 'cancel' },
					{
						text: 'Cadastrar ONG',
						onPress: () => navigation.navigate('CadastroCompleto'),
					},
				]
			);
			return;
		}

		setIsComposerVisible(true);
	};

	const handleCloseComposer = () => {
		setIsComposerVisible(false);
		setTitle('');
		setDraft('');
		setSelectedImage(null);
		setCategory('Ação');
	};

	const publishPost = async () => {
		if (!isOngOrAdmin) {
			Alert.alert(
				'Permissão Negada',
				'Apenas contas com status de ONG aprovada ou Administrador podem publicar.'
			);
			setIsComposerVisible(false);
			return;
		}

		const postTitle = title.trim();
		const body = draft.trim();

		if (!postTitle) {
			Alert.alert('Título obrigatório', 'Por favor, informe o título da publicação.');
			return;
		}

		if (!canPublish) return;

		try {
			setIsPublishing(true);

			if (usuario?._id) {
				const formData = new FormData();
				formData.append('titulo', postTitle);
				formData.append('descricao', body || 'Imagem compartilhada');
				formData.append('categoria', category);
				formData.append('criadoPor', usuario._id);

				if (selectedImage) {
					const filename = selectedImage.split('/').pop() || 'foto.jpg';
					const match = /\.(\w+)$/.exec(filename);
					const type = match ? `image/${match[1]}` : 'image/jpeg';
					// @ts-ignore
					formData.append('image', {
						uri: selectedImage,
						name: filename,
						type,
					});
				}

				await publicacaoService.criarPublicacao(formData);
			}

			// Recarrega as publicações diretamente da nuvem
			await loadPosts();
			handleCloseComposer();
		} catch (error: any) {
			console.error('Erro ao publicar:', error);
			Alert.alert('Erro ao publicar', error.message || 'Não foi possível enviar a publicação para o servidor.');
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<View style={styles.screen}>
			<ScrollView
				ref={scrollViewRef}
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
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
					{/* Banner Informativo / Boas-vindas */}
					{usuario ? (
						<View style={styles.userGreetingCard}>
							<View style={styles.userGreetingLeft}>
								<View style={[styles.userAvatar, !isOngOrAdmin && { backgroundColor: colors.brandGreen }]}>
									<Text style={styles.userAvatarText}>
										{(usuario.nome || 'ON').substring(0, 2).toUpperCase()}
									</Text>
								</View>
								<View style={styles.userGreetingTextContainer}>
									<Text style={styles.userGreetingTitle}>
										Olá, {usuario.nome.split(' ')[0]}! 👋
									</Text>
									<Text style={styles.userGreetingSub}>
										{isOngOrAdmin
											? '🏢 ONG Verificada · Permissão para publicar'
											: '🤝 Usuário Comum · Complete o cadastro de ONG para postar'}
									</Text>
								</View>
							</View>
							{isOngOrAdmin ? (
								<TouchableOpacity
									style={styles.newPostQuickButton}
									activeOpacity={0.8}
									onPress={handleOpenComposer}
								>
									<Text style={styles.newPostQuickText}>+ Postar</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									style={[styles.newPostQuickButton, { backgroundColor: colors.primary }]}
									activeOpacity={0.8}
									onPress={() => navigation.navigate('CadastroCompleto')}
								>
									<Text style={styles.newPostQuickText}>Virar ONG</Text>
								</TouchableOpacity>
							)}
						</View>
					) : (
						<View style={styles.visitorCard}>
							<View style={styles.visitorTextContainer}>
								<Text style={styles.visitorTitle}>Modo Visitante 👁️</Text>
								<Text style={styles.visitorSub}>
									Conecte-se para interagir ou retorne à tela inicial.
								</Text>
							</View>
							<View style={styles.visitorButtonsRow}>
								<TouchableOpacity
									style={styles.visitorHomeButton}
									activeOpacity={0.8}
									onPress={() => navigation.navigate('Home')}
								>
									<Text style={styles.visitorHomeButtonText}>← Início</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.visitorLoginButton}
									activeOpacity={0.8}
									onPress={() => navigation.navigate('Login')}
								>
									<Text style={styles.visitorLoginButtonText}>Entrar</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={colors.brandGreenDark} />
							<Text style={styles.loadingText}>Carregando publicações da comunidade...</Text>
						</View>
					) : posts.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyIcon}>📢</Text>
							<Text style={styles.emptyTitle}>Nenhuma publicação encontrada</Text>
							<Text style={styles.emptySub}>
								Ainda não há postagens no feed em nuvem. Puxe a tela para baixo para atualizar!
							</Text>
							{isOngOrAdmin && (
								<TouchableOpacity
									style={styles.emptyButton}
									activeOpacity={0.8}
									onPress={handleOpenComposer}
								>
									<Text style={styles.emptyButtonText}>+ Criar primeira publicação</Text>
								</TouchableOpacity>
							)}
						</View>
					) : (
						<View style={styles.postList}>
							{posts.map((post) => (
								<View key={post.id} style={styles.postCard}>
									<View style={styles.postHeader}>
										<View style={styles.avatar}>
											<Text style={styles.avatarText}>{post.initials}</Text>
										</View>
										<View style={styles.authorInfo}>
											<Text style={styles.authorName}>{post.author}</Text>
											<Text style={styles.postMeta}>{post.description} · {post.time}</Text>
										</View>
										<View style={[styles.categoryTag, post.category === 'Pedido' && styles.requestTag]}>
											<Text style={styles.categoryText}>{post.category}</Text>
										</View>
									</View>

									<Text style={styles.postTitle}>{post.title}</Text>
									<Text style={styles.postBody}>{post.body}</Text>
									{post.imageUri && (
										<Image source={{ uri: post.imageUri }} style={styles.postImage} />
									)}
									<Text style={styles.location}>{post.location}</Text>

									<View style={styles.postActions}>
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={`${post.isLiked ? 'Remover curtida' : 'Curtir'} publicação de ${post.author}`}
											accessibilityState={{ selected: post.isLiked }}
											onPress={() => toggleLike(post.id)}
											style={styles.likeButton}
										>
											<Text style={[styles.likeText, post.isLiked && styles.likedText]}>
												{post.isLiked ? 'Curtido' : 'Curtir'} · {post.likes + Number(post.isLiked)}
											</Text>
										</Pressable>
										<Text style={styles.commentsText}>
											{post.comments} {post.comments === 1 ? 'comentário' : 'comentários'}
										</Text>
									</View>
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>
			<View style={styles.bottomNavigation}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={usuario ? "Início (Atualizar Feed)" : "Voltar para o Início"}
					onPress={handleHomePress}
					style={styles.navigationButton}
				>
					<NavigationIcon name="home" color={colors.brandGreenDark} />
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Criar nova publicação"
					onPress={handleOpenComposer}
					style={styles.createNavigationButton}
				>
					<View style={styles.createIconCircle}>
						<Text style={styles.createIcon}>+</Text>
					</View>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Perfil"
					onPress={() => navigation.navigate('Perfil', {
						posts: posts.filter((post) => post.author === (usuario?.nome || 'Você')),
						usuario: usuario ?? undefined,
					})}
					style={styles.navigationButton}
				>
					<NavigationIcon name="profile" color={colors.brandGreenDark} />
				</Pressable>
			</View>
			<Modal
				visible={isComposerVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setIsComposerVisible(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.modalOverlay}
				>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Fechar criação de publicação"
						onPress={handleCloseComposer}
						style={styles.modalBackdrop}
					/>
					<View style={[styles.composer, isTablet && styles.tabletComposer]}>
						<View style={styles.composerHeader}>
							<Text style={styles.composerTitle}>Nova publicação</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Fechar"
								onPress={handleCloseComposer}
								style={styles.closeButton}
							>
								<Text style={styles.closeButtonText}>×</Text>
							</Pressable>
						</View>

						{/* Seletor de Categoria (Ação vs Pedido) */}
						<View style={styles.categorySelectorContainer}>
							<Text style={styles.inputLabel}>Categoria da publicação</Text>
							<View style={styles.categoryButtonsRow}>
								<TouchableOpacity
									style={[
										styles.categoryChoiceButton,
										category === 'Ação' && styles.categoryChoiceActiveAcao,
									]}
									onPress={() => setCategory('Ação')}
									activeOpacity={0.8}
								>
									<Text
										style={[
											styles.categoryChoiceText,
											category === 'Ação' && styles.categoryChoiceTextActiveAcao,
										]}
									>
										🎯 Ação
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.categoryChoiceButton,
										category === 'Pedido' && styles.categoryChoiceActivePedido,
									]}
									onPress={() => setCategory('Pedido')}
									activeOpacity={0.8}
								>
									<Text
										style={[
											styles.categoryChoiceText,
											category === 'Pedido' && styles.categoryChoiceTextActivePedido,
										]}
									>
										🙏 Pedido
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Campo de Título da Publicação */}
						<TextInput
							accessibilityLabel="Título da publicação"
							style={styles.titleInput}
							value={title}
							onChangeText={setTitle}
							placeholder="Título da publicação *"
							placeholderTextColor={colors.textMuted}
							maxLength={100}
						/>

						{/* Campo de Descrição */}
						<TextInput
							accessibilityLabel="Escreva uma publicação"
							style={styles.input}
							value={draft}
							onChangeText={setDraft}
							placeholder="O que está acontecendo na sua comunidade?"
							placeholderTextColor={colors.textMuted}
							multiline
							maxLength={500}
							textAlignVertical="top"
						/>
						<View style={styles.mediaActions}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Adicionar imagem da galeria"
								onPress={chooseImage}
								style={styles.mediaButton}
							>
								<Text style={styles.mediaButtonText}>Galeria</Text>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Tirar foto com a câmera"
								onPress={takePhoto}
								style={styles.mediaButton}
							>
								<Text style={styles.mediaButtonText}>Câmera</Text>
							</Pressable>
						</View>
						{selectedImage && (
							<View style={styles.imagePreviewContainer}>
								<Image source={{ uri: selectedImage }} style={styles.imagePreview} />
								<Pressable
									accessibilityRole="button"
									accessibilityLabel="Remover imagem da publicação"
									onPress={() => setSelectedImage(null)}
									style={styles.removeImageButton}
								>
									<Text style={styles.removeImageText}>Remover imagem</Text>
								</Pressable>
							</View>
						)}
						<View style={styles.composerFooter}>
							<Text style={styles.characterCount}>{draft.length}/500</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityState={{ disabled: !canPublish || isPublishing }}
								disabled={!canPublish || isPublishing}
								onPress={publishPost}
								style={[styles.publishButton, (!canPublish || isPublishing) && styles.disabledButton]}
							>
								{isPublishing ? (
									<ActivityIndicator size="small" color={colors.textLight} />
								) : (
									<Text style={styles.publishButtonText}>Publicar</Text>
								)}
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
}

function NavigationIcon({ name, color }: { name: 'home' | 'profile'; color: string }) {
	if (name === 'home') {
		return (
			<View style={styles.homeIcon}>
				<View style={[styles.homeRoof, { borderColor: color }]} />
				<View style={[styles.homeBody, { borderColor: color }]}>
					<View style={[styles.homeDoor, { backgroundColor: color }]} />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.profileIcon}>
			<View style={[styles.profileHead, { backgroundColor: color }]} />
			<View style={[styles.profileShoulders, { backgroundColor: color }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		backgroundColor: colors.background,
		flex: 1,
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 20,
		paddingBottom: 28,
	},
	content: {
		width: '100%',
		gap: 14,
	},
	tabletContent: {
		maxWidth: 700,
	},
	composer: {
		backgroundColor: colors.cardBackground,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 16,
		paddingBottom: 28,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 5,
		elevation: 3,
	},
	tabletComposer: {
		alignSelf: 'center',
		maxWidth: 700,
		width: '100%',
	},
	modalOverlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.35)',
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
	},
	composerHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	composerTitle: {
		color: colors.textPrimary,
		fontSize: 16,
		fontWeight: '700',
	},
	closeButton: {
		alignItems: 'center',
		height: 36,
		justifyContent: 'center',
		width: 36,
	},
	closeButtonText: {
		color: colors.textSecondary,
		fontSize: 28,
		lineHeight: 32,
	},
	categorySelectorContainer: {
		marginBottom: 12,
	},
	inputLabel: {
		color: colors.textSecondary,
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 6,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	categoryButtonsRow: {
		flexDirection: 'row',
		gap: 10,
	},
	categoryChoiceButton: {
		flex: 1,
		paddingVertical: 9,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1.5,
		borderColor: '#D0E2E9',
		backgroundColor: '#F8FAFC',
		alignItems: 'center',
		justifyContent: 'center',
	},
	categoryChoiceActiveAcao: {
		borderColor: colors.primary,
		backgroundColor: '#E0F7FA',
	},
	categoryChoiceActivePedido: {
		borderColor: '#E65100',
		backgroundColor: '#FFF3E0',
	},
	categoryChoiceText: {
		fontSize: 13,
		fontWeight: '600',
		color: colors.textSecondary,
	},
	categoryChoiceTextActiveAcao: {
		color: colors.primaryDark,
		fontWeight: 'bold',
	},
	categoryChoiceTextActivePedido: {
		color: '#BF360C',
		fontWeight: 'bold',
	},
	titleInput: {
		backgroundColor: colors.inputBackground,
		borderColor: colors.inputBorder,
		borderRadius: 8,
		borderWidth: 1,
		color: colors.textPrimary,
		fontSize: 14,
		fontWeight: '600',
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginBottom: 10,
	},
	input: {
		backgroundColor: colors.inputBackground,
		borderColor: colors.inputBorder,
		borderRadius: 8,
		borderWidth: 1,
		color: colors.textPrimary,
		fontSize: 14,
		minHeight: 78,
		padding: 12,
	},
	composerFooter: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 12,
	},
	characterCount: {
		color: colors.textMuted,
		fontSize: 12,
	},
	publishButton: {
		alignItems: 'center',
		backgroundColor: colors.primary,
		borderBottomColor: colors.primaryDark,
		borderBottomWidth: 3,
		borderRadius: 8,
		justifyContent: 'center',
		minHeight: 42,
		paddingHorizontal: 20,
	},
	disabledButton: {
		opacity: 0.5,
	},
	publishButtonText: {
		color: colors.textLight,
		fontSize: 14,
		fontWeight: '700',
	},
	postList: {
		gap: 12,
	},
	postCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 15,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 5,
		elevation: 3,
	},
	postHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		marginBottom: 14,
	},
	avatar: {
		alignItems: 'center',
		backgroundColor: colors.brandGreenLight,
		borderRadius: 22,
		height: 44,
		justifyContent: 'center',
		marginRight: 10,
		width: 44,
	},
	avatarText: {
		color: colors.brandGreenDark,
		fontSize: 14,
		fontWeight: '700',
	},
	authorInfo: {
		flex: 1,
	},
	authorName: {
		color: colors.textPrimary,
		fontSize: 14,
		fontWeight: '700',
	},
	postMeta: {
		color: colors.textMuted,
		fontSize: 12,
		marginTop: 2,
	},
	categoryTag: {
		backgroundColor: colors.primary,
		borderRadius: 6,
		paddingHorizontal: 9,
		paddingVertical: 5,
	},
	requestTag: {
		backgroundColor: '#E65100',
	},
	categoryText: {
		color: colors.textLight,
		fontSize: 11,
		fontWeight: '700',
	},
	postTitle: {
		color: colors.textPrimary,
		fontSize: 17,
		fontWeight: '700',
		marginBottom: 6,
	},
	postBody: {
		color: colors.textSecondary,
		fontSize: 14,
		lineHeight: 21,
	},
	location: {
		color: colors.brandGreenDark,
		fontSize: 12,
		fontWeight: '600',
		marginTop: 10,
	},
	postActions: {
		alignItems: 'center',
		borderTopColor: colors.inputBorder,
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 14,
		paddingTop: 12,
	},
	likeButton: {
		minHeight: 32,
		justifyContent: 'center',
		paddingRight: 12,
	},
	likeText: {
		color: colors.textSecondary,
		fontSize: 13,
		fontWeight: '600',
	},
	likedText: {
		color: colors.primary,
	},
	commentsText: {
		color: colors.textMuted,
		fontSize: 12,
	},
	postImage: {
		aspectRatio: 4 / 3,
		borderRadius: 8,
		marginTop: 10,
		width: '100%',
	},
	mediaActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 10,
	},
	mediaButton: {
		alignItems: 'center',
		backgroundColor: colors.inputBackground,
		borderColor: colors.inputBorder,
		borderRadius: 8,
		borderWidth: 1,
		justifyContent: 'center',
		minHeight: 40,
		paddingHorizontal: 14,
	},
	mediaButtonText: {
		color: colors.brandGreenDark,
		fontSize: 13,
		fontWeight: '600',
	},
	imagePreviewContainer: {
		marginTop: 12,
	},
	imagePreview: {
		aspectRatio: 4 / 3,
		borderRadius: 8,
		width: '100%',
	},
	removeImageButton: {
		alignSelf: 'flex-start',
		marginTop: 6,
		minHeight: 32,
		justifyContent: 'center',
	},
	removeImageText: {
		color: colors.error,
		fontSize: 13,
		fontWeight: '600',
	},
	bottomNavigation: {
		backgroundColor: colors.cardBackground,
		borderTopColor: colors.inputBorder,
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		minHeight: 64,
		paddingBottom: 8,
		paddingTop: 6,
	},
	navigationButton: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		minHeight: 50,
	},
	createNavigationButton: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		minHeight: 50,
	},
	createIconCircle: {
		alignItems: 'center',
		backgroundColor: colors.primary,
		borderRadius: 26,
		elevation: 4,
		height: 52,
		justifyContent: 'center',
		width: 52,
	},
	createIcon: {
		color: colors.textLight,
		fontSize: 32,
		fontWeight: '400',
		lineHeight: 36,
		marginTop: -2,
	},
	homeIcon: {
		height: 24,
		position: 'relative',
		width: 24,
	},
	homeRoof: {
		borderLeftWidth: 2,
		borderTopWidth: 2,
		height: 13,
		left: 6,
		position: 'absolute',
		top: 2,
		transform: [{ rotate: '45deg' }],
		width: 13,
	},
	homeBody: {
		borderBottomWidth: 2,
		borderLeftWidth: 2,
		borderRightWidth: 2,
		bottom: 1,
		height: 12,
		left: 5,
		position: 'absolute',
		width: 14,
	},
	homeDoor: {
		bottom: 0,
		height: 7,
		left: 4,
		position: 'absolute',
		width: 3,
	},
	profileIcon: {
		alignItems: 'center',
		height: 24,
		justifyContent: 'flex-end',
		width: 24,
	},
	profileHead: {
		borderRadius: 5,
		height: 9,
		marginBottom: 2,
		width: 9,
	},
	profileShoulders: {
		borderTopLeftRadius: 9,
		borderTopRightRadius: 9,
		height: 10,
		width: 18,
	},
	userGreetingCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 3,
		borderLeftWidth: 4,
		borderLeftColor: colors.primary,
	},
	userGreetingLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		gap: 10,
	},
	userAvatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	userAvatarText: {
		color: colors.textLight,
		fontWeight: 'bold',
		fontSize: 15,
	},
	userGreetingTextContainer: {
		flex: 1,
	},
	userGreetingTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.textPrimary,
	},
	userGreetingSub: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 2,
	},
	newPostQuickButton: {
		backgroundColor: colors.brandGreen,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
	},
	newPostQuickText: {
		color: colors.textLight,
		fontSize: 13,
		fontWeight: 'bold',
	},
	visitorCard: {
		backgroundColor: '#FFFBEA',
		borderColor: '#FFE082',
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	visitorTextContainer: {
		flex: 1,
		marginRight: 10,
	},
	visitorTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#8D6E63',
	},
	visitorSub: {
		fontSize: 12,
		color: '#A1887F',
		marginTop: 2,
	},
	visitorLoginButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	visitorLoginButtonText: {
		color: colors.textLight,
		fontSize: 13,
		fontWeight: 'bold',
	},
	visitorButtonsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	visitorHomeButton: {
		backgroundColor: colors.cardBackground,
		borderWidth: 1,
		borderColor: '#D7CCC8',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
	},
	visitorHomeButtonText: {
		color: '#5D4037',
		fontSize: 13,
		fontWeight: '600',
	},
	loadingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	loadingText: {
		marginTop: 12,
		color: colors.textSecondary,
		fontSize: 14,
	},
	emptyContainer: {
		backgroundColor: colors.cardBackground,
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#E0E0E0',
		marginVertical: 10,
	},
	emptyIcon: {
		fontSize: 40,
		marginBottom: 10,
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.textPrimary,
		marginBottom: 6,
		textAlign: 'center',
	},
	emptySub: {
		fontSize: 13,
		color: colors.textSecondary,
		textAlign: 'center',
		lineHeight: 18,
		marginBottom: 16,
	},
	emptyButton: {
		backgroundColor: colors.brandGreen,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
	},
	emptyButtonText: {
		color: colors.textLight,
		fontSize: 13,
		fontWeight: 'bold',
	},
});
