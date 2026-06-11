import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

const PRESET_HABITS = [
  { name: 'Meditation', icon: '🧘' },
  { name: 'Reading', icon: '📚' },
  { name: 'Walking', icon: '🚶' },
  { name: 'Stretching', icon: '🤸' },
  { name: 'Journaling', icon: '✍️' },
  { name: 'No screen 1hr before bed', icon: '📵' },
  { name: 'Supplements', icon: '💊' },
  { name: 'Cold shower', icon: '🚿' },
];

const HABIT_COLORS = [
  theme.colors.primary, theme.colors.accent,
  theme.colors.accentBlue, theme.colors.gold,
  theme.colors.primaryGlow, '#F87171',
];

// Single habit card with completion animation
function HabitCard({
  habit, isCompleted, onToggle, color,
}: {
  habit: any; isCompleted: boolean; onToggle: () => void; color: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isCompleted ? 1 : 0,
      tension: 25, friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isCompleted]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.habitCard, isCompleted && {
          borderColor: `${color}60`,
          backgroundColor: `${color}0D`,
        }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Left: icon + name */}
        <View style={[styles.habitIcon, { backgroundColor: `${color}22` }]}>
          <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.habitName, isCompleted && { color: theme.colors.textSecondary }]}>
            {habit.name}
          </Text>
          <Text style={styles.habitSub}>{isCompleted ? 'Done today ✓' : 'Tap to complete'}</Text>
        </View>

        {/* Right: check circle */}
        <Animated.View style={[
          styles.checkCircle,
          {
            backgroundColor: isCompleted ? color : 'transparent',
            borderColor: isCompleted ? color : theme.colors.border,
            transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          },
        ]}>
          {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Create habit modal
function CreateHabitModal({
  visible, onClose, onSave,
}: {
  visible: boolean; onClose: () => void; onSave: (name: string, icon: string) => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [showPresets, setShowPresets] = useState(true);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Enter a habit name'); return; }
    onSave(name.trim(), icon);
    setName(''); setIcon('⭐');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New habit</Text>

          {/* Presets */}
          {showPresets && (
            <>
              <Text style={styles.modalSub}>Quick pick</Text>
              <View style={styles.presetGrid}>
                {PRESET_HABITS.map((p) => (
                  <TouchableOpacity
                    key={p.name}
                    style={styles.presetChip}
                    onPress={() => { setName(p.name); setIcon(p.icon); setShowPresets(false); }}
                  >
                    <Text style={{ fontSize: 16 }}>{p.icon}</Text>
                    <Text style={styles.presetText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.divLine} />
                <Text style={styles.divText}>or create custom</Text>
                <View style={styles.divLine} />
              </View>
            </>
          )}

          {/* Custom input */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.iconPicker}
              onPress={() => {
                const emojis = ['⭐', '🏃', '💪', '🎯', '🧠', '❤️', '🌿', '☀️'];
                const next = emojis[(emojis.indexOf(icon) + 1) % emojis.length];
                setIcon(next);
              }}
            >
              <Text style={{ fontSize: 24 }}>{icon}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.habitInput}
              placeholder="Habit name..."
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          <Text style={styles.iconHint}>Tap the icon to cycle through options</Text>

          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text style={styles.saveBtnText}>Create habit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { habits, completedHabitIds, setHabits, toggleHabit, userId } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const done = completedHabitIds.length;
  const total = habits.length;
  const progress = total > 0 ? done / total : 0;

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progressAnim, { toValue: progress, tension: 20, friction: 8, useNativeDriver: false }).start();
  }, [progress]);

  const handleToggle = async (habit: any) => {
    toggleHabit(habit.id);
    if (userId) {
      const isNowCompleted = !completedHabitIds.includes(habit.id);
      if (isNowCompleted) {
        await supabase.from('habit_logs').insert({ user_id: userId, habit_id: habit.id });
      }
    }
  };

  const handleCreate = async (name: string, icon: string) => {
    setSaving(true);
    const newHabit = { name, icon, is_active: true, user_id: userId ?? 'local', id: `local_${Date.now()}` };

    if (userId) {
      const { data } = await supabase
        .from('habits')
        .insert({ user_id: userId, name, icon })
        .select()
        .single();
      if (data) {
        setHabits([...habits, data]);
        setSaving(false);
        return;
      }
    }
    setHabits([...habits, newHabit]);
    setSaving(false);
  };

  const pendingHabits = habits.filter((h) => !completedHabitIds.includes(h.id));
  const doneHabits = habits.filter((h) => completedHabitIds.includes(h.id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Habits</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress ring summary */}
      {total > 0 && (
        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryBig}>{done}/{total}</Text>
            <Text style={styles.summarySub}>habits done today</Text>
            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressFill, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]} />
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={{ fontSize: 40 }}>
              {progress === 1 ? '🏆' : progress >= 0.5 ? '💪' : '🎯'}
            </Text>
            <Text style={[styles.pctText, { color: progress === 1 ? theme.colors.accent : theme.colors.primary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
      )}

      {/* Pending habits */}
      {pendingHabits.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>To do</Text>
          {pendingHabits.map((h, i) => (
            <HabitCard
              key={h.id}
              habit={h}
              isCompleted={false}
              onToggle={() => handleToggle(h)}
              color={HABIT_COLORS[i % HABIT_COLORS.length]}
            />
          ))}
        </>
      )}

      {/* Completed habits */}
      {doneHabits.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Completed</Text>
          {doneHabits.map((h, i) => (
            <HabitCard
              key={h.id}
              habit={h}
              isCompleted={true}
              onToggle={() => handleToggle(h)}
              color={HABIT_COLORS[i % HABIT_COLORS.length]}
            />
          ))}
        </>
      )}

      {/* Empty state */}
      {total === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptySub}>Build consistency by adding your first habit.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.emptyBtnText}>Add your first habit</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateHabitModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 16,
  },
  summaryBig: { fontSize: 32, fontWeight: '800', color: theme.colors.text },
  summarySub: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 },
  progressBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  summaryRight: { alignItems: 'center', gap: 4 },
  pctText: { fontSize: 16, fontWeight: '800' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },

  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
  },
  habitIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  habitName: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  habitSub: { fontSize: 12, color: theme.colors.textMuted },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptySub: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  emptyBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: theme.radius.full },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 20 },
  modalSub: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  presetText: { fontSize: 13, color: theme.colors.text, fontWeight: '500' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  divText: { fontSize: 12, color: theme.colors.textMuted },

  inputRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  iconPicker: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1, borderColor: theme.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  habitInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: theme.colors.text,
  },
  iconHint: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 20 },

  saveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.radius.full, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: theme.colors.textMuted, fontSize: 15 },
});