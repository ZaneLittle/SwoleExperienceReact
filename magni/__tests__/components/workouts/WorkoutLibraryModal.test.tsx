import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { WorkoutLibraryModal } from '../../../components/workouts/WorkoutLibraryModal'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'
import { BankedWorkout } from '../../../lib/models/BankedWorkout'

jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
    },
    border: '#C6C6C8',
  }),
}))

const buildActive = (overrides: Partial<WorkoutDay> = {}): WorkoutDay => ({
  id: 'active-1',
  name: 'Bench Press',
  weight: 135,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
})

const buildBanked = (overrides: Partial<BankedWorkout> = {}): BankedWorkout => ({
  id: 'bank-1',
  sharedWorkoutId: 'sync-1',
  name: 'Squat',
  weight: 225,
  sets: 5,
  reps: 5,
  bankedAt: '2024-06-01T12:00:00.000Z',
  ...overrides,
})

const renderModal = (overrides: Partial<React.ComponentProps<typeof WorkoutLibraryModal>> = {}) => {
  const props = {
    activeWorkouts: [buildActive()] as WorkoutDay[],
    bankedWorkouts: [buildBanked()] as BankedWorkout[],
    onSelectActive: jest.fn(),
    onSelectBanked: jest.fn(),
    onClose: jest.fn(),
    onDeleteBanked: jest.fn(),
    ...overrides,
  }
  return { ...render(<WorkoutLibraryModal {...props} />), props }
}

describe('WorkoutLibraryModal', () => {
  describe('Rendering', () => {
    it('shows both active and banked workouts by default', () => {
      const { getByText } = renderModal()
      expect(getByText('Bench Press')).toBeTruthy()
      expect(getByText('Squat')).toBeTruthy()
    })

    it('labels active and banked workouts with badges', () => {
      const { getAllByText } = renderModal()
      // 'Program' and 'Bank' appear both as filter chips and as item badges.
      expect(getAllByText('Program').length).toBeGreaterThanOrEqual(2)
      expect(getAllByText('Bank').length).toBeGreaterThanOrEqual(2)
    })

    it('shows the saved-on metadata for banked entries', () => {
      const { getByText } = renderModal()
      expect(getByText(/Saved/)).toBeTruthy()
    })
  })

  describe('Search filter', () => {
    it('filters entries by name (case-insensitive)', () => {
      const { getByPlaceholderText, queryByText } = renderModal({
        activeWorkouts: [buildActive({ name: 'Bench Press' })],
        bankedWorkouts: [buildBanked({ name: 'Squat' })],
      })

      const search = getByPlaceholderText('Search by name')
      fireEvent.changeText(search, 'squa')

      expect(queryByText('Squat')).toBeTruthy()
      expect(queryByText('Bench Press')).toBeNull()
    })

    it('shows a search-specific empty message when nothing matches', () => {
      const { getByPlaceholderText, getByText } = renderModal()
      fireEvent.changeText(getByPlaceholderText('Search by name'), 'nothingmatches')
      expect(getByText('No workouts match "nothingmatches"')).toBeTruthy()
    })
  })

  describe('Source filter', () => {
    it('hides banked workouts when filter is set to Program', () => {
      const { getByLabelText, queryByText, getAllByText } = renderModal()
      fireEvent.press(getByLabelText('Filter by Program'))

      expect(queryByText('Squat')).toBeNull()
      // 'Bench Press' is shown along with its 'Program' badge
      expect(getAllByText('Bench Press').length).toBeGreaterThan(0)
    })

    it('hides active workouts when filter is set to Bank', () => {
      const { getByLabelText, getByText, queryByText } = renderModal()
      fireEvent.press(getByLabelText('Filter by Bank'))

      expect(queryByText('Bench Press')).toBeNull()
      expect(getByText('Squat')).toBeTruthy()
    })

    it('shows source-specific empty state for Bank when bank is empty', () => {
      const { getByLabelText, getByText, queryByText } = renderModal({ bankedWorkouts: [] })
      fireEvent.press(getByLabelText('Filter by Bank'))
      expect(queryByText('Squat')).toBeNull()
      expect(getByText('Your workout bank is empty')).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('calls onSelectActive when an active workout is pressed', () => {
      const onSelectActive = jest.fn()
      const onSelectBanked = jest.fn()
      const active = buildActive()
      const { getByLabelText } = renderModal({
        activeWorkouts: [active],
        bankedWorkouts: [],
        onSelectActive,
        onSelectBanked,
      })

      fireEvent.press(getByLabelText(`Add ${active.name} from program`))

      expect(onSelectActive).toHaveBeenCalledWith(active)
      expect(onSelectBanked).not.toHaveBeenCalled()
    })

    it('calls onSelectBanked when a banked workout is pressed', () => {
      const onSelectActive = jest.fn()
      const onSelectBanked = jest.fn()
      const banked = buildBanked()
      const { getByLabelText } = renderModal({
        activeWorkouts: [],
        bankedWorkouts: [banked],
        onSelectActive,
        onSelectBanked,
      })

      fireEvent.press(getByLabelText(`Add ${banked.name} from bank`))

      expect(onSelectBanked).toHaveBeenCalledWith(banked)
      expect(onSelectActive).not.toHaveBeenCalled()
    })

    it('calls onDeleteBanked when the remove button is pressed', () => {
      const onDeleteBanked = jest.fn()
      const banked = buildBanked()
      const { getByLabelText } = renderModal({
        activeWorkouts: [],
        bankedWorkouts: [banked],
        onDeleteBanked,
      })

      fireEvent.press(getByLabelText(`Remove ${banked.name} from bank`))
      expect(onDeleteBanked).toHaveBeenCalledWith(banked)
    })
  })

  describe('Close', () => {
    it('calls onClose when the close button is pressed', () => {
      const onClose = jest.fn()
      const { getByLabelText } = renderModal({ onClose })
      fireEvent.press(getByLabelText('Close workout library'))
      expect(onClose).toHaveBeenCalled()
    })
  })
})
