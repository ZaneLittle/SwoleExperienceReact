import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { workoutService } from '../../../lib/services/WorkoutService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to iOS
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockPlatform = Platform as jest.Mocked<typeof Platform>;

// Mock localStorage for web platform tests
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window object for web platform
const mockWindow = {
  localStorage: mockLocalStorage,
};

describe('WorkoutService - Platform Detection and Hydration Safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    Object.values(mockLocalStorage).forEach(mock => mock.mockClear());
    
    // Clear any existing window mock
    delete (global as any).window;
    delete (global as any).localStorage;
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'ios';
    });

    it('uses AsyncStorage for getCurrentDay on iOS', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(3));

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(3);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });

    it('uses AsyncStorage for setCurrentDay on iOS', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(1));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await workoutService.setCurrentDay(3);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(3));
    });

    it('does not access localStorage on iOS', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(2));

      await workoutService.getCurrentDay();

      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'android';
    });

    it('uses AsyncStorage for getCurrentDay on Android', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(4));

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(4);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });

    it('uses AsyncStorage for setCurrentDay on Android', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(2));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await workoutService.setCurrentDay(5);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(5));
    });

    it('does not access localStorage on Android', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(1));

      await workoutService.getCurrentDay();

      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'web';
      
      // Mock window and localStorage for web
      (global as any).window = mockWindow;
      (global as any).localStorage = mockLocalStorage;
    });

    it('uses AsyncStorage primarily on web, localStorage as fallback', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(3));

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(3);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
      // Should not use localStorage when AsyncStorage succeeds
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('falls back to localStorage when AsyncStorage returns null on web', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(2));

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(2);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });

    it('defaults to day 1 when both AsyncStorage and localStorage fail on web', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });

    it('saves to both AsyncStorage and localStorage on web', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(1));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockLocalStorage.setItem.mockImplementation(() => {});

      const result = await workoutService.setCurrentDay(3);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(3));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(3));
    });

    it('handles localStorage setItem failure gracefully on web', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(1));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      const result = await workoutService.setCurrentDay(3);

      // Should still succeed even if localStorage fails
      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(3));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('current_workout_day', JSON.stringify(3));
    });

    it('handles localStorage getItem failure gracefully on web', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage getItem error');
      });

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1); // Should default to 1
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('current_workout_day');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });
  });

  describe('Hydration Safety', () => {
    it('does not cause hydration mismatches by checking window directly', async () => {
      // This test ensures we don't use typeof window !== 'undefined' which can cause hydration issues
      mockPlatform.OS = 'web';
      (global as any).window = mockWindow;
      (global as any).localStorage = mockLocalStorage;

      // Simulate server-side rendering (no window)
      delete (global as any).window;
      delete (global as any).localStorage;

      // Should not throw or cause hydration issues
      const result = await workoutService.getCurrentDay();
      expect(result).toBe(1); // Should default to 1
    });

    it('uses Platform.OS for consistent platform detection', async () => {
      // Test that we consistently use Platform.OS instead of environment checks
      mockPlatform.OS = 'web';
      (global as any).window = mockWindow;
      (global as any).localStorage = mockLocalStorage;

      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(2));

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(2);
      // Should use localStorage fallback because Platform.OS === 'web'
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('current_workout_day');
    });
  });

  describe('Cross-Platform Consistency', () => {
    it('maintains consistent behavior across platforms', async () => {
      const platforms = ['ios', 'android', 'web'];
      
      for (const platform of platforms) {
        mockPlatform.OS = platform;
        
        if (platform === 'web') {
          (global as any).window = mockWindow;
          (global as any).localStorage = mockLocalStorage;
        }

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(2));
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        // Test getCurrentDay
        const getResult = await workoutService.getCurrentDay();
        expect(getResult).toBe(2);

        // Test setCurrentDay
        const setResult = await workoutService.setCurrentDay(3);
        expect(setResult).toBe(true);

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it('handles edge cases consistently across platforms', async () => {
      const platforms = ['ios', 'android', 'web'];
      
      for (const platform of platforms) {
        mockPlatform.OS = platform;
        
        if (platform === 'web') {
          (global as any).window = mockWindow;
          (global as any).localStorage = mockLocalStorage;
        }

        // Test with null response
        mockAsyncStorage.getItem.mockResolvedValue(null);
        if (platform === 'web') {
          mockLocalStorage.getItem.mockReturnValue(null);
        }
        const nullResult = await workoutService.getCurrentDay();
        expect(nullResult).toBe(1);

        // Test with invalid JSON
        mockAsyncStorage.getItem.mockResolvedValue('invalid json');
        const invalidResult = await workoutService.getCurrentDay();
        expect(invalidResult).toBe(1);

        // Test with storage error
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
        const errorResult = await workoutService.getCurrentDay();
        expect(errorResult).toBe(1);

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('localStorage Edge Cases', () => {
    beforeEach(() => {
      mockPlatform.OS = 'web';
      (global as any).window = mockWindow;
      (global as any).localStorage = mockLocalStorage;
    });

    it('handles localStorage returning null', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1); // Should default to 1
    });

    it('handles localStorage returning undefined', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));
      mockLocalStorage.getItem.mockReturnValue(undefined);

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1); // Should default to 1
    });

    it('handles localStorage returning empty string', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));
      mockLocalStorage.getItem.mockReturnValue('');

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1); // Should default to 1
    });

    it('handles localStorage returning invalid JSON', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = await workoutService.getCurrentDay();

      expect(result).toBe(1); // Should default to 1
    });
  });
});
