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
  
  // TouchableOpacity needs special handling to map onPress to onClick for testing
  const TouchableOpacity = (props) => {
    const { onPress, children, ...otherProps } = props;
    return React.createElement('touchableopacity', {
      ...otherProps,
      onClick: onPress, // Map onPress to onClick for fireEvent.click to work
      onPress: onPress, // Keep onPress as well
    }, children);
  };
  TouchableOpacity.displayName = 'TouchableOpacity';
  
  return {
    View: createComponent('View'),
    Text: createComponent('Text'),
    TextInput: createComponent('TextInput'),
    TouchableOpacity,
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

// Add style element support for web components
const React = require('react');
const originalCreateElement = React.createElement;
React.createElement = function(type, props) {
  const children = Array.prototype.slice.call(arguments, 2);
  if (type === 'style') {
    // Return null for style tags in tests (they're not needed for testing)
    return null;
  }
  return originalCreateElement.apply(this, arguments);
}

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {})

// Mock react-native-screens
jest.mock('react-native-screens', () => {})

