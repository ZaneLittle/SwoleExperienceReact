import { Link } from 'react-router-dom';
import { Text, View, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export default function HomeScreen() {
  const colors = useThemeColors();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>SwoleExperience</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>A simple weight tracker and workout planner</Text>
      <View style={styles.links}>
        <Link to="/weight" style={[styles.link, { color: colors.primary }]}>Go to Weight Tracker</Link>
        <Link to="/workouts" style={[styles.link, { color: colors.primary }]}>Go to Workouts</Link>
        <Link to="/settings" style={[styles.link, { color: colors.primary }]}>Go to Settings</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 8 },
  links: { marginTop: 24, gap: 12 },
  link: { marginTop: 8 },
});


