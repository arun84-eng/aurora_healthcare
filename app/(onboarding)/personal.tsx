import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function PersonalScreen() {
  const router = useRouter();
  const { profile, setProfile } = useStore();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const canContinue = name.trim() && age && gender && height && weight;

  const onContinue = () => {
    setProfile({ ...profile, name, age: Number(age), gender, height_cm: Number(height), weight_kg: Number(weight) });
    router.push('/(onboarding)/lifestyle');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>Tell us about{'\n'}yourself</Text>
          <Text style={styles.sub}>This helps Aurora personalise your experience.</Text>
        </View>

        <View style={styles.form}>
          <Field label="Your name" placeholder="e.g. Arun" value={name} onChangeText={setName} />
          <Field label="Age" placeholder="e.g. 22" value={age} onChangeText={setAge} keyboardType="number-pad" />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Height (cm)" placeholder="170" value={height} onChangeText={setHeight} keyboardType="number-pad" />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Field label="Weight (kg)" placeholder="65" value={weight} onChangeText={setWeight} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default' }: any) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 48 },
  header: { marginBottom: 40 },
  step: { fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.primary, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '700', color: theme.colors.text, lineHeight: 44, marginBottom: 10 },
  sub: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22 },
  form: {},
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 10, letterSpacing: 0.3 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row' },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18, borderRadius: theme.radius.full,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});