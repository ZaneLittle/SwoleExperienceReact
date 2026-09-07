import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ReorderControls } from '../../../components/workouts/ReorderControls'

describe('ReorderControls', () => {
  it('hides the up arrow on the first item', () => {
    const { queryByLabelText, getByLabelText } = render(
      <ReorderControls
        index={0}
        totalItems={3}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
        upAccessibilityLabel="Move up"
        downAccessibilityLabel="Move down"
      />,
    )

    expect(queryByLabelText('Move up')).toBeNull()
    expect(getByLabelText('Move down')).toBeTruthy()
  })

  it('hides the down arrow on the last item', () => {
    const { queryByLabelText, getByLabelText } = render(
      <ReorderControls
        index={2}
        totalItems={3}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
        upAccessibilityLabel="Move up"
        downAccessibilityLabel="Move down"
      />,
    )

    expect(getByLabelText('Move up')).toBeTruthy()
    expect(queryByLabelText('Move down')).toBeNull()
  })

  it('calls the matching callback when an arrow is pressed', () => {
    const onMoveUp = jest.fn()
    const onMoveDown = jest.fn()
    const { getByLabelText } = render(
      <ReorderControls
        index={1}
        totalItems={3}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        upAccessibilityLabel="Move up"
        downAccessibilityLabel="Move down"
      />,
    )

    fireEvent.press(getByLabelText('Move up'))
    fireEvent.press(getByLabelText('Move down'))

    expect(onMoveUp).toHaveBeenCalledTimes(1)
    expect(onMoveDown).toHaveBeenCalledTimes(1)
  })
})
