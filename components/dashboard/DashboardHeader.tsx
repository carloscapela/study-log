import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

interface Props {
    userName: string;
    nickname: string;
    formattedDate: string;
}

export function DashboardHeader({ userName, nickname, formattedDate }: Props) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    const displayName = nickname || userName || "Estudante";
    const avatarLetter = displayName[0].toUpperCase();

    return (
        <View style={styles.container}>
            <View style={styles.textBlock}>
                <Text style={[styles.date, { color: colors.subtext }]}>
                    {formattedDate}
                </Text>
                <Text style={[styles.greeting, { color: colors.text }]}>
                    Olá, {displayName} 👋
                </Text>
                {nickname && userName && nickname !== userName && (
                    <Text style={[styles.fullName, { color: colors.subtext }]}>
                        {userName}
                    </Text>
                )}
            </View>
            <View
                style={[
                    styles.avatar,
                    { backgroundColor: colors.cardFilledBackground },
                ]}
            >
                <Text
                    style={[
                        styles.avatarLetter,
                        { color: colors.cardFilledText },
                    ]}
                >
                    {avatarLetter}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    textBlock: {
        flex: 1,
    },
    date: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 2,
    },
    greeting: {
        fontSize: 22,
        fontWeight: "700",
    },
    fullName: {
        fontSize: 13,
        marginTop: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
    avatarLetter: {
        fontSize: 16,
        fontWeight: "700",
    },
});
