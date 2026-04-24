import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { createUser, getFirstUser, updateUser } from '@/database';
import { getProfileStats, type ProfileStats } from '@/database/repositories/study-session-repository';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { User } from '@/types/study';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PerfilScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [stats, setStats] = useState<ProfileStats>({ totalSessions: 0, totalHours: 0, streakDays: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [existingUser, profileStats] = await Promise.all([
      getFirstUser(db),
      getProfileStats(db),
    ]);
    if (existingUser) {
      setUser(existingUser);
      setName(existingUser.name);
      setNickname(existingUser.nickname);
    }
    setStats(profileStats);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedName) {
      Alert.alert('Nome obrigatório', 'Por favor, informe seu nome completo.');
      return;
    }
    if (!trimmedNickname) {
      Alert.alert('Apelido obrigatório', 'Por favor, informe um apelido.');
      return;
    }

    setSaving(true);
    try {
      if (user) {
        await updateUser(db, user.id, { name: trimmedName, nickname: trimmedNickname });
        setUser({ ...user, name: trimmedName, nickname: trimmedNickname });
      } else {
        const created = await createUser(db, { name: trimmedName, nickname: trimmedNickname });
        setUser(created);
      }
      Alert.alert('Salvo!', 'Suas informações foram atualizadas.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Verifique se o apelido já está em uso.');
    } finally {
      setSaving(false);
    }
  }

  const inputBg = { backgroundColor: colors.cardBackground };
  const inputText = { color: colors.text };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.screenBackground }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ backgroundColor: colors.screenBackground }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>suas informações</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.cardFilledBackground }]}>
            <Text style={[styles.avatarInitial, { color: colors.cardFilledText }]}>
              {name.trim() ? name.trim()[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={[styles.avatarLabel, { color: colors.subtext }]}>
            {nickname.trim() ? `@${nickname.trim()}` : '—'}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <StatItem value={String(stats.totalSessions)} label="Sessões" />
          <View style={[styles.statsDivider, { backgroundColor: colors.separator }]} />
          <StatItem value={`${stats.totalHours}h`} label="Horas totais" />
          <View style={[styles.statsDivider, { backgroundColor: colors.separator }]} />
          <StatItem value={`${stats.streakDays} dias`} label="Sequência" />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>NOME COMPLETO</Text>
            <TextInput
              style={[styles.input, inputBg, inputText, { borderColor: colors.separator }]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.subtext}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>APELIDO</Text>
            <View style={[styles.nicknameWrapper, inputBg, { borderColor: colors.separator }]}>
              <Text style={[styles.atPrefix, { color: colors.subtext }]}>@</Text>
              <TextInput
                style={[styles.nicknameInput, inputText]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="seu_apelido"
                placeholderTextColor={colors.subtext}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.cardFilledBackground }, saving && styles.disabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.cardFilledText} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.cardFilledText }]}>
              Salvar alterações
            </Text>
          )}
        </TouchableOpacity>

        {/* Back link */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            ← Voltar para tela inicial
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
  },
  avatarLabel: {
    fontSize: 13,
  },
  statsCard: {
    borderRadius: 14,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statsDivider: {
    width: 1,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  form: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  nicknameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  atPrefix: {
    fontSize: 16,
    marginRight: 4,
  },
  nicknameInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  backButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
