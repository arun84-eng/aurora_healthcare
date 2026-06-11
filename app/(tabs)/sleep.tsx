import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const SLEEP_OPTIONS = [
  { hours: 4, label: '4h', color: theme.colors.danger },
  { hours: 5, label: '5h', color: theme.colors.danger },
  { hours: 6, label: '6h', color: theme.colors.gold },
  { hours: 7, label: '7h', color: theme.colors.accent },
  { hours: 8, label: '8h', color: theme.colors.accent },
  { hours: 9, label: '9h', color: theme.colors.accent },
  { hours: 10, label: '10h', color: theme.colors.accentBlue },
];

function SleepArc({ hours }: { hours: number | null }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const maxHours = 10;
  const progress = hours ? Math.min(hours / maxHours, 1) : 0;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: progress,
      tension: 18,
      friction: 7,
      useNativeDriver: false,
    }).start();

    if (hours) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hours]);

  const getSleepColor = () => {
    if (!hours) return theme.colors.textMuted;
    if (hours >= 7) return theme.colors.accent;
    if (hours >= 6) return theme.colors.gold;
    return theme.colors.danger;
  };

  const getSleepLabel = () => {
    if (!hours) return 'No sleep logged';
    if (hours >= 8) return 'Excellent';
    if (hours >= 7) return 'Good';
    if (hours >= 6) return 'Fair';
    return 'Poor';
  };

  const color = getSleepColor();

  return (
    <View style={{ alignItems: 'center', marginVertical: 32 }}>
      {/* Outer glow ring */}
      <Animated.View style={{
        width: 200, height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: `${color}30`,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: pulseAnim }],
      }}>
        {/* Middle ring */}
        <View style={{
          width: 168, height: 168,
          borderRadius: 84,
          borderWidth: 3,
          borderColor: `${color}50`,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: `${color}08`,
        }}>
          {/* Inner content */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14 }}>🌙</Text>
            <Text style={{
              fontSize: hours ? 48 : 28,
              fontWeight: '800',
              color: hours ? color : theme.colors.textMuted,
              letterSpacing: -1,
              marginTop: 4,
            }}>
              {hours ? `${hours}` : '—'}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: '500' }}>
              {hours ? 'hours' : 'not logged'}
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color,
              marginTop: 4,
              letterSpacing: 0.5,
            }}>
              {getSleepLabel()}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Progress dots */}
      {hours && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
          {Array.from({ length: maxHours }).map((_, i) => (
            <View key={i} style={{
              width: i < hours ? 20 : 8,
              height: 6,
              borderRadius: 3,
              backgroundColor: i < hours ? color : theme.colors.border,
            }} />
          ))}
        </View>
      )}
    </View>
  );
}

function WeeklyChart({ logs }: { logs: any[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxH = 10;

  // Build last 7 days data
  const today = new Date();
  const weekData = days.map((day, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const log = logs.find(
      (l) => new Date(l.logged_at).toDateString() === date.toDateString()
    );
    return { day, hours: log?.duration_hours ?? 0 };
  });

  const animVals = useRef(weekData.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    weekData.forEach((d, i) => {
      Animated.spring(animVals[i], {
        toValue: d.hours / maxH,
        tension: 20,
        friction: 8,
        delay: i * 80,
        useNativeDriver: false,
      }).start();
    });
  }, [logs]);

  const BAR_MAX = 120;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>7-day overview</Text>
      <View style={styles.chartRow}>
        {weekData.map((d, i) => {
          const isToday = i === 6;
          const barColor = d.hours >= 7 ? theme.colors.accent : d.hours >= 6 ? theme.colors.gold : d.hours > 0 ? theme.colors.danger : theme.colors.border;
          return (
            <View key={i} style={styles.chartBar}>
              <Text style={styles.chartHours}>{d.hours > 0 ? `${d.hours}h` : ''}</Text>
              <View style={styles.barBg}>
                <Animated.View style={{
                  width: '100%',
                  height: animVals[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: barColor,
                  borderRadius: 4,
                  position: 'absolute',
                  bottom: 0,
                  opacity: isToday ? 1 : 0.7,
                }} />
              </View>
              <Text style={[styles.chartDay, isToday && { color: theme.colors.primary, fontWeight: '700' }]}>
                {d.day}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
          <Text style={styles.legendText}>7–9h (great)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.gold }]} />
          <Text style={styles.legendText}>6h (ok)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
          <Text style={styles.legendText}>{'<6h (low)'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function SleepScreen() {
  const router = useRouter();
  const { lastSleepHours, sleepLogs, setLastSleep, setSleepLogs, userId } = useStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLogSleep = async (hours: number) => {
    setSelected(hours);
    setLastSleep(hours);

    if (userId) {
      setSaving(true);
      const { data } = await supabase
        .from('sleep_logs')
        .insert({ user_id: userId, duration_hours: hours })
        .select()
        .single();

      if (data) setSleepLogs([data, ...sleepLogs]);
      setSaving(false);
    }
  };

  const avg = sleepLogs.length > 0
    ? (sleepLogs.reduce((s, l) => s + l.duration_hours, 0) / sleepLogs.length).toFixed(1)
    : null;

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
        <Text style={styles.title}>Sleep</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {lastSleepHours ?? '—'}<Text style={styles.statUnit}>{lastSleepHours ? 'h' : ''}</Text>
          </Text>
          <Text style={styles.statLabel}>last night</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {avg ?? '—'}<Text style={styles.statUnit}>{avg ? 'h' : ''}</Text>
          </Text>
          <Text style={styles.statLabel}>weekly avg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: theme.colors.primary }]}>
            {sleepLogs.length}
          </Text>
          <Text style={styles.statLabel}>days logged</Text>
        </View>
      </View>

      {/* Sleep arc visual */}
      <SleepArc hours={selected ?? lastSleepHours} />

      {/* Log sleep */}
      <Text style={styles.sectionLabel}>How long did you sleep?</Text>
      <View style={styles.sleepGrid}>
        {SLEEP_OPTIONS.map((opt) => {
          const isSelected = (selected ?? lastSleepHours) === opt.hours;
          return (
            <TouchableOpacity
              key={opt.hours}
              style={[styles.sleepChip, isSelected && {
                backgroundColor: `${opt.color}22`,
                borderColor: opt.color,
              }]}
              onPress={() => handleLogSleep(opt.hours)}
              activeOpacity={0.75}
            >
              <Text style={[styles.sleepChipText, isSelected && { color: opt.color }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {saving && (
        <Text style={{ textAlign: 'center', color: theme.colors.textMuted, marginBottom: 16 }}>
          Saving...
        </Text>
      )}

      {/* Insight */}
      <View style={[styles.insightBox, {
        borderColor: `${(selected ?? lastSleepHours) && (selected ?? lastSleepHours)! >= 7
          ? theme.colors.accent
          : theme.colors.gold}40`,
      }]}>
        <Text style={styles.insightText}>
          {!lastSleepHours && !selected
            ? 'Log your sleep to start tracking your patterns.'
            : (selected ?? lastSleepHours)! >= 8
            ? 'Excellent sleep! Your body and mind will thank you today.'
            : (selected ?? lastSleepHours)! >= 7
            ? 'Good sleep last night. Stay consistent for best results.'
            : (selected ?? lastSleepHours)! >= 6
            ? 'Slightly below optimal. Aim for 7–8 hours tonight.'
            : 'Low sleep detected. Prioritise rest and reduce screen time before bed.'}
        </Text>
      </View>

      {/* Weekly chart */}
      <WeeklyChart logs={sleepLogs} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  statUnit: { fontSize: 13, fontWeight: '400', color: theme.colors.textMuted },
  statLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: theme.colors.border },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' },

  sleepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sleepChip: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sleepChipText: { fontSize: 15, fontWeight: '700', color: theme.colors.textSecondary },

  insightBox: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  insightText: { fontSize: 14, color: theme.colors.text, lineHeight: 22 },

  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 20 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, marginBottom: 12 },
  chartBar: { flex: 1, alignItems: 'center', gap: 6 },
  chartHours: { fontSize: 10, color: theme.colors.textMuted, height: 16 },
  barBg: {
    width: '60%', height: 120,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  chartDay: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: theme.colors.textMuted },
});