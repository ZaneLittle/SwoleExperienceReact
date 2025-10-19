import { Workout, WorkoutData, WorkoutConverter } from './Workout';

export interface WorkoutDay extends Workout {
  day: number;
  dayOrder: number;
}

export interface WorkoutDayData extends WorkoutData {
  day: number;
  dayOrder: number;
}

export const WorkoutDayConverter = {
  toData: (workoutDay: WorkoutDay): WorkoutDayData => ({
    ...WorkoutConverter.toData(workoutDay),
    day: workoutDay.day,
    dayOrder: workoutDay.dayOrder,
  }),

  fromData: (data: WorkoutDayData): WorkoutDay => ({
    ...WorkoutConverter.fromData(data),
    day: data.day,
    dayOrder: data.dayOrder,
  }),
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
