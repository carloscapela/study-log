import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StudyRecord } from '@/types/study';
import { StyleSheet, Text, View } from 'react-native';
import { StudyRecordItem } from './StudyRecordItem';

interface Props {
  records: StudyRecord[];
}

export function StudyRecordList({ records }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Últimos Registros</Text>
      <View style={[styles.list, { backgroundColor: colors.cardBackground }]}>
        {records.map((record, index) => (
          <View key={record.id}>
            <StudyRecordItem record={record} />
            {index < records.length - 1 && (
              <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  list: {
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
  },
});
