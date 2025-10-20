import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

// Your EXACT original home screen content
function IndexScreen() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      height: '100%',
      backgroundColor: '#000000'
    }}>
      <div style={{ 
        fontSize: 28, 
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8
      }}>
        SwoleExperience
      </div>
      <div style={{ 
        color: '#cccccc',
        marginBottom: 24
      }}>
        A simple weight tracker and workout planner
      </div>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ 
          color: '#ffffff',
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid #333',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Go to Weight Tracker
        </div>
        <div style={{ 
          color: '#ffffff',
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid #333',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Go to Workouts
        </div>
        <div style={{ 
          color: '#ffffff',
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid #333',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Go to Settings
        </div>
      </div>
    </div>
  )
}

// Placeholder screens for now
function WeightScreen() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      height: '100%',
      backgroundColor: '#000000'
    }}>
      <div style={{ 
        fontSize: 28, 
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8
      }}>
        Weight Tracker
      </div>
      <div style={{ 
        color: '#cccccc'
      }}>
        Track your weight progress
      </div>
    </div>
  )
}

function WorkoutsScreen() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      height: '100%',
      backgroundColor: '#000000'
    }}>
      <div style={{ 
        fontSize: 28, 
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8
      }}>
        Workouts
      </div>
      <div style={{ 
        color: '#cccccc'
      }}>
        Plan and track your workouts
      </div>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      height: '100%',
      backgroundColor: '#000000'
    }}>
      <div style={{ 
        fontSize: 28, 
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8
      }}>
        Settings
      </div>
      <div style={{ 
        color: '#cccccc'
      }}>
        Configure your app
      </div>
    </div>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('index')
  
  const renderScreen = () => {
    switch (activeTab) {
      case 'index':
        return <IndexScreen />
      case 'weight':
        return <WeightScreen />
      case 'workouts':
        return <WorkoutsScreen />
      case 'settings':
        return <SettingsScreen />
      default:
        return <IndexScreen />
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main content */}
      <div style={{ 
        flex: 1,
        paddingBottom: '80px' // Space for tab bar
      }}>
        {renderScreen()}
      </div>
      
      {/* Tab bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('weight')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'weight' ? '#ffffff' : '#888888',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '10px'
          }}
        >
          ▲ Weight
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'workouts' ? '#ffffff' : '#888888',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '10px'
          }}
        >
          ■ Workouts
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'settings' ? '#ffffff' : '#888888',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '10px'
          }}
        >
          ○ Settings
        </button>
      </div>
    </div>
  )
}

function WebApp() {
  return <AppContent />
}

// This will be the entry point for Vite builds
const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<WebApp />)
}