import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, FlatList, ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '0',
    eyebrow: 'Welcome to Aurora',
    headline: 'Understand yourself\nbetter every day.',
    sub: '',
    accent: theme.colors.primary,
  },
  {
    id: '1',
    eyebrow: 'Meet your companion',
    headline: 'A health partner\nthat actually listens.',
    sub: 'Aurora learns from you and speaks your language — not medical charts.',
    accent: theme.colors.accentBlue,
  },
  {
    id: '2',
    eyebrow: 'Track what matters',
    headline: 'Hydration. Sleep.\nHabits. Nutrition.',
    sub: 'Everything in one place, without the overwhelm.',
    accent: theme.colors.accent,
  },
  {
    id: '3',
    eyebrow: 'Personalised insights',
    headline: 'Daily clarity,\nnot just data.',
    sub: 'Aurora connects the dots so you know what to focus on today.',
    accent: theme.colors.gold,
  },
  {
    id: '4',
    eyebrow: 'Build your rhythm',
    headline: 'Small habits.\nLasting change.',
    sub: "Consistency compounds. Aurora keeps you on track without the guilt.",
    accent: theme.colors.primaryGlow,
  },
];

// Animated floating orb background
function OrbBg({ color }: { color: string }) {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float1, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(float1, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(float2, { toValue: 1, duration: 5000, useNativeDriver: true }),
          Animated.timing(float2, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      ).start();
    }, 1500);
  }, []);

  const y1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const y2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[styles.orb, {
          backgroundColor: color,
          width: 280, height: 280,
          top: height * 0.1, left: -80,
          transform: [{ translateY: y1 }],
        }]}
      />
      <Animated.View
        style={[styles.orb, {
          backgroundColor: color,
          width: 200, height: 200,
          bottom: height * 0.15, right: -60,
          opacity: 0.4,
          transform: [{ translateY: y2 }],
        }]}
      />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const accentColor = slides[current].accent;

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setCurrent(Number(viewableItems[0].item.id));
  });

  const goNext = () => {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      router.push('/(auth)/signup');
    }
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.eyebrow}>{item.eyebrow}</Text>
      <Text style={[styles.headline, { color: theme.colors.text }]}>{item.headline}</Text>
      {item.sub ? <Text style={styles.sub}>{item.sub}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <OrbBg color={accentColor} />

      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === current ? 24 : 6,
                backgroundColor: i === current ? accentColor : theme.colors.textMuted,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: accentColor }]} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {current === slides.length - 1 ? 'Get started' : 'Continue'}
        </Text>
      </TouchableOpacity>

      {/* Skip */}
      {current < slides.length - 1 && (
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 48,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: height * 0.18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  headline: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 50,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  sub: {
    fontSize: 17,
    lineHeight: 26,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btn: {
    marginHorizontal: 24,
    paddingVertical: 18,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
});