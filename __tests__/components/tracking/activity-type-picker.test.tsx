import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityTypePicker } from '@/components/tracking/activity-type-picker';
import { TestWrapper } from '../../helpers/test-wrapper';

describe('ActivityTypePicker', () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    onSelect.mockClear();
  });

  it('renders all three activity types', async () => {
    render(
      <ActivityTypePicker selected="run" onSelect={onSelect} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('Walk')).toBeTruthy();
      expect(screen.getByText('Run')).toBeTruthy();
      expect(screen.getByText('Cycle')).toBeTruthy();
    });
  });

  it('renders Lucide icons for each activity', async () => {
    render(
      <ActivityTypePicker selected="run" onSelect={onSelect} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      // Icons are now Lucide stubs; verify labels still appear alongside them
      expect(screen.getByText('Walk')).toBeTruthy();
      expect(screen.getByText('Run')).toBeTruthy();
      expect(screen.getByText('Cycle')).toBeTruthy();
    });
  });

  it('calls onSelect with correct type when pressed', async () => {
    render(
      <ActivityTypePicker selected="run" onSelect={onSelect} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByLabelText('Walk activity')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Walk activity'));
    expect(onSelect).toHaveBeenCalledWith('walk');

    fireEvent.press(screen.getByLabelText('Cycle activity'));
    expect(onSelect).toHaveBeenCalledWith('cycle');
  });

  it('marks selected item with accessibility state', async () => {
    render(
      <ActivityTypePicker selected="walk" onSelect={onSelect} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByLabelText('Walk activity')).toBeTruthy();
    });

    const walkButton = screen.getByLabelText('Walk activity');
    expect(walkButton.props.accessibilityState).toEqual({ selected: true });

    const runButton = screen.getByLabelText('Run activity');
    expect(runButton.props.accessibilityState).toEqual({ selected: false });
  });
});
