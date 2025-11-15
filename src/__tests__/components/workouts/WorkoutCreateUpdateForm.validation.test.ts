describe('WorkoutCreateUpdateForm Validation Logic', () => {
  const validateForm = (
    name: string,
    weight: string,
    sets: string,
    reps: string
  ): { name?: string; weight?: string; sets?: string; reps?: string } => {
    const errors: {
      name?: string;
      weight?: string;
      sets?: string;
      reps?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    const weightNum = Number(weight);
    if (weight === '' || weight.trim() === '' || isNaN(weightNum) || weightNum < 0) {
      errors.weight = 'Please enter a valid weight';
    }
    const setsNum = Number(sets);
    if (sets === '' || sets.trim() === '' || isNaN(setsNum) || setsNum < 0) {
      errors.sets = 'Please enter a valid number of sets';
    }
    const repsNum = Number(reps);
    if (reps === '' || reps.trim() === '' || isNaN(repsNum) || repsNum < 0) {
      errors.reps = 'Please enter a valid number of reps';
    }

    return errors;
  };

  describe('Weight field validation', () => {
    it('should return error when weight is empty', () => {
      const errors = validateForm('Test Exercise', '', '3', '10');
      expect(errors.weight).toBe('Please enter a valid weight');
      expect(errors.name).toBeUndefined();
      expect(errors.sets).toBeUndefined();
      expect(errors.reps).toBeUndefined();
    });

    it('should return error when weight contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', 'abc', '3', '10');
      expect(errors.weight).toBe('Please enter a valid weight');
    });

    it('should return error when weight is negative', () => {
      const errors = validateForm('Test Exercise', '-5', '3', '10');
      expect(errors.weight).toBe('Please enter a valid weight');
    });

    it('should allow weight value of 0', () => {
      const errors = validateForm('Test Exercise', '0', '3', '10');
      expect(errors.weight).toBeUndefined();
    });

    it('should allow positive weight values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10');
      expect(errors.weight).toBeUndefined();
    });
  });

  describe('Sets field validation', () => {
    it('should return error when sets is empty', () => {
      const errors = validateForm('Test Exercise', '100', '', '10');
      expect(errors.sets).toBe('Please enter a valid number of sets');
    });

    it('should return error when sets contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', '100', 'xyz', '10');
      expect(errors.sets).toBe('Please enter a valid number of sets');
    });

    it('should return error when sets is negative', () => {
      const errors = validateForm('Test Exercise', '100', '-2', '10');
      expect(errors.sets).toBe('Please enter a valid number of sets');
    });

    it('should allow sets value of 0', () => {
      const errors = validateForm('Test Exercise', '100', '0', '10');
      expect(errors.sets).toBeUndefined();
    });

    it('should allow positive sets values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10');
      expect(errors.sets).toBeUndefined();
    });
  });

  describe('Reps field validation', () => {
    it('should return error when reps is empty', () => {
      const errors = validateForm('Test Exercise', '100', '3', '');
      expect(errors.reps).toBe('Please enter a valid number of reps');
    });

    it('should return error when reps contains non-numeric text', () => {
      const errors = validateForm('Test Exercise', '100', '3', 'invalid');
      expect(errors.reps).toBe('Please enter a valid number of reps');
    });

    it('should return error when reps is negative', () => {
      const errors = validateForm('Test Exercise', '100', '3', '-1');
      expect(errors.reps).toBe('Please enter a valid number of reps');
    });

    it('should allow reps value of 0', () => {
      const errors = validateForm('Test Exercise', '100', '3', '0');
      expect(errors.reps).toBeUndefined();
    });

    it('should allow positive reps values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10');
      expect(errors.reps).toBeUndefined();
    });
  });

  describe('Name field validation', () => {
    it('should return error when name is empty', () => {
      const errors = validateForm('', '100', '3', '10');
      expect(errors.name).toBe('Name is required');
    });

    it('should return error when name is only whitespace', () => {
      const errors = validateForm('   ', '100', '3', '10');
      expect(errors.name).toBe('Name is required');
    });

    it('should allow valid name', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10');
      expect(errors.name).toBeUndefined();
    });
  });

  describe('Multiple field validation', () => {
    it('should return errors for all invalid fields at once', () => {
      const errors = validateForm('', 'abc', 'xyz', '-5');
      expect(errors.name).toBe('Name is required');
      expect(errors.weight).toBe('Please enter a valid weight');
      expect(errors.sets).toBe('Please enter a valid number of sets');
      expect(errors.reps).toBe('Please enter a valid number of reps');
    });

    it('should allow valid form with all fields including zeros', () => {
      const errors = validateForm('Test Exercise', '0', '0', '0');
      expect(errors.name).toBeUndefined();
      expect(errors.weight).toBeUndefined();
      expect(errors.sets).toBeUndefined();
      expect(errors.reps).toBeUndefined();
    });

    it('should allow valid form with all positive values', () => {
      const errors = validateForm('Test Exercise', '100', '3', '10');
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});

