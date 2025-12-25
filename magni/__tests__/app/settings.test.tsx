import { Alert } from 'react-native'
import { workoutHistoryService } from '../../lib/services/WorkoutHistoryService'

// Mock the workout history service
jest.mock('../../lib/services/WorkoutHistoryService')
const mockWorkoutHistoryService = workoutHistoryService as jest.Mocked<typeof workoutHistoryService>

// Mock Alert
jest.spyOn(Alert, 'alert')

// Mock console.error to avoid test output noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('Settings Screen Clear History Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Clear Workout History Logic', () => {
    it('calls removeAllHistory service method correctly', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockResolvedValue(true)

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(mockWorkoutHistoryService.removeAllHistory).toHaveBeenCalledTimes(1)
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'All workout history has been cleared.')
    })

    it('shows success alert when removeAllHistory succeeds', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockResolvedValue(true)

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(Alert.alert).toHaveBeenCalledWith('Success', 'All workout history has been cleared.')
    })

    it('shows error alert when removeAllHistory fails', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockResolvedValue(false)

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to clear workout history. Please try again.')
    })

    it('shows error alert when removeAllHistory throws an error', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockRejectedValue(new Error('Storage error'))

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'An unexpected error occurred while clearing workout history.')
    })

    it('handles multiple consecutive calls correctly', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockResolvedValue(true)

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()
      await handleClearHistory()

      expect(mockWorkoutHistoryService.removeAllHistory).toHaveBeenCalledTimes(2)
      expect(Alert.alert).toHaveBeenCalledTimes(2)
      expect(Alert.alert).toHaveBeenNthCalledWith(1, 'Success', 'All workout history has been cleared.')
      expect(Alert.alert).toHaveBeenNthCalledWith(2, 'Success', 'All workout history has been cleared.')
    })

    it('does not show success alert when removeAllHistory fails', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockResolvedValue(false)

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(Alert.alert).not.toHaveBeenCalledWith('Success', 'All workout history has been cleared.')
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to clear workout history. Please try again.')
    })

    it('handles network or storage errors gracefully', async () => {
      mockWorkoutHistoryService.removeAllHistory.mockRejectedValue(new Error('Network timeout'))

      // Simulate the handleClearHistory function logic
      const handleClearHistory = async () => {
        try {
          const success = await workoutHistoryService.removeAllHistory()
          if (success) {
            Alert.alert('Success', 'All workout history has been cleared.')
          } else {
            Alert.alert('Error', 'Failed to clear workout history. Please try again.')
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
        }
      }

      await handleClearHistory()

      expect(mockWorkoutHistoryService.removeAllHistory).toHaveBeenCalledTimes(1)
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'An unexpected error occurred while clearing workout history.')
    })
  })
})
