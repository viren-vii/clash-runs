import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthError, resendVerification } from '@/lib/auth/auth-service';
import { Colors, FontFamilies, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail } = useAuth();
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const resendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!email) router.replace('/auth/signup');
  }, [email, router]);

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearTimeout(resendTimerRef.current);
    };
  }, []);

  async function handleVerify() {
    setError('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email ?? '', code);
      router.replace('/auth/signin');
    } catch (e) {
      setError(
        e instanceof AuthError ? e.message : 'Verification failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setResending(true);
    try {
      await resendVerification(email ?? '');
      setResent(true);
      if (resendTimerRef.current) clearTimeout(resendTimerRef.current);
      resendTimerRef.current = setTimeout(() => setResent(false), 30_000);
    } catch (e) {
      setError(
        e instanceof AuthError ? e.message : 'Could not resend code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }

  function handleCodeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.primary }]}>Check Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: theme.onSurface }}>{email}</Text>
        </Text>

        {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

        <TextInput
          ref={inputRef}
          style={[styles.codeInput, { backgroundColor: theme.surfaceContainerHigh, color: theme.onSurface }]}
          placeholder="000000"
          placeholderTextColor={theme.onSurfaceDim}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleVerify}
          testID="code-input"
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
          testID="verify-button"
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Verify Email</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={resending || resent}
          testID="resend-button"
        >
          <Text style={[styles.linkText, { color: resent ? theme.onSurfaceDim : theme.primary }]}>
            {resent ? 'Code sent!' : "Didn't receive it? Resend"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    ...Typography.headlineLg,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLg,
    marginBottom: Spacing.lg,
  },
  codeInput: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.md,
    letterSpacing: 8,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.labelLg,
    fontFamily: FontFamilies.bodyBold,
  },
  linkText: {
    ...Typography.bodyMd,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySm,
    textAlign: 'center',
  },
});
