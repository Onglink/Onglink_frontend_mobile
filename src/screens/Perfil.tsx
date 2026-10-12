import React, { useState } from 'react';
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfilePost, RootStackParamList } from '../../App';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

type ProfileDetails = {
	nome: string;
	contato: string;
	telefone: string;
	email: string;
	endereco: string;
};

const INITIAL_PROFILE: ProfileDetails = {
	nome: 'Mariana Costa',
	contato: 'Contato preferencial: WhatsApp',
	telefone: '(15) 99876-5432',
	email: 'mariana.costa@email.com',
	endereco: 'Votorantim, SP',
};

export default function Perfil({ route }: Props) {
	const { width } = useWindowDimensions();
	const isTablet = width > 600;
	const posts = route.params?.posts ?? [];
	const [profile, setProfile] = useState<ProfileDetails>(INITIAL_PROFILE);
	const [draft, setDraft] = useState<ProfileDetails>(INITIAL_PROFILE);
	const [isEditing, setIsEditing] = useState(false);

	const startEditing = () => {
		setDraft(profile);
		setIsEditing(true);
	};

	const cancelEditing = () => {
		setDraft(profile);
		setIsEditing(false);
	};

	const saveProfile = () => {
		const requiredFields: (keyof ProfileDetails)[] = [
			'nome', 'contato', 'telefone', 'email', 'endereco',
		];

		if (requiredFields.some((field) => !draft[field].trim())) {
			Alert.alert('Campos obrigatórios', 'Preencha todos os dados do perfil antes de salvar.');
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
			Alert.alert('E-mail inválido', 'Informe um endereço de e-mail válido.');
			return;
		}

		const savedProfile = {
			nome: draft.nome.trim(),
			contato: draft.contato.trim(),
			telefone: draft.telefone.trim(),
			email: draft.email.trim(),
			endereco: draft.endereco.trim(),
		};
		setProfile(savedProfile);
		setDraft(savedProfile);
		setIsEditing(false);
		Alert.alert('Perfil atualizado', 'Suas informações foram atualizadas.');
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.screen}
		>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
				<View style={[styles.content, isTablet && styles.tabletContent]}>
					<View style={styles.profileCard}>
						<View style={styles.profileHeading}>
							<View style={styles.avatar}>
								<Text style={styles.avatarText}>{getInitials(profile.nome)}</Text>
							</View>
							<View style={styles.profileHeadingText}>
								<Text style={styles.name}>{profile.nome}</Text>
								<Text style={styles.contact}>{profile.contato}</Text>
							</View>
						</View>

						<View style={styles.profileActions}>
							<Text style={styles.sectionEyebrow}>SEU PERFIL</Text>
							{!isEditing && (
								<Pressable
									accessibilityRole="button"
									onPress={startEditing}
									style={styles.editButton}
								>
									<Text style={styles.editButtonText}>Editar</Text>
								</Pressable>
							)}
						</View>

						{isEditing ? (
							<View style={styles.form}>
								<ProfileInput
									label="Nome"
									value={draft.nome}
									onChangeText={(nome) => setDraft((current) => ({ ...current, nome }))}
									autoCapitalize="words"
								/>
								<ProfileInput
									label="Contato"
									value={draft.contato}
									onChangeText={(contato) => setDraft((current) => ({ ...current, contato }))}
								/>
								<ProfileInput
									label="Telefone"
									value={draft.telefone}
									onChangeText={(telefone) => setDraft((current) => ({ ...current, telefone }))}
									keyboardType="phone-pad"
								/>
								<ProfileInput
									label="E-mail"
									value={draft.email}
									onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
									keyboardType="email-address"
									autoCapitalize="none"
								/>
								<ProfileInput
									label="Endereço"
									value={draft.endereco}
									onChangeText={(endereco) => setDraft((current) => ({ ...current, endereco }))}
									autoCapitalize="words"
								/>
								<View style={styles.formActions}>
									<Pressable
										accessibilityRole="button"
										onPress={cancelEditing}
										style={styles.cancelButton}
									>
										<Text style={styles.cancelButtonText}>Cancelar</Text>
									</Pressable>
									<Pressable
										accessibilityRole="button"
										onPress={saveProfile}
										style={styles.saveButton}
									>
										<Text style={styles.saveButtonText}>Salvar alterações</Text>
									</Pressable>
								</View>
							</View>
						) : (
							<View style={styles.details}>
								<ProfileDetail label="Contato" value={profile.contato} />
								<ProfileDetail label="Telefone" value={profile.telefone} />
								<ProfileDetail label="E-mail" value={profile.email} />
								<ProfileDetail label="Endereço" value={profile.endereco} last />
							</View>
						)}
					</View>

					<View style={styles.publicationsHeader}>
						<View>
							<Text style={styles.publicationsTitle}>Minhas publicações</Text>
							<Text style={styles.publicationsCount}>
								{posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
							</Text>
						</View>
					</View>

					{posts.length ? (
						<View style={styles.postList}>
							{posts.map((post) => <PublicationCard key={post.id} post={post} />)}
						</View>
					) : (
						<View style={styles.emptyState}>
							<View style={styles.emptyIcon}><Text style={styles.emptyIconText}>+</Text></View>
							<Text style={styles.emptyTitle}>Nenhuma publicação por aqui</Text>
							<Text style={styles.emptyDescription}>
								Quando você compartilhar algo no feed, suas publicações aparecerão nesta página.
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

function ProfileInput({
	label,
	...inputProps
}: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	keyboardType?: 'default' | 'email-address' | 'phone-pad';
	autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
	return (
		<View style={styles.inputGroup}>
			<Text style={styles.inputLabel}>{label}</Text>
			<TextInput
				{...inputProps}
				style={styles.input}
				placeholderTextColor={colors.textMuted}
				returnKeyType="done"
			/>
		</View>
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
	scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 32 },
	content: { width: '100%', gap: 16 },
	tabletContent: { maxWidth: 700 },
	profileCard: {
		backgroundColor: colors.cardBackground, borderRadius: 15, elevation: 3, padding: 20,
		shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
	},
	profileHeading: {
		alignItems: 'center', borderBottomColor: colors.inputBorder,
		borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingBottom: 18,
	},
	avatar: {
		alignItems: 'center', backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen,
		borderRadius: 34, borderWidth: 2, height: 68, justifyContent: 'center', marginRight: 14, width: 68,
	},
	avatarText: { color: colors.brandGreenDark, fontSize: 20, fontWeight: '700' },
	profileHeadingText: { flex: 1 },
	name: { color: colors.textPrimary, fontSize: 21, fontWeight: '700' },
	contact: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
	profileActions: {
		alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 16,
	},
	sectionEyebrow: { color: colors.brandGreenDark, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
	editButton: {
		alignItems: 'center', borderColor: colors.brandGreen, borderRadius: 8, borderWidth: 1,
		justifyContent: 'center', minHeight: 36, paddingHorizontal: 16,
	},
	editButtonText: { color: colors.brandGreenDark, fontSize: 14, fontWeight: '700' },
	details: { marginTop: 4 },
	detailRow: {
		borderBottomColor: colors.inputBorder, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 11,
	},
	lastDetailRow: { borderBottomWidth: 0, paddingBottom: 2 },
	detailLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
	detailValue: { color: colors.textPrimary, fontSize: 15 },
	form: { marginTop: 12 },
	inputGroup: { marginBottom: 13 },
	inputLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 6 },
	input: {
		backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderRadius: 8, borderWidth: 1,
		color: colors.textPrimary, fontSize: 14, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10,
	},
	formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
	cancelButton: {
		alignItems: 'center', backgroundColor: colors.cardBackground, borderColor: colors.inputBorder,
		borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 46,
	},
	cancelButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
	saveButton: {
		alignItems: 'center', backgroundColor: colors.primary, borderBottomColor: colors.primaryDark,
		borderBottomWidth: 3, borderRadius: 8, flex: 1.4, justifyContent: 'center', minHeight: 46, paddingHorizontal: 8,
	},
	saveButtonText: { color: colors.textLight, fontSize: 14, fontWeight: '700' },
	publicationsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
	publicationsTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '700' },
	publicationsCount: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
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
	emptyState: { alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 15, padding: 30 },
	emptyIcon: {
		alignItems: 'center', backgroundColor: colors.greenHighlight, borderRadius: 25,
		height: 50, justifyContent: 'center', width: 50,
	},
	emptyIconText: { color: colors.brandGreenDark, fontSize: 28, fontWeight: '400' },
	emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 14, textAlign: 'center' },
	emptyDescription: {
		color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 360, textAlign: 'center',
	},
});