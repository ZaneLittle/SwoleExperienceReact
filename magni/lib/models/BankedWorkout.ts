import { SetDetail, Workout, WORKOUT_CONSTRAINTS, getSyncGroupId } from './Workout'

/**
 * A snapshot of a workout that has been "saved for later" — removed from the
 * active program but preserved with its weights, reps, set details, notes, and
 * exercise-max linkage so it can be restored without re-entering data.
 *
 * Day-specific relationships (alt/superset parents, day, dayOrder) are NOT
 * preserved because they only make sense within a specific program day.
 */
export interface BankedWorkout {
  id: string;
  sharedWorkoutId?: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
  setDetails?: SetDetail[];
  exerciseMaxId?: string;
  maxPercentage?: number;
  bankedAt: string;
}

export const BankedWorkoutConverter = {
  toData: (banked: BankedWorkout): BankedWorkout => banked,
  fromData: (data: BankedWorkout): BankedWorkout => data,
}

export class BankedWorkoutValidator {
  static validate(banked: BankedWorkout): void {
    if (!banked.id || banked.id.trim() === '') {
      throw new Error('Banked workout must have an id.')
    }
    if (!banked.name || banked.name.trim() === '') {
      throw new Error('Banked workout must have a name.')
    }
    if (!banked.bankedAt || isNaN(Date.parse(banked.bankedAt))) {
      throw new Error('Banked workout must have a valid bankedAt timestamp.')
    }
    if (banked.notes && banked.notes.length > WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT) {
      throw new Error(`Notes cannot exceed ${WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT} characters.`)
    }
    if (banked.weight > WORKOUT_CONSTRAINTS.WEIGHT_LIMIT) {
      throw new Error(`Weight cannot exceed ${WORKOUT_CONSTRAINTS.WEIGHT_LIMIT}.`)
    }
    if (banked.reps > WORKOUT_CONSTRAINTS.REPS_LIMIT) {
      throw new Error(`Reps cannot exceed ${WORKOUT_CONSTRAINTS.REPS_LIMIT}.`)
    }
    if (banked.sets > WORKOUT_CONSTRAINTS.SETS_LIMIT) {
      throw new Error(`Sets cannot exceed ${WORKOUT_CONSTRAINTS.SETS_LIMIT}.`)
    }
    if (banked.setDetails) {
      for (const detail of banked.setDetails) {
        if (detail.weight > WORKOUT_CONSTRAINTS.WEIGHT_LIMIT) {
          throw new Error(`Weight cannot exceed ${WORKOUT_CONSTRAINTS.WEIGHT_LIMIT}.`)
        }
        if (detail.reps > WORKOUT_CONSTRAINTS.REPS_LIMIT) {
          throw new Error(`Reps cannot exceed ${WORKOUT_CONSTRAINTS.REPS_LIMIT}.`)
        }
      }
    }
  }

  static hasSetDetails(banked: BankedWorkout): boolean {
    return !!(banked.setDetails && banked.setDetails.length > 0)
  }
}

/**
 * The sync group identifier for a banked workout — same idea as
 * `getSyncGroupId` for Workout, but defined here so BankedWorkout doesn't
 * need to be widened to a full Workout shape.
 */
export function getBankedSyncGroupId(banked: BankedWorkout): string {
  return banked.sharedWorkoutId ?? banked.id
}

/**
 * Returns the subset of `banked` whose sync group is NOT currently represented
 * by any active program workout. Used to keep the workout library from showing
 * the same exercise twice — once as "Program" and once as "Bank" — when a user
 * banked an exercise that is still scheduled in another day. Once all active
 * copies are removed, the banked entry surfaces in the library again.
 */
export function filterBankForActivePrograms(
  banked: BankedWorkout[],
  activeWorkouts: Workout[],
): BankedWorkout[] {
  const activeSyncGroups = new Set(activeWorkouts.map(getSyncGroupId))
  return banked.filter(entry => !activeSyncGroups.has(getBankedSyncGroupId(entry)))
}

/**
 * Build a BankedWorkout snapshot from any Workout-shaped value.
 * Day-specific fields are stripped; weights/reps/setDetails/notes/exerciseMax
 * are preserved by value (deep-copied where mutable).
 */
export function bankedWorkoutFromWorkout(
  workout: Workout,
  options?: { id?: string; bankedAt?: Date | string },
): BankedWorkout {
  const id = options?.id ?? `bank-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const bankedAt = typeof options?.bankedAt === 'string'
    ? options.bankedAt
    : (options?.bankedAt ?? new Date()).toISOString()

  return {
    id,
    sharedWorkoutId: workout.sharedWorkoutId ?? workout.id,
    name: workout.name,
    weight: workout.weight,
    sets: workout.sets,
    reps: workout.reps,
    notes: workout.notes,
    setDetails: workout.setDetails?.map(detail => ({ ...detail })),
    exerciseMaxId: workout.exerciseMaxId,
    maxPercentage: workout.maxPercentage,
    bankedAt,
  }
}
