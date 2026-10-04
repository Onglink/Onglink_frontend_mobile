import React, { useState } from 'react';
import {
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
	View,
	useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

type PostCategory = 'Ação' | 'Pedido';

type FeedPost = {
	id: string;
	author: string;
	description: string;
	initials: string;
	category: PostCategory;
	location: string;
	time: string;
	title: string;
	body: string;
	imageUri: string | null;
	likes: number;
	comments: number;
	isLiked: boolean;
};

const DEMO_POSTS: FeedPost[] = [
	{
		id: 'post-1',
		author: 'Instituto Sementes',
		description: 'Organização social',
		initials: 'IS',
		category: 'Ação',
		location: 'Votorantim, SP',
		time: 'Há 2 horas',
		title: 'Mutirão de horta comunitária',
		body: 'Neste sábado vamos preparar os canteiros do bairro. Toda ajuda e muda de tempero é bem-vinda.',
		imageUri: null,
		likes: 24,
		comments: 6,
		isLiked: false,
	},
	{
		id: 'post-2',
		author: 'Coletivo Patas Unidas',
		description: 'Proteção animal',
		initials: 'PU',
		category: 'Pedido',
		location: 'Sorocaba, SP',
		time: 'Há 5 horas',
		title: 'Precisamos de cobertores',
		body: 'Estamos recebendo animais resgatados esta semana e precisamos de cobertores limpos para acolhimento.',
		imageUri: null,
		likes: 18,
		comments: 4,
		isLiked: false,
	},
	{
		id: 'post-3',
		author: 'Mariana Costa',
		description: 'Voluntária',
		initials: 'MC',
		category: 'Ação',
		location: 'Votorantim, SP',
		time: 'Ontem',
		title: 'Oficina de leitura para crianças',
		body: 'Foi uma tarde cheia de histórias na biblioteca do bairro. Obrigada a todas as pessoas voluntárias!',
		imageUri: null,
		likes: 31,
		comments: 8,
		isLiked: false,
	},
];

export default function Feed({ navigation }: Props) {
	const { width } = useWindowDimensions();
	const isTablet = width > 600;
	const [posts, setPosts] = useState<FeedPost[]>(DEMO_POSTS);
	const [draft, setDraft] = useState('');
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isComposerVisible, setIsComposerVisible] = useState(false);
	const canPublish = draft.trim().length > 0 || selectedImage !== null;

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

	const publishPost = () => {
		const body = draft.trim();
		if (!canPublish) return;

		const newPost: FeedPost = {
			id: `post-${Date.now()}`,
			author: 'Você',
			description: 'Comunidade',
			initials: 'VC',
			category: 'Ação',
			location: 'Onglink',
			time: 'Agora',
			title: 'Nova publicação',
			body: body || 'Imagem compartilhada',
			imageUri: selectedImage,
			likes: 0,
			comments: 0,
			isLiked: false,
		};

		setPosts((currentPosts) => [newPost, ...currentPosts]);
		setDraft('');
		setSelectedImage(null);
		setIsComposerVisible(false);
	};

	return (
		<View style={styles.screen}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={[styles.content, isTablet && styles.tabletContent]}>
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
				</View>
			</ScrollView>
			<View style={styles.bottomNavigation}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Início"
					onPress={() => navigation.navigate('Feed')}
					style={styles.navigationButton}
				>
					<NavigationIcon name="home" color={colors.brandGreenDark} />
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Criar nova publicação"
					onPress={() => setIsComposerVisible(true)}
					style={styles.createNavigationButton}
				>
					<View style={styles.createIconCircle}>
						<Text style={styles.createIcon}>+</Text>
					</View>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Perfil"
					onPress={() => Alert.alert('Perfil indisponível', 'A tela de perfil ainda não está disponível.')}
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
						onPress={() => setIsComposerVisible(false)}
						style={styles.modalBackdrop}
					/>
					<View style={[styles.composer, isTablet && styles.tabletComposer]}>
						<View style={styles.composerHeader}>
							<Text style={styles.composerTitle}>Nova publicação</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Fechar"
								onPress={() => setIsComposerVisible(false)}
								style={styles.closeButton}
							>
								<Text style={styles.closeButtonText}>×</Text>
							</Pressable>
						</View>
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
								accessibilityState={{ disabled: !canPublish }}
								disabled={!canPublish}
								onPress={publishPost}
								style={[styles.publishButton, !canPublish && styles.disabledButton]}
							>
								<Text style={styles.publishButtonText}>Publicar</Text>
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
		backgroundColor: colors.brandGreen,
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
});
