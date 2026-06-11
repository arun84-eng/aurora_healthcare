import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, TextInput, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const QUICK_AMOUNTS = [150, 250, 350, 500];

// ── Animated Water Bottle ──────────────────────────────────────────
function WaterBottle({ progress }: { progress: number }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: progress,
      tension: 20,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const BOTTLE_H = 220;
  const BOTTLE_W = 90;

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BOTTLE_H - 20],
  });

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const pct = Math.round(progress * 100);

  return (
    <View style={{ alignItems: 'center', marginVertical: 32 }}>
      {/* Glow behind bottle */}
      <Animated.View style={{
        position: 'absolute',
        width: 140, height: 140,
        borderRadius: 70,
        backgroundColor: theme.colors.water,
        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.10] }),
        top: 40,
      }} />

      {/* Bottle shape */}
      <View style={{
        width: BOTTLE_W,
        height: BOTTLE_H,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: progress > 0 ? theme.colors.water : theme.colors.border,
        overflow: 'hidden',
        backgroundColor: `${theme.colors.water}10`,
        justifyContent: 'flex-end',
      }}>
        {/* Water fill */}
        <Animated.View style={{
          height: fillHeight,
          width: '100%',
          backgroundColor: theme.colors.water,
          opacity: 0.85,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Wave effect on top of water */}
          <Animated.View style={{
            position: 'absolute',
            top: -6,
            left: 0,
            right: 0,
            height: 14,
            transform: [{ translateX: waveTranslate }],
          }}>
            <View style={{
              width: BOTTLE_W * 2,
              height: 14,
              backgroundColor: `${theme.colors.water}60`,
              borderRadius: 7,
              marginLeft: -BOTTLE_W / 2,
            }} />
          </Animated.View>

          {/* Shine streak */}
          <View style={{
            position: 'absolute',
            right: 12,
            top: 10,
            bottom: 10,
            width: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.3)',
          }} />
        </Animated.View>

        {/* Bottle neck top */}
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 2,
          borderBottomColor: progress > 0 ? theme.colors.water : theme.colors.border,
        }} />
      </View>

      {/* Bottle cap */}
      <View style={{
        width: 36, height: 14,
        backgroundColor: progress >= 1 ? theme.colors.accent : theme.colors.surfaceElevated,
        borderRadius: 4,
        marginTop: -BOTTLE_H - 14,
        marginBottom: BOTTLE_H,
        borderWidth: 2,
        borderColor: progress > 0 ? theme.colors.water : theme.colors.border,
        zIndex: 10,
      }} />

      {/* Percentage label */}
      <Text style={{
        fontSize: 42,
        fontWeight: '800',
        color: progress > 0 ? theme.colors.water : theme.colors.textMuted,
        marginTop: 20,
        letterSpacing: -1,
      }}>{pct}<Text style={{ fontSize: 20, fontWeight: '500' }}>%</Text></Text>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 }}>
        {progress >= 1 ? '🎉 Goal reached!' : 'of daily goal'}
      </Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function HydrationScreen() {
  const router = useRouter();
  const { todayWaterMl, waterGoalMl, addWater, userId, hydrationLogs } = useStore();
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [adding, setAdding] = useState(false);

  const progress = Math.min(todayWaterMl / waterGoalMl, 1);
  const remaining = Math.max(waterGoalMl - todayWaterMl, 0);

  const handleAddWater = async (ml: number) => {
    if (adding) return;
    setAdding(true);

    // Optimistic update
    addWater(ml);

    // Persist to Supabase if logged in
    if (userId) {
      await supabase.from('hydration_logs').insert({
        user_id: userId,
        amount_ml: ml,
      });
    }

    setAdding(false);
    setCustomAmount('');
    setShowCustom(false);
  };

  const handleCustomAdd = () => {
    const ml = parseInt(customAmount);
    if (!ml || ml <= 0 || ml > 5000) {
      Alert.alert('Invalid amount', 'Please enter a value between 1 and 5000ml');
      return;
    }
    handleAddWater(ml);
  };

  // Today's log entries
  const todayLogs = hydrationLogs.filter(
    (l) => new Date(l.logged_at).toDateString() === new Date().toDateString()
  );

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
        <Text style={styles.title}>Hydration</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{todayWaterMl}<Text style={styles.statUnit}>ml</Text></Text>
          <Text style={styles.statLabel}>consumed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{waterGoalMl}<Text style={styles.statUnit}>ml</Text></Text>
          <Text style={styles.statLabel}>goal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: remaining === 0 ? theme.colors.accent : theme.colors.water }]}>
            {remaining}<Text style={styles.statUnit}>ml</Text>
          </Text>
          <Text style={styles.statLabel}>remaining</Text>
        </View>
      </View>

      {/* Water bottle */}
      <WaterBottle progress={progress} />

      {/* Quick add buttons */}
      <Text style={styles.sectionLabel}>Quick add</Text>
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((ml) => (
          <TouchableOpacity
            key={ml}
            style={styles.quickBtn}
            onPress={() => handleAddWater(ml)}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>💧</Text>
            <Text style={styles.quickBtnText}>{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom amount */}
      {showCustom ? (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Enter ml amount"
            placeholderTextColor={theme.colors.textMuted}
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="number-pad"
            autoFocus
          />
          <TouchableOpacity style={styles.customAddBtn} onPress={handleCustomAdd}>
            <Text style={styles.customAddText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCustom(false)} style={{ padding: 8 }}>
            <Ionicons name="close" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.customToggle} onPress={() => setShowCustom(true)}>
          <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.customToggleText}>Custom amount</Text>
        </TouchableOpacity>
      )}

      {/* Insight */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          {progress >= 1
            ? "You've hit your hydration goal today! Great consistency."
            : progress >= 0.5
            ? `Halfway there! ${remaining}ml to go.`
            : `You need ${remaining}ml more to hit your goal today.`}
        </Text>
      </View>

      {/* Today's log */}
      {todayLogs.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.sectionLabel}>Today's log</Text>
          {todayLogs.slice(0, 8).map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logDot} />
              <Text style={styles.logText}>{log.amount_ml}ml</Text>
              <Text style={styles.logTime}>
                {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}
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

  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  quickBtnIcon: { fontSize: 20 },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.water },

  customRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 },
  customInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  customAddBtn: {
    backgroundColor: theme.colors.water,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  customAddText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  customToggleText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },

  insightBox: {
    backgroundColor: `${theme.colors.water}15`,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.water}30`,
    marginBottom: 28,
  },
  insightText: { fontSize: 14, color: theme.colors.text, lineHeight: 22 },

  logSection: { marginTop: 8 },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.water },
  logText: { flex: 1, fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  logTime: { fontSize: 13, color: theme.colors.textMuted },
});