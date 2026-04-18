import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import type { AuthUser, SigninResponse } from './auth-service';
import * as AuthService from './auth-service';
import * as TokenManager from './token-manager';
import { checkBiometricAvailability, promptBiometric } from './biometric-service';
import { registerSessionInvalidatedHandler } from './session-events';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'AUTHENTICATED'; user: AuthUser }
  | { type: 'UNAUTHENTICATED' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true };
    case 'AUTHENTICATED':
      return { user: action.user, isAuthenticated: true, isLoading: false };
    case 'UNAUTHENTICATED':
      return { user: null, isAuthenticated: false, isLoading: false };
  }
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const restoreSession = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (!refreshToken) {
        dispatch({ type: 'UNAUTHENTICATED' });
        return;
      }

      // Try the stored access token first; if valid, we're done.
      const accessToken = await TokenManager.getAccessToken();
      if (accessToken) {
        const user = await TokenManager.getUser<AuthUser>();
        if (user) {
          dispatch({ type: 'AUTHENTICATED', user });
          return;
        }
      }

      // Access token expired — require biometric (if available) before using refresh token.
      const { available } = await checkBiometricAvailability();
      if (available) {
        const biometricOk = await promptBiometric('Unlock to continue your session');
        if (!biometricOk) {
          await TokenManager.clearTokens();
          dispatch({ type: 'UNAUTHENTICATED' });
          return;
        }
      }

      const { accessToken: newAccess, refreshToken: newRefresh } =
        await AuthService.refreshTokens(refreshToken);
      await TokenManager.saveTokens(newAccess, newRefresh);

      const user = await TokenManager.getUser<AuthUser>();
      if (user) {
        dispatch({ type: 'AUTHENTICATED', user });
      } else {
        dispatch({ type: 'UNAUTHENTICATED' });
      }
    } catch {
      await TokenManager.clearTokens();
      dispatch({ type: 'UNAUTHENTICATED' });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    return registerSessionInvalidatedHandler(() => {
      dispatch({ type: 'UNAUTHENTICATED' });
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response: SigninResponse = await AuthService.signin(email, password);
    await Promise.all([
      TokenManager.saveTokens(response.accessToken, response.refreshToken),
      TokenManager.saveUser(response.user),
    ]);
    dispatch({ type: 'AUTHENTICATED', user: response.user });
  }, []);

  const signupFn = useCallback(async (email: string, password: string) => {
    await AuthService.signup(email, password);
  }, []);

  const verifyEmailFn = useCallback(async (email: string, code: string) => {
    await AuthService.verifyEmail(email, code);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) await AuthService.signout(refreshToken);
    } catch {
      // best-effort; still clear local tokens
    }
    await TokenManager.clearTokens();
    dispatch({ type: 'UNAUTHENTICATED' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup: signupFn,
        verifyEmail: verifyEmailFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
