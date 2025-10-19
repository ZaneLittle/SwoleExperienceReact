import { Average, AverageData, AverageConverter } from '../../../lib/models/Average';

describe('Average Model', () => {
  describe('Average Interface', () => {
    it('has correct structure', () => {
      const average: Average = {
        date: new Date('2024-01-15T00:00:00Z'),
        average: 180.5,
        threeDayAverage: 180.6,
        sevenDayAverage: 180.7,
      };

      expect(average.date).toBeInstanceOf(Date);
      expect(average.average).toBe(180.5);
      expect(average.threeDayAverage).toBe(180.6);
      expect(average.sevenDayAverage).toBe(180.7);
    });

    it('allows null values for rolling averages', () => {
      const average: Average = {
        date: new Date('2024-01-15T00:00:00Z'),
        average: 180.5,
        threeDayAverage: null,
        sevenDayAverage: null,
      };

      expect(average.average).toBe(180.5);
      expect(average.threeDayAverage).toBeNull();
      expect(average.sevenDayAverage).toBeNull();
    });
  });

  describe('AverageData Interface', () => {
    it('has correct structure', () => {
      const averageData: AverageData = {
        dateTime: '2024-01-15T00:00:00.000Z',
        average: 180.5,
        threeDayAverage: 180.6,
        sevenDayAverage: 180.7,
      };

      expect(typeof averageData.dateTime).toBe('string');
      expect(averageData.average).toBe(180.5);
      expect(averageData.threeDayAverage).toBe(180.6);
      expect(averageData.sevenDayAverage).toBe(180.7);
    });

    it('allows null values for rolling averages', () => {
      const averageData: AverageData = {
        dateTime: '2024-01-15T00:00:00.000Z',
        average: 180.5,
        threeDayAverage: null,
        sevenDayAverage: null,
      };

      expect(averageData.average).toBe(180.5);
      expect(averageData.threeDayAverage).toBeNull();
      expect(averageData.sevenDayAverage).toBeNull();
    });
  });

  describe('AverageConverter', () => {
    describe('toData', () => {
      it('converts Average to AverageData correctly', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.toData(average);

        expect(result).toEqual({
          dateTime: '2024-01-15T00:00:00.000Z',
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        });
      });

      it('handles null values correctly', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: null,
          sevenDayAverage: null,
        };

        const result = AverageConverter.toData(average);

        expect(result.dateTime).toBe('2024-01-15T00:00:00.000Z');
        expect(result.average).toBe(180.5);
        expect(result.threeDayAverage).toBeNull();
        expect(result.sevenDayAverage).toBeNull();
      });

      it('handles mixed null and non-null values', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: null,
        };

        const result = AverageConverter.toData(average);

        expect(result.threeDayAverage).toBe(180.6);
        expect(result.sevenDayAverage).toBeNull();
      });

      it('handles different date formats', () => {
        const average: Average = {
          date: new Date('2024-01-15T23:59:59Z'),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.toData(average);

        expect(result.dateTime).toBe('2024-01-15T23:59:59.000Z');
      });
    });

    describe('fromData', () => {
      it('converts AverageData to Average correctly', () => {
        const averageData: AverageData = {
          dateTime: '2024-01-15T00:00:00.000Z',
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.fromData(averageData);

        expect(result.date).toEqual(new Date('2024-01-15T00:00:00Z'));
        expect(result.average).toBe(180.5);
        expect(result.threeDayAverage).toBe(180.6);
        expect(result.sevenDayAverage).toBe(180.7);
      });

      it('handles null values correctly', () => {
        const averageData: AverageData = {
          dateTime: '2024-01-15T00:00:00.000Z',
          average: 180.5,
          threeDayAverage: null,
          sevenDayAverage: null,
        };

        const result = AverageConverter.fromData(averageData);

        expect(result.average).toBe(180.5);
        expect(result.threeDayAverage).toBeNull();
        expect(result.sevenDayAverage).toBeNull();
      });

      it('handles mixed null and non-null values', () => {
        const averageData: AverageData = {
          dateTime: '2024-01-15T00:00:00.000Z',
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: null,
        };

        const result = AverageConverter.fromData(averageData);

        expect(result.threeDayAverage).toBe(180.6);
        expect(result.sevenDayAverage).toBeNull();
      });

      it('handles different ISO string formats', () => {
        const averageData: AverageData = {
          dateTime: '2024-01-15T00:00:00Z', // Without milliseconds
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.fromData(averageData);

        expect(result.date).toEqual(new Date('2024-01-15T00:00:00Z'));
      });
    });

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const originalAverage: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const averageData = AverageConverter.toData(originalAverage);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack).toEqual(originalAverage);
      });

      it('maintains data integrity with null values', () => {
        const originalAverage: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: null,
          sevenDayAverage: null,
        };

        const averageData = AverageConverter.toData(originalAverage);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack).toEqual(originalAverage);
      });

      it('maintains data integrity with mixed null values', () => {
        const originalAverage: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: null,
        };

        const averageData = AverageConverter.toData(originalAverage);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack).toEqual(originalAverage);
      });

      it('preserves precision in average values', () => {
        const originalAverage: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.123456789,
          threeDayAverage: 180.234567890,
          sevenDayAverage: 180.345678901,
        };

        const averageData = AverageConverter.toData(originalAverage);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(180.123456789);
        expect(convertedBack.threeDayAverage).toBe(180.234567890);
        expect(convertedBack.sevenDayAverage).toBe(180.345678901);
      });
    });

    describe('Error Handling', () => {
      it('handles invalid date strings gracefully', () => {
        const averageData: AverageData = {
          dateTime: 'invalid-date',
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.fromData(averageData);
        expect(result.date).toBeInstanceOf(Date);
        expect(isNaN(result.date.getTime())).toBe(true);
      });

      it('handles null/undefined values', () => {
        const averageData = {
          dateTime: null as any,
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const result = AverageConverter.fromData(averageData);
        expect(result.date).toBeInstanceOf(Date);
        // null converts to epoch time (1970-01-01), which is valid
        expect(result.date.getTime()).toBe(0);
      });
    });

    describe('Type Safety', () => {
      it('enforces correct types for Average interface', () => {
        // This test ensures TypeScript compilation
        const average: Average = {
          date: new Date(),
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        // These should cause TypeScript errors if types are wrong
        expect(average.date instanceof Date).toBe(true);
        expect(typeof average.average).toBe('number');
        expect(typeof average.threeDayAverage).toBe('number');
        expect(typeof average.sevenDayAverage).toBe('number');
      });

      it('enforces correct types for AverageData interface', () => {
        // This test ensures TypeScript compilation
        const averageData: AverageData = {
          dateTime: '2024-01-15T00:00:00.000Z',
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        // These should cause TypeScript errors if types are wrong
        expect(typeof averageData.dateTime).toBe('string');
        expect(typeof averageData.average).toBe('number');
        expect(typeof averageData.threeDayAverage).toBe('number');
        expect(typeof averageData.sevenDayAverage).toBe('number');
      });

      it('handles nullable types correctly', () => {
        const average: Average = {
          date: new Date(),
          average: 180.5,
          threeDayAverage: null,
          sevenDayAverage: null,
        };

        expect(typeof average.average).toBe('number');
        expect(average.threeDayAverage).toBeNull();
        expect(average.sevenDayAverage).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('handles extreme average values', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 999.999,
          threeDayAverage: 1000.001,
          sevenDayAverage: 998.998,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(999.999);
        expect(convertedBack.threeDayAverage).toBe(1000.001);
        expect(convertedBack.sevenDayAverage).toBe(998.998);
      });

      it('handles very small average values', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 0.001,
          threeDayAverage: 0.002,
          sevenDayAverage: 0.003,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(0.001);
        expect(convertedBack.threeDayAverage).toBe(0.002);
        expect(convertedBack.sevenDayAverage).toBe(0.003);
      });

      it('handles negative average values', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: -5.5,
          threeDayAverage: -4.5,
          sevenDayAverage: -3.5,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(-5.5);
        expect(convertedBack.threeDayAverage).toBe(-4.5);
        expect(convertedBack.sevenDayAverage).toBe(-3.5);
      });

      it('handles zero average values', () => {
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 0,
          threeDayAverage: 0,
          sevenDayAverage: 0,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(0);
        expect(convertedBack.threeDayAverage).toBe(0);
        expect(convertedBack.sevenDayAverage).toBe(0);
      });

      it('handles leap year dates', () => {
        const average: Average = {
          date: new Date(2024, 1, 29), // Leap year - February 29, 2024
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        // 2024 is a leap year, so Feb 29 should exist
        expect(convertedBack.date.getFullYear()).toBe(2024);
        expect(convertedBack.date.getMonth()).toBe(1); // February
        expect(convertedBack.date.getDate()).toBe(29);
      });

      it('handles year boundaries', () => {
        const average: Average = {
          date: new Date(2023, 11, 31), // December 31, 2023
          average: 180.5,
          threeDayAverage: 180.6,
          sevenDayAverage: 180.7,
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.date.getFullYear()).toBe(2023);
        expect(convertedBack.date.getMonth()).toBe(11); // December
        expect(convertedBack.date.getDate()).toBe(31);
      });
    });

    describe('Business Logic Validation', () => {
      it('handles realistic weight average scenarios', () => {
        // Typical weight tracking scenario
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5, // Daily average
          threeDayAverage: 180.6, // Slightly higher 3-day trend
          sevenDayAverage: 180.4, // Slightly lower 7-day trend
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(180.5);
        expect(convertedBack.threeDayAverage).toBe(180.6);
        expect(convertedBack.sevenDayAverage).toBe(180.4);
      });

      it('handles insufficient data scenarios', () => {
        // Early in weight tracking when rolling averages aren't available
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5, // Only daily average available
          threeDayAverage: null, // Not enough data for 3-day
          sevenDayAverage: null, // Not enough data for 7-day
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(180.5);
        expect(convertedBack.threeDayAverage).toBeNull();
        expect(convertedBack.sevenDayAverage).toBeNull();
      });

      it('handles partial data scenarios', () => {
        // Some rolling averages available but not all
        const average: Average = {
          date: new Date('2024-01-15T00:00:00Z'),
          average: 180.5,
          threeDayAverage: 180.6, // 3-day available
          sevenDayAverage: null, // 7-day not yet available
        };

        const averageData = AverageConverter.toData(average);
        const convertedBack = AverageConverter.fromData(averageData);

        expect(convertedBack.average).toBe(180.5);
        expect(convertedBack.threeDayAverage).toBe(180.6);
        expect(convertedBack.sevenDayAverage).toBeNull();
      });
    });
  });
});
