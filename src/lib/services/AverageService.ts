import AsyncStorage from '@react-native-async-storage/async-storage';
import { Average, AverageData, AverageConverter } from '../models/Average';
import { Weight } from '../models/Weight';

const AVERAGE_STORAGE_KEY = 'averages';

class AverageService {
  private static instance: AverageService;

  private constructor() {}

  static getInstance(): AverageService {
    if (!AverageService.instance) {
      AverageService.instance = new AverageService();
    }
    return AverageService.instance;
  }

  async getAverages(startDate?: Date): Promise<Average[]> {
    try {
      const averagesJson = await AsyncStorage.getItem(AVERAGE_STORAGE_KEY);
      if (!averagesJson) return [];

      const averagesData: AverageData[] = JSON.parse(averagesJson);
      const averages = averagesData.map(AverageConverter.fromData);

      // Filter to last 60 days
      const cutoffDate = startDate 
        ? new Date(startDate.getTime() - 60 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      return averages
        .filter(average => average.date >= cutoffDate)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting averages:', error);
      return [];
    }
  }

  async calculateAverages(weights: Weight[]): Promise<Average[]> {
    try {
      const averages: Average[] = [];
      const weightsByDate = new Map<string, Weight[]>();

      // Group weights by date (truncated to day)
      weights.forEach(weight => {
        const dateKey = this.truncateToDay(weight.dateTime).toISOString().split('T')[0];
        if (!weightsByDate.has(dateKey)) {
          weightsByDate.set(dateKey, []);
        }
        weightsByDate.get(dateKey)!.push(weight);
      });
      
      // Calculate averages for each day
      const sortedDates = Array.from(weightsByDate.keys()).sort();
      
      for (const dateKey of sortedDates) {
        const dayWeights = weightsByDate.get(dateKey)!;
        // Create date in local timezone to match useDailyStats
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        
        // Calculate daily average
        const dailyAverage = dayWeights.reduce((sum, w) => sum + w.weight, 0) / dayWeights.length;
        
        // Calculate 3-day and 7-day averages
        const threeDayAverage = this.calculateRollingAverage(weightsByDate, dateKey, 3);
        const sevenDayAverage = this.calculateRollingAverage(weightsByDate, dateKey, 7);

        averages.push({
          date,
          average: dailyAverage,
          threeDayAverage,
          sevenDayAverage,
        });
      }

      // Store averages
      const averagesData = averages.map(AverageConverter.toData);
      await AsyncStorage.setItem(AVERAGE_STORAGE_KEY, JSON.stringify(averagesData));

      return averages;
    } catch (error) {
      console.error('Error calculating averages:', error);
      return [];
    }
  }

  private calculateRollingAverage(weightsByDate: Map<string, Weight[]>, currentDate: string, days: number): number | null {
    const currentDateObj = new Date(currentDate);
    const weights: number[] = [];
    const datesUsed: string[] = [];

    // Look for weights within the specified range of days (including current day)
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(currentDateObj.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = checkDate.toISOString().split('T')[0];
      const dayWeights = weightsByDate.get(dateKey);
            
      if (dayWeights && dayWeights.length > 0) {
        const dayAverage = dayWeights.reduce((sum, w) => sum + w.weight, 0) / dayWeights.length;
        weights.push(dayAverage);
        datesUsed.push(dateKey);
      }
    }

    // Return average if we have at least 2 days of data (minimum for meaningful average)
    // For 3-day average, require at least 2 days; for 7-day average, require at least 3 days
    const minRequiredDays = days === 3 ? 2 : Math.max(3, Math.floor(days * 0.6));
    const result = weights.length >= minRequiredDays
      ? weights.reduce((sum, w) => sum + w, 0) / weights.length 
      : null;

    return result;
  }

  private truncateToDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}

export const averageService = AverageService.getInstance();
