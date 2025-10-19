import { useMemo } from 'react';
import { Weight } from '../lib/models/Weight';
import { Average } from '../lib/models/Average';

interface DailyStat {
  date: Date;
  dateStr: string;
  min: number;
  max: number;
  avg: number;
}

interface AverageDataPoint {
  date: Date;
  average: number | null;
  threeDayAverage: number | null;
  sevenDayAverage: number | null;
}

interface AverageData {
  date: Date;
  average: number;
  threeDayAverage: number | null;
  sevenDayAverage: number | null;
}

interface WeightStats {
  currentWeight: number;
  threeDayChange: number;
  sevenDayChange: number;
}

interface DailyStatsResult {
  dailyStats: DailyStat[];
  averageData: AverageData[];
  yDomain: {
    min: number;
    max: number;
  };
  stats: WeightStats;
}

export function useDailyStats(weights: Weight[], averages: Average[]): DailyStatsResult {
  return useMemo(() => {
    if (!weights.length) {
      return { 
        dailyStats: [], 
        averageData: [], 
        yDomain: { min: 0, max: 100 },
        stats: { currentWeight: 0, threeDayChange: 0, sevenDayChange: 0 }
      };
    }

    // Get the full date range from the data
    const allDates = weights.map(w => {
      const date = new Date(w.dateTime);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });
    
    const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Create array of all dates in the range
    const dates: Array<{
      date: Date;
      dateStr: string;
      weights: number[];
    }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push({
        date: new Date(currentDate),
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weights: []
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in weights for each day
    weights.forEach(weight => {
        // Truncate time to get just the date
        const weightDate = new Date(weight.dateTime.getFullYear(), weight.dateTime.getMonth(), weight.dateTime.getDate());
        const day = dates.find(d => {
          const dayDate = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate());
          return dayDate.getTime() === weightDate.getTime();
        });
        if (day) {
          day.weights.push(weight.weight);
        }
      });

    // Get days that have weight data
    const daysWithData = dates.filter(day => day.weights.length > 0);

    // Create daily stats only for days with data
    const dailyStats = daysWithData.map(({ date, dateStr, weights }) => ({
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // Ensure date is normalized to midnight
      dateStr: dateStr,
      min: Math.min(...weights),
      max: Math.max(...weights),
      avg: weights.reduce((sum, w) => sum + w, 0) / weights.length,
    }));

    // Use the averages from AverageService instead of recalculating
    // Sort averages in ascending order (oldest first) for proper chart display
    const sortedAverages = [...averages].sort((a, b) => a.date.getTime() - b.date.getTime());
    const averageData = sortedAverages.map(avg => ({
      date: avg.date,
      average: avg.average,
      threeDayAverage: avg.threeDayAverage,
      sevenDayAverage: avg.sevenDayAverage,
    }));

    // Calculate min and max values across all series
    const allValues = [
      ...dailyStats.map(ds => ds.min),
      ...dailyStats.map(ds => ds.max),
      ...dailyStats.map(ds => ds.avg),
      ...averageData.map(ad => ad.average),
      ...averageData.map(ad => ad.threeDayAverage).filter((v): v is number => v !== null),
      ...averageData.map(ad => ad.sevenDayAverage).filter((v): v is number => v !== null)
    ];

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // Add 2 pounds padding
    const yDomain = {
      min: Math.floor(minValue) - 2,
      max: Math.ceil(maxValue) + 2
    };

    // Calculate stats for the component
    const calculateStats = (): WeightStats => {
      if (!averages.length) return { currentWeight: 0, threeDayChange: 0, sevenDayChange: 0 };
      
      // Find the most recent averages that have values
      const latestWithSevenDay = averages.find(a => a.sevenDayAverage !== null);
      const latestWithThreeDay = averages.find(a => a.threeDayAverage !== null);
      
      const currentWeight = latestWithSevenDay?.sevenDayAverage || 
                           latestWithThreeDay?.threeDayAverage || 
                           averages[0].average;

      // Calculate changes only if we have enough data
      let threeDayChange = 0;
      let sevenDayChange = 0;

      if (latestWithThreeDay && averages.length >= 3) {
        const threeDayStart = averages.find(a => a.threeDayAverage !== null && a !== latestWithThreeDay);
        if (threeDayStart) {
          threeDayChange = latestWithThreeDay.threeDayAverage! - threeDayStart.threeDayAverage!;
        }
      }

      if (latestWithSevenDay && averages.length >= 7) {
        const sevenDayStart = averages.find(a => a.sevenDayAverage !== null && a !== latestWithSevenDay);
        if (sevenDayStart) {
          sevenDayChange = latestWithSevenDay.sevenDayAverage! - sevenDayStart.sevenDayAverage!;
        }
      }

      return { currentWeight, threeDayChange, sevenDayChange };
    };

    const stats = calculateStats();

    return { dailyStats, averageData, yDomain, stats };
  }, [weights, averages]);
}