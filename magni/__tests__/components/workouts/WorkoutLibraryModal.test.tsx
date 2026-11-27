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

const renderModal = async (overrides: Partial<React.ComponentProps<typeof WorkoutLibraryModal>> = {}) => {
  const props = {
    activeWorkouts: [buildActive()] as WorkoutDay[],
    bankedWorkouts: [buildBanked()] as BankedWorkout[],
    onSelectActive: jest.fn(),
    onSelectBanked: jest.fn(),
    onClose: jest.fn(),
    onDeleteBanked: jest.fn(),
    ...overrides,
  }
  return { ...await render(<WorkoutLibraryModal {...props} />), props }
}

describe('WorkoutLibraryModal', () => {
  describe('Rendering', () => {
    it('shows both active and banked workouts by default', async () => {
      const { getByText } = await renderModal()
      expect(getByText('Bench Press')).toBeTruthy()
      expect(getByText('Squat')).toBeTruthy()
    })

    it('labels active and banked workouts with badges', async () => {
      const { getAllByText } = await renderModal()
      // 'Program' and 'Bank' appear both as filter chips and as item badges.
      expect(getAllByText('Program').length).toBeGreaterThanOrEqual(2)
      expect(getAllByText('Bank').length).toBeGreaterThanOrEqual(2)
    })

    it('shows the saved-on metadata for banked entries', async () => {
      const { getByText } = await renderModal()
      expect(getByText(/Saved/)).toBeTruthy()
    })
  })

  describe('Search filter', () => {
    it('filters entries by name (case-insensitive)', async () => {
      const { getByPlaceholderText, queryByText } = await renderModal({
        activeWorkouts: [buildActive({ name: 'Bench Press' })],
        bankedWorkouts: [buildBanked({ name: 'Squat' })],
      })

      const search = getByPlaceholderText('Search by name')
      await fireEvent.changeText(search, 'squa')

      expect(queryByText('Squat')).toBeTruthy()
      expect(queryByText('Bench Press')).toBeNull()
    })

    it('shows a search-specific empty message when nothing matches', async () => {
      const { getByPlaceholderText, getByText } = await renderModal()
      await fireEvent.changeText(getByPlaceholderText('Search by name'), 'nothingmatches')
      expect(getByText('No workouts match "nothingmatches"')).toBeTruthy()
    })
  })

  describe('Source filter', () => {
    it('hides banked workouts when filter is set to Program', async () => {
      const { getByLabelText, queryByText, getAllByText } = await renderModal()
      await fireEvent.press(getByLabelText('Filter by Program'))

      expect(queryByText('Squat')).toBeNull()
      // 'Bench Press' is shown along with its 'Program' badge
      expect(getAllByText('Bench Press').length).toBeGreaterThan(0)
    })

    it('hides active workouts when filter is set to Bank', async () => {
      const { getByLabelText, getByText, queryByText } = await renderModal()
      await fireEvent.press(getByLabelText('Filter by Bank'))

      expect(queryByText('Bench Press')).toBeNull()
      expect(getByText('Squat')).toBeTruthy()
    })

    it('shows source-specific empty state for Bank when bank is empty', async () => {
      const { getByLabelText, getByText, queryByText } = await renderModal({ bankedWorkouts: [] })
      await fireEvent.press(getByLabelText('Filter by Bank'))
      expect(queryByText('Squat')).toBeNull()
      expect(getByText('Your workout bank is empty')).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('calls onSelectActive when an active workout is pressed', async () => {
      const onSelectActive = jest.fn()
      const onSelectBanked = jest.fn()
      const active = buildActive()
      const { getByLabelText } = await renderModal({
        activeWorkouts: [active],
        bankedWorkouts: [],
        onSelectActive,
        onSelectBanked,
      })

      await fireEvent.press(getByLabelText(`Add ${active.name} from program`))

      expect(onSelectActive).toHaveBeenCalledWith(active)
      expect(onSelectBanked).not.toHaveBeenCalled()
    })

    it('calls onSelectBanked when a banked workout is pressed', async () => {
      const onSelectActive = jest.fn()
      const onSelectBanked = jest.fn()
      const banked = buildBanked()
      const { getByLabelText } = await renderModal({
        activeWorkouts: [],
        bankedWorkouts: [banked],
        onSelectActive,
        onSelectBanked,
      })

      await fireEvent.press(getByLabelText(`Add ${banked.name} from bank`))

      expect(onSelectBanked).toHaveBeenCalledWith(banked)
      expect(onSelectActive).not.toHaveBeenCalled()
    })

    it('calls onDeleteBanked when the remove button is pressed', async () => {
      const onDeleteBanked = jest.fn()
      const banked = buildBanked()
      const { getByLabelText } = await renderModal({
        activeWorkouts: [],
        bankedWorkouts: [banked],
        onDeleteBanked,
      })

      await fireEvent.press(getByLabelText(`Remove ${banked.name} from bank`))
      expect(onDeleteBanked).toHaveBeenCalledWith(banked)
    })
  })

  describe('Close', () => {
    it('calls onClose when the close button is pressed', async () => {
      const onClose = jest.fn()
      const { getByLabelText } = await renderModal({ onClose })
      await fireEvent.press(getByLabelText('Close workout library'))
      expect(onClose).toHaveBeenCalled()
    })
  })
})
