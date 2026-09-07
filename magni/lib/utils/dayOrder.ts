import { WorkoutDay } from '../models/WorkoutDay'

export function swapWorkoutDays(
  workouts: WorkoutDay[],
  dayA: number,
  dayB: number,
): WorkoutDay[] {
  if (dayA === dayB) {
    return workouts
  }

  return workouts.map(workout => {
    if (workout.day === dayA) {
      return { ...workout, day: dayB }
    }
    if (workout.day === dayB) {
      return { ...workout, day: dayA }
    }
    return workout
  })
}

export function getProgramDayCount(workouts: WorkoutDay[]): number {
  if (workouts.length === 0) {
    return 0
  }
  return workouts.reduce((max, workout) => Math.max(max, workout.day), 0)
}
