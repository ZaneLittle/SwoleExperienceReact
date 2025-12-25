import { Workout } from './Workout'

export interface WorkoutHistory extends Workout {
  workoutId: string;
  date: string;
}

export const WorkoutHistoryConverter = {
  toData: (workoutHistory: WorkoutHistory): WorkoutHistory => workoutHistory,
  fromData: (data: WorkoutHistory): WorkoutHistory => data,
}

export class WorkoutHistoryValidator {
  static altExists(workoutHistory: WorkoutHistory, workouts: WorkoutHistory[]): boolean {
    return workouts.some(w => w.workoutId === workoutHistory.altParentId)
  }

  static supersetExists(workoutHistory: WorkoutHistory, workouts: WorkoutHistory[]): boolean {
    return workouts.some(w => w.workoutId === workoutHistory.supersetParentId)
  }

  static isAlternative(workoutHistory: WorkoutHistory, workouts: Workout[]): boolean {
    return workouts.some(w => w.altParentId === workoutHistory.workoutId)
  }

  static isSuperset(workoutHistory: WorkoutHistory, workouts: Workout[]): boolean {
    return workouts.some(w => w.supersetParentId === workoutHistory.workoutId)
  }
}
