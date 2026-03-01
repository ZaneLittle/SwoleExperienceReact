import { useMemo } from 'react'
import { Weight } from '../lib/models/Weight'
import { Average } from '../lib/models/Average'

interface DailyStat {
  date: Date;
  dateStr: string;
  min: number;
  max: number;
  avg: number;
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
  }
  stats: WeightStats;
}

export function useDailyStats(weights: Weight[], averages: Average[]): DailyStatsResult {
  return useMemo(() => {
    if (!weights.length) {
      return { 
        dailyStats: [], 
        averageData: [], 
        yDomain: { min: 0, max: 100 },
        stats: { currentWeight: 0, threeDayChange: 0, sevenDayChange: 0 },
      }
    }

    // Get the full date range from the data
    const allDates = weights.map(w => {
      const date = new Date(w.dateTime)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    })
    
    const startDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const endDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // Create array of all dates in the range
    const dates: Array<{
      date: Date;
      dateStr: string;
      weights: number[];
    }> = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push({
        date: new Date(currentDate),
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weights: [],
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in weights for each day
    weights.forEach(weight => {
        // Truncate time to get just the date
        const weightDate = new Date(weight.dateTime.getFullYear(), weight.dateTime.getMonth(), weight.dateTime.getDate())
        const day = dates.find(d => {
          const dayDate = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate())
          return dayDate.getTime() === weightDate.getTime()
        })
        if (day) {
          day.weights.push(weight.weight)
        }
      })

    // Get days that have weight data
    const daysWithData = dates.filter(day => day.weights.length > 0)

    // Create daily stats only for days with data
    const dailyStats = daysWithData.map(({ date, dateStr, weights }) => ({
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // Ensure date is normalized to midnight
      dateStr: dateStr,
      min: Math.min(...weights),
      max: Math.max(...weights),
      avg: weights.reduce((sum, w) => sum + w, 0) / weights.length,
    }))

    // Use the averages from AverageService instead of recalculating
    // Sort averages in ascending order (oldest first) for proper chart display
    const sortedAverages = [...averages].sort((a, b) => a.date.getTime() - b.date.getTime())
    const averageData = sortedAverages.map(avg => ({
      date: avg.date,
      average: avg.average,
      threeDayAverage: avg.threeDayAverage,
      sevenDayAverage: avg.sevenDayAverage,
    }))

    // Calculate min and max values across all series
    const allValues = [
      ...dailyStats.map(ds => ds.min),
      ...dailyStats.map(ds => ds.max),
      ...dailyStats.map(ds => ds.avg),
      ...averageData.map(ad => ad.average),
      ...averageData.map(ad => ad.threeDayAverage).filter((v): v is number => v !== null),
      ...averageData.map(ad => ad.sevenDayAverage).filter((v): v is number => v !== null),
    ]

    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)
    
    // Add 2 pounds padding
    const yDomain = {
      min: Math.floor(minValue) - 2,
      max: Math.ceil(maxValue) + 2,
    }

    // Helper function to normalize date to midnight for comparison
    const normalizeDate = (date: Date): Date => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    }

    // Calculate stats for the component
    const calculateStats = (): WeightStats => {
      if (!sortedAverages.length) return { currentWeight: 0, threeDayChange: 0, sevenDayChange: 0 }
      
      // Get the most recent average entry (last in sorted array)
      const latestAverage = sortedAverages[sortedAverages.length - 1]
      const latestDate = normalizeDate(latestAverage.date)
      
      // Calculate current weight as average of 1-day, 3-day, and 7-day averages where available
      const availableAverages: number[] = []
      if (latestAverage.average != null) {
        availableAverages.push(latestAverage.average)
      }
      if (latestAverage.threeDayAverage != null) {
        availableAverages.push(latestAverage.threeDayAverage)
      }
      if (latestAverage.sevenDayAverage != null) {
        availableAverages.push(latestAverage.sevenDayAverage)
      }
      
      const currentWeight = availableAverages.length > 0
        ? availableAverages.reduce((sum, avg) => sum + avg, 0) / availableAverages.length
        : 0

      // Helper function to calculate change for a given day offset and average type
      const calculateChange = (
        daysAgo: number,
        currentAverage: number | null,
        getAverage: (avg: Average) => number | null,
      ): number => {
        if (currentAverage == null) return 0

        const targetDate = new Date(latestDate)
        targetDate.setDate(targetDate.getDate() - daysAgo)
        const targetDateNormalized = normalizeDate(targetDate)
        
        // Find average entry closest to target date (within 1 day tolerance)
        // Only consider entries that are before the latest date
        const candidates = sortedAverages
          .filter(a => {
            const aDateNormalized = normalizeDate(a.date)
            return getAverage(a) != null && aDateNormalized.getTime() < latestDate.getTime()
          })
          .map(a => {
            const aDateNormalized = normalizeDate(a.date)
            const daysDiff = Math.abs(aDateNormalized.getTime() - targetDateNormalized.getTime()) / (24 * 60 * 60 * 1000)
            return {
              average: a,
              daysDiff,
            }
          })
          .filter(c => c.daysDiff <= 1)
          .sort((a, b) => a.daysDiff - b.daysDiff)
        
        if (candidates.length > 0) {
          const startAverage = getAverage(candidates[0].average)
          return startAverage != null ? currentAverage - startAverage : 0
        }
        return 0
      }

      // Calculate rolling trends: compare current average with average from N days ago
      const threeDayChange = calculateChange(
        3,
        latestAverage.threeDayAverage,
        (a) => a.threeDayAverage,
      )
      
      const sevenDayChange = calculateChange(
        7,
        latestAverage.sevenDayAverage,
        (a) => a.sevenDayAverage,
      )

      return { currentWeight, threeDayChange, sevenDayChange }
    }

    const stats = calculateStats()

    return { dailyStats, averageData, yDomain, stats }
  }, [weights, averages])
}