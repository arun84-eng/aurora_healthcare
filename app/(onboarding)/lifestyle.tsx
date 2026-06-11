import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';

const WAKE_TIMES = ['5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM'];
const BED_TIMES = ['9 PM', '10 PM', '11 PM', '12 AM', '1 AM', '2 AM'];
const ACTIVITY = [
  { label: 'Sedentary', desc: 'Mostly sitting' },
  { label: 'Light', desc: '1–2 days/week' },
  { label: 'Moderate', desc: '3–4 days/week' },
  { label: 'Active', desc: '5+ days/week' },
];

export default function LifestyleScreen() {
  const router = useRouter();
  const { profile, setProfile } = useStore();
  const [wakeTime, setWakeTime] = useState('');
  const [bedTime, setBedTime] = useState('');
  const [activity, setActivity] = useState('');

  const canContinue = wakeTime && bedTime && activity;

  const onContinue = () => {
    setProfile({ ...profile, wake_time: wakeTime, bed_time: bedTime, activity_level: activity });
    router.push('/(onboarding)/goals');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>Your daily{'\n'}rhythm</Text>
        <Text style={styles.sub}>Aurora will use this to time your reminders just right.</Text>

        <Section label="When do you usually wake up?">
          <View style={styles.chips}>
            {WAKE_TIMES.map((t) => (
              <Chip key={t} label={t} active={wakeTime === t} onPress={() => setWakeTime(t)} />
            ))}
          </View>
        </Section>

        <Section label="When do you usually go to bed?">
          <View style={styles.chips}>
            {BED_TIMES.map((t) => (
              <Chip key={t} label={t} active={bedTime === t} onPress={() => setBedTime(t)} />
            ))}
          </View>
        </Section>

        <Section label="How active are you?">
          {ACTIVITY.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.activityCard, activity === a.label && styles.activityCardActive]}
              onPress={() => setActivity(a.label)}
            >
              <Text style={[styles.activityLabel, activity === a.label && { color: theme.colors.primary }]}>
                {a.label}
              </Text>
              <Text style={styles.activityDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </Section>

        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 48 },
  step: { fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.primary, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '700', color: theme.colors.text, lineHeight: 44, marginBottom: 10 },
  sub: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 14, letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 20, paddingVertical: 16,
    marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  activityCardActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` },
  activityLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  activityDesc: { fontSize: 13, color: theme.colors.textMuted },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18, borderRadius: theme.radius.full,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});