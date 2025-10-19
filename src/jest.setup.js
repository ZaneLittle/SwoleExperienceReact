// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-uuid
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

// Mock specific React Native modules that cause issues
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  prompt: jest.fn(),
}));

// Mock Victory components (only when needed for component tests)
// jest.mock('victory', () => ({
//   VictoryChart: 'VictoryChart',
//   VictoryAxis: 'VictoryAxis',
//   VictoryGroup: 'VictoryGroup',
//   VictoryLine: 'VictoryLine',
//   VictoryScatter: 'VictoryScatter',
//   VictoryArea: 'VictoryArea',
// }));

// Mock window.confirm for web platform
global.window = {
  ...global.window,
  confirm: jest.fn(),
};

// Mock localStorage for web platform
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Silence specific console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Error getting weights:') ||
       args[0].includes('Error getting averages:') ||
       args[0].includes('Error adding weight:') ||
       args[0].includes('Error calculating averages:') ||
       args[0].includes('Error getting current day:') ||
       args[0].includes('Error setting current day:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
