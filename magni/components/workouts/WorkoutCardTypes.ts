import { Workout } from '../../lib/models/Workout'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { WorkoutHistory } from '../../lib/models/WorkoutHistory'

export interface WorkoutCardCallbacks {
  onDelete?: (workout: WorkoutDay) => void;
  onUpdate?: (workout: WorkoutDay) => void;
}

export interface WorkoutCardData {
  workout: Workout | WorkoutDay | WorkoutHistory;
  workoutsInDay: WorkoutDay[];
  alternatives: Workout[];
  supersets: Workout[];
}

export interface WorkoutCardProps extends WorkoutCardCallbacks, WorkoutCardData {}
