import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import auth from './auth';
import AppLogo from '../components/AppLogo';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = NativeStackScreenProps<any, any>;
type Field = 'name' | 'email' | 'password' | 'confirmPassword';
type Status = { type: 'success' | 'error'; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const computeErrors = useCallback(() => {
    const next: Partial<Record<Field, string>> = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      next.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = 'Enter a valid email address';
    }

    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 8) {
      next.password = 'Use at least 8 characters';
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = 'Use letters and numbers';
    }

    if (isSignup) {
      if (!name.trim()) {
        next.name = 'Name is required';
      } else if (name.trim().length < 3) {
        next.name = 'Name must be 3+ characters';
      }

      if (!confirmPassword) {
        next.confirmPassword = 'Confirm your password';
      } else if (confirmPassword !== password) {
        next.confirmPassword = 'Passwords must match';
      }
    }

    return next;
  }, [email, password, confirmPassword, name, isSignup]);

  const errors = useMemo(() => computeErrors(), [computeErrors]);
  const hasErrors = Object.keys(errors).length > 0;

  const markTouched = (field: Field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggleMode = (nextSignup: boolean) => {
    setIsSignup(nextSignup);
    setTouched({ name: false, email: false, password: false, confirmPassword: false });
    setFormError('');
    setStatus(null);
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (!nextSignup) {
      setName('');
    }
  };

  const buildFieldError = (field: Field) => (touched[field] ? errors[field] : undefined);

  const runAuthFlow = async () => {
    setFormError('');
    setStatus(null);
    const fieldsToTouch: Field[] = isSignup ? ['name', 'email', 'password', 'confirmPassword'] : ['email', 'password'];
    setTouched((prev) => {
      const next = { ...prev };
      fieldsToTouch.forEach((key) => {
        next[key] = true;
      });
      return next;
    });

    const currentErrors = computeErrors();
    if (Object.keys(currentErrors).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await auth.signup(name.trim(), email.trim(), password);
      } else {
        await auth.login({ email: email.trim(), password });
      }

      setPassword('');
      setConfirmPassword('');
      if (isSignup) setName('');

      setStatus({ type: 'success', message: isSignup ? 'Account created successfully.' : 'Login successful.' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { returnAction } = route.params || {};
      if (returnAction) {
        const { type } = returnAction as any;
        if (type === 'playTrailer') {
          navigation.navigate('Details', { movieId: returnAction.movieId, playTrailerKey: returnAction.playTrailerKey });
          return;
        }
        if (type === 'favorite') {
          navigation.navigate('Details', { movieId: returnAction.movieId ?? returnAction.movie?.id, autoFavorite: true, returnAction });
          return;
        }
        if (type === 'watch') {
          navigation.navigate('Details', { movieId: returnAction.movieId });
          return;
        }
        if (type === 'download') {
          navigation.navigate('Details', { movieId: returnAction.movieId, returnAction });
          return;
        }
      }

      const { returnScreen, params } = route.params || {};
      if (returnScreen) {
        navigation.navigate(returnScreen, params || {});
      } else {
        navigation.navigate('Tabs');
      }
    } catch (err: any) {
      console.warn('login error', err);
      let message = isSignup ? 'Could not create your account.' : 'We could not sign you in.';
      if (err instanceof Error) {
        switch (err.message) {
          case 'ACCOUNT_EXISTS':
            message = 'An account with that email already exists.';
            break;
          case 'ACCOUNT_NOT_FOUND':
            message = 'No account found for that email.';
            break;
          case 'INVALID_CREDENTIALS':
            message = 'Incorrect email and password combination.';
            break;
          case 'PASSWORD_REQUIRED':
            message = 'Enter your password to continue.';
            break;
          default:
            break;
        }
      }
      setFormError(message);
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const passwordHasLength = password.length >= 8;
  const passwordHasMix = /[A-Za-z]/.test(password) && /\d/.test(password);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <AppLogo align="center" tone="light" tagline="Bhutan Movie Club" />
          <Text style={styles.subtitle}>{isSignup ? 'Create a secure account to sync watchlists everywhere.' : 'Welcome back! Sign in to pick up where you left off.'}</Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeButton, !isSignup && styles.modeButtonActive]}
              onPress={() => toggleMode(false)}
              disabled={!isSignup}
            >
              <Text style={!isSignup ? styles.modeTextActive : styles.modeText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, isSignup && styles.modeButtonActive]}
              onPress={() => toggleMode(true)}
              disabled={isSignup}
            >
              <Text style={isSignup ? styles.modeTextActive : styles.modeText}>Create account</Text>
            </TouchableOpacity>
          </View>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          {status ? (
            <View style={[styles.statusBanner, status.type === 'success' ? styles.statusSuccess : styles.statusError]}>
              <Text style={styles.statusText}>{status.message}</Text>
            </View>
          ) : null}

          {isSignup && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                placeholder="Jamyang Dorji"
                value={name}
                onChangeText={setName}
                onBlur={() => markTouched('name')}
                autoCapitalize="words"
                style={[styles.input, buildFieldError('name') && styles.inputError]}
                returnKeyType="next"
              />
              {buildFieldError('name') ? <Text style={styles.errorText}>{buildFieldError('name')}</Text> : null}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              style={[styles.input, buildFieldError('email') && styles.inputError]}
              returnKeyType="next"
            />
            {buildFieldError('email') ? <Text style={styles.errorText}>{buildFieldError('email')}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.secureField}>
              <TextInput
                placeholder="Minimum 8 characters"
                value={password}
                onChangeText={setPassword}
                onBlur={() => markTouched('password')}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.secureInput, buildFieldError('password') && styles.inputError]}
                returnKeyType={isSignup ? 'next' : 'done'}
              />
              <TouchableOpacity
                style={styles.secureToggle}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6f42c1" />
              </TouchableOpacity>
            </View>
            {buildFieldError('password') ? <Text style={styles.errorText}>{buildFieldError('password')}</Text> : null}

            <View style={styles.passwordHints}>
              <Text style={[styles.hint, passwordHasLength ? styles.hintValid : styles.hintMuted]}>• 8+ characters</Text>
              <Text style={[styles.hint, passwordHasMix ? styles.hintValid : styles.hintMuted]}>• Letters & numbers</Text>
            </View>
          </View>

          {isSignup && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.secureField}>
                <TextInput
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => markTouched('confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.secureInput, buildFieldError('confirmPassword') && styles.inputError]}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.secureToggle}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6f42c1" />
                </TouchableOpacity>
              </View>
              {buildFieldError('confirmPassword') ? <Text style={styles.errorText}>{buildFieldError('confirmPassword')}</Text> : null}
            </View>
          )}

          <TouchableOpacity style={styles.forgotLink} onPress={() => alert('Password resets are not available in the demo build yet.') }>
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, (loading) && styles.buttonDisabled]} onPress={runAuthFlow} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f3f7' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 4 },
  subtitle: { color: '#666', marginBottom: 18, textAlign: 'center' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#f1effa', borderRadius: 16, padding: 4, marginBottom: 16 },
  modeButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  modeButtonActive: { backgroundColor: '#6f42c1' },
  modeText: { color: '#6f42c1', fontWeight: '600' },
  modeTextActive: { color: '#fff', fontWeight: '700' },
  formError: { color: '#c53030', marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  statusBanner: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 16 },
  statusSuccess: { backgroundColor: '#e6fffa' },
  statusError: { backgroundColor: '#fff5f5' },
  statusText: { textAlign: 'center', fontWeight: '600', color: '#1a202c' },
  inputGroup: { marginBottom: 14 },
  label: { fontWeight: '700', marginBottom: 6, color: '#1a1a1a' },
  input: { height: 48, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fafafa' },
  secureField: { position: 'relative' },
  secureInput: { paddingRight: 48 },
  secureToggle: { position: 'absolute', right: 12, top: 12 },
  inputError: { borderColor: '#f44336', backgroundColor: '#fff6f5' },
  errorText: { color: '#c53030', fontSize: 12, marginTop: 4 },
  passwordHints: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hint: { fontSize: 12 },
  hintMuted: { color: '#999' },
  hintValid: { color: '#2f855a', fontWeight: '600' },
  forgotLink: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 16 },
  forgotLinkText: { color: '#6f42c1', fontWeight: '600' },
  button: { backgroundColor: '#6f42c1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default LoginScreen;
