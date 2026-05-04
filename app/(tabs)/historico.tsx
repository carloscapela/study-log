import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import {
  getAllSessionsWithSubject,
  deleteStudySession,
} from '@/database/repositories/study-session-repository';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatMinutes } from '@/hooks/use-dashboard';
import type { StudySessionWithSubject } from '@/types/study';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Filter = 'all' | 'today' | 'yesterday' | 'week';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatSessionDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (isSameDay(date, now)) return `hoje, ${time}`;
  if (isSameDay(date, yesterday)) return `ontem, ${time}`;

  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${day} ${month}, ${time}`;
}

function applyFilter(sessions: StudySessionWithSubject[], filter: Filter): StudySessionWithSubject[] {
  if (filter === 'all') return sessions;

  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;

  return sessions.filter(s => {
    const t = new Date(s.startedAt).getTime();
    if (filter === 'today') return t >= todayStart;
    if (filter === 'yesterday') return t >= yesterdayStart && t < todayStart;
    if (filter === 'week') return t >= weekStart;
    return true;
  });
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'week', label: 'Esta semana' },
];

export default function HistoricoScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<StudySessionWithSubject[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const rows = await getAllSessionsWithSubject(db);
    setSessions(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllSessionsWithSubject(db).then(rows => {
        if (active) setSessions(rows);
      });
      return () => { active = false; };
    }, [db])
  );

  async function handleConfirmDelete() {
    if (pendingDeleteId === null) return;
    setDeleting(true);
    await deleteStudySession(db, pendingDeleteId);
    setPendingDeleteId(null);
    setDeleting(false);
    load();
  }

  const filtered = useMemo(() => {
    let result = applyFilter(sessions, filter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        s =>
          s.subjectName.toLowerCase().includes(q) ||
          (s.notes ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, filter, search]);

  const totalMinutes = useMemo(
    () => filtered.reduce((acc, s) => acc + s.durationMinutes, 0),
    [filtered]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBackground }]}>
      {/* Header */}
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
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Histórico</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>sessões de estudo</Text>
          </View>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.cardFilledBackground }]}
            onPress={() => router.push('/iniciar-estudo')}
            activeOpacity={0.8}
          >
            <Text style={[styles.startBtnText, { color: colors.cardFilledText }]}>+ Iniciar Estudo</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.screenBackground, borderColor: colors.separator },
          ]}
        >
          <Text style={[styles.searchIcon, { color: colors.subtext }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar matéria ou assunto..."
            placeholderTextColor={colors.subtext}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter chips */}
        <View style={styles.chips}>
          {FILTER_LABELS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: colors.cardFilledBackground }
                    : { backgroundColor: colors.badgeBackground },
                ]}
                onPress={() => setFilter(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.cardFilledText : colors.subtext },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Summary bar */}
      <View style={[styles.summary, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.summaryCount, { color: colors.subtext }]}>
          {filtered.length} {filtered.length === 1 ? 'sessão' : 'sessões'}
        </Text>
        <Text style={[styles.summaryTotal, { color: colors.text }]}>
          Total: {formatMinutes(totalMinutes)}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {search || filter !== 'all'
                ? 'Nenhuma sessão encontrada.'
                : 'Nenhuma sessão registrada ainda.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionItem
            item={item}
            colors={colors}
            onDelete={() => setPendingDeleteId(item.id)}
          />
        )}
      />

      {/* Delete confirmation modal */}
      <Modal
        visible={pendingDeleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Excluir sessão?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
              Essa ação não pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { borderColor: colors.separator }]}
                onPress={() => setPendingDeleteId(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnDelete, deleting && styles.disabled]}
                onPress={handleConfirmDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnDeleteText}>
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SessionItem({
  item,
  colors,
  onDelete,
}: {
  item: StudySessionWithSubject;
  colors: (typeof Colors)['light'];
  onDelete: () => void;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconBadge, { backgroundColor: colors.badgeBackground }]}>
        <Text style={[styles.iconLetter, { color: colors.text }]}>
          {item.subjectIconLetter.charAt(0)}
        </Text>
      </View>

      <View style={styles.itemBody}>
        <Text style={[styles.itemSubject, { color: colors.text }]} numberOfLines={1}>
          {item.subjectName}
        </Text>
        {item.notes ? (
          <Text style={[styles.itemNotes, { color: colors.subtext }]} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.itemRight}>
        <Text style={[styles.itemDuration, { color: colors.text }]}>
          {formatMinutes(item.durationMinutes)}
        </Text>
        <Text style={[styles.itemDate, { color: colors.subtext }]}>
          {formatSessionDate(item.startedAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.deleteBtn, { borderColor: '#E74C3C' }]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  startBtn: {
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    gap: Spacing.xs,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryCount: {
    fontSize: 13,
  },
  summaryTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemSubject: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 13,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  itemDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 12,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalBtnCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnDelete: {
    flex: 1,
    backgroundColor: '#E74C3C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
});
