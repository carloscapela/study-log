import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  variant: 'outlined' | 'filled';
}

export function StatsCard({ label, value, subtitle, variant }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isFilled = variant === 'filled';
  const bgColor = isFilled ? colors.cardFilledBackground : colors.cardBackground;
  const textColor = isFilled ? colors.cardFilledText : colors.text;
  const subtextColor = isFilled ? colors.cardFilledText : colors.subtext;
  const borderStyle = isFilled ? {} : { borderWidth: 1, borderColor: colors.cardBorder };

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, borderStyle]}>
      <Text style={[styles.label, { color: isFilled ? colors.cardFilledText : colors.subtext }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtextColor }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'flex-end',
    minHeight: 100,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
});
