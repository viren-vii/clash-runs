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

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  async function handleSignIn() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(
        e instanceof AuthError ? e.message : 'Sign in failed. Please try again.',
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
        <Text style={[styles.title, { color: theme.primary }]}>Clash Runs</Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
          Sign in to continue
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
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
          testID="password-input"
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          testID="signin-button"
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Sign In</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/signup')}
          testID="goto-signup"
        >
          <Text style={[styles.linkText, { color: theme.onSurfaceVariant }]}>
            Don't have an account?{' '}
            <Text style={{ color: theme.primary }}>Sign up</Text>
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
