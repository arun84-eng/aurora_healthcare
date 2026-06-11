import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

function InsightCard() {
  const { todayWaterMl, waterGoalMl, lastSleepHours, profile } = useStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const getInsight = () => {
    if (todayWaterMl < waterGoalMl * 0.3) return "You're behind on hydration today. Start with a big glass of water.";
    if (lastSleepHours && lastSleepHours < 6) return "You slept less than 6 hours. Prioritise rest tonight.";
    if (todayWaterMl >= waterGoalMl) return "Hydration goal crushed today! Keep the momentum going.";
    return `Good morning${profile?.name ? ', ' + profile.name : ''}. Stay consistent today.`;
  };

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim }]}>
      <View style={styles.insightHeader}>
        <View style={styles.insightDot} />
        <Text style={styles.insightLabel}>Daily insight</Text>
      </View>
      <Text style={styles.insightText}>{getInsight()}</Text>
    </Animated.View>
  );
}

function HydrationCard() {
  const { todayWaterMl, waterGoalMl } = useStore();
  const router = useRouter();
  const progress = Math.min(todayWaterMl / waterGoalMl, 1);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/hydration')} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.colors.water}22` }]}>
          <Ionicons name="water-outline" size={18} color={theme.colors.water} />
        </View>
        <Text style={styles.cardTitle}>Hydration</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
      <Text style={styles.cardBigNumber}>{todayWaterMl}<Text style={styles.cardUnit}>ml</Text></Text>
      <Text style={styles.cardSub}>of {waterGoalMl}ml goal</Text>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, {
          width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: theme.colors.water,
        }]} />
      </View>
      <Text style={styles.cardFooter}>{Math.round(progress * 100)}% complete</Text>
    </TouchableOpacity>
  );
}

function SleepCard() {
  const { lastSleepHours } = useStore();
  const router = useRouter();

  const getSleepColor = () => {
    if (!lastSleepHours) return theme.colors.textMuted;
    if (lastSleepHours >= 7) return theme.colors.accent;
    if (lastSleepHours >= 6) return theme.colors.gold;
    return theme.colors.danger;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/sleep')} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.colors.primary}22` }]}>
          <Ionicons name="moon-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Sleep</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
      {lastSleepHours ? (
        <>
          <Text style={[styles.cardBigNumber, { color: getSleepColor() }]}>
            {lastSleepHours}<Text style={styles.cardUnit}>hrs</Text>
          </Text>
          <Text style={styles.cardSub}>last night</Text>
          <Text style={styles.cardFooter}>
            {lastSleepHours >= 7 ? 'Well rested ✓' : lastSleepHours >= 6 ? 'Could be better' : 'Below recommended'}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.cardBigNumber, { color: theme.colors.textMuted, fontSize: 22 }]}>Not logged</Text>
          <Text style={styles.cardSub}>tap to log sleep</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function HabitsCard() {
  const { habits, completedHabitIds } = useStore();
  const router = useRouter();
  const total = habits.length;
  const done = completedHabitIds.length;
  const progress = total > 0 ? done / total : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/habits')} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.colors.accent}22` }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.accent} />
        </View>
        <Text style={styles.cardTitle}>Habits</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
      {total > 0 ? (
        <>
          <Text style={styles.cardBigNumber}>{done}<Text style={styles.cardUnit}>/{total}</Text></Text>
          <Text style={styles.cardSub}>completed today</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${progress * 100}%`,
              backgroundColor: theme.colors.accent,
            }]} />
          </View>
          <Text style={styles.cardFooter}>{Math.round(progress * 100)}% done</Text>
        </>
      ) : (
        <>
          <Text style={[styles.cardBigNumber, { color: theme.colors.textMuted, fontSize: 22 }]}>No habits</Text>
          <Text style={styles.cardSub}>tap to create one</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function AuroraCompanionBanner() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity
      style={styles.companionBanner}
      onPress={() => router.push('/(tabs)/companion')}
      activeOpacity={0.85}
    >
      <Animated.View style={[styles.companionOrb, { transform: [{ scale: pulseAnim }] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.companionTitle}>Talk to Aurora</Text>
        <Text style={styles.companionSub}>Ask anything about your health</Text>
      </View>
      <View style={styles.micBtn}>
        <Ionicons name="mic" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { profile, userId, setHydrationLogs, setSleepLogs, setHabits, setWaterGoal } = useStore();

  useEffect(() => {
    if (!userId) return;

    // Load today's hydration
    supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .then(({ data }) => { if (data) setHydrationLogs(data); });

    // Load sleep logs
    supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(7)
      .then(({ data }) => { if (data) setSleepLogs(data); });

    // Load habits
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .then(({ data }) => { if (data) setHabits(data); });

    // Load water goal from profile
    if (profile?.water_goal_ml) setWaterGoal(profile.water_goal_ml);
  }, [userId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{profile?.name ?? 'Welcome back'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name[0].toUpperCase() : 'A'}
          </Text>
        </TouchableOpacity>
      </View>

      <InsightCard />
      <AuroraCompanionBanner />

      {/* Cards grid */}
      <View style={styles.grid}>
        <HydrationCard />
        <SleepCard />
      </View>
      <HabitsCard />

      {/* Streak row */}
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>0</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={styles.streakEmoji}>💧</Text>
          <Text style={styles.streakNum}>0</Text>
          <Text style={styles.streakLabel}>hydration days</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={styles.streakEmoji}>✅</Text>
          <Text style={styles.streakNum}>0</Text>
          <Text style={styles.streakLabel}>habits done</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '700', color: theme.colors.text },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },

  insightCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}33`,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  insightLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: theme.colors.primary },
  insightText: { fontSize: 16, color: theme.colors.text, lineHeight: 24, fontWeight: '500' },

  companionBanner: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  companionOrb: {
    position: 'absolute',
    left: -20, top: -20,
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}18`,
  },
  companionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  companionSub: { fontSize: 13, color: theme.colors.textSecondary },
  micBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  grid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  cardBigNumber: { fontSize: 32, fontWeight: '800', color: theme.colors.text, marginBottom: 2 },
  cardUnit: { fontSize: 16, fontWeight: '400', color: theme.colors.textMuted },
  cardSub: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 12 },
  cardFooter: { fontSize: 11, color: theme.colors.textMuted, marginTop: 6 },

  progressBg: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  streakRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  streakItem: { flex: 1, alignItems: 'center', gap: 4 },
  streakEmoji: { fontSize: 22 },
  streakNum: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  streakLabel: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center' },
  streakDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
});