import { Workout, WorkoutData, WorkoutConverter } from './Workout';

export interface WorkoutHistory extends Workout {
  workoutId: string;
  date: string;
}

export interface WorkoutHistoryData extends WorkoutData {
  workoutId: string;
  date: string;
}

export const WorkoutHistoryConverter = {
  toData: (workoutHistory: WorkoutHistory): WorkoutHistoryData => ({
    ...WorkoutConverter.toData(workoutHistory),
    workoutId: workoutHistory.workoutId,
    date: workoutHistory.date,
  }),

  fromData: (data: WorkoutHistoryData): WorkoutHistory => ({
    ...WorkoutConverter.fromData(data),
    workoutId: data.workoutId,
    date: data.date,
  }),
};

export class WorkoutHistoryValidator {
  static altExists(workoutHistory: WorkoutHistory, workouts: WorkoutHistory[]): boolean {
    return workouts.some(w => w.workoutId === workoutHistory.altParentId);
  }

  static supersetExists(workoutHistory: WorkoutHistory, workouts: WorkoutHistory[]): boolean {
    return workouts.some(w => w.workoutId === workoutHistory.supersetParentId);
  }

  static isAlternative(workoutHistory: WorkoutHistory, workouts: Workout[]): boolean {
    return workouts.some(w => w.altParentId === workoutHistory.workoutId);
  }

  static isSuperset(workoutHistory: WorkoutHistory, workouts: Workout[]): boolean {
    return workouts.some(w => w.supersetParentId === workoutHistory.workoutId);
  }
}
