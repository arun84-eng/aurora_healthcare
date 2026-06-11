import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're all set!</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.btnText}>Start using Aurora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 40 },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 18, paddingHorizontal: 48, borderRadius: 999 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
