import { Colors } from '@/constants/theme';
import { formatMinutes, formatRecordTime } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StudyRecord } from '@/types/study';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  record: StudyRecord;
}

export function StudyRecordItem({ record }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: colors.badgeBackground }]}>
        <Text style={[styles.badgeLetter, { color: colors.text }]}>{record.iconLetter}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.subject, { color: colors.text }]}>{record.subject}</Text>
        <Text style={[styles.topic, { color: colors.subtext }]}>{record.topic}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetter: {
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  subject: {
    fontSize: 15,
    fontWeight: '700',
  },
  topic: {
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 13,
    marginTop: 2,
  },
});
