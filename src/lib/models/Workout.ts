export interface Workout {
  id: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
  supersetParentId?: string;
  altParentId?: string;
}

export interface WorkoutData {
  id: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
  supersetParentId?: string;
  altParentId?: string;
}

export const WorkoutConverter = {
  toData: (workout: Workout): WorkoutData => ({
    id: workout.id,
    name: workout.name,
    weight: workout.weight,
    sets: workout.sets,
    reps: workout.reps,
    notes: workout.notes,
    supersetParentId: workout.supersetParentId,
    altParentId: workout.altParentId,
  }),

  fromData: (data: WorkoutData): Workout => ({
    id: data.id,
    name: data.name,
    weight: data.weight,
    sets: data.sets,
    reps: data.reps,
    notes: data.notes,
    supersetParentId: data.supersetParentId,
    altParentId: data.altParentId,
  }),
};

// Validation constants
export const WORKOUT_CONSTRAINTS = {
  NOTES_LENGTH_LIMIT: 256,
  WEIGHT_LIMIT: 9999,
  SETS_LIMIT: 9999,
  REPS_LIMIT: 9999,
} as const;

export class WorkoutValidator {
  static validate(workout: Workout): void {
    if (workout.notes && workout.notes.length > WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT) {
      throw new Error(`Notes cannot exceed ${WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT} characters.`);
    }
    if (workout.weight > WORKOUT_CONSTRAINTS.WEIGHT_LIMIT) {
      throw new Error(`Weight cannot exceed ${WORKOUT_CONSTRAINTS.WEIGHT_LIMIT}.`);
    }
    if (workout.reps > WORKOUT_CONSTRAINTS.REPS_LIMIT) {
      throw new Error(`Reps cannot exceed ${WORKOUT_CONSTRAINTS.REPS_LIMIT}.`);
    }
    if (workout.sets > WORKOUT_CONSTRAINTS.SETS_LIMIT) {
      throw new Error(`Sets cannot exceed ${WORKOUT_CONSTRAINTS.SETS_LIMIT}.`);
    }
  }

  static hasNote(workout: Workout): boolean {
    return !!(workout.notes && workout.notes.trim() !== '');
  }

  static getAlternatives(workout: Workout, workoutList: Workout[]): Workout[] {
    const id = workout.id;
    return workoutList.filter(w => w.altParentId === id);
  }

  static getSupersets(workout: Workout, workoutList: Workout[]): Workout[] {
    const id = workout.id;
    return workoutList.filter(w => w.supersetParentId === id);
  }
}
