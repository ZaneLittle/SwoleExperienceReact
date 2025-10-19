import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface TimePickerModalProps {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onTimeSelected: (date: Date) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  currentDate,
  onClose,
  onTimeSelected,
}) => {
  const colors = useThemeColors();
  const [tempTime, setTempTime] = useState(currentDate);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const setTime = (date: Date, hours: number, minutes: number) => {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  const handleTimeSelect = () => {
    const newDate = new Date(currentDate);
    newDate.setHours(tempTime.getHours(), tempTime.getMinutes());
    onTimeSelected(newDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Time</Text>
          
          <View style={styles.timePickerContainer}>
            <View style={styles.timeDisplay}>
              <Text style={[styles.timeDisplayText, { color: colors.text.primary }]}>
                {formatTime(tempTime)}
              </Text>
            </View>
            
            <View style={styles.timeControls}>
              <View style={styles.timeControlGroup}>
                <Text style={[styles.timeControlLabel, { color: colors.text.secondary }]}>Hour</Text>
                <View style={styles.timeControlButtons}>
                  <TouchableOpacity 
                    style={[styles.timeControlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setHours(tempTime.getHours() - 1);
                      setTempTime(newTime);
                    }}
                  >
                    <Text style={[styles.timeControlButtonText, { color: colors.text.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeControlValue, { color: colors.text.primary }]}>
                    {tempTime.getHours().toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.timeControlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setHours(tempTime.getHours() + 1);
                      setTempTime(newTime);
                    }}
                  >
                    <Text style={[styles.timeControlButtonText, { color: colors.text.primary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.timeControlGroup}>
                <Text style={[styles.timeControlLabel, { color: colors.text.secondary }]}>Minute</Text>
                <View style={styles.timeControlButtons}>
                  <TouchableOpacity 
                    style={[styles.timeControlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setMinutes(tempTime.getMinutes() - 15);
                      setTempTime(newTime);
                    }}
                  >
                    <Text style={[styles.timeControlButtonText, { color: colors.text.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeControlValue, { color: colors.text.primary }]}>
                    {tempTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.timeControlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setMinutes(tempTime.getMinutes() + 15);
                      setTempTime(newTime);
                    }}
                  >
                    <Text style={[styles.timeControlButtonText, { color: colors.text.primary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.quickTimeButtons}>
              <TouchableOpacity 
                style={[styles.quickTimeButton, { backgroundColor: colors.background }]} 
                onPress={() => setTempTime(setTime(tempTime, 8, 0))}
              >
                <Text style={[styles.quickTimeButtonText, { color: colors.primary }]}>8:00 AM</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickTimeButton, { backgroundColor: colors.background }]} 
                onPress={() => setTempTime(setTime(tempTime, 14, 0))}
              >
                <Text style={[styles.quickTimeButtonText, { color: colors.primary }]}>2:00 PM</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickTimeButton, { backgroundColor: colors.background }]} 
                onPress={() => setTempTime(setTime(tempTime, 18, 0))}
              >
                <Text style={[styles.quickTimeButtonText, { color: colors.primary }]}>6:00 PM</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickTimeButton, { backgroundColor: colors.background }]} 
                onPress={() => setTempTime(new Date())}
              >
                <Text style={[styles.quickTimeButtonText, { color: colors.primary }]}>Now</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.background }]} 
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.primary }]} 
              onPress={handleTimeSelect}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Select Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '5%',
    margin: '5%',
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Time picker specific styles
  timePickerContainer: {
    marginBottom: 20,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: '5%',
  },
  timeControlGroup: {
    alignItems: 'center',
  },
  timeControlLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeControlButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timeControlButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeControlValue: {
    fontSize: 24,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  quickTimeButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickTimeButton: {
    borderRadius: 6,
    padding: 10,
    flex: 1,
    minWidth: 70,
  },
  quickTimeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
