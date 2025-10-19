import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CompleteWorkoutButtonProps {
  visible: boolean;
  isCompleting: boolean;
  onComplete: () => void;
}

export const CompleteWorkoutButton: React.FC<CompleteWorkoutButtonProps> = ({
  visible,
  isCompleting,
  onComplete,
}) => {
  if (!visible) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]} 
      onPress={onComplete}
      disabled={isCompleting}
    >
      {isCompleting ? (
        <Text style={styles.completeButtonText}>Completing...</Text>
      ) : (
        <Text style={styles.completeButtonText}>Complete Day</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  completeButton: {
    margin: 16,
    marginBottom: 80, // Add space for bottom tab bar
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
