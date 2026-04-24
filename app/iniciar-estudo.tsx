import { Spacing } from "@/constants/spacing";
import { Colors } from "@/constants/theme";
import { createStudySession } from "@/database/repositories/study-session-repository";
import {
  createSubject,
  getAllSubjects,
} from "@/database/repositories/subject-repository";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Subject } from "@/types/study";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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

type TimerStatus = "idle" | "running" | "paused";

const DEFAULT_SUBJECTS = [
    { name: "Língua Portuguesa", iconLetter: "POR" },
    { name: "Matemática", iconLetter: "MAT" },
    { name: "Raciocínio Lógico", iconLetter: "RAC" },
    { name: "Informática", iconLetter: "INF" },
    { name: "Direito Constitucional", iconLetter: "CON" },
    { name: "Direito Administrativo", iconLetter: "ADM" },
    { name: "Direito Penal", iconLetter: "PEN" },
    { name: "Direito Processual Penal", iconLetter: "PPP" },
    { name: "Direito Civil", iconLetter: "CIV" },
    { name: "Direito Processual Civil", iconLetter: "PPC" },
    { name: "Administração Geral", iconLetter: "ADG" },
    { name: "Administração Pública", iconLetter: "ADP" },
    { name: "Contabilidade Geral", iconLetter: "CTG" },
    { name: "Contabilidade Pública", iconLetter: "CTP" },
    { name: "Economia", iconLetter: "ECO" },
    { name: "Legislação Específica", iconLetter: "LEG" },
    { name: "Conhecimentos Gerais", iconLetter: "GER" },
    { name: "Atualidades", iconLetter: "ATU" },
    { name: "Arquivologia", iconLetter: "ARQ" },
    { name: "Gestão de Pessoas", iconLetter: "GEP" },
    { name: "Direito Tributário", iconLetter: "TRI" },
    { name: "Auditoria", iconLetter: "AUD" },
    { name: "Estatística", iconLetter: "EST" },
    { name: "Tecnologia da Informação", iconLetter: "TIC" },
];

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function IniciarEstudoScreen() {
    const db = useSQLiteContext();
    const router = useRouter();
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];
    const insets = useSafeAreaInsets();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(
        null,
    );
    const [topic, setTopic] = useState("");
    const [status, setStatus] = useState<TimerStatus>("idle");
    const [elapsed, setElapsed] = useState(0);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadSubjects = useCallback(async () => {
        let list = await getAllSubjects(db);
        if (list.length === 0) {
            for (const s of DEFAULT_SUBJECTS) {
                await createSubject(db, s);
            }
            list = await getAllSubjects(db);
        }
        setSubjects(list);
        if (list.length > 0) setSelectedSubject(list[0]);
    }, [db]);

    useEffect(() => {
        loadSubjects();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [loadSubjects]);

    function startTimer() {
        if (!startedAt) setStartedAt(new Date().toISOString());
        setStatus("running");
        intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);
    }

    function pauseTimer() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("paused");
    }

    function resumeTimer() {
        setStatus("running");
        intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);
    }

    async function finishTimer() {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (elapsed < 30) {
            Alert.alert("Sessão muito curta", "Deseja descartar esta sessão?", [
                {
                    text: "Continuar",
                    onPress: () => {
                        if (status === "running") resumeTimer();
                        else setStatus("paused");
                    },
                },
                {
                    text: "Descartar",
                    style: "destructive",
                    onPress: () => router.back(),
                },
            ]);
            return;
        }

        setSaving(true);
        try {
            await createStudySession(db, {
                subjectId: selectedSubject!.id,
                durationMinutes: Math.max(1, Math.round(elapsed / 60)),
                startedAt: startedAt!,
                notes: topic.trim() || null,
            });
            router.back();
        } catch {
            Alert.alert("Erro", "Não foi possível salvar a sessão.");
            setSaving(false);
        }
    }

    const statusLabel =
        status === "idle"
            ? "PRONTO PARA COMEÇAR"
            : status === "running"
              ? "EM ANDAMENTO"
              : "PAUSADO";

    const isActive = status !== "idle";

    return (
        <View
            style={[
                styles.screen,
                { backgroundColor: colors.screenBackground },
            ]}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Scrollable content */}
                <View
                    style={[
                        styles.content,
                        {
                            paddingTop: insets.top + Spacing.md,
                            paddingHorizontal: Spacing.md,
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                        >
                            <Text
                                style={[
                                    styles.backArrow,
                                    { color: colors.text },
                                ]}
                            >
                                ←
                            </Text>
                        </TouchableOpacity>
                        <View>
                            <Text
                                style={[styles.title, { color: colors.text }]}
                            >
                                Iniciar Estudo
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: colors.subtext },
                                ]}
                            >
                                nova sessão
                            </Text>
                        </View>
                    </View>

                    {/* Matéria */}
                    <View style={styles.fieldGroup}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.subtext },
                            ]}
                        >
                            MATÉRIA
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.pickerButton,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.separator,
                                },
                            ]}
                            onPress={() => setPickerVisible(true)}
                            disabled={isActive}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.pickerText,
                                    {
                                        color: selectedSubject
                                            ? colors.text
                                            : colors.subtext,
                                    },
                                ]}
                            >
                                {selectedSubject?.name ??
                                    "Selecione uma matéria"}
                            </Text>
                            <Text
                                style={[
                                    styles.chevron,
                                    { color: colors.subtext },
                                ]}
                            >
                                ▾
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Assunto */}
                    <View style={styles.fieldGroup}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.subtext },
                            ]}
                        >
                            ASSUNTO
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.separator,
                                    color: colors.text,
                                },
                            ]}
                            value={topic}
                            onChangeText={setTopic}
                            placeholder="ex: Cálculo Diferencial"
                            placeholderTextColor={colors.subtext}
                            editable={!isActive}
                            returnKeyType="done"
                        />
                    </View>

                    {/* Timer */}
                    <View style={styles.timerSection}>
                        <View
                            style={[
                                styles.timerCircle,
                                {
                                    borderColor:
                                        status === "running"
                                            ? colors.text
                                            : colors.separator,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.timerText,
                                    { color: colors.text },
                                ]}
                            >
                                {formatTime(elapsed)}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.statusLabel,
                                { color: colors.subtext },
                            ]}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                {/* Fixed action buttons at bottom */}
                <View
                    style={[
                        styles.actions,
                        {
                            paddingBottom: insets.bottom + Spacing.md,
                            paddingHorizontal: Spacing.md,
                            backgroundColor: colors.screenBackground,
                        },
                    ]}
                >
                    {!isActive ? (
                        <TouchableOpacity
                            style={[
                                styles.btnPrimary,
                                {
                                    backgroundColor:
                                        colors.cardFilledBackground,
                                },
                                !selectedSubject && styles.disabled,
                            ]}
                            onPress={startTimer}
                            disabled={!selectedSubject}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.btnPrimaryText,
                                    { color: colors.cardFilledText },
                                ]}
                            >
                                ▶ Iniciar
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[
                                    styles.btnSecondary,
                                    {
                                        borderColor: colors.cardBorder,
                                        backgroundColor: colors.cardBackground,
                                    },
                                ]}
                                onPress={
                                    status === "running"
                                        ? pauseTimer
                                        : resumeTimer
                                }
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.btnSecondaryText,
                                        { color: colors.text },
                                    ]}
                                >
                                    {status === "running"
                                        ? "⏸  Pausar"
                                        : "▶  Retomar"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.btnPrimary,
                                    styles.btnFlex,
                                    {
                                        backgroundColor:
                                            colors.cardFilledBackground,
                                    },
                                    saving && styles.disabled,
                                ]}
                                onPress={finishTimer}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.btnPrimaryText,
                                        { color: colors.cardFilledText },
                                    ]}
                                >
                                    {saving ? "Salvando..." : "■  Finalizar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* Subject picker modal */}
            <Modal
                visible={pickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setPickerVisible(false)}
                    activeOpacity={1}
                >
                    <View
                        style={[
                            styles.modalSheet,
                            { backgroundColor: colors.cardBackground },
                        ]}
                    >
                        <View
                            style={[
                                styles.modalHandle,
                                { backgroundColor: colors.separator },
                            ]}
                        />
                        <Text
                            style={[styles.modalTitle, { color: colors.text }]}
                        >
                            Selecionar Matéria
                        </Text>
                        <FlatList
                            data={subjects}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        selectedSubject?.id === item.id && {
                                            backgroundColor:
                                                colors.badgeBackground,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedSubject(item);
                                        setPickerVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.iconBadge,
                                            {
                                                backgroundColor:
                                                    colors.badgeBackground,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.iconLetter,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {item.iconLetter}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            { color: colors.text },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    {selectedSubject?.id === item.id && (
                                        <Text
                                            style={{
                                                color: colors.tint,
                                                fontWeight: "700",
                                            }}
                                        >
                                            ✓
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        flex: 1,
        gap: Spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    backArrow: {
        fontSize: 22,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 13,
    },
    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    pickerText: {
        fontSize: 16,
    },
    chevron: {
        fontSize: 14,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        fontSize: 16,
    },
    timerSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
    },
    timerCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    timerText: {
        fontSize: 36,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
        letterSpacing: 1,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    actions: {
        paddingTop: Spacing.sm,
    },
    btnRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    btnPrimary: {
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    btnFlex: {
        flex: 1,
    },
    btnPrimaryText: {
        fontSize: 16,
        fontWeight: "700",
    },
    btnSecondary: {
        borderRadius: 28,
        borderWidth: 1.5,
        paddingVertical: 16,
        paddingHorizontal: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    btnSecondaryText: {
        fontSize: 15,
        fontWeight: "600",
    },
    disabled: {
        opacity: 0.4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        maxHeight: "70%",
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: Spacing.sm,
    },
    modalItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: 12,
        paddingHorizontal: Spacing.sm,
        borderRadius: 10,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    iconLetter: {
        fontSize: 15,
        fontWeight: "700",
    },
    modalItemText: {
        flex: 1,
        fontSize: 16,
    },
});
