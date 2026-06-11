import { supabase } from './supabase';
import { useStore } from './store';

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY!;

const tools = [
  {
    type: 'function',
    function: {
      name: 'add_water',
      description: 'Log water intake for the user in millilitres',
      parameters: {
        type: 'object',
        properties: {
          amount_ml: { type: 'number', description: 'Amount of water in ml' },
        },
        required: ['amount_ml'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_sleep',
      description: 'Log hours of sleep for the user last night',
      parameters: {
        type: 'object',
        properties: {
          duration_hours: { type: 'number', description: 'Hours of sleep' },
        },
        required: ['duration_hours'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Create a new habit for the user',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          icon: { type: 'string', description: 'Emoji icon' },
        },
        required: ['name', 'icon'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_habit',
      description: 'Mark a habit as completed for today',
      parameters: {
        type: 'object',
        properties: {
          habit_name: { type: 'string' },
        },
        required: ['habit_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_summary',
      description: "Get a summary of today's health progress",
      parameters: { type: 'object', properties: {} },
    },
  },
];

async function executeTool(name: string, args: any, userId: string): Promise<string> {
  const store = useStore.getState();

  switch (name) {
    case 'add_water': {
      const ml = args.amount_ml;
      await supabase.from('hydration_logs').insert({ user_id: userId, amount_ml: ml });
      store.addWater(ml);
      return `Added ${ml}ml. Total today: ${store.todayWaterMl + ml}ml`;
    }
    case 'log_sleep': {
      const hours = args.duration_hours;
      await supabase.from('sleep_logs').insert({ user_id: userId, duration_hours: hours });
      store.setLastSleep(hours);
      return `Logged ${hours} hours of sleep`;
    }
    case 'create_habit': {
      const { name, icon } = args;
      const { data } = await supabase
        .from('habits')
        .insert({ user_id: userId, name, icon })
        .select()
        .single();
      if (data) store.setHabits([...store.habits, data]);
      return `Created habit: ${icon} ${name}`;
    }
    case 'complete_habit': {
      const habit = store.habits.find((h) =>
        h.name.toLowerCase().includes(args.habit_name.toLowerCase())
      );
      if (!habit) return `Couldn't find habit: ${args.habit_name}`;
      await supabase.from('habit_logs').insert({ user_id: userId, habit_id: habit.id });
      store.toggleHabit(habit.id);
      return `Marked "${habit.name}" as complete`;
    }
    case 'get_summary': {
      const { todayWaterMl, waterGoalMl, lastSleepHours, habits, completedHabitIds } = store;
      return JSON.stringify({
        water: { today_ml: todayWaterMl, goal_ml: waterGoalMl },
        sleep: { last_night_hours: lastSleepHours },
        habits: { total: habits.length, completed: completedHabitIds.length },
      });
    }
    default:
      return 'Unknown tool';
  }
}

export async function sendToAurora(
  userMessage: string,
  userId: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const store = useStore.getState();
  const { todayWaterMl, waterGoalMl, lastSleepHours, habits, completedHabitIds, profile } = store;

  const systemPrompt = `You are Aurora, a warm and intelligent personal health companion. 
Speak naturally like a supportive friend. Keep responses to 1-3 sentences unless detail is needed.

Current user context:
- Name: ${profile?.name ?? 'there'}
- Water today: ${todayWaterMl}ml of ${waterGoalMl}ml goal
- Sleep last night: ${lastSleepHours ? lastSleepHours + ' hours' : 'not logged'}
- Habits: ${completedHabitIds.length} of ${habits.length} completed today
- Habits list: ${habits.map((h) => h.name).join(', ') || 'none yet'}

Use tools proactively when user mentions health data. After using a tool, confirm naturally and encouragingly.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) return "I'm having trouble connecting. Please try again.";

  // Handle tool calls
  if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
    const toolCall = choice.message.tool_calls[0];
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);

    const toolResult = await executeTool(toolName, toolArgs, userId);

    // Second call with tool result
    const followUp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...messages,
          { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
          { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const followData = await followUp.json();
    return followData.choices?.[0]?.message?.content ?? 'Done!';
  }

  return choice.message?.content ?? "I'm not sure how to help with that.";
}