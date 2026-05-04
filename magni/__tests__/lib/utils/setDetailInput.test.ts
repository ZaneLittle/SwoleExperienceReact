import {
  parseDetailNumberFromInput,
  setDetailsToPerSetTexts,
} from '../../../lib/utils/setDetailInput'

describe('setDetailInput', () => {
  describe('parseDetailNumberFromInput', () => {
    it('parses decimal weights used in per-set details', () => {
      expect(parseDetailNumberFromInput('137.5')).toBe(137.5)
      expect(parseDetailNumberFromInput('12.25')).toBe(12.25)
      expect(parseDetailNumberFromInput('0.5')).toBe(0.5)
    })

    it('treats trailing decimal as valid partial parse (same as parseFloat)', () => {
      expect(parseDetailNumberFromInput('12.')).toBe(12)
    })

    it('trims whitespace before parsing', () => {
      expect(parseDetailNumberFromInput('  202.75  ')).toBe(202.75)
    })

    it('returns 0 for empty or incomplete decimal entry', () => {
      expect(parseDetailNumberFromInput('')).toBe(0)
      expect(parseDetailNumberFromInput('   ')).toBe(0)
      expect(parseDetailNumberFromInput('.')).toBe(0)
      expect(parseDetailNumberFromInput('-')).toBe(0)
      expect(parseDetailNumberFromInput('-.')).toBe(0)
    })

    it('returns 0 for non-numeric garbage', () => {
      expect(parseDetailNumberFromInput('abc')).toBe(0)
      expect(parseDetailNumberFromInput('12abc')).toBe(12)
    })
  })

  describe('setDetailsToPerSetTexts', () => {
    it('stringifies decimal set weights for display', () => {
      const rows = setDetailsToPerSetTexts([
        { weight: 137.5, reps: 8 },
        { weight: 12.25, reps: 10 },
      ])
      expect(rows).toEqual([
        { weight: '137.5', reps: '8' },
        { weight: '12.25', reps: '10' },
      ])
    })
  })
})
