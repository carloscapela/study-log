import { Spacing } from "@/constants/spacing";
import { Colors } from "@/constants/theme";
import {
  createGoal,
  deleteGoal,
  getAllGoals,
  setGoalStatus,
  updateGoal,
  type GoalStatus,
  type StudyGoal,
} from "@/database/repositories/study-goal-repository";
import { getTodayTotalMinutes } from "@/database/repositories/study-session-repository";
import { getFirstUser } from "@/database/repositories/user-repository";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatMinutes } from "@/hooks/use-dashboard";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── helpers ────────────────────────────────────────────────────────────────

function minutesToSliderValue(minutes: number): number {
    return Math.round((minutes - 15) / 15);
}
function sliderValueToMinutes(value: number): number {
    return 15 + value * 15;
}
const SLIDER_MAX = minutesToSliderValue(480); // 8h = 31 steps

function formatDailyTarget(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min/dia`;
    if (m === 0) return `${h}h/dia`;
    return `${h}h ${m}min/dia`;
}

const STATUS_LABELS: Record<GoalStatus, string> = {
    active: "Ativo",
    paused: "Pausado",
    completed: "Concluído",
};

const STATUS_COLORS: Record<GoalStatus, string> = {
    active: "#27AE60",
    paused: "#E67E22",
    completed: "#2980B9",
};

// ─── circular progress ───────────────────────────────────────────────────────

function CircularProgress({
    ratio,
    size = 140,
}: {
    ratio: number;
    size?: number;
}) {
    const clipped = Math.min(Math.max(ratio, 0), 1);
    const deg = clipped * 360;
    const half = size / 2;
    const thickness = size * 0.09;
    const inner = size - thickness * 2;

    // Two-half-circle rotation technique
    const leftDeg = deg > 180 ? 180 : deg;
    const rightDeg = deg > 180 ? deg - 180 : 0;

    return (
        <View
            style={{
                width: size,
                height: size,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Track */}
            <View
                style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    borderRadius: half,
                    borderWidth: thickness,
                    borderColor: "#E5E5EA",
                }}
            />
            {/* Right half (0–180°) */}
            <View
                style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    borderRadius: half,
                    overflow: "hidden",
                }}
            >
                <View
                    style={{
                        position: "absolute",
                        width: half,
                        height: size,
                        left: half,
                        overflow: "hidden",
                    }}
                >
                    <View
                        style={{
                            position: "absolute",
                            width: size,
                            height: size,
                            borderRadius: half,
                            borderWidth: thickness,
                            borderColor: "#11181C",
                            right: 0,
                            transform: [{ rotate: `${rightDeg}deg` }],
                        }}
                    />
                </View>
            </View>
            {/* Left half (180–360°) */}
            <View
                style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    borderRadius: half,
                    overflow: "hidden",
                }}
            >
                <View
                    style={{
                        position: "absolute",
                        width: half,
                        height: size,
                        left: 0,
                        overflow: "hidden",
                    }}
                >
                    <View
                        style={{
                            position: "absolute",
                            width: size,
                            height: size,
                            borderRadius: half,
                            borderWidth: thickness,
                            borderColor: "#11181C",
                            left: 0,
                            transform: [{ rotate: `${leftDeg - 180}deg` }],
                        }}
                    />
                </View>
            </View>
            {/* Inner circle to create ring */}
            <View
                style={{
                    position: "absolute",
                    width: inner,
                    height: inner,
                    borderRadius: inner / 2,
                    backgroundColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text
                    style={{
                        fontSize: size * 0.22,
                        fontWeight: "700",
                        color: "#11181C",
                    }}
                >
                    {Math.round(clipped * 100)}%
                </Text>
                <Text
                    style={{
                        fontSize: size * 0.1,
                        color: "#8E8E93",
                        marginTop: 2,
                    }}
                >
                    de hoje
                </Text>
            </View>
        </View>
    );
}

// ─── goal form (create / edit) ───────────────────────────────────────────────

interface GoalFormProps {
    initial?: StudyGoal;
    onSave: (data: {
        contestName: string;
        dailyMinutes: number;
        status: GoalStatus;
    }) => Promise<void>;
    onClose: () => void;
    colors: (typeof Colors)["light"];
    saving: boolean;
}

function GoalForm({ initial, onSave, onClose, colors, saving }: GoalFormProps) {
    const [name, setName] = useState(initial?.contestName ?? "");
    const [sliderVal, setSliderVal] = useState(
        minutesToSliderValue(initial?.dailyMinutes ?? 120),
    );
    const [status, setStatus] = useState<GoalStatus>(
        initial?.status ?? "active",
    );

    const minutes = sliderValueToMinutes(sliderVal);
    const isEdit = !!initial;

    const STATUSES: GoalStatus[] = ["active", "paused", "completed"];

    function nudge(delta: number) {
        setSliderVal((v) => Math.min(SLIDER_MAX, Math.max(0, v + delta)));
    }

    return (
        <View
            style={[
                formStyles.sheet,
                { backgroundColor: colors.cardBackground },
            ]}
        >
            <View
                style={[
                    formStyles.handle,
                    { backgroundColor: colors.separator },
                ]}
            />

            <View style={formStyles.titleRow}>
                <Text style={[formStyles.title, { color: colors.text }]}>
                    {isEdit ? "Editar Meta" : "Nova Meta"}
                </Text>
                <TouchableOpacity
                    onPress={onClose}
                    style={formStyles.closeBtn}
                    activeOpacity={0.7}
                >
                    <Feather name="x" size={20} color={colors.subtext} />
                </TouchableOpacity>
            </View>

            <Text style={[formStyles.label, { color: colors.subtext }]}>
                NOME DO CONCURSO
            </Text>
            <TextInput
                style={[
                    formStyles.input,
                    {
                        color: colors.text,
                        borderColor: colors.separator,
                        backgroundColor: colors.screenBackground,
                    },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="ex: ENEM 2025"
                placeholderTextColor={colors.subtext}
                autoCapitalize="characters"
                returnKeyType="done"
            />

            <View style={formStyles.sliderLabelRow}>
                <Text style={[formStyles.label, { color: colors.subtext }]}>
                    META DIÁRIA
                </Text>
                <Text style={[formStyles.sliderValue, { color: colors.text }]}>
                    {formatMinutes(minutes)}
                </Text>
            </View>

            {/* Slider substitute: tap-able track with – + buttons */}
            <View style={formStyles.sliderRow}>
                <Text
                    style={[formStyles.sliderBound, { color: colors.subtext }]}
                >
                    15min
                </Text>
                <TouchableOpacity
                    style={[
                        formStyles.nudgeBtn,
                        { borderColor: colors.separator },
                    ]}
                    onPress={() => nudge(-1)}
                    activeOpacity={0.7}
                >
                    <Text style={[formStyles.nudgeTxt, { color: colors.text }]}>
                        −
                    </Text>
                </TouchableOpacity>
                <View
                    style={[
                        formStyles.track,
                        { backgroundColor: colors.badgeBackground },
                    ]}
                >
                    <View
                        style={[
                            formStyles.fill,
                            {
                                backgroundColor: colors.cardFilledBackground,
                                width: `${(sliderVal / SLIDER_MAX) * 100}%`,
                            },
                        ]}
                    />
                </View>
                <TouchableOpacity
                    style={[
                        formStyles.nudgeBtn,
                        { borderColor: colors.separator },
                    ]}
                    onPress={() => nudge(1)}
                    activeOpacity={0.7}
                >
                    <Text style={[formStyles.nudgeTxt, { color: colors.text }]}>
                        +
                    </Text>
                </TouchableOpacity>
                <Text
                    style={[formStyles.sliderBound, { color: colors.subtext }]}
                >
                    8h
                </Text>
            </View>

            {isEdit && (
                <>
                    <Text style={[formStyles.label, { color: colors.subtext }]}>
                        STATUS
                    </Text>
                    <View style={formStyles.statusRow}>
                        {STATUSES.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    formStyles.statusChip,
                                    status === s
                                        ? {
                                              backgroundColor:
                                                  colors.cardFilledBackground,
                                          }
                                        : {
                                              backgroundColor:
                                                  colors.badgeBackground,
                                          },
                                ]}
                                onPress={() => setStatus(s)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        formStyles.statusChipText,
                                        {
                                            color:
                                                status === s
                                                    ? colors.cardFilledText
                                                    : colors.subtext,
                                        },
                                    ]}
                                >
                                    {STATUS_LABELS[s]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            <TouchableOpacity
                style={[
                    formStyles.saveBtn,
                    { backgroundColor: colors.cardFilledBackground },
                    saving && formStyles.disabled,
                ]}
                onPress={() =>
                    onSave({
                        contestName: name.trim(),
                        dailyMinutes: minutes,
                        status,
                    })
                }
                disabled={saving || !name.trim()}
                activeOpacity={0.8}
            >
                <Text
                    style={[
                        formStyles.saveBtnText,
                        { color: colors.cardFilledText },
                    ]}
                >
                    {saving
                        ? "Salvando..."
                        : isEdit
                          ? "Salvar alterações"
                          : "Criar meta"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const formStyles = StyleSheet.create({
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: Spacing.xs,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
    },
    closeBtn: {
        padding: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        fontSize: 16,
    },
    sliderLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sliderValue: {
        fontSize: 15,
        fontWeight: "700",
    },
    sliderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    sliderBound: {
        fontSize: 11,
        width: 30,
        textAlign: "center",
    },
    nudgeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    nudgeTxt: {
        fontSize: 18,
        lineHeight: 22,
    },
    track: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
    },
    fill: {
        height: 6,
        borderRadius: 3,
    },
    statusRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    statusChip: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    statusChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    saveBtn: {
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: Spacing.xs,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: "700",
    },
    disabled: {
        opacity: 0.5,
    },
});

// ─── goal card ───────────────────────────────────────────────────────────────

interface GoalCardProps {
    goal: StudyGoal;
    todayMinutes: number;
    colors: (typeof Colors)["light"];
    onProgress: () => void;
    onEdit: () => void;
    onTogglePause: () => void;
    onDelete: () => void;
}

function GoalCard({
    goal,
    todayMinutes,
    colors,
    onProgress,
    onEdit,
    onTogglePause,
    onDelete,
}: GoalCardProps) {
    const ratio = Math.min(todayMinutes / goal.dailyMinutes, 1);
    const pct = Math.round(ratio * 100);

    return (
        <View
            style={[
                cardStyles.card,
                { backgroundColor: colors.cardBackground },
            ]}
        >
            <View style={cardStyles.topRow}>
                <View style={cardStyles.nameBlock}>
                    <Text
                        style={[cardStyles.name, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {goal.contestName}
                    </Text>
                    <View style={cardStyles.badgeRow}>
                        <View
                            style={[
                                cardStyles.badge,
                                {
                                    backgroundColor:
                                        STATUS_COLORS[goal.status] + "22",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    cardStyles.badgeText,
                                    { color: STATUS_COLORS[goal.status] },
                                ]}
                            >
                                {STATUS_LABELS[goal.status]}
                            </Text>
                        </View>
                        <Text
                            style={[
                                cardStyles.daily,
                                { color: colors.subtext },
                            ]}
                        >
                            {formatDailyTarget(goal.dailyMinutes)}
                        </Text>
                    </View>
                </View>

                <View style={cardStyles.actions}>
                    <ActionBtn
                        icon="target"
                        color={colors.subtext}
                        borderColor={colors.separator}
                        onPress={onProgress}
                    />
                    <ActionBtn
                        icon="edit-2"
                        color={colors.subtext}
                        borderColor={colors.separator}
                        onPress={onEdit}
                    />
                    <ActionBtn
                        icon={goal.status === "active" ? "pause" : "play"}
                        color={colors.subtext}
                        borderColor={colors.separator}
                        onPress={onTogglePause}
                    />
                    <ActionBtn
                        icon="x"
                        color="#E74C3C"
                        borderColor="#E74C3C"
                        onPress={onDelete}
                    />
                </View>
            </View>

            <View style={cardStyles.progressSection}>
                <View style={cardStyles.progressLabelRow}>
                    <Text
                        style={[
                            cardStyles.progressLabel,
                            { color: colors.subtext },
                        ]}
                    >
                        Progresso de hoje
                    </Text>
                    <Text
                        style={[cardStyles.progressPct, { color: colors.text }]}
                    >
                        {pct}%
                    </Text>
                </View>
                <View
                    style={[
                        cardStyles.track,
                        { backgroundColor: colors.badgeBackground },
                    ]}
                >
                    <View
                        style={[
                            cardStyles.fill,
                            {
                                width: `${pct}%`,
                                backgroundColor: colors.cardFilledBackground,
                            },
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

function ActionBtn({
    icon,
    color,
    borderColor,
    onPress,
}: {
    icon: React.ComponentProps<typeof Feather>["name"];
    color: string;
    borderColor: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[cardStyles.actionBtn, { borderColor }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Feather name={icon} size={13} color={color} />
        </TouchableOpacity>
    );
}

const cardStyles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
    },
    nameBlock: {
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    badge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    daily: {
        fontSize: 13,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.xs,
        flexShrink: 0,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    progressSection: {
        gap: 6,
    },
    progressLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressLabel: {
        fontSize: 12,
    },
    progressPct: {
        fontSize: 12,
        fontWeight: "600",
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
    },
    fill: {
        height: 6,
        borderRadius: 3,
    },
});

// ─── main screen ─────────────────────────────────────────────────────────────

type Sheet = "create" | "edit" | "progress" | "delete" | null;

export default function MetasScreen() {
    const db = useSQLiteContext();
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];
    const insets = useSafeAreaInsets();

    const [goals, setGoals] = useState<StudyGoal[]>([]);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [userId, setUserId] = useState<number | null>(null);
    const [sheet, setSheet] = useState<Sheet>(null);
    const [selected, setSelected] = useState<StudyGoal | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        const [allGoals, mins, user] = await Promise.all([
            getAllGoals(db),
            getTodayTotalMinutes(db),
            getFirstUser(db),
        ]);
        setGoals(allGoals);
        setTodayMinutes(mins);
        if (user) setUserId(user.id);
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            load().then(() => {
                if (!active) return;
            });
            return () => {
                active = false;
            };
        }, [load]),
    );

    function openProgress(goal: StudyGoal) {
        setSelected(goal);
        setSheet("progress");
    }
    function openEdit(goal: StudyGoal) {
        setSelected(goal);
        setSheet("edit");
    }
    function openDelete(goal: StudyGoal) {
        setSelected(goal);
        setSheet("delete");
    }
    function closeSheet() {
        setSheet(null);
        setSelected(null);
    }

    async function handleCreate(data: {
        contestName: string;
        dailyMinutes: number;
        status: GoalStatus;
    }) {
        if (!userId) return;
        setSaving(true);
        await createGoal(db, {
            userId,
            contestName: data.contestName,
            dailyMinutes: data.dailyMinutes,
        });
        setSaving(false);
        closeSheet();
        load();
    }

    async function handleEdit(data: {
        contestName: string;
        dailyMinutes: number;
        status: GoalStatus;
    }) {
        if (!selected) return;
        setSaving(true);
        await updateGoal(db, selected.id, {
            contestName: data.contestName,
            dailyMinutes: data.dailyMinutes,
            status: data.status,
        });
        setSaving(false);
        closeSheet();
        load();
    }

    async function handleTogglePause(goal: StudyGoal) {
        const next: GoalStatus = goal.status === "active" ? "paused" : "active";
        await setGoalStatus(db, goal.id, next);
        load();
    }

    async function handleDelete() {
        if (!selected) return;
        setSaving(true);
        await deleteGoal(db, selected.id);
        setSaving(false);
        closeSheet();
        load();
    }

    const active = goals.filter((g) => g.status === "active");
    const paused = goals.filter((g) => g.status === "paused");
    const completed = goals.filter((g) => g.status === "completed");

    type Section = { title: string; data: StudyGoal[] };
    const sections: Section[] = [
        { title: "ATIVAS", data: active },
        { title: "PAUSADAS", data: paused },
        { title: "CONCLUÍDAS", data: completed },
    ].filter((s) => s.data.length > 0);

    const progressGoal = selected && sheet === "progress" ? selected : null;
    const progressRatio = progressGoal
        ? Math.min(todayMinutes / progressGoal.dailyMinutes, 1)
        : 0;

    return (
        <View
            style={[
                styles.screen,
                { backgroundColor: colors.screenBackground },
            ]}
        >
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
                        <Text
                            style={[
                                styles.headerSub,
                                { color: colors.subtext },
                            ]}
                        >
                            {goals.length}{" "}
                            {goals.length === 1
                                ? "meta cadastrada"
                                : "metas cadastradas"}
                        </Text>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Metas
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.newBtn,
                            { backgroundColor: colors.cardFilledBackground },
                        ]}
                        onPress={() => setSheet("create")}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.newBtnText,
                                { color: colors.cardFilledText },
                            ]}
                        >
                            + Nova meta
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={sections}
                keyExtractor={(s) => s.title}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + Spacing.xl },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text
                            style={[
                                styles.emptyText,
                                { color: colors.subtext },
                            ]}
                        >
                            Nenhuma meta cadastrada ainda.
                        </Text>
                    </View>
                }
                renderItem={({ item: section }) => (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    { color: colors.subtext },
                                ]}
                            >
                                {section.title}
                            </Text>
                            <Text
                                style={[
                                    styles.sectionCount,
                                    { color: colors.subtext },
                                ]}
                            >
                                {section.data.length}
                            </Text>
                        </View>
                        <View style={styles.cards}>
                            {section.data.map((goal) => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    todayMinutes={todayMinutes}
                                    colors={colors}
                                    onProgress={() => openProgress(goal)}
                                    onEdit={() => openEdit(goal)}
                                    onTogglePause={() =>
                                        handleTogglePause(goal)
                                    }
                                    onDelete={() => openDelete(goal)}
                                />
                            ))}
                        </View>
                    </View>
                )}
            />

            {/* Create / Edit bottom sheet */}
            <Modal
                visible={sheet === "create" || sheet === "edit"}
                transparent
                animationType="slide"
                onRequestClose={closeSheet}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <TouchableOpacity
                        style={styles.sheetOverlay}
                        onPress={closeSheet}
                        activeOpacity={1}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.sheetInner}
                        >
                            <GoalForm
                                initial={
                                    sheet === "edit"
                                        ? (selected ?? undefined)
                                        : undefined
                                }
                                onSave={
                                    sheet === "edit" ? handleEdit : handleCreate
                                }
                                onClose={closeSheet}
                                colors={colors}
                                saving={saving}
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Progress modal */}
            <Modal
                visible={sheet === "progress"}
                transparent
                animationType="slide"
                onRequestClose={closeSheet}
            >
                <TouchableOpacity
                    style={styles.sheetOverlay}
                    onPress={closeSheet}
                    activeOpacity={1}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.sheetInner}
                    >
                        <View
                            style={[
                                styles.progressSheet,
                                { backgroundColor: colors.cardBackground },
                            ]}
                        >
                            <View
                                style={[
                                    formStyles.handle,
                                    { backgroundColor: colors.separator },
                                ]}
                            />
                            <View style={formStyles.titleRow}>
                                <Text
                                    style={[
                                        formStyles.title,
                                        { color: colors.text },
                                    ]}
                                >
                                    Progresso
                                </Text>
                                <TouchableOpacity
                                    onPress={closeSheet}
                                    style={formStyles.closeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Feather
                                        name="x"
                                        size={20}
                                        color={colors.subtext}
                                    />
                                </TouchableOpacity>
                            </View>
                            {progressGoal && (
                                <>
                                    <Text
                                        style={[
                                            styles.progressGoalName,
                                            { color: colors.text },
                                        ]}
                                    >
                                        {progressGoal.contestName}
                                    </Text>
                                    <View style={styles.circleWrapper}>
                                        <CircularProgress
                                            ratio={progressRatio}
                                            size={140}
                                        />
                                    </View>
                                    <View
                                        style={[
                                            styles.statsRow,
                                            { borderColor: colors.separator },
                                        ]}
                                    >
                                        <View style={styles.statItem}>
                                            <Text
                                                style={[
                                                    styles.statValue,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {formatMinutes(
                                                    progressGoal.dailyMinutes,
                                                )}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.statLabel,
                                                    { color: colors.subtext },
                                                ]}
                                            >
                                                Meta diária
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statDivider,
                                                {
                                                    backgroundColor:
                                                        colors.separator,
                                                },
                                            ]}
                                        />
                                        <View style={styles.statItem}>
                                            <Text
                                                style={[
                                                    styles.statValue,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {formatMinutes(todayMinutes)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.statLabel,
                                                    { color: colors.subtext },
                                                ]}
                                            >
                                                Estudado hoje
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statDivider,
                                                {
                                                    backgroundColor:
                                                        colors.separator,
                                                },
                                            ]}
                                        />
                                        <View style={styles.statItem}>
                                            <Text
                                                style={[
                                                    styles.statValue,
                                                    {
                                                        color: STATUS_COLORS[
                                                            progressGoal.status
                                                        ],
                                                    },
                                                ]}
                                            >
                                                {
                                                    STATUS_LABELS[
                                                        progressGoal.status
                                                    ]
                                                }
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.statLabel,
                                                    { color: colors.subtext },
                                                ]}
                                            >
                                                Status
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.closeFullBtn,
                                            {
                                                backgroundColor:
                                                    colors.badgeBackground,
                                            },
                                        ]}
                                        onPress={closeSheet}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.closeFullBtnText,
                                                { color: colors.text },
                                            ]}
                                        >
                                            Fechar
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Delete confirmation */}
            <Modal
                visible={sheet === "delete"}
                transparent
                animationType="fade"
                onRequestClose={closeSheet}
            >
                <View style={styles.deleteOverlay}>
                    <View
                        style={[
                            styles.deleteCard,
                            { backgroundColor: colors.cardBackground },
                        ]}
                    >
                        <Text
                            style={[styles.deleteTitle, { color: colors.text }]}
                        >
                            Excluir meta?
                        </Text>
                        <Text
                            style={[
                                styles.deleteSubtitle,
                                { color: colors.subtext },
                            ]}
                        >
                            Essa ação não pode ser desfeita.
                        </Text>
                        <View style={styles.deleteActions}>
                            <TouchableOpacity
                                style={[
                                    styles.deleteCancelBtn,
                                    { borderColor: colors.separator },
                                ]}
                                onPress={closeSheet}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.deleteCancelText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.deleteConfirmBtn,
                                    saving && styles.disabled,
                                ]}
                                onPress={handleDelete}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.deleteConfirmText}>
                                    {saving ? "Excluindo..." : "Excluir"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerSub: { fontSize: 13 },
    title: { fontSize: 24, fontWeight: "700" },
    newBtn: {
        borderRadius: 20,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
    },
    newBtnText: { fontSize: 14, fontWeight: "600" },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        gap: Spacing.lg,
    },
    emptyState: { alignItems: "center", paddingTop: Spacing.xl * 2 },
    emptyText: { fontSize: 15 },
    section: { gap: Spacing.sm },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 2,
    },
    sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
    sectionCount: { fontSize: 11, fontWeight: "600" },
    cards: { gap: Spacing.sm },
    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    sheetInner: { width: "100%" },
    progressSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    progressGoalName: { fontSize: 17, fontWeight: "600" },
    circleWrapper: { alignItems: "center", paddingVertical: Spacing.sm },
    statsRow: {
        flexDirection: "row",
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: Spacing.md,
    },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statDivider: { width: 1, marginVertical: 4 },
    statValue: { fontSize: 15, fontWeight: "700" },
    statLabel: { fontSize: 11 },
    closeFullBtn: {
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    closeFullBtnText: { fontSize: 15, fontWeight: "600" },
    deleteOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.xl,
    },
    deleteCard: {
        width: "100%",
        borderRadius: 20,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    deleteTitle: { fontSize: 18, fontWeight: "700" },
    deleteSubtitle: { fontSize: 14 },
    deleteActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    deleteCancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    deleteCancelText: { fontSize: 15, fontWeight: "600" },
    deleteConfirmBtn: {
        flex: 1,
        backgroundColor: "#E74C3C",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    deleteConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    disabled: { opacity: 0.5 },
});
