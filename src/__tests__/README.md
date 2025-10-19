# Weight Components Test Suite

This directory contains comprehensive unit tests for all weight-related components, services, models, and hooks in the SwoleExperience React Native application.

## Test Structure

### Components
- **WeightEntryForm.test.tsx** - Tests for the weight entry form component
  - Form rendering and validation
  - Weight input handling
  - Date/time selection (web vs mobile)
  - Form submission and error handling
  - Platform-specific behavior

- **WeightHistory.test.tsx** - Tests for the weight history component
  - List rendering and empty states
  - Delete functionality (web vs mobile)
  - Edit functionality and inline editing
  - Confirmation dialogs
  - Error handling

- **WeightChart.test.tsx** - Tests for the weight chart component
  - Chart rendering with Victory components
  - Chart options toggling
  - Statistics display
  - Empty state handling
  - Responsive design
  - Data integration with useDailyStats hook

### Services
- **WeightService.test.ts** - Tests for the weight service
  - CRUD operations (Create, Read, Update, Delete)
  - AsyncStorage integration
  - Data filtering and sorting
  - Error handling and edge cases
  - Singleton pattern validation

- **AverageService.test.ts** - Tests for the average service
  - Average calculations
  - Rolling averages (3-day, 7-day)
  - Date grouping and processing
  - Storage operations
  - Edge cases and error handling

### Hooks
- **useDailyStats.test.ts** - Tests for the daily statistics hook
  - Data processing and transformation
  - Statistics calculations
  - Y-domain calculations
  - Memoization behavior
  - Edge cases and performance

### Models
- **Weight.test.ts** - Tests for the Weight model and converter
  - Interface validation
  - Data conversion (toData/fromData)
  - Round-trip conversion integrity
  - Type safety
  - Edge cases and error handling

- **Average.test.ts** - Tests for the Average model and converter
  - Interface validation
  - Nullable field handling
  - Data conversion integrity
  - Type safety
  - Business logic validation

## Test Utilities

### testUtils.tsx
Provides common test utilities including:
- Mock data generators (`createMockWeight`, `createMockAverage`)
- Custom render function with providers
- Test helpers for creating multiple mock objects

### mocks/services.ts
Provides service mocks including:
- WeightService mock with default implementations
- AverageService mock with default implementations
- Helper functions for test setup
- Mock reset functionality

## Test Coverage

The test suite provides comprehensive coverage for:

### Functional Testing
- ✅ Component rendering and user interactions
- ✅ Form validation and submission
- ✅ CRUD operations
- ✅ Data processing and calculations
- ✅ Error handling and edge cases

### Platform Testing
- ✅ Web platform behavior
- ✅ Mobile platform behavior
- ✅ Platform-specific UI components

### Data Flow Testing
- ✅ Component to service integration
- ✅ Service to storage integration
- ✅ Hook to component integration
- ✅ Model data conversion

### Edge Cases
- ✅ Empty data states
- ✅ Invalid input handling
- ✅ Network/storage failures
- ✅ Extreme values
- ✅ Date/time edge cases

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test WeightEntryForm.test.tsx
```

## Test Configuration

The test suite uses:
- **Jest** as the test runner
- **React Native Testing Library** for component testing
- **Jest-Expo** preset for Expo compatibility
- **AsyncStorage** mocking for storage operations
- **Victory** component mocking for chart testing

## Mock Strategy

### External Dependencies
- AsyncStorage is mocked to simulate storage operations
- Alert and Platform APIs are mocked for cross-platform testing
- Victory components are mocked to avoid complex chart rendering in tests

### Child Components
- DatePickerModal and TimePickerModal are mocked as simple div elements
- DateTimeButtons is mocked to provide testable interactions

### Services
- Services are mocked at the module level to provide predictable behavior
- Default implementations return successful results
- Test-specific overrides allow for error scenario testing

## Best Practices

### Test Organization
- Tests are organized by functionality and grouped logically
- Each test file focuses on a single component/service/hook
- Test descriptions are clear and describe the expected behavior

### Assertions
- Tests verify both positive and negative scenarios
- Edge cases and error conditions are thoroughly tested
- Async operations are properly awaited and tested

### Mock Management
- Mocks are reset between tests to ensure isolation
- Mock implementations are realistic and match real behavior
- Test-specific mock overrides are used sparingly

### Performance
- Large datasets are tested to ensure performance
- Memoization behavior is verified
- Concurrent operations are tested

## Maintenance

When adding new features to weight components:

1. **Add corresponding tests** for new functionality
2. **Update existing tests** if behavior changes
3. **Add edge cases** for new validation rules
4. **Update mocks** if new dependencies are added
5. **Verify test coverage** remains comprehensive

## Future Improvements

Potential enhancements to the test suite:

- **Integration tests** for complete user workflows
- **Visual regression tests** for chart components
- **Performance benchmarks** for large datasets
- **Accessibility tests** for screen reader compatibility
- **E2E tests** for critical user paths
