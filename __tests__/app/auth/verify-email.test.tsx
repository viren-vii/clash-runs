import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import VerifyEmailScreen from '@/app/auth/verify-email';
import { AuthError } from '@/lib/auth/auth-service';

const mockVerifyEmail = jest.fn();
const mockResendVerification = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ verifyEmail: mockVerifyEmail }),
}));

// Keep AuthError real; mock only the functions called by the screen
jest.mock('@/lib/auth/auth-service', () => ({
  ...jest.requireActual('@/lib/auth/auth-service'),
  resendVerification: (...args: unknown[]) => mockResendVerification(...args),
}));

let mockEmail: string | undefined = 'user@example.com';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => ({ email: mockEmail }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'dark' }));

function renderScreen() {
  return render(<VerifyEmailScreen />);
}

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockResendVerification.mockResolvedValue(undefined);
    mockEmail = 'user@example.com';
  });
  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it('renders code input', () => {
    renderScreen();
    expect(screen.getByTestId('code-input')).toBeTruthy();
  });

  it('renders verify button', () => {
    renderScreen();
    expect(screen.getByTestId('verify-button')).toBeTruthy();
  });

  it('renders resend button', () => {
    renderScreen();
    expect(screen.getByTestId('resend-button')).toBeTruthy();
  });

  it('shows the email address in the subtitle', () => {
    renderScreen();
    expect(screen.getByText('user@example.com')).toBeTruthy();
  });

  it('shows validation error when code is shorter than 6 digits', async () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('code-input'), '123');
    fireEvent.press(screen.getByTestId('verify-button'));
    await waitFor(() => {
      expect(screen.getByText('Please enter the 6-digit code.')).toBeTruthy();
    });
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it('strips non-digit characters from code input', () => {
    renderScreen();
    fireEvent.changeText(screen.getByTestId('code-input'), 'abc123def');
    expect(screen.getByTestId('code-input').props.value).toBe('123');
  });

  it('calls verifyEmail and navigates to signin on success', async () => {
    mockVerifyEmail.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('code-input'), '123456');
    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-button'));
    });

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('user@example.com', '123456');
      expect(mockReplace).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('shows server error on AuthError', async () => {
    mockVerifyEmail.mockRejectedValue(
      new AuthError(400, 'Invalid verification code'),
    );
    renderScreen();

    fireEvent.changeText(screen.getByTestId('code-input'), '000000');
    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeTruthy();
    });
  });

  it('shows generic error on unexpected failure', async () => {
    mockVerifyEmail.mockRejectedValue(new Error('Network error'));
    renderScreen();

    fireEvent.changeText(screen.getByTestId('code-input'), '123456');
    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please try again.')).toBeTruthy();
    });
  });

  it('redirects to signup when email param is missing', async () => {
    mockEmail = undefined;
    renderScreen();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/signup');
    });
  });

  it('calls resendVerification API and shows "Code sent!" on success', async () => {
    mockResendVerification.mockResolvedValue(undefined);
    renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId('resend-button'));
    });
    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByText('Code sent!')).toBeTruthy();
    });
  });

  it('shows error and does NOT set "Code sent!" when resend API fails', async () => {
    mockResendVerification.mockRejectedValue(new AuthError(429, 'Too many requests'));
    renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId('resend-button'));
    });
    await waitFor(() => {
      expect(screen.getByText('Too many requests')).toBeTruthy();
      expect(screen.queryByText('Code sent!')).toBeNull();
    });
  });

  it('shows generic error when resend fails without AuthError', async () => {
    mockResendVerification.mockRejectedValue(new Error('Network error'));
    renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId('resend-button'));
    });
    await waitFor(() => {
      expect(screen.getByText('Could not resend code. Please try again.')).toBeTruthy();
    });
  });
});
