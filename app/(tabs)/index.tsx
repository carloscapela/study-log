import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProgressSection } from '@/components/dashboard/ProgressSection';
import { StartStudyButton } from '@/components/dashboard/StartStudyButton';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { StudyRecordList } from '@/components/dashboard/StudyRecordList';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { useDashboard } from '@/hooks/use-dashboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { userName, goal, recentRecords, progressRatio, remainingMinutes, formattedDate } =
    useDashboard();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader userName={userName} formattedDate={formattedDate} />

      <View style={styles.section}>
        <StatsRow goal={goal} />
      </View>

      <View style={styles.section}>
        <ProgressSection goal={goal} progressRatio={progressRatio} remainingMinutes={remainingMinutes} />
      </View>

      <View style={styles.section}>
        <StartStudyButton onPress={() => router.push('/iniciar-estudo')} />
      </View>

      <View style={styles.section}>
        <StudyRecordList records={recentRecords} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  section: {},
});
