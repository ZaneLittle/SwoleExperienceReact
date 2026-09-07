import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { ProgramDayList } from '../../../components/workouts/ProgramDayList'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#0066cc',
    surface: '#ffffff',
    border: '#dddddd',
    text: { primary: '#111111', secondary: '#666666' },
  }),
}))

const workout = (overrides: Partial<WorkoutDay>): WorkoutDay => ({
  id: 'workout',
  name: 'Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
})

describe('ProgramDayList', () => {
  it('shows every day, including an empty day, and summarizes each populated day', () => {
    const { getAllByText, getByText, getByTestId } = render(
      <ProgramDayList
        dayCount={4}
        workouts={[
          workout({ id: 'squat', name: 'Squat', day: 3 }),
          workout({ id: 'bench', name: 'Bench', day: 4 }),
        ]}
        selectedDay={3}
        onSelectDay={jest.fn()}
        onSwapDays={jest.fn()}
      />,
    )

    expect(getByTestId('program-day-row-2')).toBeTruthy()
    expect(getAllByText('No workouts')).toHaveLength(2)
    expect(getByText('Squat')).toBeTruthy()
    expect(getByText('Bench')).toBeTruthy()
  })

  it('uses arrows to request an adjacent day swap', () => {
    const onSwapDays = jest.fn()
    const { getByTestId } = render(
      <ProgramDayList
        dayCount={4}
        workouts={[workout({ day: 3 })]}
        selectedDay={3}
        onSelectDay={jest.fn()}
        onSwapDays={onSwapDays}
      />,
    )

    fireEvent.press(getByTestId('move-day-3-up'))
    fireEvent.press(getByTestId('move-day-3-down'))

    expect(onSwapDays).toHaveBeenNthCalledWith(1, 3, 2)
    expect(onSwapDays).toHaveBeenNthCalledWith(2, 3, 4)
  })

  it('identifies the original and current day at each reordered position', () => {
    const { getByTestId, getByText, queryByText } = render(
      <ProgramDayList
        dayCount={3}
        workouts={[]}
        originalDays={[1, 3, 2]}
        selectedDay={1}
        onSelectDay={jest.fn()}
        onSwapDays={jest.fn()}
      />,
    )

    expect(getByTestId('day-change-arrow-2')).toBeTruthy()
    expect(getByTestId('day-change-arrow-3')).toBeTruthy()
    expect(queryByText('Day 3 -> Day 2')).toBeNull()
    expect(queryByText('Day 2 -> Day 3')).toBeNull()
    expect(getByText('Day 1')).toBeTruthy()
    expect(() => getByText('Day 1 -> Day 1')).toThrow()
  })
})
