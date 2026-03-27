describe('WorkoutCreateUpdateForm Validation Logic', () => {
  const validateForm = (
    name: string,
    weight: string,
    sets: string,
    reps: string,
  ): { name?: string; weight?: string; sets?: string; reps?: string } => {
    const errors: {
      name?: string;
      weight?: string;
      sets?: string;
      reps?: string;
    } = {}

    if (!name.trim()) {
      errors.name = 'Name is required'
    }
    const weightNum = Number(weight)
    if (weight === '' || weight.trim() === '' || isNaN(weightNum) || weightNum < 0) {
      errors.weight = 'Please enter a valid weight'
    }
    const setsNum = Number(sets)
    if (sets === '' || sets.trim() === '' || isNaN(setsNum) || setsNum < 0) {
      errors.sets = 'Please enter a valid number of sets'
    }
    const repsNum = Number(reps)
    if (reps === '' || reps.trim() === '' || isNaN(repsNum) || repsNum < 0) {
      errors.reps = 'Please enter a valid number of reps'
    }

    return errors
  }

  describe('Weight field validation', () => {
    it('should return error when weight is empty', () => {
      const errors = validateForm('Test Exercise', '', '3', '10')
      expect(errors.weight).toBe('Please enter a valid weight')
      expect(errors.name).toBeUndefined()
      expect(errors.sets).toBeUndefined()
      expect(errors.reps).toBeUndefined()
    })

    it('should return error when weight contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', 'abc', '3', '10')
      expect(errors.weight).toBe('Please enter a valid weight')
    })

    it('should return error when weight is negative', () => {
      const errors = validateForm('Test Exercise', '-5', '3', '10')
      expect(errors.weight).toBe('Please enter a valid weight')
    })

    it('should allow weight value of 0', () => {
      const errors = validateForm('Test Exercise', '0', '3', '10')
      expect(errors.weight).toBeUndefined()
    })

    it('should allow positive weight values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10')
      expect(errors.weight).toBeUndefined()
    })
  })

  describe('Sets field validation', () => {
    it('should return error when sets is empty', () => {
      const errors = validateForm('Test Exercise', '100', '', '10')
      expect(errors.sets).toBe('Please enter a valid number of sets')
    })

    it('should return error when sets contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', '100', 'xyz', '10')
      expect(errors.sets).toBe('Please enter a valid number of sets')
    })

    it('should return error when sets is negative', () => {
      const errors = validateForm('Test Exercise', '100', '-2', '10')
      expect(errors.sets).toBe('Please enter a valid number of sets')
    })

    it('should allow sets value of 0', () => {
      const errors = validateForm('Test Exercise', '100', '0', '10')
      expect(errors.sets).toBeUndefined()
    })

    it('should allow positive sets values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10')
      expect(errors.sets).toBeUndefined()
    })
  })

  describe('Reps field validation', () => {
    it('should return error when reps is empty', () => {
      const errors = validateForm('Test Exercise', '100', '3', '')
      expect(errors.reps).toBe('Please enter a valid number of reps')
    })

    it('should return error when reps contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', '100', '3', 'invalid')
      expect(errors.reps).toBe('Please enter a valid number of reps')
    })

    it('should return error when reps is negative', () => {
      const errors = validateForm('Test Exercise', '100', '3', '-1')
      expect(errors.reps).toBe('Please enter a valid number of reps')
    })

    it('should allow reps value of 0', () => {
      const errors = validateForm('Test Exercise', '100', '3', '0')
      expect(errors.reps).toBeUndefined()
    })

    it('should allow positive reps values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10')
      expect(errors.reps).toBeUndefined()
    })
  })

  describe('Name field validation', () => {
    it('should return error when name is empty', () => {
      const errors = validateForm('', '100', '3', '10')
      expect(errors.name).toBe('Name is required')
    })

    it('should return error when name is only whitespace', () => {
      const errors = validateForm('   ', '100', '3', '10')
      expect(errors.name).toBe('Name is required')
    })

    it('should allow valid name', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10')
      expect(errors.name).toBeUndefined()
    })
  })

  describe('Multiple field validation', () => {
    it('should return errors for all invalid fields at once', () => {
      const errors = validateForm('', 'abc', 'xyz', '-5')
      expect(errors.name).toBe('Name is required')
      expect(errors.weight).toBe('Please enter a valid weight')
      expect(errors.sets).toBe('Please enter a valid number of sets')
      expect(errors.reps).toBe('Please enter a valid number of reps')
    })

    it('should allow valid form with all fields including zeros', () => {
      const errors = validateForm('Test Exercise', '0', '0', '0')
      expect(errors.name).toBeUndefined()
      expect(errors.weight).toBeUndefined()
      expect(errors.sets).toBeUndefined()
      expect(errors.reps).toBeUndefined()
    })

    it('should allow valid form with all positive values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10')
      expect(Object.keys(errors).length).toBe(0)
    })
  })
})

interface SetDetail {
  weight: number;
  reps: number;
}

describe('WorkoutCreateUpdateForm Per-Set Mode Validation Logic', () => {
  const validatePerSetForm = (
    name: string,
    setDetails: SetDetail[],
  ): {
    name?: string;
    sets?: string;
    setDetails?: Record<number, { weight?: string; reps?: string }>;
  } => {
    const errors: {
      name?: string;
      sets?: string;
      setDetails?: Record<number, { weight?: string; reps?: string }>;
    } = {}

    if (!name.trim()) {
      errors.name = 'Name is required'
    }

    if (setDetails.length === 0) {
      errors.sets = 'Add at least one set'
    }
    const detailErrors: Record<number, { weight?: string; reps?: string }> = {}
    setDetails.forEach((detail, index) => {
      const rowErrors: { weight?: string; reps?: string } = {}
      if (isNaN(detail.weight) || detail.weight < 0) {
        rowErrors.weight = 'Invalid'
      }
      if (isNaN(detail.reps) || detail.reps < 0) {
        rowErrors.reps = 'Invalid'
      }
      if (Object.keys(rowErrors).length > 0) {
        detailErrors[index] = rowErrors
      }
    })
    if (Object.keys(detailErrors).length > 0) {
      errors.setDetails = detailErrors
    }

    return errors
  }

  describe('Valid per-set data', () => {
    it('should accept valid set details', () => {
      const errors = validatePerSetForm('Bench Press', [
        { weight: 135, reps: 8 },
        { weight: 145, reps: 6 },
        { weight: 155, reps: 4 },
      ])
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should accept a single set', () => {
      const errors = validatePerSetForm('Squat', [{ weight: 225, reps: 5 }])
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should accept sets with zero weight', () => {
      const errors = validatePerSetForm('Push-ups', [
        { weight: 0, reps: 20 },
        { weight: 0, reps: 15 },
      ])
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should accept sets with zero reps', () => {
      const errors = validatePerSetForm('Plank', [{ weight: 0, reps: 0 }])
      expect(Object.keys(errors).length).toBe(0)
    })
  })

  describe('Empty set details', () => {
    it('should return error when set details array is empty', () => {
      const errors = validatePerSetForm('Bench Press', [])
      expect(errors.sets).toBe('Add at least one set')
    })
  })

  describe('Invalid set detail values', () => {
    it('should return error for negative weight in a set', () => {
      const errors = validatePerSetForm('Bench Press', [
        { weight: 135, reps: 8 },
        { weight: -10, reps: 6 },
      ])
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![1]?.weight).toBe('Invalid')
      expect(errors.setDetails![0]).toBeUndefined()
    })

    it('should return error for negative reps in a set', () => {
      const errors = validatePerSetForm('Bench Press', [
        { weight: 135, reps: -1 },
      ])
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![0]?.reps).toBe('Invalid')
    })

    it('should return errors for multiple invalid sets', () => {
      const errors = validatePerSetForm('Bench Press', [
        { weight: -5, reps: -3 },
        { weight: 135, reps: 8 },
        { weight: -10, reps: -1 },
      ])
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![0]?.weight).toBe('Invalid')
      expect(errors.setDetails![0]?.reps).toBe('Invalid')
      expect(errors.setDetails![1]).toBeUndefined()
      expect(errors.setDetails![2]?.weight).toBe('Invalid')
      expect(errors.setDetails![2]?.reps).toBe('Invalid')
    })

    it('should return error for NaN weight', () => {
      const errors = validatePerSetForm('Test', [
        { weight: NaN, reps: 10 },
      ])
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![0]?.weight).toBe('Invalid')
    })

    it('should return error for NaN reps', () => {
      const errors = validatePerSetForm('Test', [
        { weight: 100, reps: NaN },
      ])
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![0]?.reps).toBe('Invalid')
    })
  })

  describe('Name validation in per-set mode', () => {
    it('should still require name when in per-set mode', () => {
      const errors = validatePerSetForm('', [{ weight: 100, reps: 10 }])
      expect(errors.name).toBe('Name is required')
    })

    it('should reject whitespace-only name in per-set mode', () => {
      const errors = validatePerSetForm('   ', [{ weight: 100, reps: 10 }])
      expect(errors.name).toBe('Name is required')
    })
  })

  describe('Combined errors', () => {
    it('should return both name and set errors simultaneously', () => {
      const errors = validatePerSetForm('', [{ weight: -5, reps: -3 }])
      expect(errors.name).toBe('Name is required')
      expect(errors.setDetails).toBeDefined()
      expect(errors.setDetails![0]?.weight).toBe('Invalid')
      expect(errors.setDetails![0]?.reps).toBe('Invalid')
    })

    it('should return name error and empty sets error simultaneously', () => {
      const errors = validatePerSetForm('', [])
      expect(errors.name).toBe('Name is required')
      expect(errors.sets).toBe('Add at least one set')
    })
  })
})

