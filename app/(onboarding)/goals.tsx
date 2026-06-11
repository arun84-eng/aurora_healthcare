import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

const GOALS = [
  { id: 'hydration', label: 'Improve hydration', emoji: '💧' },
  { id: 'sleep', label: 'Sleep better', emoji: '🌙' },
  { id: 'habits', label: 'Build better habits', emoji: '✅' },
  { id: 'nutrition', label: 'Eat healthier', emoji: '🥗' },
  { id: 'energy', label: 'Improve energy', emoji: '⚡' },
  { id: 'consistency', label: 'Stay consistent', emoji: '🔥' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { profile, setProfile, userId } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

  const onFinish = async () => {
    if (!userId) return;
    setSaving(true);
    const finalProfile = { ...profile, goals: selected, id: userId };
    setProfile(finalProfile);

    // Save to Supabase
    await supabase.from('profiles').upsert(finalProfile);
    setSaving(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>What do you want{'\n'}to work on?</Text>
        <Text style={styles.sub}>Pick as many as you like. You can always change these later.</Text>

        <View style={styles.grid}>
          {GOALS.map((goal) => {
            const active = selected.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, active && styles.goalCardActive]}
                onPress={() => toggle(goal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.emoji}>{goal.emoji}</Text>
                <Text style={[styles.goalLabel, active && { color: theme.colors.primary }]}>
                  {goal.label}
                </Text>
                {active && <View style={styles.checkDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.btn, (selected.length === 0 || saving) && styles.btnDisabled]}
          onPress={onFinish}
          disabled={selected.length === 0 || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{saving ? 'Setting up Aurora…' : "Let's go →"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 48 },
  step: { fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.primary, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '700', color: theme.colors.text, lineHeight: 44, marginBottom: 10 },
  sub: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 36 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 40 },
  goalCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 20,
    position: 'relative',
  },
  goalCardActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` },
  emoji: { fontSize: 28, marginBottom: 10 },
  goalLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, lineHeight: 20 },
  checkDot: {
    position: 'absolute', top: 12, right: 12,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18, borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});