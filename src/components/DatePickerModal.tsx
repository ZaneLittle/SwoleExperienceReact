import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface DatePickerModalProps {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onDateSelected: (date: Date) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  currentDate,
  onClose,
  onDateSelected,
}) => {
  const colors = useThemeColors();
  const [tempDate, setTempDate] = useState(currentDate);
  const [customDateInput, setCustomDateInput] = useState('');
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);

  const formatDateOnly = (date: Date) => {
    return date.toLocaleDateString();
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handleCustomDateSubmit = () => {
    if (customDateInput.trim()) {
      try {
        const parsedDate = new Date(customDateInput);
        if (!isNaN(parsedDate.getTime())) {
          const newDate = new Date(currentDate);
          newDate.setFullYear(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
          onDateSelected(newDate);
          setShowCustomDateInput(false);
          setCustomDateInput('');
          onClose();
        } else {
          Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
        }
      } catch (error) {
        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
      }
    }
  };

  const handleDateSelect = () => {
    onDateSelected(tempDate);
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
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Date</Text>
          
          {!showCustomDateInput ? (
            <>
              <View style={styles.datePickerContainer}>
                <View style={styles.dateNavigation}>
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => setTempDate(addDays(tempDate, -1))}
                  >
                    <Text style={[styles.navButtonText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.currentDateText, { color: colors.text.primary }]}>
                    {formatDateOnly(tempDate)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => setTempDate(addDays(tempDate, 1))}
                  >
                    <Text style={[styles.navButtonText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity 
                    style={styles.quickDateButton} 
                    onPress={() => setTempDate(new Date())}
                  >
                    <Text style={styles.quickDateButtonText}>Today</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickDateButton} 
                    onPress={() => setTempDate(addDays(new Date(), -1))}
                  >
                    <Text style={styles.quickDateButtonText}>Yesterday</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickDateButton} 
                    onPress={() => setShowCustomDateInput(true)}
                  >
                    <Text style={styles.quickDateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={onClose}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={handleDateSelect}
                >
                  <Text style={styles.modalButtonText}>Select Date</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.customDateContainer}>
                <Text style={styles.customDateLabel}>Enter date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.customDateInput}
                  value={customDateInput}
                  onChangeText={setCustomDateInput}
                  placeholder="2024-01-15"
                  autoFocus={true}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setShowCustomDateInput(false);
                    setCustomDateInput('');
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={handleCustomDateSubmit}
                >
                  <Text style={styles.modalButtonText}>Set Date</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: '3%',
    alignItems: 'center',
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
  },
  // Date picker specific styles
  datePickerContainer: {
    marginBottom: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  currentDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickDateButton: {
    backgroundColor: '#e8f4fd',
    borderRadius: 6,
    padding: '3%',
    width: '30%',
    minWidth: 80,
  },
  quickDateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  customDateContainer: {
    marginBottom: 20,
  },
  customDateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  customDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
