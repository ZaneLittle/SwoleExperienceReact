// Setup for React Native Testing Library
import 'react-native-gesture-handler/jestSetup';

// Mock React Native components for testing
jest.mock('react-native', () => {
  const React = require('react');

  return {
    Alert: {
      alert: jest.fn(),
    },
    Modal: ({ children, visible, ...props }) => {
      return visible ? React.createElement('View', props, children) : null;
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    ActivityIndicator: 'ActivityIndicator',
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {});

// Mock react-native-screens
jest.mock('react-native-screens', () => {});