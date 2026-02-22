import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { loginStyles as styles } from '../styles/LoginStyles';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [emailOrUsername, setEmailOrUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [usernameFocused, setUsernameFocused] = useState<boolean>(false);
  const [emailOrUsernameFocused, setEmailOrUsernameFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  

  const handleEmailFocus = useCallback(() => setEmailFocused(true), []);
  const handleEmailBlur = useCallback(() => setEmailFocused(false), []);
  const handleUsernameFocus = useCallback(() => setUsernameFocused(true), []);
  const handleUsernameBlur = useCallback(() => setUsernameFocused(false), []);
  const handleEmailOrUsernameFocus = useCallback(() => setEmailOrUsernameFocused(true), []);
  const handleEmailOrUsernameBlur = useCallback(() => setEmailOrUsernameFocused(false), []);
  const handlePasswordFocus = useCallback(() => setPasswordFocused(true), []);
  const handlePasswordBlur = useCallback(() => setPasswordFocused(false), []);


  
  const { login, signup, resetPassword } = useAuth();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    if (isSignUp) {
      // Sign up validation
      if (!email.trim() || !username.trim() || !password.trim()) {
        showAlert('Missing Information', 'Please fill in all fields to continue');
        return;
      }

      if (!validateEmail(email.trim())) {
        showAlert('Invalid Email', 'Please enter a valid email address');
        return;
      }

      if (!validateUsername(username.trim())) {
        showAlert('Invalid Username', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
        return;
      }

      if (!validatePassword(password)) {
        showAlert('Weak Password', 'Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      
      try {
        const result = await signup(email.trim(), username.trim(), password);

        if (!result.success && result.error) {
          showAlert('Sign Up Error', result.error);
        }
      } catch (error) {
        console.error('Unexpected signup error:', error);
        showAlert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Login validation
      if (!emailOrUsername.trim() || !password.trim()) {
        showAlert('Missing Information', 'Please fill in all fields to continue');
        return;
      }

      setLoading(true);
      
      try {
        const result = await login(emailOrUsername.trim(), password);

        if (!result.success && result.error) {
          showAlert('Login Error', result.error);
        }
      } catch (error) {
        console.error('Unexpected login error:', error);
        showAlert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showAlert('Email Required', 'Please enter your email address');
      return;
    }

    if (!validateEmail(resetEmail.trim())) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetPassword(resetEmail.trim());
      
      if (result.success) {
        showAlert(
          'Reset Email Sent', 
          'Check your email for instructions to reset your password. The link will expire in 1 hour.'
        );
        setShowForgotPassword(false);
        setResetEmail('');
      } else if (result.error) {
        showAlert('Reset Failed', result.error);
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      showAlert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setUsername('');
    setEmailOrUsername('');
    setPassword('');
  };

  // Forgot Password Modal Content
  if (showForgotPassword) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#E6F2FF" />
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.appName}>BookNook</Text>
                </View>
                <Text style={styles.tagline}>Reset your password</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Forgot Password?</Text>
                    <Text style={styles.formSubtitle}>
                      Enter your email address and we'll send you instructions to reset your password.
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={[
                        styles.input,
                        emailFocused && styles.inputFocused
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor="#A0AEC0"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={handleEmailFocus}
                      onBlur={handleEmailBlur}
                      blurOnSubmit={false}
                      returnKeyType="next"
                    />
                  </View>
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.authButton, 
                      loading && styles.authButtonDisabled,
                      !resetEmail.trim() && styles.authButtonDisabled
                    ]} 
                    onPress={handleForgotPassword}
                    disabled={loading || !resetEmail.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authButtonText}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.switchButton}
                    onPress={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchButtonText}>
                      <Text style={styles.switchButtonHighlight}>
                        ← Back to Login
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}></View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </>
    );
  }

  // Main Login/Signup Screen
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#E6F2FF" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.appName}>BookNook</Text>
              </View>
              <Text style={styles.tagline}>Your Library, Your Rules.</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.formCard}>

              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Join the Community' : 'Welcome Back'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isSignUp 
                    ? 'Start your reading journey with us' 
                    : 'Continue your reading journey here'
                  }
                </Text>
              </View>

              <View style={styles.inputContainer}>
                {isSignUp ? (
                  <>
                    {/* Email field for signup */}
                    <View style={[styles.inputWrapper]}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                          style={[
                            styles.input,
                            emailFocused && styles.inputFocused
                          ]}
                          placeholder="Enter your email"
                          placeholderTextColor="#A0AEC0"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={handleEmailFocus}
                          onBlur={handleEmailBlur}
                          blurOnSubmit={false}
                          returnKeyType="next"
                        />
                    </View>

                    {/* Username field for signup */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <TextInput
                        style={[
                          styles.input,
                          usernameFocused && styles.inputFocused
                        ]}
                        placeholder="Choose a username"
                        placeholderTextColor="#A0AEC0"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                        onFocus={handleUsernameFocus}
                        onBlur={handleUsernameBlur}
                        blurOnSubmit={false}
                        returnKeyType="next"
                      />
                      {username.length > 0 && !validateUsername(username) && (
                        <Text style={styles.helperText}>
                          3-20 characters, letters, numbers, and underscores only
                        </Text>
                      )}
                    </View>
                  </>
                ) : (
                  /* Email or Username field for login */
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email or Username</Text>
                  <TextInput
                    style={[
                      styles.input,
                      emailOrUsernameFocused && styles.inputFocused
                    ]}
                    placeholder="Enter your email or username"
                    placeholderTextColor="#A0AEC0"
                    value={emailOrUsername}
                    onChangeText={setEmailOrUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={handleEmailOrUsernameFocus}
                    onBlur={handleEmailOrUsernameBlur}
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </View>
                )}

                {/* Password field */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[
                          styles.passwordInput,
                          passwordFocused && styles.inputFocused
                        ]}
                        placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                        placeholderTextColor="#A0AEC0"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!loading}
                        onFocus={handlePasswordFocus}
                        onBlur={handlePasswordBlur}
                        blurOnSubmit={true}
                        returnKeyType="done"
                      />
                      <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <Image 
                          source={showPassword ? require('../assets/images/nonvisible.png') : require('../assets/images/Visible.png')}
                          style={styles.eyeIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                {/* Forgot Password Link - Only show on Login */}
                {!isSignUp && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordButton}
                    onPress={() => {
                      setResetEmail(emailOrUsername.includes('@') ? emailOrUsername : '');
                      setShowForgotPassword(true);
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.authButton, 
                  loading && styles.authButtonDisabled,
                  (isSignUp 
                    ? (!email.trim() || !username.trim() || !password.trim())
                    : (!emailOrUsername.trim() || !password.trim())
                  ) && styles.authButtonDisabled
                ]} 
                onPress={handleAuth}
                disabled={loading || (isSignUp 
                  ? (!email.trim() || !username.trim() || !password.trim())
                  : (!emailOrUsername.trim() || !password.trim())
                )}
                activeOpacity={0.8}
              >
                <Text style={styles.authButtonText}>
                  {loading ? (
                    <>
                      <Text style={styles.loadingSpinner}> </Text>
                      {isSignUp ? 'Creating Account...' : 'Logging In...'}
                    </>
                  ) : (
                    isSignUp ? 'Create Account' : 'Log In'
                  )}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.switchButton}
                onPress={handleSwitchMode}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.switchButtonText}>
                  {isSignUp 
                    ? 'Already have an account? ' 
                    : "Don't have an account? "
                  }
                  <Text style={styles.switchButtonHighlight}>
                    {isSignUp ? 'Log In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}