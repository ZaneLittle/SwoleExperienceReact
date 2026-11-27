import { renderHook } from '@testing-library/react-native'
import { useDayText } from '../../hooks/useDayText'

describe('useDayText', () => {
  it('should return "Today" for offset 0', async () => {
    const { result } = await renderHook(() => useDayText(0))
    expect(result.current).toBe('Today')
  })

  it('should return "Yesterday" for offset -1', async () => {
    const { result } = await renderHook(() => useDayText(-1))
    expect(result.current).toBe('Yesterday')
  })

  it('should return "Tomorrow" for offset 1', async () => {
    const { result } = await renderHook(() => useDayText(1))
    expect(result.current).toBe('Tomorrow')
  })

  it('should return correct text for negative offsets', async () => {
    const { result: result2 } = await renderHook(() => useDayText(-2))
    expect(result2.current).toBe('2 Days Ago')

    const { result: result3 } = await renderHook(() => useDayText(-5))
    expect(result3.current).toBe('5 Days Ago')

    const { result: result10 } = await renderHook(() => useDayText(-10))
    expect(result10.current).toBe('10 Days Ago')
  })

  it('should return correct text for positive offsets', async () => {
    const { result: result2 } = await renderHook(() => useDayText(2))
    expect(result2.current).toBe('In 2 Days')

    const { result: result3 } = await renderHook(() => useDayText(3))
    expect(result3.current).toBe('In 3 Days')

    const { result: result7 } = await renderHook(() => useDayText(7))
    expect(result7.current).toBe('In 7 Days')
  })

  it('should update when dayOffset changes', async () => {
    const { result, rerender } = await renderHook(
      ({ dayOffset }) => useDayText(dayOffset),
      { initialProps: { dayOffset: 0 } },
    )

    expect(result.current).toBe('Today')

    await rerender({ dayOffset: -1 })
    expect(result.current).toBe('Yesterday')

    await rerender({ dayOffset: 1 })
    expect(result.current).toBe('Tomorrow')

    await rerender({ dayOffset: -3 })
    expect(result.current).toBe('3 Days Ago')

    await rerender({ dayOffset: 5 })
    expect(result.current).toBe('In 5 Days')
  })
})
