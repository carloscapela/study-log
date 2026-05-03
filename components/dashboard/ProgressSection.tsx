import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatMinutes } from "@/hooks/use-dashboard";
import type { DailyGoal } from "@/types/study";
import { StyleSheet, Text, View } from "react-native";

interface Props {
    goal: DailyGoal;
    progressRatio: number;
    remainingMinutes: number;
}

export function ProgressSection({
    goal,
    progressRatio,
    remainingMinutes,
}: Props) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.cardBackground },
            ]}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Progresso da meta
                </Text>
                <Text style={[styles.fraction, { color: colors.subtext }]}>
                    {formatMinutes(goal.studiedMinutes)} /{" "}
                    {formatMinutes(goal.targetMinutes)}
                </Text>
            </View>
            <View
                style={[
                    styles.track,
                    { backgroundColor: colors.badgeBackground },
                ]}
            >
                <View
                    style={[
                        styles.fill,
                        {
                            backgroundColor: colors.cardFilledBackground,
                            width: `${progressRatio * 100}%`,
                        },
                    ]}
                />
            </View>
            {remainingMinutes > 0 ? (
                <Text style={[styles.hint, { color: colors.subtext }]}>
                    faltam {remainingMinutes} min para atingir a meta
                </Text>
            ) : (
                <Text style={[styles.hint, { color: colors.subtext }]}>
                    meta atingida! 🎉
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        padding: 16,
        gap: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
    },
    fraction: {
        fontSize: 13,
    },
    track: {
        height: 8,
        borderRadius: 999,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 999,
    },
    hint: {
        fontSize: 12,
    },
});
