import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignUpScreen from '@/app/auth/signup';
import { AuthError } from '@/lib/auth/auth-service';

const mockSignup = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'dark' }));

function renderScreen() {
  return render(<SignUpScreen />);
}

describe('SignUpScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all three inputs', () => {
    renderScreen();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('renders signup button', () => {
    renderScreen();
    expect(screen.getByTestId('signup-button')).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('signup-button'));
    await waitFor(() => {
      expect(screen.getByText('All fields are required.')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows email format error for invalid email', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('email-input'), 'bad-email');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'password123');
    fireEvent.press(screen.getByTestId('signup-button'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'different123');
    fireEvent.press(screen.getByTestId('signup-button'));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'short');
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'short');
    fireEvent.press(screen.getByTestId('signup-button'));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
    });
  });

  it('calls signup and navigates to verify-email on success', async () => {
    mockSignup.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'password123');
    await act(async () => {
      fireEvent.press(screen.getByTestId('signup-button'));
    });

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/auth/verify-email',
        params: { email: 'user@example.com' },
      });
    });
  });

  it('shows server error on AuthError', async () => {
    mockSignup.mockRejectedValue(new AuthError(409, 'Email already in use'));
    renderScreen();

    fireEvent.changeText(screen.getByTestId('email-input'), 'taken@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'password123');
    await act(async () => {
      fireEvent.press(screen.getByTestId('signup-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeTruthy();
    });
  });

  it('navigates back when sign-in link pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('goto-signin'));
    expect(mockBack).toHaveBeenCalled();
  });
});
