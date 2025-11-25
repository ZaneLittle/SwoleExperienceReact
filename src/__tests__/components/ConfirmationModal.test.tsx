import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useConfirmation } from '../../hooks/useConfirmation';
import { setGlobalConfirmationHandler, confirm, confirmAlert, confirmDelete } from '../../utils/confirm';
import { ConfirmationButton } from '../../components/ConfirmationModal';

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => {
  const React = require('react');
  return {
    useTheme: () => ({
      theme: 'light',
      themeMode: 'light',
      setThemeMode: jest.fn(),
      toggleTheme: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock useThemeColors hook
jest.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
      quaternary: '#3C3C4366',
    },
    border: '#C6C6C8',
    separator: '#C6C6C8',
  }),
}));

// Mock constants
jest.mock('../../lib/constants/ui', () => ({
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  SHADOWS: {
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
}));

describe('ConfirmationModal Utilities', () => {
  describe('useConfirmation hook', () => {
    it('should initialize with no confirmation', () => {
      const { result } = renderHook(() => useConfirmation());
      
      expect(result.current.ConfirmationComponent).toBeNull();
    });

    it('should show confirmation when showConfirmation is called', () => {
      const { result } = renderHook(() => useConfirmation());
      
      act(() => {
        result.current.showConfirmation({
          title: 'Test Title',
          message: 'Test Message',
          buttons: [
            { text: 'OK', onPress: jest.fn() },
          ],
        });
      });

      expect(result.current.ConfirmationComponent).not.toBeNull();
    });

    it('should hide confirmation when hideConfirmation is called', () => {
      const { result } = renderHook(() => useConfirmation());
      
      act(() => {
        result.current.showConfirmation({
          title: 'Test Title',
          message: 'Test Message',
          buttons: [
            { text: 'OK', onPress: jest.fn() },
          ],
        });
      });

      expect(result.current.ConfirmationComponent).not.toBeNull();

      act(() => {
        result.current.hideConfirmation();
      });

      expect(result.current.ConfirmationComponent).toBeNull();
    });
  });

  describe('confirm utility function', () => {
    it('should call global handler when set', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const buttons: ConfirmationButton[] = [
        { text: 'OK', onPress: jest.fn() },
      ];

      confirm('Test Title', 'Test Message', buttons);

      expect(mockHandler).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        buttons,
      });
    });

    it('should handle multiple buttons', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const buttons: ConfirmationButton[] = [
        { text: 'Cancel', style: 'cancel', onPress: jest.fn() },
        { text: 'OK', style: 'default', onPress: jest.fn() },
        { text: 'Delete', style: 'destructive', onPress: jest.fn() },
      ];

      confirm('Test Title', 'Test Message', buttons);

      expect(mockHandler).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        buttons,
      });
      expect(mockHandler.mock.calls[0][0].buttons).toHaveLength(3);
    });
  });

  describe('confirmAlert utility function', () => {
    it('should create alert with OK button', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      confirmAlert('Test Title', 'Test Message', onConfirm);

      expect(mockHandler).toHaveBeenCalled();
      const callArgs = mockHandler.mock.calls[0][0];
      expect(callArgs.title).toBe('Test Title');
      expect(callArgs.message).toBe('Test Message');
      expect(callArgs.buttons).toHaveLength(1);
      expect(callArgs.buttons[0].text).toBe('OK');
      expect(callArgs.buttons[0].style).toBe('default');
    });

    it('should include Cancel button when onCancel is provided', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      confirmAlert('Test Title', 'Test Message', onConfirm, onCancel);

      expect(mockHandler).toHaveBeenCalled();
      const callArgs = mockHandler.mock.calls[0][0];
      expect(callArgs.buttons).toHaveLength(2);
      expect(callArgs.buttons[0].text).toBe('Cancel');
      expect(callArgs.buttons[0].style).toBe('cancel');
      expect(callArgs.buttons[1].text).toBe('OK');
    });

    it('should call onConfirm when OK button is pressed', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      confirmAlert('Test Title', 'Test Message', onConfirm);

      const callArgs = mockHandler.mock.calls[0][0];
      callArgs.buttons[0].onPress();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel button is pressed', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      confirmAlert('Test Title', 'Test Message', onConfirm, onCancel);

      const callArgs = mockHandler.mock.calls[0][0];
      callArgs.buttons[0].onPress();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmDelete utility function', () => {
    it('should create delete confirmation with Delete button', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      confirmDelete('Test Title', 'Test Message', onConfirm);

      expect(mockHandler).toHaveBeenCalled();
      const callArgs = mockHandler.mock.calls[0][0];
      expect(callArgs.title).toBe('Test Title');
      expect(callArgs.message).toBe('Test Message');
      expect(callArgs.buttons).toHaveLength(1);
      expect(callArgs.buttons[0].text).toBe('Delete');
      expect(callArgs.buttons[0].style).toBe('destructive');
    });

    it('should include Cancel button when onCancel is provided', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      confirmDelete('Test Title', 'Test Message', onConfirm, onCancel);

      expect(mockHandler).toHaveBeenCalled();
      const callArgs = mockHandler.mock.calls[0][0];
      expect(callArgs.buttons).toHaveLength(2);
      expect(callArgs.buttons[0].text).toBe('Cancel');
      expect(callArgs.buttons[0].style).toBe('cancel');
      expect(callArgs.buttons[1].text).toBe('Delete');
      expect(callArgs.buttons[1].style).toBe('destructive');
    });

    it('should call onConfirm when Delete button is pressed', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      confirmDelete('Test Title', 'Test Message', onConfirm);

      const callArgs = mockHandler.mock.calls[0][0];
      callArgs.buttons[callArgs.buttons.length - 1].onPress();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel button is pressed', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      confirmDelete('Test Title', 'Test Message', onConfirm, onCancel);

      const callArgs = mockHandler.mock.calls[0][0];
      callArgs.buttons[0].onPress();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle confirm when handler is not set', () => {
      setGlobalConfirmationHandler(null as any);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      confirm('Test Title', 'Test Message', []);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Confirmation handler not set. Please use ConfirmationProvider.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty buttons array in confirm', () => {
      const mockHandler = jest.fn();
      setGlobalConfirmationHandler(mockHandler);

      confirm('Test Title', 'Test Message', []);

      expect(mockHandler).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        buttons: [],
      });
    });
  });
});
