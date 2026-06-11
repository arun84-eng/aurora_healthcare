Aurora — AI-Powered Health Companion

Understand yourself better every day.

Aurora is a mobile-first health companion that helps you track hydration, sleep, habits, and nutrition — and actually understand what that data means through an intelligent AI companion with voice interaction.

Demo
WelcomeDashboardHydrationAI CompanionCinematic onboardingLive health cardsAnimated water bottleVoice + agent actions
APK Download: Install on Android

Features
Core Modules

Hydration Tracking — Animated water bottle that fills in real time, quick-add buttons, custom entry, daily history log
Sleep Tracking — Pulsing arc visual, hour selector chips, 7-day bar chart with colour-coded quality indicators
Habit Tracking — Create habits from presets or custom, complete with satisfying animations, progress tracking
Home Dashboard — Personalised daily insight, all health cards in one view, streak tracking

AI Companion (Core Feature)

Voice-to-voice interaction — Speak naturally, receive spoken responses via expo-speech
Agent actions — Aurora can take real actions through conversation:

"I drank 500ml of water" → logs hydration, updates bottle
"I slept 7 hours last night" → updates sleep log
"Create a meditation habit" → creates the habit
"How am I doing today?" → personalised health summary


Contextual awareness — Aurora knows your current water intake, sleep, habits, and goals
Suggested prompts — Quick-tap conversation starters

Onboarding & Auth

Cinematic 5-screen welcome flow with animated orbs
Email signup/login via Supabase Auth
Google OAuth sign-in
3-step onboarding: personal info → lifestyle → health goals
All data persisted to Supabase


Tech Stack
LayerTechnologyMobileReact Native + Expo SDK 56RoutingExpo Router (file-based)StateZustandBackend & AuthSupabase (PostgreSQL + Auth)AIGroq API (Llama 3.3 70B)Voice STTWeb Speech APIVoice TTSexpo-speechBuildEAS Build

Project Structure
aurora/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/
│   │   ├── welcome.tsx
│   │   ├── personal.tsx
│   │   ├── lifestyle.tsx
│   │   ├── goals.tsx
│   │   └── notifications.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          # Home Dashboard
│   │   ├── hydration.tsx      # Hydration Module
│   │   ├── sleep.tsx          # Sleep Module
│   │   ├── habits.tsx         # Habits Module
│   │   ├── companion.tsx      # AI Voice Companion
│   │   └── profile.tsx        # Profile & Settings
│   ├── _layout.tsx
│   └── index.tsx
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── claude.ts              # AI companion + tool use
│   └── store.ts               # Zustand global state
├── constants/
│   └── theme.ts               # Design tokens
└── components/

Database Schema (Supabase)
sqlprofiles          -- User profile & onboarding data
hydration_logs    -- Water intake entries
sleep_logs        -- Sleep duration entries
habits            -- User-created habits
habit_logs        -- Habit completion records
All tables use Row Level Security — users can only access their own data.

AI Agent Architecture
The AI companion uses tool use / function calling so Aurora can take real actions:
User speaks/types
      ↓
Context injected (water, sleep, habits, profile)
      ↓
Groq Llama 3.3 70B decides → reply OR tool call
      ↓
Tool executed → Supabase updated → Zustand state updated
      ↓
Follow-up response generated
      ↓
expo-speech speaks the response aloud
Available tools:

add_water(amount_ml) — logs hydration
log_sleep(duration_hours) — logs sleep
create_habit(name, icon) — creates a new habit
complete_habit(habit_name) — marks habit done
get_summary() — returns today's health snapshot


Getting Started
Prerequisites

Node.js 18+
Expo CLI
Supabase account (free)
Groq API key (free at console.groq.com)

Installation
bashgit clone https://github.com/arun84-eng/aurora.git
cd aurora
npm install --legacy-peer-deps
Environment Setup
Create a .env file in the root:
envEXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_KEY=your_groq_api_key
Database Setup
Run the SQL schema in your Supabase SQL Editor:
sqlcreate table profiles (
  id uuid references auth.users primary key,
  name text, age int, gender text,
  height_cm float, weight_kg float,
  wake_time text, bed_time text,
  activity_level text, goals text[],
  water_goal_ml int default 2000,
  created_at timestamp default now()
);

create table hydration_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  amount_ml int, logged_at timestamp default now()
);

create table sleep_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  duration_hours float, logged_at timestamp default now()
);

create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  name text, icon text,
  is_active boolean default true,
  created_at timestamp default now()
);

create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id),
  user_id uuid references profiles(id),
  completed_at timestamp default now()
);
Run
bashnpx expo start
Scan the QR code with Expo Go or press w for web.

Build APK
bashnpm install -g eas-cli
eas login
eas build --platform android --profile preview

Design Philosophy
Aurora is built around three principles:

Understanding over data — Don't just show numbers. Tell users what they mean.
Conversation over forms — Logging health data should feel like talking to a friend, not filling a spreadsheet.
Encouragement over judgment — Every insight is supportive, never clinical or stressful.

The visual design uses a dark ink palette with aurora purple (#7B6EF6) accents, animated orbs, and smooth spring animations to create a premium, calm experience.

Built For
Project Aurora Hackathon — Mobile Health Companion Challenge
Developer: Arun Bamel
Institution: Amity University, B.Tech AI & ML (2026)
GitHub: @arun84-eng

Built with React Native, Expo, Supabase, and Groq AI.
