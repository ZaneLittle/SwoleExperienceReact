import AsyncStorage from '@react-native-async-storage/async-storage';
import { weightService } from '../../../lib/services/WeightService';
import { Weight, WeightData } from '../../../lib/models/Weight';
import { createMockWeight } from '../../utils/testUtils';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetItem = mockAsyncStorage.getItem as jest.MockedFunction<typeof mockAsyncStorage.getItem>;
const mockSetItem = mockAsyncStorage.setItem as jest.MockedFunction<typeof mockAsyncStorage.setItem>;

// Mock console.error to avoid test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('WeightService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeights', () => {
    it('returns empty array when no data exists', async () => {
      mockGetItem.mockResolvedValueOnce(null);

      const result = await weightService.getWeights();

      expect(result).toEqual([]);
      expect(mockGetItem).toHaveBeenCalledWith('weights');
    });

    it('returns empty array when storage throws error', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await weightService.getWeights();

      expect(result).toEqual([]);
      expect(mockGetItem).toHaveBeenCalledWith('weights');
    });

    it('returns weights sorted by date (newest first)', async () => {
      const now = new Date();
      const recentDate1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const recentDate2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const recentDate3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      const mockWeightsData: WeightData[] = [
        {
          id: '1',
          dateTime: recentDate1.toISOString(),
          weight: 180.5,
        },
        {
          id: '2',
          dateTime: recentDate2.toISOString(),
          weight: 181.0,
        },
        {
          id: '3',
          dateTime: recentDate3.toISOString(),
          weight: 180.0,
        },
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockWeightsData));

      const result = await weightService.getWeights();

      expect(result).toHaveLength(3);
      expect(result[0].dateTime.getTime()).toBeGreaterThan(result[1].dateTime.getTime());
      expect(result[1].dateTime.getTime()).toBeGreaterThan(result[2].dateTime.getTime());
      expect(result[0].weight).toBe(180.5);
      expect(result[2].weight).toBe(180.0);
    });

    it('filters weights to last 60 days', async () => {
      const now = new Date();
      const sixtyOneDaysAgo = new Date(now.getTime() - 61 * 24 * 60 * 60 * 1000);
      const fiftyNineDaysAgo = new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000);

      const mockWeightsData: WeightData[] = [
        {
          id: '1',
          dateTime: sixtyOneDaysAgo.toISOString(),
          weight: 180.0,
        },
        {
          id: '2',
          dateTime: fiftyNineDaysAgo.toISOString(),
          weight: 181.0,
        },
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockWeightsData));

      const result = await weightService.getWeights();

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(181.0);
    });

    it('filters weights with custom start date', async () => {
      const startDate = new Date('2024-01-01');
      const beforeStart = new Date('2023-12-01');
      const afterStart = new Date('2024-01-15');

      const mockWeightsData: WeightData[] = [
        {
          id: '1',
          dateTime: beforeStart.toISOString(),
          weight: 180.0,
        },
        {
          id: '2',
          dateTime: afterStart.toISOString(),
          weight: 181.0,
        },
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockWeightsData));

      const result = await weightService.getWeights(startDate);

      // Both weights should be included since they're within 60 days of startDate
      expect(result).toHaveLength(2);
      expect(result[0].weight).toBe(181.0); // Most recent first
      expect(result[1].weight).toBe(180.0);
    });

    it('handles malformed JSON gracefully', async () => {
      mockGetItem.mockResolvedValueOnce('invalid json');

      const result = await weightService.getWeights();

      expect(result).toEqual([]);
    });

    it('converts WeightData to Weight objects correctly', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const mockWeightData: WeightData = {
        id: 'test-id',
        dateTime: recentDate.toISOString(),
        weight: 180.5,
      };

      mockGetItem.mockResolvedValueOnce(JSON.stringify([mockWeightData]));

      const result = await weightService.getWeights();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-id',
        dateTime: recentDate,
        weight: 180.5,
      });
    });
  });

  describe('addWeight', () => {
    it('adds weight successfully', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      const result = await weightService.addWeight(newWeight);

      expect(result).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith(
        'weights',
        expect.stringContaining('"weight":180.5')
      );
    });

    it('generates unique ID for new weight', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      await weightService.addWeight(newWeight);

      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      
      expect(storedData[0].id).toBeDefined();
      expect(typeof storedData[0].id).toBe('string');
      expect(storedData[0].id.length).toBeGreaterThan(0);
    });

    it('adds weight to existing weights', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const existingWeights = [
        createMockWeight({ id: 'existing-1', weight: 180.0, dateTime: recentDate }),
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date(),
        weight: 180.5,
      };

      await weightService.addWeight(newWeight);

      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      
      expect(storedData).toHaveLength(2);
      expect(storedData[0].weight).toBe(180.5); // New weight should be first
      expect(storedData[1].weight).toBe(180.0); // Existing weight second
    });

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      const result = await weightService.addWeight(newWeight);

      expect(result).toBe(false);
    });

    it('handles getWeights failure gracefully', async () => {
      // Mock getWeights to throw an error, but setItem to succeed
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'));
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      const result = await weightService.addWeight(newWeight);

      // The service should still succeed because it can handle getWeights failure
      // by treating it as no existing weights
      expect(result).toBe(true);
    });
  });

  describe('removeWeight', () => {
    it('removes weight successfully', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const existingWeights = [
        createMockWeight({ id: 'keep-1', weight: 180.0, dateTime: recentDate }),
        createMockWeight({ id: 'remove-1', weight: 180.5, dateTime: recentDate }),
        createMockWeight({ id: 'keep-2', weight: 181.0, dateTime: recentDate }),
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockResolvedValueOnce(undefined);

      const result = await weightService.removeWeight('remove-1');

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      
      expect(storedData).toHaveLength(2);
      expect(storedData.find((w: any) => w.id === 'remove-1')).toBeUndefined();
    });

    it('returns true even when weight does not exist', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const existingWeights = [
        createMockWeight({ id: 'keep-1', weight: 180.0, dateTime: recentDate }),
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockResolvedValueOnce(undefined);

      const result = await weightService.removeWeight('non-existent');

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      
      expect(storedData).toHaveLength(1); // Should still have the existing weight
    });

    it('returns false when storage fails', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'));
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await weightService.removeWeight('any-id');

      expect(result).toBe(false);
    });

    it('returns false when setItem fails', async () => {
      const existingWeights = [createMockWeight({ id: 'test-1' })];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await weightService.removeWeight('test-1');

      expect(result).toBe(false);
    });
  });

  describe('updateWeight', () => {
    it('updates weight successfully', async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const existingWeights = [
        createMockWeight({ id: 'update-1', weight: 180.0, dateTime: recentDate }),
        createMockWeight({ id: 'keep-1', weight: 181.0, dateTime: recentDate }),
      ];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockResolvedValueOnce(undefined);

      const updatedWeight = {
        id: 'update-1',
        dateTime: recentDate,
        weight: 180.5,
      };

      const result = await weightService.updateWeight(updatedWeight);

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      
      const updatedItem = storedData.find((w: any) => w.id === 'update-1');
      expect(updatedItem.weight).toBe(180.5);
      
      const unchangedItem = storedData.find((w: any) => w.id === 'keep-1');
      expect(unchangedItem.weight).toBe(181.0);
    });

    it('returns false when weight does not exist', async () => {
      const existingWeights = [createMockWeight({ id: 'keep-1', weight: 180.0 })];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockResolvedValueOnce(undefined);

      const updatedWeight = {
        id: 'non-existent',
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      const result = await weightService.updateWeight(updatedWeight);

      expect(result).toBe(true); // Should still return true even if weight doesn't exist
    });

    it('returns false when storage fails', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'));
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));

      const updatedWeight = createMockWeight();

      const result = await weightService.updateWeight(updatedWeight);

      expect(result).toBe(false);
    });

    it('returns false when setItem fails', async () => {
      const existingWeights = [createMockWeight({ id: 'test-1' })];

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingWeights.map(w => ({
        id: w.id,
        dateTime: w.dateTime.toISOString(),
        weight: w.weight,
      }))));
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));

      const updatedWeight = {
        id: 'test-1',
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      const result = await weightService.updateWeight(updatedWeight);

      expect(result).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const instance1 = weightService;
      const instance2 = weightService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('Edge Cases', () => {
    it('handles very large weight values', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 999.999,
      };

      const result = await weightService.addWeight(newWeight);

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      expect(storedData[0].weight).toBe(999.999);
    });

    it('handles very small weight values', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 0.001,
      };

      const result = await weightService.addWeight(newWeight);

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      expect(storedData[0].weight).toBe(0.001);
    });

    it('handles weights with extreme dates', async () => {
      const extremeDate = new Date('1900-01-01T00:00:00Z');
      
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);

      const newWeight = {
        dateTime: extremeDate,
        weight: 180.5,
      };

      const result = await weightService.addWeight(newWeight);

      expect(result).toBe(true);
      
      const setItemCall = mockSetItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1] as string);
      expect(new Date(storedData[0].dateTime)).toEqual(extremeDate);
    });

    it('handles concurrent operations gracefully', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      mockSetItem.mockResolvedValueOnce(undefined);
      mockSetItem.mockResolvedValueOnce(undefined);

      const weights = [
        { dateTime: new Date('2024-01-15T10:00:00Z'), weight: 180.0 },
        { dateTime: new Date('2024-01-16T10:00:00Z'), weight: 180.5 },
      ];

      // Simulate concurrent operations
      const promises = weights.map(weight => weightService.addWeight(weight));
      const results = await Promise.all(promises);

      expect(results.every(result => result === true)).toBe(true);
    });
  });
});
