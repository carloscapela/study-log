import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import {
  createSubject,
  deleteSubject,
  updateSubject,
} from '@/database/repositories/subject-repository';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Subject } from '@/types/study';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ItemMode = 'idle' | 'confirm-delete' | 'editing';

export default function MateriasScreen() {
  const db = useSQLiteContext();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newName, setNewName] = useState('');
  const [modes, setModes] = useState<Record<number, ItemMode>>({});
  const [editValues, setEditValues] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const rows = await db.getAllAsync<{
      id: number;
      name: string;
      icon_letter: string;
      created_at: string;
    }>('SELECT * FROM subjects ORDER BY id');
    setSubjects(
      rows.map(r => ({
        id: r.id,
        name: r.name,
        iconLetter: r.icon_letter,
        createdAt: r.created_at,
      }))
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function setMode(id: number, mode: ItemMode | null) {
    setModes(prev => {
      const next = { ...prev };
      if (mode === null) delete next[id];
      else next[id] = mode;
      return next;
    });
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    await createSubject(db, { name, iconLetter: name[0].toUpperCase() });
    setNewName('');
    load();
  }

  async function handleConfirmDelete(id: number) {
    await deleteSubject(db, id);
    setMode(id, null);
    load();
  }

  async function handleSaveEdit(id: number) {
    const name = (editValues[id] ?? '').trim();
    if (!name) return;
    await updateSubject(db, id, { name, iconLetter: name[0].toUpperCase() });
    setMode(id, null);
    load();
  }

  const canAdd = newName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.screenBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            paddingTop: insets.top + Spacing.md,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Matérias</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {subjects.length} cadastrada{subjects.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.addSection}>
            <Text style={[styles.sectionLabel, { color: colors.subtext }]}>NOVA MATÉRIA</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[
                  styles.addInput,
                  { backgroundColor: colors.cardBackground, color: colors.text },
                ]}
                placeholder="ex: Química"
                placeholderTextColor={colors.subtext}
                value={newName}
                onChangeText={setNewName}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  canAdd
                    ? { backgroundColor: colors.cardFilledBackground }
                    : {
                        backgroundColor: colors.cardBackground,
                        borderWidth: 1,
                        borderColor: colors.separator,
                      },
                ]}
                onPress={handleAdd}
                disabled={!canAdd}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.addBtnText,
                    { color: canAdd ? colors.cardFilledText : colors.subtext },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const mode = modes[item.id] ?? 'idle';
          const num = String(index + 1).padStart(2, '0');

          if (mode === 'confirm-delete') {
            return (
              <View style={[styles.itemCard, styles.deleteCard]}>
                <Text style={styles.deleteLabel} numberOfLines={1}>
                  Excluir "{item.name}"?
                </Text>
                <View style={styles.deleteActions}>
                  <TouchableOpacity
                    style={styles.deleteConfirmBtn}
                    onPress={() => handleConfirmDelete(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteConfirmText}>Excluir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.separator }]}
                    onPress={() => setMode(item.id, null)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          if (mode === 'editing') {
            return (
              <View
                style={[styles.itemCard, styles.editCard, { backgroundColor: colors.cardBackground }]}
              >
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.separator }]}
                  value={editValues[item.id] ?? item.name}
                  onChangeText={val =>
                    setEditValues(prev => ({ ...prev, [item.id]: val }))
                  }
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => handleSaveEdit(item.id)}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.cardFilledBackground }]}
                  onPress={() => handleSaveEdit(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.saveBtnText, { color: colors.cardFilledText }]}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { borderColor: colors.separator }]}
                  onPress={() => setMode(item.id, null)}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={16} color={colors.subtext} />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View style={[styles.itemCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.numBadge, { backgroundColor: colors.badgeBackground }]}>
                <Text style={[styles.numText, { color: colors.subtext }]}>{num}</Text>
              </View>
              <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: colors.separator }]}
                onPress={() => {
                  setEditValues(prev => ({ ...prev, [item.id]: item.name }));
                  setMode(item.id, 'editing');
                }}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={14} color={colors.subtext} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: colors.separator }]}
                onPress={() => setMode(item.id, 'confirm-delete')}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  addSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  separator: {
    height: Spacing.sm,
  },
  itemCard: {
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  numBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCard: {
    backgroundColor: '#FFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteConfirmBtn: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  cancelText: {
    fontWeight: '600',
    fontSize: 14,
  },
  editCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 15,
  },
  saveBtn: {
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
