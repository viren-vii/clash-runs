import React, { useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthError } from '@/lib/auth/auth-service';
import { Colors, FontFamilies, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  async function handleSignUp() {
    setError('');
    if (!email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password);
      router.push({ pathname: '/auth/verify-email', params: { email: email.trim() } });
    } catch (e) {
      setError(
        e instanceof AuthError ? e.message : 'Sign up failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
          Join Clash Runs
        </Text>

        {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

        <TextInput
          style={[styles.input, { backgroundColor: theme.surfaceContainerHigh, color: theme.onSurface }]}
          placeholder="Email"
          placeholderTextColor={theme.onSurfaceDim}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          testID="email-input"
        />

        <TextInput
          ref={passwordRef}
          style={[styles.input, { backgroundColor: theme.surfaceContainerHigh, color: theme.onSurface }]}
          placeholder="Password"
          placeholderTextColor={theme.onSurfaceDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          testID="password-input"
        />

        <TextInput
          ref={confirmRef}
          style={[styles.input, { backgroundColor: theme.surfaceContainerHigh, color: theme.onSurface }]}
          placeholder="Confirm Password"
          placeholderTextColor={theme.onSurfaceDim}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          testID="confirm-password-input"
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          testID="signup-button"
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Create Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} testID="goto-signin">
          <Text style={[styles.linkText, { color: theme.onSurfaceVariant }]}>
            Already have an account?{' '}
            <Text style={{ color: theme.primary }}>Sign in</Text>
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
  input: {
    fontFamily: FontFamilies.body,
    fontSize: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
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
