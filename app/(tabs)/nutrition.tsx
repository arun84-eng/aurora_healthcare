import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅', time: 'Morning' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️', time: 'Afternoon' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙', time: 'Evening' },
  { key: 'snack', label: 'Snack', emoji: '🍎', time: 'Anytime' },
] as const;

const QUICK_FOODS = [
  { name: 'Oatmeal bowl', calories: 300, protein: 10, carbs: 55, fat: 6, type: 'breakfast' as const },
  { name: 'Grilled chicken', calories: 250, protein: 35, carbs: 0, fat: 8, type: 'lunch' as const },
  { name: 'Brown rice + dal', calories: 380, protein: 14, carbs: 70, fat: 4, type: 'lunch' as const },
  { name: 'Mixed salad', calories: 150, protein: 5, carbs: 20, fat: 6, type: 'dinner' as const },
  { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, type: 'snack' as const },
  { name: 'Greek yogurt', calories: 130, protein: 12, carbs: 9, fat: 4, type: 'snack' as const },
  { name: 'Eggs (2)', calories: 140, protein: 12, carbs: 1, fat: 10, type: 'breakfast' as const },
  { name: 'Roti + sabzi', calories: 320, protein: 9, carbs: 58, fat: 7, type: 'dinner' as const },
];

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color }]}>{value}g</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function AddMealModal({
  visible, onClose, onSave, mealType,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id' | 'time'>) => void;
  mealType: Meal['type'];
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [tab, setTab] = useState<'quick' | 'custom'>('quick');

  const reset = () => {
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
  };

  const handleQuick = (food: typeof QUICK_FOODS[0]) => {
    onSave({ name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, type: mealType });
    reset(); onClose();
  };

  const handleCustom = () => {
    if (!name || !calories) { Alert.alert('Enter at least name and calories'); return; }
    onSave({
      name, type: mealType,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add to {MEAL_TYPES.find(m => m.key === mealType)?.label}</Text>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, tab === 'quick' && styles.tabActive]} onPress={() => setTab('quick')}>
              <Text style={[styles.tabText, tab === 'quick' && styles.tabTextActive]}>Quick add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'custom' && styles.tabActive]} onPress={() => setTab('custom')}>
              <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {tab === 'quick' ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {QUICK_FOODS.map((food) => (
                <TouchableOpacity key={food.name} style={styles.quickItem} onPress={() => handleQuick(food)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickItemName}>{food.name}</Text>
                    <Text style={styles.quickItemMacros}>
                      {food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Food name" placeholder="e.g. Dal chawal" value={name} onChangeText={setName} />
              <Field label="Calories (kcal)" placeholder="300" value={calories} onChangeText={setCalories} keyboardType="number-pad" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Protein (g)" placeholder="0" value={protein} onChangeText={setProtein} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Carbs (g)" placeholder="0" value={carbs} onChangeText={setCarbs} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Fat (g)" placeholder="0" value={fat} onChangeText={setFat} keyboardType="number-pad" />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, (!name || !calories) && { opacity: 0.4 }]}
                onPress={handleCustom}
                disabled={!name || !calories}
              >
                <Text style={styles.saveBtnText}>Add meal</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default' }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function NutritionScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [modalType, setModalType] = useState<Meal['type'] | null>(null);

  const addMeal = (meal: Omit<Meal, 'id' | 'time'>) => {
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMeals((prev) => [...prev, newMeal]);
  };

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);

  const calorieGoal = 2000;
  const caloriePct = Math.min((totalCalories / calorieGoal) * 100, 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nutrition</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Calorie ring summary */}
      <View style={styles.summaryCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.calorieNum}>{totalCalories}<Text style={styles.calorieUnit}> kcal</Text></Text>
          <Text style={styles.calorieSub}>of {calorieGoal} kcal goal</Text>
          <View style={styles.calBarBg}>
            <View style={[styles.calBarFill, { width: `${caloriePct}%` }]} />
          </View>
          <Text style={styles.calorieSub}>{Math.round(caloriePct)}% of daily goal</Text>
        </View>
        <Text style={{ fontSize: 48 }}>
          {caloriePct >= 100 ? '🎯' : caloriePct >= 50 ? '🥗' : '🍽️'}
        </Text>
      </View>

      {/* Macros */}
      <View style={styles.macroCard}>
        <Text style={styles.sectionLabel}>Macronutrients</Text>
        <MacroBar label="Protein" value={totalProtein} max={150} color={theme.colors.accent} />
        <MacroBar label="Carbohydrates" value={totalCarbs} max={250} color={theme.colors.accentBlue} />
        <MacroBar label="Fat" value={totalFat} max={65} color={theme.colors.gold} />
      </View>

      {/* Meal sections */}
      {MEAL_TYPES.map((mealType) => {
        const mealLogs = meals.filter((m) => m.type === mealType.key);
        const mealCals = mealLogs.reduce((s, m) => s + m.calories, 0);

        return (
          <View key={mealType.key} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderLeft}>
                <Text style={{ fontSize: 22 }}>{mealType.emoji}</Text>
                <View>
                  <Text style={styles.mealTitle}>{mealType.label}</Text>
                  <Text style={styles.mealTime}>{mealType.time}</Text>
                </View>
              </View>
              <View style={styles.mealHeaderRight}>
                {mealCals > 0 && (
                  <Text style={styles.mealCals}>{mealCals} kcal</Text>
                )}
                <TouchableOpacity
                  style={styles.addMealBtn}
                  onPress={() => setModalType(mealType.key as Meal['type'])}
                >
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {mealLogs.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyMeal}
                onPress={() => setModalType(mealType.key as Meal['type'])}
              >
                <Text style={styles.emptyMealText}>+ Add {mealType.label.toLowerCase()}</Text>
              </TouchableOpacity>
            ) : (
              mealLogs.map((meal) => (
                <View key={meal.id} style={styles.mealItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealItemName}>{meal.name}</Text>
                    <Text style={styles.mealItemMacros}>
                      P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.mealItemCal}>{meal.calories}</Text>
                    <Text style={styles.mealItemCalUnit}>kcal</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      })}

      {/* Insight */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          {totalCalories === 0
            ? 'Start logging your meals to track your nutrition today.'
            : totalCalories < 1200
            ? 'You may be under-eating today. Focus on balanced meals.'
            : totalCalories >= calorieGoal
            ? "You've reached your calorie goal. Great consistency!"
            : `You have ${calorieGoal - totalCalories} kcal remaining for today.`}
        </Text>
      </View>

      {modalType && (
        <AddMealModal
          visible={!!modalType}
          onClose={() => setModalType(null)}
          onSave={addMeal}
          mealType={modalType}
        />
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

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 20,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16,
  },
  calorieNum: { fontSize: 36, fontWeight: '800', color: theme.colors.text },
  calorieUnit: { fontSize: 16, fontWeight: '400', color: theme.colors.textMuted },
  calorieSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, marginBottom: 8 },
  calBarBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  calBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },

  macroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 20,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  macroLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  macroValue: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  mealSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  mealHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  mealTime: { fontSize: 12, color: theme.colors.textMuted },
  mealCals: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  addMealBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${theme.colors.primary}22`,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyMeal: { padding: 16 },
  emptyMealText: { fontSize: 14, color: theme.colors.textMuted },
  mealItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  mealItemName: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  mealItemMacros: { fontSize: 12, color: theme.colors.textMuted },
  mealItemCal: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  mealItemCalUnit: { fontSize: 11, color: theme.colors.textMuted },

  insightBox: {
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: theme.radius.md, padding: 16,
    borderWidth: 1, borderColor: `${theme.colors.accent}30`,
    marginTop: 8,
  },
  insightText: { fontSize: 14, color: theme.colors.text, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 20 },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: '#fff' },

  quickItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  quickItemName: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  quickItemMacros: { fontSize: 12, color: theme.colors.textMuted },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: theme.colors.text,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16, borderRadius: theme.radius.full,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingTop: 16 },
  cancelText: { color: theme.colors.textMuted, fontSize: 15 },
});