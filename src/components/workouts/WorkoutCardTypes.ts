import { Workout } from '../../lib/models/Workout';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { WorkoutHistory } from '../../lib/models/WorkoutHistory';

export type WorkoutCardWorkout = Workout | WorkoutDay | WorkoutHistory;

export interface WorkoutCardConfig {
  allowDelete: boolean;
  allowUpdate: boolean;
  isSupersetsEnabled: boolean;
  isAlternativesEnabled: boolean;
  isProgressionHelperEnabled: boolean;
}

export interface WorkoutCardCallbacks {
  onDelete?: (workout: WorkoutDay) => void;
  onUpdate?: (workout: WorkoutDay) => void;
}

export interface WorkoutCardData {
  workout: WorkoutCardWorkout;
  workoutsInDay: WorkoutDay[];
  alternatives: Workout[];
  supersets: Workout[];
}

export interface WorkoutCardProps extends WorkoutCardConfig, WorkoutCardCallbacks, WorkoutCardData {}
