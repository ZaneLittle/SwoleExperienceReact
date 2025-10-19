import { Alert, Platform } from 'react-native';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
}

export class AppError extends Error {
  public readonly context: ErrorContext;
  public readonly code: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', context: ErrorContext = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = {
      ...context,
      timestamp: new Date(),
    };
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const handleError = (error: unknown, context: ErrorContext = {}): void => {
  console.error('App Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Show user-friendly error message
  const userMessage = getUserFriendlyMessage(error);
  
  if (Platform.OS === 'web') {
    // Use browser alert for web
    window.alert(userMessage);
  } else {
    // Use React Native Alert for mobile
    Alert.alert('Error', userMessage);
  }
};

const getUserFriendlyMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ErrorCodes.STORAGE_ERROR:
        return 'There was a problem saving your data. Please try again.';
      case ErrorCodes.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      case ErrorCodes.AUTHENTICATION_ERROR:
        return 'Please log in again to continue.';
      case ErrorCodes.PERMISSION_ERROR:
        return 'Permission denied. Please check your settings.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  if (error instanceof Error) {
    // Handle specific error messages
    if (error.message.includes('AsyncStorage')) {
      return 'There was a problem accessing your data. Please try again.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }
  }

  return 'Something went wrong. Please try again.';
};

export const createErrorHandler = (context: ErrorContext) => {
  return (error: unknown) => handleError(error, context);
};

// Async error wrapper for service methods
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorContext = {}
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };
};
