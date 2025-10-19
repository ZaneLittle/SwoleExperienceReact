import { Weight, WeightData, WeightConverter } from '../../../lib/models/Weight';

describe('Weight Model', () => {
  describe('Weight Interface', () => {
    it('has correct structure', () => {
      const weight: Weight = {
        id: 'test-id',
        dateTime: new Date('2024-01-15T10:00:00Z'),
        weight: 180.5,
      };

      expect(weight.id).toBe('test-id');
      expect(weight.dateTime).toBeInstanceOf(Date);
      expect(weight.weight).toBe(180.5);
    });
  });

  describe('WeightData Interface', () => {
    it('has correct structure', () => {
      const weightData: WeightData = {
        id: 'test-id',
        dateTime: '2024-01-15T10:00:00.000Z',
        weight: 180.5,
      };

      expect(weightData.id).toBe('test-id');
      expect(typeof weightData.dateTime).toBe('string');
      expect(weightData.weight).toBe(180.5);
    });
  });

  describe('WeightConverter', () => {
    describe('toData', () => {
      it('converts Weight to WeightData correctly', () => {
        const weight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 180.5,
        };

        const result = WeightConverter.toData(weight);

        expect(result).toEqual({
          id: 'test-id',
          dateTime: '2024-01-15T14:30:00.000Z',
          weight: 180.5,
        });
      });

      it('handles different timezones correctly', () => {
        const weight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T23:59:59Z'),
          weight: 180.5,
        };

        const result = WeightConverter.toData(weight);

        expect(result.dateTime).toBe('2024-01-15T23:59:59.000Z');
      });

      it('handles edge dates correctly', () => {
        const weight: Weight = {
          id: 'test-id',
          dateTime: new Date('1900-01-01T00:00:00Z'),
          weight: 180.5,
        };

        const result = WeightConverter.toData(weight);

        expect(result.dateTime).toBe('1900-01-01T00:00:00.000Z');
      });
    });

    describe('fromData', () => {
      it('converts WeightData to Weight correctly', () => {
        const weightData: WeightData = {
          id: 'test-id',
          dateTime: '2024-01-15T14:30:00.000Z',
          weight: 180.5,
        };

        const result = WeightConverter.fromData(weightData);

        expect(result.id).toBe('test-id');
        expect(result.dateTime).toEqual(new Date('2024-01-15T14:30:00Z'));
        expect(result.weight).toBe(180.5);
      });

      it('handles different ISO string formats', () => {
        const weightData: WeightData = {
          id: 'test-id',
          dateTime: '2024-01-15T14:30:00Z', // Without milliseconds
          weight: 180.5,
        };

        const result = WeightConverter.fromData(weightData);

        expect(result.dateTime).toEqual(new Date('2024-01-15T14:30:00Z'));
      });

      it('handles edge dates correctly', () => {
        const weightData: WeightData = {
          id: 'test-id',
          dateTime: '1900-01-01T00:00:00.000Z',
          weight: 180.5,
        };

        const result = WeightConverter.fromData(weightData);

        expect(result.dateTime).toEqual(new Date('1900-01-01T00:00:00Z'));
      });
    });

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const originalWeight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 180.5,
        };

        const weightData = WeightConverter.toData(originalWeight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack).toEqual(originalWeight);
      });

      it('handles extreme weight values correctly', () => {
        const originalWeight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 999.999,
        };

        const weightData = WeightConverter.toData(originalWeight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.weight).toBe(999.999);
      });

      it('handles very small weight values correctly', () => {
        const originalWeight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 0.001,
        };

        const weightData = WeightConverter.toData(originalWeight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.weight).toBe(0.001);
      });

      it('preserves precision in weight values', () => {
        const originalWeight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 180.123456789,
        };

        const weightData = WeightConverter.toData(originalWeight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.weight).toBe(180.123456789);
      });
    });

    describe('Error Handling', () => {
      it('handles invalid date strings gracefully', () => {
        const weightData: WeightData = {
          id: 'test-id',
          dateTime: 'invalid-date',
          weight: 180.5,
        };

        const result = WeightConverter.fromData(weightData);
        expect(result.dateTime).toBeInstanceOf(Date);
        expect(isNaN(result.dateTime.getTime())).toBe(true);
      });

      it('handles null/undefined values', () => {
        const weightData = {
          id: 'test-id',
          dateTime: null as any,
          weight: 180.5,
        };

        const result = WeightConverter.fromData(weightData);
        expect(result.dateTime).toBeInstanceOf(Date);
        // null converts to epoch time (1970-01-01), which is valid
        expect(result.dateTime.getTime()).toBe(0);
      });
    });

    describe('Type Safety', () => {
      it('enforces correct types for Weight interface', () => {
        // This test ensures TypeScript compilation
        const weight: Weight = {
          id: 'string-id',
          dateTime: new Date(),
          weight: 180.5,
        };

        // These should cause TypeScript errors if types are wrong
        expect(typeof weight.id).toBe('string');
        expect(weight.dateTime instanceof Date).toBe(true);
        expect(typeof weight.weight).toBe('number');
      });

      it('enforces correct types for WeightData interface', () => {
        // This test ensures TypeScript compilation
        const weightData: WeightData = {
          id: 'string-id',
          dateTime: '2024-01-15T14:30:00.000Z',
          weight: 180.5,
        };

        // These should cause TypeScript errors if types are wrong
        expect(typeof weightData.id).toBe('string');
        expect(typeof weightData.dateTime).toBe('string');
        expect(typeof weightData.weight).toBe('number');
      });
    });

    describe('Edge Cases', () => {
      it('handles leap year dates', () => {
        const weight: Weight = {
          id: 'test-id',
          dateTime: new Date('2024-02-29T12:00:00Z'), // Leap year
          weight: 180.5,
        };

        const weightData = WeightConverter.toData(weight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.dateTime.getDate()).toBe(29);
        expect(convertedBack.dateTime.getMonth()).toBe(1); // February
      });

      it('handles year boundaries', () => {
        const weight: Weight = {
          id: 'test-id',
          dateTime: new Date('2023-12-31T23:59:59Z'),
          weight: 180.5,
        };

        const weightData = WeightConverter.toData(weight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.dateTime.getFullYear()).toBe(2023);
        expect(convertedBack.dateTime.getMonth()).toBe(11); // December
        expect(convertedBack.dateTime.getDate()).toBe(31);
      });

      it('handles very long IDs', () => {
        const longId = 'a'.repeat(1000);
        const weight: Weight = {
          id: longId,
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 180.5,
        };

        const weightData = WeightConverter.toData(weight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.id).toBe(longId);
      });

      it('handles special characters in IDs', () => {
        const specialId = 'test-id-123_!@#$%^&*()';
        const weight: Weight = {
          id: specialId,
          dateTime: new Date('2024-01-15T14:30:00Z'),
          weight: 180.5,
        };

        const weightData = WeightConverter.toData(weight);
        const convertedBack = WeightConverter.fromData(weightData);

        expect(convertedBack.id).toBe(specialId);
      });
    });
  });
});
