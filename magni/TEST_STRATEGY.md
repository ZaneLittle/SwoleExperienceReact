# Test Strategy for Magni

This document outlines the testing strategy for the Magni frontend application (React Native/Expo), focusing on testing to catch bugs rather than achieving arbitrary coverage metrics.

## Philosophy

**Test with purpose, not for coverage.** We write tests to:
- Catch bugs before they reach users
- Prevent regressions when refactoring
- Document expected behavior
- Verify critical user paths work correctly

We do **NOT** write tests to:
- Reach a specific coverage percentage
- Test implementation details
- Test framework/library code (React, React Native, etc.)
- Test obvious code (simple getters, trivial utilities)

## Overview

Magni uses a pragmatic testing strategy organized by component type:

1. **Unit Tests** - Test individual functions, hooks, and business logic in isolation
2. **Component Tests** - Test React components with user interactions
3. **Integration Tests** - Test component and service interactions

## Test Structure

Test files are organized in `__tests__/` directories that mirror the source structure:

```
magni/
├── __tests__/
│   ├── app/                      # App-level tests
│   ├── components/               # Component tests
│   │   └── workouts/            # Component subdirectory tests
│   ├── hooks/                    # Hook tests
│   ├── lib/
│   │   ├── models/              # Model tests
│   │   └── services/            # Service tests
│   ├── utils/                    # Test utilities
│   └── README.md                # Test documentation
├── app/                          # Source files
├── components/
├── hooks/
└── lib/
```

**Naming Convention**: `*.test.ts` or `*.test.tsx` for test files matching the source file name.

## Testing Tools

### Test Framework
- **Jest** (`jest`) - Primary test runner and assertion library
- **Jest Expo** (`jest-expo`) - Expo-compatible Jest preset
- **React Native Testing Library** (`@testing-library/react-native`) - Component testing utilities
- **React Testing Library** (`@testing-library/react`) - React component testing (for hooks)
- **React Test Renderer** (`react-test-renderer`) - React component rendering for tests

### Test Utilities
- **AsyncStorage Mock** - Mocked via `jest.setup.js` for storage operations
- **React Native Mocks** - Platform-specific components mocked for web test environment
- **Custom Test Utils** - Helper functions in `__tests__/utils/testUtils.ts`

## Test Categories

### 1. Model Tests
**Location**: `__tests__/lib/models/*.test.ts`

**What to Test**:
- Data validation and constraints
- Converter functions (toData/fromData)
- Round-trip conversion integrity
- Business logic (validators, helpers)
- Edge cases (null, undefined, boundary values)

**What NOT to Test**:
- TypeScript interfaces (compile-time checks)
- Simple property accessors
- Trivial getters/setters

**Example Patterns**:
```typescript
describe('Workout Model', () => {
  describe('WorkoutConverter', () => {
    it('converts Workout to WorkoutData correctly', () => {
      const workout: Workout = { /* ... */ }
      const workoutData = WorkoutConverter.toData(workout)
      expect(workoutData.id).toBe(workout.id)
      // ... verify all fields
    })

    it('maintains data integrity through round-trip conversion', () => {
      const original = { /* ... */ }
      const converted = WorkoutConverter.fromData(
        WorkoutConverter.toData(original)
      )
      expect(converted).toEqual(original)
    })
  })

  describe('WorkoutValidator', () => {
    it('throws error for notes exceeding length limit', () => {
      const workout = { /* ... */, notes: 'A'.repeat(257) }
      expect(() => WorkoutValidator.validate(workout)).toThrow()
    })
  })
})
```

### 2. Service Tests
**Location**: `__tests__/lib/services/*.test.ts`

**What to Test**:
- CRUD operations (happy paths)
- Error handling (storage failures, invalid data)
- Data filtering and sorting
- Edge cases (empty arrays, null values)
- AsyncStorage integration (mocked)
- Singleton pattern validation (if applicable)

**What NOT to Test**:
- AsyncStorage implementation details
- Internal helper functions (test via public API)
- Network requests (handled by integration tests)

**Example Patterns**:
```typescript
describe('WorkoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWorkouts', () => {
    it('returns empty array when no data exists', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      const result = await workoutService.getWorkouts()
      expect(result).toEqual([])
    })

    it('returns workouts sorted by dayOrder', async () => {
      const mockData = [/* unsorted workouts */]
      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockData))
      const result = await workoutService.getWorkouts()
      expect(result[0].dayOrder).toBeLessThan(result[1].dayOrder)
    })

    it('handles storage errors gracefully', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      const result = await workoutService.getWorkouts()
      expect(result).toEqual([])
    })
  })
})
```

### 3. Hook Tests
**Location**: `__tests__/hooks/*.test.ts`

**What to Test**:
- Initial state values
- State updates from user actions
- Side effects (API calls, storage operations)
- Error handling in hooks
- Memoization behavior (if applicable)
- Edge cases (empty inputs, null values)

**What NOT to Test**:
- React's internal hook mechanics
- Render optimization details
- Internal state management implementation

**Example Patterns**:
```typescript
describe('useWorkoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWorkoutService.removeWorkout.mockResolvedValue(true)
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutForm())
    expect(result.current.showForm).toBe(false)
    expect(result.current.editingWorkout).toBeUndefined()
  })

  it('should handle delete workout successfully', async () => {
    const mockOnRefresh = jest.fn()
    const { result } = renderHook(() => useWorkoutForm())

    mockConfirmDelete.mockResolvedValue(true)
    
    await act(async () => {
      await result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh)
    })

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith(mockWorkout.id)
    expect(mockOnRefresh).toHaveBeenCalled()
  })
})
```

### 4. Component Tests
**Location**: `__tests__/components/**/*.test.tsx`

**What to Test**:
- Component renders correctly
- User interactions (clicks, inputs, form submissions)
- Conditional rendering (loading states, empty states, error states)
- Platform-specific behavior (web vs mobile)
- Form validation and error messages
- Integration with hooks and services (mocked)

**What NOT to Test**:
- Internal component state (test via user interactions)
- Styling details (visual testing is manual)
- Third-party component behavior (DatePicker, Modal, etc. - mock them)
- Implementation details (test behavior, not code)

**Example Patterns**:
```typescript
describe('ConfirmationModal', () => {
  it('should show confirmation when showConfirmation is called', () => {
    const { result } = renderHook(() => useConfirmation())
    
    act(() => {
      result.current.showConfirmation({
        title: 'Test Title',
        message: 'Test Message',
        buttons: [{ text: 'OK', onPress: jest.fn() }],
      })
    })

    expect(result.current.ConfirmationComponent).not.toBeNull()
  })

  it('should call onPress when button is clicked', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <ConfirmationModal
        title="Test"
        message="Message"
        buttons={[{ text: 'OK', onPress }]}
      />
    )
    
    fireEvent.press(getByText('OK'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
```

### 5. Integration Tests
**Location**: `__tests__/lib/services/*.integration.test.ts`

**What to Test**:
- Complete workflows (export/import, multi-step processes)
- Service interactions
- Data flow across multiple components/services
- End-to-end user scenarios for critical paths

**When to Write**:
- Complex multi-step operations
- Critical user flows (data sync, import/export)
- Cross-service interactions

**Example**: Export/Import workflow, complete workout completion flow

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Run Specific Test File
```bash
pnpm test WorkoutService.test.ts
```

### Run Tests Matching Pattern
```bash
pnpm test -t "should handle delete"
```

## Test Utilities

### Mock Data Generators
Located in `__tests__/utils/testUtils.ts`:

```typescript
// Use helper functions to create test data
const mockWeight = createMockWeight({ weight: 180.5, dateTime: new Date() })
const mockWorkout = createMockWorkout({ name: 'Bench Press', weight: 135 })
const mockWeights = createMockWeights(10, 180) // 10 weights starting at 180
```

### Custom Render with Providers
For components that need context providers:

```typescript
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../contexts/ThemeContext'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}
```

## Mock Strategy

### External Dependencies
- **AsyncStorage**: Always mocked (via `jest.setup.js`)
- **Platform APIs**: Mocked for cross-platform testing
- **React Native Components**: Mocked for web test environment
- **Victory Charts**: Mocked as simple divs (complex rendering not needed in tests)

### Services
- Services are mocked at the module level using `jest.mock()`
- Default implementations return successful results
- Override mocks in specific tests for error scenarios

```typescript
jest.mock('../../lib/services/WorkoutService')
const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>

beforeEach(() => {
  jest.clearAllMocks()
  mockWorkoutService.getWorkouts.mockResolvedValue([])
})
```

### Contexts and Providers
- Mock contexts that provide theme, auth, etc.
- Provide minimal implementations for test needs

```typescript
jest.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    background: '#ffffff',
    text: { primary: '#000000' },
    // ... minimal theme needed for test
  }),
}))
```

## Best Practices for React Testing

### 1. Test User Behavior, Not Implementation
❌ **Don't**:
```typescript
expect(component.state.isOpen).toBe(true) // Testing internal state
```

✅ **Do**:
```typescript
expect(getByText('Modal Content')).toBeVisible() // Testing user-visible behavior
```

### 2. Use React Testing Library Queries
Prefer queries that users would use:
1. `getByRole` - Most accessible
2. `getByLabelText` - Forms
3. `getByText` - Fallback
4. `getByTestId` - Last resort

```typescript
// ✅ Good - user-visible
const button = getByRole('button', { name: 'Save' })

// ❌ Bad - implementation detail
const button = getByTestId('save-button')
```

### 3. Test Interactions, Not State
❌ **Don't**:
```typescript
expect(component.state.value).toBe('test')
```

✅ **Do**:
```typescript
fireEvent.changeText(input, 'test')
expect(input.props.value).toBe('test')
```

### 4. Wait for Async Operations
Always use `act()` and `waitFor()` for async operations:

```typescript
await act(async () => {
  await result.current.handleSave()
})

await waitFor(() => {
  expect(getByText('Saved!')).toBeVisible()
})
```

### 5. Clean Up Mocks
Reset mocks between tests to prevent test pollution:

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### 6. Test Edge Cases and Errors
Don't just test happy paths:

```typescript
it('handles network errors gracefully', async () => {
  mockService.getData.mockRejectedValueOnce(new Error('Network error'))
  // ... test error handling
})
```

### 7. Group Related Tests
Use `describe` blocks to organize related tests:

```typescript
describe('WorkoutService', () => {
  describe('getWorkouts', () => {
    it('returns empty array when no data', () => { /* ... */ })
    it('returns sorted workouts', () => { /* ... */ })
  })
  
  describe('saveWorkout', () => {
    it('saves workout successfully', () => { /* ... */ })
    it('handles storage errors', () => { /* ... */ })
  })
})
```

### 8. Keep Tests Focused
One assertion per test concept (multiple related assertions are fine):

```typescript
// ✅ Good - focused test
it('validates email format', () => {
  const result = validateEmail('invalid')
  expect(result.isValid).toBe(false)
  expect(result.error).toBe('Invalid email format')
})

// ❌ Bad - testing too much
it('validates form', () => {
  expect(validateEmail('invalid')).toBe(false)
  expect(validatePassword('short')).toBe(false)
  expect(validateName('')).toBe(false)
})
```

### 9. Use Descriptive Test Names
Test names should describe behavior:

```typescript
// ✅ Good
it('shows error message when email is invalid', () => { /* ... */ })
it('disables submit button when form is invalid', () => { /* ... */ })

// ❌ Bad
it('test email', () => { /* ... */ })
it('works', () => { /* ... */ })
```

### 10. Mock at the Right Level
- Mock external dependencies (AsyncStorage, API calls)
- Mock complex components (charts, date pickers)
- Don't mock simple components (just render them)
- Don't mock the component under test

## Platform-Specific Testing

### Web vs Mobile
Test platform-specific behavior when it matters:

```typescript
describe('Platform-specific behavior', () => {
  it('uses Alert on mobile', () => {
    Platform.OS = 'ios'
    // ... test mobile behavior
  })

  it('uses confirm dialog on web', () => {
    Platform.OS = 'web'
    // ... test web behavior
  })
})
```

### Date/Time Pickers
Mock platform-specific pickers in component tests:

```typescript
jest.mock('../../components/DatePickerModal', () => ({
  DatePickerModal: 'DatePickerModal', // Simple mock
}))
```

## What NOT to Test

1. **Third-party library code** (React, React Native, Expo, etc.)
2. **Simple presentational components** without logic
3. **Constants and configuration** (unless they contain logic)
4. **Type definitions** (TypeScript handles this)
5. **Trivial utilities** (one-liners with no logic)
6. **Styling and CSS** (use visual/manual testing)
7. **Implementation details** (internal state, private methods)

## Coverage Goals

**We do not set strict coverage targets.** Instead:

- Focus on **critical paths** (user authentication, data persistence, calculations)
- Test **business logic** thoroughly
- Test **error handling** and edge cases
- Test **user-facing functionality** (forms, interactions)
- Skip tests for **obvious or trivial code**

**Guideline**: If a bug in untested code would be caught immediately in manual testing, it may not need a test.

## Continuous Integration

Tests run automatically:
- On every pull request (recommended)
- Before merging PRs (recommended)
- On push to main branch (optional)

### CI Requirements
- All tests must pass
- No console errors or warnings (unless intentionally tested)
- Linting must pass
- Types must compile

## Common Patterns

### Testing Forms
```typescript
it('submits form with valid data', async () => {
  const onSubmit = jest.fn()
  const { getByLabelText, getByRole } = render(<Form onSubmit={onSubmit} />)
  
  fireEvent.changeText(getByLabelText('Name'), 'Test')
  fireEvent.changeText(getByLabelText('Email'), 'test@example.com')
  fireEvent.press(getByRole('button', { name: 'Submit' }))
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@example.com',
    })
  })
})
```

### Testing Loading States
```typescript
it('shows loading indicator while fetching data', async () => {
  mockService.getData.mockImplementation(() => 
    new Promise(resolve => setTimeout(resolve, 100))
  )
  
  const { getByTestId } = render(<Component />)
  expect(getByTestId('loading')).toBeVisible()
  
  await waitFor(() => {
    expect(queryByTestId('loading')).toBeNull()
  })
})
```

### Testing Error States
```typescript
it('displays error message when fetch fails', async () => {
  mockService.getData.mockRejectedValueOnce(new Error('Failed'))
  
  const { getByText } = render(<Component />)
  
  await waitFor(() => {
    expect(getByText('Failed to load data')).toBeVisible()
  })
})
```

## Debugging Tests

### Common Issues

1. **"Not wrapped in act()" warnings**
   - Wrap state updates in `act()`
   - Use `waitFor()` for async updates

2. **Mocks not resetting**
   - Use `jest.clearAllMocks()` in `beforeEach`

3. **Async operations not completing**
   - Use `await` and `waitFor()` appropriately
   - Check mock implementations are async

4. **Component not rendering**
   - Check mocks are not blocking render
   - Verify providers are set up correctly

## Future Enhancements

Potential improvements to consider:

- [ ] Visual regression testing for UI components
- [ ] E2E tests for critical user flows (Detox, Maestro)
- [ ] Accessibility testing (a11y checks)
- [ ] Performance testing for large datasets
- [ ] Snapshot testing for complex components (use sparingly)

## Resources

- [React Testing Library Documentation](https://testing-library.com/react-native)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Library Queries Priority](https://testing-library.com/docs/queries/about/#priority)

