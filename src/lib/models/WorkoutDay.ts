import { Workout, WorkoutConverter } from './Workout';

export interface WorkoutDay extends Workout {
  day: number;
  dayOrder: number;
}

export const WorkoutDayConverter = {
  toData: (workoutDay: WorkoutDay): WorkoutDay => workoutDay,
  fromData: (data: WorkoutDay): WorkoutDay => data,
};

export class WorkoutDayValidator {
  static altExists(workoutDay: WorkoutDay, workouts: Workout[]): boolean {
    return workouts.some(w => w.id === workoutDay.altParentId);
  }

  static supersetExists(workoutDay: WorkoutDay, workouts: Workout[]): boolean {
    return workouts.some(w => w.id === workoutDay.supersetParentId);
  }

  static isAlternative(workoutDay: WorkoutDay, workouts: Workout[]): boolean {
    return workouts.some(w => w.altParentId === workoutDay.id);
  }

  static isSuperset(workoutDay: WorkoutDay, workouts: Workout[]): boolean {
    return workouts.some(w => w.supersetParentId === workoutDay.id);
  }
}
