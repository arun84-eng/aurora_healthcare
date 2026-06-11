import { create } from 'zustand';

type HydrationLog = { id: string; amount_ml: number; logged_at: string };
type SleepLog = { id: string; duration_hours: number; logged_at: string };
type Habit = { id: string; name: string; icon: string; is_active: boolean };

interface AuroraStore {
  // Auth
  userId: string | null;
  profile: any | null;
  setUserId: (id: string | null) => void;
  setProfile: (profile: any) => void;

  // Hydration
  todayWaterMl: number;
  waterGoalMl: number;
  hydrationLogs: HydrationLog[];
  addWater: (ml: number) => void;
  setHydrationLogs: (logs: HydrationLog[]) => void;
  setWaterGoal: (goal: number) => void;

  // Sleep
  lastSleepHours: number | null;
  sleepLogs: SleepLog[];
  setLastSleep: (hours: number) => void;
  setSleepLogs: (logs: SleepLog[]) => void;

  // Habits
  habits: Habit[];
  completedHabitIds: string[];
  setHabits: (habits: Habit[]) => void;
  toggleHabit: (id: string) => void;

  // AI Companion
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  addMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  clearChat: () => void;
}

export const useStore = create<AuroraStore>((set, get) => ({
  userId: null,
  profile: null,
  setUserId: (id) => set({ userId: id }),
  setProfile: (profile) => set({ profile }),

  todayWaterMl: 0,
  waterGoalMl: 2000,
  hydrationLogs: [],
  addWater: (ml) => set((s) => ({ todayWaterMl: s.todayWaterMl + ml })),
  setHydrationLogs: (logs) => {
    const today = new Date().toDateString();
    const todayTotal = logs
      .filter((l) => new Date(l.logged_at).toDateString() === today)
      .reduce((sum, l) => sum + l.amount_ml, 0);
    set({ hydrationLogs: logs, todayWaterMl: todayTotal });
  },
  setWaterGoal: (goal) => set({ waterGoalMl: goal }),

  lastSleepHours: null,
  sleepLogs: [],
  setLastSleep: (hours) => set({ lastSleepHours: hours }),
  setSleepLogs: (logs) => {
    const last = logs[0];
    set({ sleepLogs: logs, lastSleepHours: last?.duration_hours ?? null });
  },

  habits: [],
  completedHabitIds: [],
  setHabits: (habits) => set({ habits }),
  toggleHabit: (id) =>
    set((s) => ({
      completedHabitIds: s.completedHabitIds.includes(id)
        ? s.completedHabitIds.filter((h) => h !== id)
        : [...s.completedHabitIds, id],
    })),

  chatHistory: [],
  addMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
}));