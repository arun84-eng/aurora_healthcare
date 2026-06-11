import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { theme } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setUserId, setProfile, clearChat } = useStore();

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUserId(null);
          setProfile(null);
          clearChat();
          router.replace('/(onboarding)/welcome');
        },
      },
    ]);
  };

  const infoRows = [
    { icon: 'person-outline', label: 'Name', value: profile?.name ?? '—' },
    { icon: 'calendar-outline', label: 'Age', value: profile?.age ? `${profile.age} years` : '—' },
    { icon: 'body-outline', label: 'Height', value: profile?.height_cm ? `${profile.height_cm} cm` : '—' },
    { icon: 'barbell-outline', label: 'Weight', value: profile?.weight_kg ? `${profile.weight_kg} kg` : '—' },
    { icon: 'water-outline', label: 'Water goal', value: profile?.water_goal_ml ? `${profile.water_goal_ml} ml` : '2000 ml' },
    { icon: 'fitness-outline', label: 'Activity', value: profile?.activity_level ?? '—' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name[0].toUpperCase() : 'A'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? 'Aurora User'}</Text>
        <Text style={styles.email}>Health companion member</Text>
        {profile?.goals && profile.goals.length > 0 && (
          <View style={styles.goalsRow}>
            {profile.goals.slice(0, 3).map((g: string) => (
              <View key={g} style={styles.goalChip}>
                <Text style={styles.goalChipText}>{g}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={styles.sectionLabel}>Your profile</Text>
      <View style={styles.card}>
        {infoRows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < infoRows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Ionicons name={row.icon as any} size={18} color={theme.colors.primary} />
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.sectionLabel}>Settings</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.row, styles.rowBorder]}
          onPress={() => router.push('/(onboarding)/personal')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Edit profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.row, styles.rowBorder]}
          onPress={() => router.push('/(onboarding)/goals')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="flag-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Update goals</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={clearChat}>
          <View style={styles.rowLeft}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Clear chat history</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Aurora v1.0 · Built with ❤️</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },

  avatarSection: { alignItems: 'center', marginBottom: 36 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 14 },
  goalsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  goalChip: {
    backgroundColor: `${theme.colors.primary}22`,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: `${theme.colors.primary}44`,
  },
  goalChipText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 24, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: theme.colors.textSecondary },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16,
    backgroundColor: `${theme.colors.danger}15`,
    borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: `${theme.colors.danger}30`,
    marginBottom: 24,
  },
  signOutText: { color: theme.colors.danger, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 12 },
});
