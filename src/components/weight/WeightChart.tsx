import React, { useState } from 'react';
import { useDailyStats } from '../../hooks/useDailyStats';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryTheme, VictoryAxis, VictoryGroup, VictoryLine, VictoryScatter, VictoryArea } from 'victory';
import { Weight } from '../../lib/models/Weight';
import { Average } from '../../lib/models/Average';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WeightChartProps {
  weights: Weight[];
  averages: Average[];
}

interface ChartOptions {
  showMinMax: boolean;
  showAverage: boolean;
  showThreeDayAverage: boolean;
  showSevenDayAverage: boolean;
}


export const WeightChart: React.FC<WeightChartProps> = ({ weights, averages }) => {
  const colors = useThemeColors();
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width);
  const [options, setOptions] = React.useState<ChartOptions>({
    showMinMax: true,
    showAverage: true,
    showThreeDayAverage: true,
    showSevenDayAverage: true,
  });


  const renderStatCard = (value: number | undefined, label: string, change?: number, isTrendOnly?: boolean) => {
    const getChevronColor = () => {
      if (label.includes('3 Day')) return 'rgba(75, 192, 192, 1)';
      if (label.includes('7 Day')) return 'rgba(153, 102, 255, 1)';
      return colors.text.secondary;
    };

    return (
      <View style={[styles.statCard, { backgroundColor: colors.background }]}>
        {!isTrendOnly && value !== undefined && (
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{value.toFixed(1)}</Text>
        )}
        {change !== undefined && (
          <View style={styles.trendContainer}>
            <Text style={[styles.changeIcon, { color: getChevronColor() }]}>
              {change > 0 ? '▲' : '▼'}
            </Text>
            <Text style={[styles.changeValue, { color: colors.text.secondary }]}> {Math.abs(change).toFixed(1)}</Text>
          </View>
        )}
        <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{label}</Text>
      </View>
    );
  };


  if (weights.length < 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.text.secondary }]}>
          {weights.length === 0 
            ? 'No weights have been logged' 
            : 'Keep adding weights to see your trends!'
          }
        </Text>
      </View>
    );
  }

  // Prepare chart data
  const { dailyStats, averageData, yDomain, stats } = useDailyStats(weights, averages);
  
  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      onLayout={event => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>Weight Trends</Text>
      
      <View style={styles.statsContainer}>
        {renderStatCard(stats.currentWeight, 'Current')}
        {renderStatCard(undefined, '3 Day Avg', stats.threeDayChange, true)}
        {renderStatCard(undefined, '7 Day Avg', stats.sevenDayChange, true)}
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionToggle, { backgroundColor: colors.background, borderColor: colors.border }, options.showAverage && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={() => setOptions(prev => ({ ...prev, showAverage: !prev.showAverage }))}
        >
          <View style={[styles.legendDot, { backgroundColor: 'rgba(0, 122, 255, 1)' }]} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Average</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionToggle, { backgroundColor: colors.background, borderColor: colors.border }, options.showMinMax && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={() => setOptions(prev => ({ ...prev, showMinMax: !prev.showMinMax }))}
        >
          <View style={[styles.legendDot, { backgroundColor: 'rgba(128, 128, 128, 0.5)', borderWidth: 1, borderColor: 'rgba(128, 128, 128, 0.8)' }]} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Min/Max</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionToggle, { backgroundColor: colors.background, borderColor: colors.border }, options.showThreeDayAverage && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={() => setOptions(prev => ({ ...prev, showThreeDayAverage: !prev.showThreeDayAverage }))}
        >
          <View style={[styles.legendDot, { backgroundColor: 'rgba(75, 192, 192, 1)' }]} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>3-Day Avg</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionToggle, { backgroundColor: colors.background, borderColor: colors.border }, options.showSevenDayAverage && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={() => setOptions(prev => ({ ...prev, showSevenDayAverage: !prev.showSevenDayAverage }))}
        >
          <View style={[styles.legendDot, { backgroundColor: 'rgba(153, 102, 255, 1)' }]} />
          <Text style={[styles.optionText, { color: colors.text.primary }]}>7-Day Avg</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartWrapper}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={containerWidth - 32}
          height={180}
          padding={{ top: 10, bottom: 30, left: 35, right: 20 }}
          domain={{ y: [yDomain.min, yDomain.max] }}
        >
          <VictoryAxis
            tickFormat={(date: any) => {
              if (date instanceof Date) {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              // Handle timestamps (numbers)
              if (typeof date === 'number') {
                return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              // Handle string dates
              if (typeof date === 'string') {
                return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              // Fallback for other types
              return String(date);
            }}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fontSize: 10, padding: 5, angle: -45, fill: colors.text.secondary },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: colors.border },
              grid: { stroke: colors.border + '40' },
              tickLabels: { fontSize: 10, padding: 2, angle: -45, textAnchor: 'end', fill: colors.text.secondary },
            }}
          />
          {options.showMinMax && dailyStats.length > 0 && (
            <VictoryGroup>
              {/* Fill area between min and max */}
              <VictoryArea
                data={dailyStats}
                x="date"
                y="min"
                y0="max"
                style={{
                  data: {
                    fill: 'rgba(128, 128, 128, 0.1)',
                    stroke: 'none',
                  },
                }}
              />
              {/* Min line */}
              <VictoryLine
                data={dailyStats}
                x="date"
                y="min"
                style={{
                  data: {
                    stroke: 'rgba(128, 128, 128, 0.5)',
                    strokeDasharray: '4,4',
                    strokeWidth: 1,
                  },
                }}
              />
              {/* Max line */}
              <VictoryLine
                data={dailyStats}
                x="date"
                y="max"
                style={{
                  data: {
                    stroke: 'rgba(128, 128, 128, 0.5)',
                    strokeDasharray: '4,4',
                    strokeWidth: 1,
                  },
                }}
              />
            </VictoryGroup>
          )}
          {options.showAverage && averageData.length > 0 && (
            <VictoryGroup>
              <VictoryLine
                data={averageData}
                x="date"
                y="average"
                style={{
                  data: { stroke: 'rgba(0, 122, 255, 1)', strokeWidth: 2 },
                }}
              />
              <VictoryScatter
                data={averageData}
                x="date"
                y="average"
                size={4}
                style={{
                  data: { fill: 'rgba(0, 122, 255, 1)' },
                }}
              />
            </VictoryGroup>
          )}
          {options.showThreeDayAverage && averageData.length > 0 && (
            <VictoryGroup>
              <VictoryLine
                data={averageData.filter(d => d.threeDayAverage !== null)}
                x="date"
                y="threeDayAverage"
                style={{
                  data: { stroke: 'rgba(75, 192, 192, 1)', strokeWidth: 2 },
                }}
              />
              <VictoryScatter
                data={averageData.filter(d => d.threeDayAverage !== null)}
                x="date"
                y="threeDayAverage"
                size={4}
                style={{
                  data: { fill: 'rgba(75, 192, 192, 1)' },
                }}
              />
            </VictoryGroup>
          )}
          {options.showSevenDayAverage && averageData.length > 0 && (
            <VictoryGroup>
              <VictoryLine
                data={averageData.filter(d => d.sevenDayAverage !== null)}
                x="date"
                y="sevenDayAverage"
                style={{
                  data: { stroke: 'rgba(153, 102, 255, 1)', strokeWidth: 2 },
                }}
              />
              <VictoryScatter
                data={averageData.filter(d => d.sevenDayAverage !== null)}
                x="date"
                y="sevenDayAverage"
                size={4}
                style={{
                  data: { fill: 'rgba(153, 102, 255, 1)' },
                }}
              />
            </VictoryGroup>
          )}
        </VictoryChart>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 11,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  changeIcon: {
    fontSize: 16,
  },
  changeValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    padding: 40,
  },
});