import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignInScreen from '@/app/auth/signin';
import { AuthError } from '@/lib/auth/auth-service';

const mockLogin = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'dark' }));

function renderScreen() {
  return render(<SignInScreen />);
}

describe('SignInScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email and password inputs', () => {
    renderScreen();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
  });

  it('renders Sign In button', () => {
    renderScreen();
    expect(screen.getByTestId('signin-button')).toBeTruthy();
  });

  it('renders link to sign-up screen', () => {
    renderScreen();
    expect(screen.getByTestId('goto-signup')).toBeTruthy();
  });

  it('shows validation error when fields are empty', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('signin-button'));
    await waitFor(() => {
      expect(screen.getByText('Email and password are required.')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows email format error for invalid email', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('email-input'), 'not-an-email');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.press(screen.getByTestId('signin-button'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with trimmed email and password', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('email-input'), '  user@example.com  ');
    fireEvent.changeText(screen.getByTestId('password-input'), 'secret123');
    await act(async () => {
      fireEvent.press(screen.getByTestId('signin-button'));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123');
    });
  });

  it('shows server error message on AuthError', async () => {
    mockLogin.mockRejectedValue(new AuthError(401, 'Invalid credentials'));
    renderScreen();

    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'wrongpass');
    await act(async () => {
      fireEvent.press(screen.getByTestId('signin-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('shows generic error on unexpected failure', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));
    renderScreen();

    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'secret123');
    await act(async () => {
      fireEvent.press(screen.getByTestId('signin-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in failed. Please try again.')).toBeTruthy();
    });
  });

  it('navigates to signup when link pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('goto-signup'));
    expect(mockPush).toHaveBeenCalledWith('/auth/signup');
  });
});
