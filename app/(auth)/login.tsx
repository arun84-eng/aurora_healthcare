import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { theme } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { setUserId, setProfile } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Listen for OAuth redirect
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setProfile(profile);
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding)/personal');
        }
      }
    });
  }, []);

  const onLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login Error', error.message);
      return;
    }

    if (data.user) {
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        setProfile(profile);
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/personal');
      }
    }
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : 'aurora://',
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        Alert.alert('Google Sign In Error', error.message);
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        } else {
          await WebBrowser.openAuthSessionAsync(data.url, 'aurora://');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Google sign in failed');
    }
    setGoogleLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome{'\n'}back</Text>
          <Text style={styles.sub}>Good to see you again.</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]}
          onPress={onLogin}
          disabled={!email || !password || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Logging in…' : 'Log in'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Button */}
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
          onPress={onGoogleSignIn}
          disabled={googleLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>
            {googleLoading ? 'Opening Google…' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.signupText}>
            No account?{' '}
            <Text style={{ color: theme.colors.primary }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { flex: 1, padding: 28, paddingTop: 80, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '700', color: theme.colors.text, lineHeight: 44, marginBottom: 10 },
  sub: { fontSize: 15, color: theme.colors.textSecondary },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: theme.colors.text, marginBottom: 14,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18, borderRadius: theme.radius.full,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, fontSize: 13 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.full, paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  googleIcon: {
    fontSize: 18, fontWeight: '800',
    color: '#4285F4',
  },
  googleText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  signupLink: { alignItems: 'center', marginTop: 24 },
  signupText: { color: theme.colors.textSecondary, fontSize: 15 },
});