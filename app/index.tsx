import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/(onboarding)/welcome');
        return;
      }
      supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data) router.replace('/(tabs)');
          else router.replace('/(onboarding)/personal');
        });
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#7B6EF6" size="large" />
    </View>
  );
}
