import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { DatePickerModal } from '../DatePickerModal';
import { TimePickerModal } from '../TimePickerModal';
import { Weight } from '../../lib/models/Weight';
import { weightService } from '../../lib/services/WeightService';
import { averageService } from '../../lib/services/AverageService';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WeightHistoryProps {
  onWeightDeleted: () => void;
  weights: Weight[];
}

export const WeightHistory: React.FC<WeightHistoryProps> = ({ onWeightDeleted, weights }) => {
  const colors = useThemeColors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedWeight, setEditedWeight] = useState('');
  const [editWeight, setEditWeight] = useState<Weight | null>(null);
  const [editedDate, setEditedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const handleDelete = async (id: string) => {
    
    const performDelete = async () => {
      try {
        const success = await weightService.removeWeight(id);
        if (success) {
          // Recalculate averages after deletion
          const updatedWeights = await weightService.getWeights();
          await averageService.calculateAverages(updatedWeights);
          onWeightDeleted();
        } else {
          console.error('Failed to remove weight');
        }
      } catch (error) {
        console.error('Error in handleDelete:', error);
      }
    };

    if (Platform.OS === 'web') {
      // Use browser's native confirm dialog for web
      const confirmed = window.confirm('Are you sure you want to delete this weight entry?');
      if (confirmed) {
        await performDelete();
      }
    } else {
      // Use React Native Alert for mobile platforms
      Alert.alert(
        'Delete Weight',
        'Are you sure you want to delete this weight entry?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('Delete cancelled by user') },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const handleEdit = (weight: Weight) => {
    setEditingId(weight.id);
    setEditedWeight(weight.weight.toString());
  };

  const handleEditSubmit = async (weight: Weight) => {
    const weightValue = parseFloat(editedWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    try {
      const success = await weightService.updateWeight({
        id: weight.id,
        dateTime: weight.dateTime,
        weight: weightValue,
      });

      if (success) {
        // Recalculate averages
        const updatedWeights = await weightService.getWeights();
        await averageService.calculateAverages(updatedWeights);
        onWeightDeleted(); // Use the same callback to refresh the list
        setEditingId(null); // Exit edit mode
      } else {
        Alert.alert('Error', 'Failed to update weight');
      }
    } catch (error) {
      console.error('Error updating weight:', error);
      Alert.alert('Error', 'Failed to update weight');
    }
  };

  const renderItem = ({ item }: { item: Weight }) => (
    <View style={[styles.weightItem, { backgroundColor: colors.surface }]}>
      <View style={styles.dateTimeInfo}>
        <Text style={[styles.dateText, { color: colors.text.primary }]}>
          {new Date(item.dateTime).toLocaleDateString()}
        </Text>
        <Text style={[styles.timeText, { color: colors.text.secondary }]}>
          {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <View style={styles.weightSection}>
        {editingId === item.id ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.weightInputSmall, { 
                backgroundColor: colors.surface, 
                color: colors.text.primary,
                borderColor: colors.border 
              }]}
              value={editedWeight}
              onChangeText={setEditedWeight}
              keyboardType="numeric"
              returnKeyType="done"
              autoFocus
              onSubmitEditing={() => handleEditSubmit(item)}
              onBlur={() => setEditingId(null)}
            />
          </View>
        ) : (
          <View style={styles.weightContainer}>
            <Text style={[styles.weightText, { color: colors.text.primary }]}>{item.weight}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={[styles.editButtonText, { color: colors.primary }]}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!weights || weights.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No weight entries yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={weights}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      {editWeight && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Weight Entry</Text>

              <View style={styles.modalForm}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDateModal(true)}
                >
                  <Text style={[styles.dateTimeButtonText, { color: colors.text.primary }]}>
                    {editedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowTimeModal(true)}
                >
                  <Text style={[styles.dateTimeButtonText, { color: colors.text.primary }]}>
                    {editedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.weightInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text.primary,
                    borderColor: colors.border 
                  }]}
                  value={editedWeight}
                  onChangeText={setEditedWeight}
                  keyboardType="numeric"
                  placeholder="Enter weight"
                  placeholderTextColor={colors.text.tertiary}
                  returnKeyType="done"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setEditWeight(null)}
                  >
                    <Text style={[styles.buttonText, { color: colors.text.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={() => editWeight && handleEditSubmit(editWeight)}
                  >
                    <Text style={[styles.buttonText, styles.saveButtonText, { color: '#fff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <DatePickerModal
        visible={showDateModal}
        currentDate={editedDate}
        onClose={() => setShowDateModal(false)}
        onDateSelected={date => {
          setEditedDate(date);
          setShowDateModal(false);
        }}
      />

      <TimePickerModal
        visible={showTimeModal}
        currentDate={editedDate}
        onClose={() => setShowTimeModal(false)}
        onTimeSelected={date => {
          setEditedDate(date);
          setShowTimeModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightInputSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 16,
    width: 80,
    borderWidth: 1,
  },
  editButton: {
    paddingHorizontal: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalForm: {
    gap: 12,
  },
  dateTimeButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateTimeButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  weightInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 8,
  },
  list: {
    flex: 1,
  },
  weightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dateTimeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  weightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 2,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
  },
  weightText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
  },
});