import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

function AppContent() {
  const colors = useThemeColors();
  
  return (
    <>
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
      <Tabs 
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          },
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            href: null, // Hide from tab bar
            title: 'Home'
          }} 
        />
        <Tabs.Screen 
          name="weight" 
          options={{ 
            title: 'Weight',
            tabBarIcon: () => <Text style={{ fontSize: 20, color: colors.text.primary }}>▲</Text>
          }} 
        />
        <Tabs.Screen 
          name="workouts" 
          options={{ 
            title: 'Workouts',
            tabBarIcon: () => <Text style={{ fontSize: 20, color: colors.text.primary }}>■</Text>
          }} 
        />
        <Tabs.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            tabBarIcon: () => <Text style={{ fontSize: 20, color: colors.text.primary }}>○</Text>
          }} 
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}


