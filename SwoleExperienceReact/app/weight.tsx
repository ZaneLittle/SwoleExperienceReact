import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Text, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WeightEntryForm } from '../components/weight/WeightEntryForm';
import { WeightChart } from '../components/weight/WeightChart';
import { WeightHistory } from '../components/weight/WeightHistory';
import { Weight } from '../lib/models/Weight';
import { Average } from '../lib/models/Average';
import { weightService } from '../lib/services/WeightService';
import { averageService } from '../lib/services/AverageService';
import { useThemeColors } from '../hooks/useThemeColors';

export default function WeightScreen() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [averages, setAverages] = useState<Average[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  const loadData = async () => {
    try {
      setLoading(true);
      const [weightsData, averagesData] = await Promise.all([
        weightService.getWeights(),
        averageService.getAverages(),
      ]);
      setWeights(weightsData);
      setAverages(averagesData);
    } catch (error) {
      console.error('Error loading weight data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when the screen comes into focus (e.g., when switching tabs)
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [loading])
  );

  const handleWeightAdded = () => {
    loadData();
  };

  const handleWeightsChanged = () => {
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <WeightEntryForm onWeightAdded={handleWeightAdded} />
      
      <WeightChart weights={weights} averages={averages} />
      
      <WeightHistory
        weights={weights}
        onWeightDeleted={handleWeightsChanged}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});


