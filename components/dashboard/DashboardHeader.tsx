import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  userName: string;
  formattedDate: string;
}

export function DashboardHeader({ userName, formattedDate }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.date, { color: colors.subtext }]}>{formattedDate}</Text>
        <Text style={[styles.greeting, { color: colors.text }]}>Olá, {userName} 👋</Text>
      </View>
      <View style={[styles.avatar, { backgroundColor: colors.cardFilledBackground }]}>
        <Text style={[styles.avatarLetter, { color: colors.cardFilledText }]}>
          {userName[0].toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
});
