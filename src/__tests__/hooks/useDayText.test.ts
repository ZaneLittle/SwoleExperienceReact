import { renderHook } from '@testing-library/react-native';
import { useDayText } from '../../hooks/useDayText';

describe('useDayText', () => {
  it('should return "Today" for offset 0', () => {
    const { result } = renderHook(() => useDayText(0));
    expect(result.current).toBe('Today');
  });

  it('should return "Yesterday" for offset -1', () => {
    const { result } = renderHook(() => useDayText(-1));
    expect(result.current).toBe('Yesterday');
  });

  it('should return "Tomorrow" for offset 1', () => {
    const { result } = renderHook(() => useDayText(1));
    expect(result.current).toBe('Tomorrow');
  });

  it('should return correct text for negative offsets', () => {
    const { result: result2 } = renderHook(() => useDayText(-2));
    expect(result2.current).toBe('2 Days Ago');

    const { result: result3 } = renderHook(() => useDayText(-5));
    expect(result3.current).toBe('5 Days Ago');

    const { result: result10 } = renderHook(() => useDayText(-10));
    expect(result10.current).toBe('10 Days Ago');
  });

  it('should return correct text for positive offsets', () => {
    const { result: result2 } = renderHook(() => useDayText(2));
    expect(result2.current).toBe('In 2 Days');

    const { result: result3 } = renderHook(() => useDayText(3));
    expect(result3.current).toBe('In 3 Days');

    const { result: result7 } = renderHook(() => useDayText(7));
    expect(result7.current).toBe('In 7 Days');
  });

  it('should update when dayOffset changes', () => {
    const { result, rerender } = renderHook(
      ({ dayOffset }) => useDayText(dayOffset),
      { initialProps: { dayOffset: 0 } }
    );

    expect(result.current).toBe('Today');

    rerender({ dayOffset: -1 });
    expect(result.current).toBe('Yesterday');

    rerender({ dayOffset: 1 });
    expect(result.current).toBe('Tomorrow');

    rerender({ dayOffset: -3 });
    expect(result.current).toBe('3 Days Ago');

    rerender({ dayOffset: 5 });
    expect(result.current).toBe('In 5 Days');
  });
});
