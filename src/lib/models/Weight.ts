export interface Weight {
  id: string;
  dateTime: Date;
  weight: number;
}

export interface WeightData {
  id: string;
  dateTime: string;
  weight: number;
}

export const WeightConverter = {
  toData: (weight: Weight): WeightData => ({
    id: weight.id,
    dateTime: weight.dateTime.toISOString(),
    weight: weight.weight,
  }),

  fromData: (data: WeightData): Weight => ({
    id: data.id,
    dateTime: new Date(data.dateTime),
    weight: data.weight,
  }),
};
