import { v4 } from 'react-native-uuid';
import { Weight } from '../../lib/models/Weight';
import { Average } from '../../lib/models/Average';
import { Workout } from '../../lib/models/Workout';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { WorkoutHistory } from '../../lib/models/WorkoutHistory';

// Helper to create mock weights
export const createMockWeight = (overrides?: Partial<Weight>): Weight => ({
  id: v4() as string,
  dateTime: new Date(),
  weight: 180.0,
  ...overrides,
});

// Helper to create mock averages
export const createMockAverage = (overrides?: Partial<Average>): Average => ({
  date: new Date(),
  average: 180.0,
  threeDayAverage: null,
  sevenDayAverage: null,
  ...overrides,
});

// Helper to create mock workouts
export const createMockWorkout = (overrides?: Partial<Workout>): Workout => ({
  id: v4() as string,
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  ...overrides,
});

// Helper to create mock workout days
export const createMockWorkoutDay = (overrides?: Partial<WorkoutDay>): WorkoutDay => ({
  id: v4() as string,
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
});

// Helper to create mock workout history
export const createMockWorkoutHistory = (overrides?: Partial<WorkoutHistory>): WorkoutHistory => ({
  id: v4() as string,
  workoutId: v4() as string,
  date: '2024-01-15',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  ...overrides,
});

// Helper to create a series of mock weights
export const createMockWeights = (count: number, startWeight: number = 180): Weight[] => {
  const weights: Weight[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - i)); // Go back in time
    weights.push(createMockWeight({ dateTime: date, weight: startWeight + i }));
  }
  return weights;
};

// Helper to create a series of mock workout days
export const createMockWorkoutDays = (count: number, day: number = 1): WorkoutDay[] => {
  const workoutDays: WorkoutDay[] = [];
  for (let i = 0; i < count; i++) {
    workoutDays.push(createMockWorkoutDay({ 
      id: `workout-${i}`,
      name: `Exercise ${i}`,
      weight: 100 + i * 10,
      day,
      dayOrder: i 
    }));
  }
  return workoutDays;
};
