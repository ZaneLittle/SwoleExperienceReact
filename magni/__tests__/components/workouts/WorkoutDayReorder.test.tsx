import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import WorkoutDayReorder from '../../../components/workouts/WorkoutDayReorder'
import { workoutService } from '../../../lib/services/WorkoutService'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

jest.mock('expo-router', () => {
  return {
    useFocusEffect: (effect: () => void | (() => void)) =>
      jest.requireActual<typeof import('react')>('react').useEffect(effect, [effect]),
  }
})
jest.mock('../../../lib/services/WorkoutService')
jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#dddddd',
    primary: '#0066cc',
    text: { primary: '#111111', secondary: '#666666' },
  }),
}))
jest.mock('../../../utils/confirm', () => ({ confirmAlert: jest.fn() }))

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>

const workout = (day: number): WorkoutDay => ({
  id: `workout-${day}`,
  name: `Exercise ${day}`,
  weight: 100,
  sets: 3,
  reps: 10,
  day,
  dayOrder: 0,
})

describe('WorkoutDayReorder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders no extra empty day after the final programmed day', async () => {
    mockWorkoutService.getWorkouts.mockResolvedValue([1, 2, 3, 4].map(workout))
    mockWorkoutService.getUniqueDays.mockResolvedValue(4)

    const { getByTestId, queryByTestId } = render(
      <WorkoutDayReorder onBack={jest.fn()} />,
    )

    await waitFor(() => expect(getByTestId('program-day-row-4')).toBeTruthy())

    expect(queryByTestId('program-day-row-5')).toBeNull()
  })
})
