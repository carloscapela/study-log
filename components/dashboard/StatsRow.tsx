import { formatMinutes } from '@/hooks/use-dashboard';
import type { DailyGoal } from '@/types/study';
import { StyleSheet, View } from 'react-native';
import { StatsCard } from './StatsCard';

interface Props {
  goal: DailyGoal;
}

export function StatsRow({ goal }: Props) {
  const percent = Math.round((goal.studiedMinutes / goal.targetMinutes) * 100);

  return (
    <View style={styles.row}>
      <StatsCard
        variant="outlined"
        label="Estudado Hoje"
        value={formatMinutes(goal.studiedMinutes)}
      />
      <StatsCard
        variant="filled"
        label="Meta Diária"
        value={formatMinutes(goal.targetMinutes)}
        subtitle={`${percent}% concluído`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
