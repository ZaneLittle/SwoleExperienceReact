// Setup for React Native Testing Library
import 'react-native-gesture-handler/jestSetup';

// Mock react-native components for React Native Testing Library
jest.mock('react-native', () => {
  const React = require('react');
  
  // Create simple component functions
  const createComponent = (name) => {
    const Comp = (props) => React.createElement(name, props, props?.children);
    Comp.displayName = name;
    return Comp;
  }
  
  return {
    View: createComponent('View'),
    Text: createComponent('Text'),
    TextInput: createComponent('TextInput'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    ScrollView: (props) => React.createElement('ScrollView', props, props?.children),
    KeyboardAvoidingView: (props) => React.createElement('KeyboardAvoidingView', props, props?.children),
    Modal: (props) => {
      if (!props?.visible) return null;
      return React.createElement('View', { testID: 'modal', ...props }, props?.children);
    },
    ActivityIndicator: createComponent('ActivityIndicator'),
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'web', // Default to web for consistent test behavior in jsdom environment.
                 // Individual tests can override this if needed for platform-specific testing.
      select: jest.fn((obj) => obj.web || obj.default),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  }
})

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {})

// Mock react-native-screens
jest.mock('react-native-screens', () => {})