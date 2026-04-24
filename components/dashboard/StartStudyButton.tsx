import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  onPress: () => void;
}

export function StartStudyButton({ onPress }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.cardFilledBackground }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: colors.cardFilledText }]}>+ Iniciar Estudo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
