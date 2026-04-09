import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ControlButtons } from '@/components/tracking/control-buttons';
import * as Haptics from 'expo-haptics';

// ControlButtons doesn't use SettingsProvider, so no wrapper needed

describe('ControlButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('idle state', () => {
    it('renders START button', () => {
      render(<ControlButtons status="idle" />);
      expect(screen.getByText('START')).toBeTruthy();
    });

    it('does not render STOP or PAUSE', () => {
      render(<ControlButtons status="idle" />);
      expect(screen.queryByText('STOP')).toBeNull();
      expect(screen.queryByText('PAUSE')).toBeNull();
    });

    it('calls onStart and triggers haptic on press', () => {
      const onStart = jest.fn();
      render(<ControlButtons status="idle" onStart={onStart} />);
      fireEvent.press(screen.getByText('START'));
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium,
      );
    });
  });

  describe('active state', () => {
    it('renders STOP and PAUSE buttons', () => {
      render(<ControlButtons status="active" />);
      expect(screen.getByText('STOP')).toBeTruthy();
      expect(screen.getByText('PAUSE')).toBeTruthy();
    });

    it('does not render START or RESUME', () => {
      render(<ControlButtons status="active" />);
      expect(screen.queryByText('START')).toBeNull();
      expect(screen.queryByText('RESUME')).toBeNull();
    });

    it('calls onPause on PAUSE press', () => {
      const onPause = jest.fn();
      render(<ControlButtons status="active" onPause={onPause} />);
      fireEvent.press(screen.getByText('PAUSE'));
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onStop on STOP press', () => {
      const onStop = jest.fn();
      render(<ControlButtons status="active" onStop={onStop} />);
      fireEvent.press(screen.getByText('STOP'));
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('paused state', () => {
    it('renders STOP and RESUME buttons', () => {
      render(<ControlButtons status="paused" />);
      expect(screen.getByText('STOP')).toBeTruthy();
      expect(screen.getByText('RESUME')).toBeTruthy();
    });

    it('does not render PAUSE or START', () => {
      render(<ControlButtons status="paused" />);
      expect(screen.queryByText('PAUSE')).toBeNull();
      expect(screen.queryByText('START')).toBeNull();
    });

    it('calls onResume on RESUME press', () => {
      const onResume = jest.fn();
      render(<ControlButtons status="paused" onResume={onResume} />);
      fireEvent.press(screen.getByText('RESUME'));
      expect(onResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has correct accessibility labels', () => {
      render(<ControlButtons status="idle" />);
      expect(screen.getByLabelText('Start activity')).toBeTruthy();
    });

    it('labels stop and pause buttons when active', () => {
      render(<ControlButtons status="active" />);
      expect(screen.getByLabelText('Stop activity')).toBeTruthy();
      expect(screen.getByLabelText('Pause activity')).toBeTruthy();
    });

    it('labels resume button when paused', () => {
      render(<ControlButtons status="paused" />);
      expect(screen.getByLabelText('Resume activity')).toBeTruthy();
    });
  });
});
