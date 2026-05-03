import { Colors } from "@/constants/theme";
import { formatMinutes, formatRecordTime } from "@/hooks/use-dashboard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { StudySessionWithSubject } from "@/types/study";
import { StyleSheet, Text, View } from "react-native";

interface Props {
    record: StudySessionWithSubject;
}

export function StudyRecordItem({ record }: Props) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    return (
        <View style={styles.container}>
            <View style={[styles.badge, { backgroundColor: colors.badgeBackground }]}>
                <Text style={[styles.badgeLetter, { color: colors.text }]}>
                    {record.subjectIconLetter}
                </Text>
            </View>
            <View style={styles.info}>
                <Text style={[styles.subject, { color: colors.text }]}>
                    {record.subjectName}
                </Text>
                {record.notes ? (
                    <Text style={[styles.notes, { color: colors.subtext }]} numberOfLines={1}>
                        {record.notes}
                    </Text>
                ) : null}
            </View>
            <View style={styles.meta}>
                <Text style={[styles.duration, { color: colors.text }]}>
                    {formatMinutes(record.durationMinutes)}
                </Text>
                <Text style={[styles.time, { color: colors.subtext }]}>
                    {formatRecordTime(record.startedAt)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeLetter: {
        fontSize: 16,
        fontWeight: "600",
    },
    info: {
        flex: 1,
    },
    subject: {
        fontSize: 15,
        fontWeight: "700",
    },
    notes: {
        fontSize: 13,
        marginTop: 2,
    },
    meta: {
        alignItems: "flex-end",
    },
    duration: {
        fontSize: 15,
        fontWeight: "700",
    },
    time: {
        fontSize: 13,
        marginTop: 2,
    },
});
