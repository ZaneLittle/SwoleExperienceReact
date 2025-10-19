import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Weight, WeightData, WeightConverter } from '../models/Weight';

const WEIGHT_STORAGE_KEY = 'weights';

class WeightService {
  private static instance: WeightService;

  private constructor() {}

  static getInstance(): WeightService {
    if (!WeightService.instance) {
      WeightService.instance = new WeightService();
    }
    return WeightService.instance;
  }

  async getWeights(startDate?: Date): Promise<Weight[]> {
    try {
      const weightsJson = await AsyncStorage.getItem(WEIGHT_STORAGE_KEY);
      if (!weightsJson) return [];

      const weightsData: WeightData[] = JSON.parse(weightsJson);
      const weights = weightsData.map(WeightConverter.fromData);

      // Filter to last 60 days
      const cutoffDate = startDate 
        ? new Date(startDate.getTime() - 60 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      return weights
        .filter(weight => weight.dateTime >= cutoffDate)
        .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    } catch (error) {
      console.error('Error getting weights:', error);
      return [];
    }
  }

  async addWeight(weight: Omit<Weight, 'id'>): Promise<boolean> {
    try {
      const newWeight: Weight = {
        ...weight,
        id: uuid.v4() as string,
      };

      const existingWeights = await this.getWeights();
      const weightsData = [
        WeightConverter.toData(newWeight),
        ...existingWeights.map(WeightConverter.toData)
      ];

      await AsyncStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weightsData));
      return true;
    } catch (error) {
      console.error('Error adding weight:', error);
      return false;
    }
  }

  async removeWeight(id: string): Promise<boolean> {
    try {
      const existingWeights = await this.getWeights();
      const filteredWeights = existingWeights.filter(weight => weight.id !== id);
      const weightsData = filteredWeights.map(WeightConverter.toData);
      
      await AsyncStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weightsData));
      
      return true;
    } catch (error) {
      console.error('Error removing weight:', error);
      return false;
    }
  }

  async updateWeight(weight: Weight): Promise<boolean> {
    try {
      const existingWeights = await this.getWeights();
      const updatedWeights = existingWeights.map(w => 
        w.id === weight.id ? weight : w
      );
      
      const weightsData = updatedWeights.map(WeightConverter.toData);
      await AsyncStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weightsData));
      return true;
    } catch (error) {
      console.error('Error updating weight:', error);
      return false;
    }
  }
}

export const weightService = WeightService.getInstance();
