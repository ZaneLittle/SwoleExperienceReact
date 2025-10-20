import React from 'react'
import { Platform, Text, View } from 'react-native'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useThemeColors } from './hooks/useThemeColors'

// Import your screens
import IndexScreen from './app/index'
import WeightScreen from './app/weight'
import WorkoutsPage from './app/workouts'
import SettingsScreen from './app/settings'

// Configure React Native Web
if (Platform.OS === 'web') {
  require('react-native-web/dist/index.js')
}

function TabBar() {
  const colors = useThemeColors()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    }}>
      <Text 
        onPress={() => navigate('/weight')}
        style={{ 
          fontSize: 20, 
          color: isActive('/weight') ? colors.primary : colors.text.primary,
          cursor: 'pointer'
        }}
      >
        ▲ Weight
      </Text>
      <Text 
        onPress={() => navigate('/workouts')}
        style={{ 
          fontSize: 20, 
          color: isActive('/workouts') ? colors.primary : colors.text.primary,
          cursor: 'pointer'
        }}
      >
        ■ Workouts
      </Text>
      <Text 
        onPress={() => navigate('/settings')}
        style={{ 
          fontSize: 20, 
          color: isActive('/settings') ? colors.primary : colors.text.primary,
          cursor: 'pointer'
        }}
      >
        ○ Settings
      </Text>
    </View>
  )
}

function AppContent() {
  const colors = useThemeColors()
  
  return (
    <>
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
      <Routes>
        <Route path="/" element={<Navigate to="/index" replace />} />
        <Route path="/index" element={<IndexScreen />} />
        <Route path="/weight" element={<WeightScreen />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      <TabBar />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
