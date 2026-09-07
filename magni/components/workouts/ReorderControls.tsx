import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ReorderControlsProps {
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  upTestID?: string;
  downTestID?: string;
  upAccessibilityLabel?: string;
  downAccessibilityLabel?: string;
}

export function ReorderControls({
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  upTestID,
  downTestID,
  upAccessibilityLabel,
  downAccessibilityLabel,
}: ReorderControlsProps) {
  const showUp = index > 0
  const showDown = index < totalItems - 1

  if (!showUp && !showDown) {
    return <View style={styles.reorderControls} />
  }

  return (
    <View style={styles.reorderControls}>
      {showUp && (
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={onMoveUp}
          testID={upTestID}
          accessibilityLabel={upAccessibilityLabel}
          accessibilityRole="button"
        >
          <Text style={styles.reorderButtonText}>↑</Text>
        </TouchableOpacity>
      )}
      {showDown && (
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={onMoveDown}
          testID={downTestID}
          accessibilityLabel={downAccessibilityLabel}
          accessibilityRole="button"
        >
          <Text style={styles.reorderButtonText}>↓</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  reorderControls: {
    flexDirection: 'column',
    marginRight: 12,
    justifyContent: 'center',
    minWidth: 32,
  },
  reorderButton: {
    backgroundColor: '#666666',
    borderRadius: 4,
    padding: 8,
    marginVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
})
