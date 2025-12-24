import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  visible: boolean
  onHide: () => void
  type?: ToastType
  duration?: number
}

function Toast({ message, visible, onHide, type = 'info', duration = 4000 }: ToastProps) {
  const colors = useThemeColors()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(-100)).current
  const [webOpacity, setWebOpacity] = useState(0)

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'web') {
        setWebOpacity(1)
        const timer = setTimeout(() => {
          setWebOpacity(0)
          setTimeout(() => onHide(), 300)
        }, duration)
        return () => clearTimeout(timer)
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start()

        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onHide()
          })
        }, duration)

        return () => clearTimeout(timer)
      }
    } else {
      if (Platform.OS === 'web') {
        setWebOpacity(0)
      } else {
        fadeAnim.setValue(0)
        slideAnim.setValue(-100)
      }
    }
  }, [visible, duration, fadeAnim, slideAnim, onHide])

  if (!visible) return null

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return '#34C759'
      case 'error':
        return colors.error || '#FF3B30'
      default:
        return colors.primary || '#007AFF'
    }
  }

  const getToastBackground = () => {
    if (colors.background === '#F2F2F7') {
      return '#E5E5EA'
    } else {
      return '#1C1C1E'
    }
  }

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: getToastBackground(),
            borderLeft: `4px solid ${getTypeColor()}`,
            borderTop: `1px solid ${colors.border}`,
            borderRight: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '600px',
            width: '100%',
            opacity: webOpacity,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: colors.text.primary, flex: 1 }}>
            {message}
          </span>
          <button
            onClick={onHide}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.text.secondary,
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: getToastBackground(),
            borderLeftColor: getTypeColor(),
            borderTopColor: colors.border,
            borderRightColor: colors.border,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.text.primary }]}>{message}</Text>
        </View>
        <TouchableOpacity onPress={onHide} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.text.secondary }]}>×</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 20,
  },
})

export default Toast
