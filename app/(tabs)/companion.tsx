import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { theme } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { sendToAurora } from '../../lib/claude';

// Web Speech API for STT (works in browser + mobile web)
const startListening = (onResult: (text: string) => void, onEnd: () => void) => {
  if (typeof window === 'undefined') { onEnd(); return; }
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) { onEnd(); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e: any) => onResult(e.results[0][0].transcript);
  recognition.onend = onEnd;
  recognition.onerror = onEnd;
  recognition.start();
  return recognition;
};

// Animated orb that pulses while listening / thinking
function AuroraOrb({ state }: { state: 'idle' | 'listening' | 'thinking' | 'speaking' }) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'idle') {
      pulse1.setValue(1); pulse2.setValue(1); pulse3.setValue(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      return;
    }

    const speed = state === 'listening' ? 600 : state === 'thinking' ? 400 : 800;
    [pulse1, pulse2, pulse3].forEach((p, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(p, { toValue: 1.3, duration: speed, useNativeDriver: true }),
          Animated.timing(p, { toValue: 1, duration: speed, useNativeDriver: true }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
  }, [state]);

  const stateColors: Record<string, string> = {
    idle: theme.colors.primary,
    listening: '#EF4444',
    thinking: theme.colors.gold,
    speaking: theme.colors.accent,
  };

  const color = stateColors[state];

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.orbContainer}>
      {/* Outer rings */}
      <Animated.View style={[styles.orbRing, styles.orbRing3, {
        borderColor: `${color}15`,
        transform: [{ scale: pulse3 }],
      }]} />
      <Animated.View style={[styles.orbRing, styles.orbRing2, {
        borderColor: `${color}25`,
        transform: [{ scale: pulse2 }],
      }]} />
      <Animated.View style={[styles.orbRing, styles.orbRing1, {
        borderColor: `${color}40`,
        transform: [{ scale: pulse1 }],
      }]} />

      {/* Core orb */}
      <Animated.View style={[styles.orbCore, {
        backgroundColor: color,
        transform: state !== 'idle' ? [{ rotate: spin }] : [],
      }]}>
        <Ionicons
          name={
            state === 'listening' ? 'mic' :
            state === 'thinking' ? 'ellipsis-horizontal' :
            state === 'speaking' ? 'volume-high-outline' :
            'mic-outline'
          }
          size={28}
          color="#fff"
        />
      </Animated.View>

      {/* State label */}
      <Text style={[styles.orbLabel, { color }]}>
        {state === 'idle' ? 'Tap to speak' :
         state === 'listening' ? 'Listening...' :
         state === 'thinking' ? 'Thinking...' :
         'Aurora is speaking'}
      </Text>
    </View>
  );
}

// Chat message bubble
function MessageBubble({ msg }: { msg: { role: string; content: string } }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = msg.role === 'user';

  return (
    <Animated.View style={[
      styles.bubbleRow,
      isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {!isUser && (
        <View style={styles.auroraAvatar}>
          <Text style={{ fontSize: 12 }}>✦</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}>
        <Text style={[
          styles.bubbleText,
          isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
        ]}>
          {msg.content}
        </Text>
      </View>
    </Animated.View>
  );
}

// Suggested prompts
const SUGGESTIONS = [
  "How am I doing today?",
  "I drank 500ml of water",
  "I slept 7 hours last night",
  "Create a meditation habit",
  "What should I focus on?",
];

export default function CompanionScreen() {
  const { chatHistory, addMessage, userId, profile } = useStore();
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  // Speak response using expo-speech
  const speakResponse = (text: string) => {
    setOrbState('speaking');
    const cleanText = text.replace(/[*_~`]/g, '');
    Speech.speak(cleanText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => setOrbState('idle'),
      onError: () => setOrbState('idle'),
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMsg = { role: 'user' as const, content: text.trim() };
    addMessage(userMsg);
    setInputText('');
    setIsProcessing(true);
    setOrbState('thinking');

    try {
      const response = await sendToAurora(
        text.trim(),
        userId ?? 'guest',
        chatHistory
      );

      const assistantMsg = { role: 'assistant' as const, content: response };
      addMessage(assistantMsg);
      setIsProcessing(false);
      speakResponse(response);
    } catch (err) {
      const errMsg = { role: 'assistant' as const, content: "I'm having trouble connecting right now. Please check your API key and try again." };
      addMessage(errMsg);
      setIsProcessing(false);
      setOrbState('idle');
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleOrbPress = () => {
    if (orbState === 'speaking') {
      Speech.stop();
      setOrbState('idle');
      return;
    }

    if (orbState === 'listening') {
      recognitionRef.current?.stop();
      setOrbState('idle');
      return;
    }

    if (orbState !== 'idle') return;

    setOrbState('listening');
    recognitionRef.current = startListening(
      (text) => {
        setOrbState('thinking');
        sendMessage(text);
      },
      () => {
        if (orbState === 'listening') setOrbState('idle');
      }
    );
  };

  // Welcome message
  useEffect(() => {
    if (chatHistory.length === 0) {
      setTimeout(() => {
        const welcome = {
          role: 'assistant' as const,
          content: `Hi${profile?.name ? ' ' + profile.name : ''}! I'm Aurora, your personal health companion. You can talk to me or type — I can log your water intake, sleep, habits, and give you personalised insights. How can I help you today?`,
        };
        addMessage(welcome);
      }, 800);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerOrb} />
          <View>
            <Text style={styles.headerTitle}>Aurora</Text>
            <Text style={styles.headerSub}>Your health companion</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => Speech.stop()}
          style={styles.headerBtn}
        >
          <Ionicons name="volume-mute-outline" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Chat messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {chatHistory.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isProcessing && (
          <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
            <View style={styles.auroraAvatar}>
              <Text style={{ fontSize: 12 }}>✦</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.typingText}>Aurora is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {chatHistory.length <= 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestScroll}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestChip}
              onPress={() => sendMessage(s)}
            >
              <Text style={styles.suggestText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Voice orb */}
      <TouchableOpacity onPress={handleOrbPress} activeOpacity={0.85}>
        <AuroraOrb state={orbState} />
      </TouchableOpacity>

      {/* Text input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Or type a message..."
          placeholderTextColor={theme.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage(inputText)}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isProcessing) && { opacity: 0.4 }]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isProcessing}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerOrb: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, opacity: 0.9 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  headerSub: { fontSize: 12, color: theme.colors.textMuted },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },

  chatScroll: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8, gap: 12 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },

  auroraAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleUser: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: theme.colors.surfaceElevated, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff', fontWeight: '500' },
  bubbleTextAssistant: { color: theme.colors.text },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 14, color: theme.colors.textMuted },

  suggestScroll: { maxHeight: 52, marginBottom: 4 },
  suggestChip: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  suggestText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500', whiteSpace: 'nowrap' } as any,

  orbContainer: { alignItems: 'center', paddingVertical: 16 },
  orbRing: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  orbRing3: { width: 120, height: 120 },
  orbRing2: { width: 96, height: 96 },
  orbRing1: { width: 76, height: 76 },
  orbCore: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  orbLabel: { marginTop: 72, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },

  inputRow: {
    flexDirection: 'row', gap: 10, padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  textInput: {
    flex: 1, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
});