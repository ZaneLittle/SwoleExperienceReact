export interface Average {
  date: Date;
  average: number;
  threeDayAverage: number | null;
  sevenDayAverage: number | null;
}

export interface AverageData {
  dateTime: string;
  average: number;
  threeDayAverage: number | null;
  sevenDayAverage: number | null;
}

export const AverageConverter = {
  toData: (average: Average): AverageData => ({
    dateTime: average.date.toISOString(),
    average: average.average,
    threeDayAverage: average.threeDayAverage,
    sevenDayAverage: average.sevenDayAverage,
  }),

  fromData: (data: AverageData): Average => ({
    date: new Date(data.dateTime),
    average: data.average,
    threeDayAverage: data.threeDayAverage,
    sevenDayAverage: data.sevenDayAverage,
  }),
};
