// contexts/AuthContext.tsx
import { useRouter, useSegments } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email or username.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/invalid-credential':
      return 'Invalid email/username or password.';
    default:
      return 'An error occurred. Please try again.';
  }
}

// Helper function to validate username
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { valid: true };
}

// Helper function to check if username exists
async function usernameExists(username: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

// Helper function to get email from username
async function getEmailFromUsername(username: string): Promise<string | null> {
  try {
    console.log('Looking up email for username:', username.toLowerCase());
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    console.log('Query results - Documents found:', querySnapshot.size);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log('Found user data:', { email: userData.email, username: userData.username });
      return userData.email;
    }
    
    console.log('No user found with username:', username);
    return null;
  } catch (error) {
    console.error('Error getting email from username:', error);
    return null;
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log(' Firebase auth listener starting...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user ? user.email : 'no user');
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      console.log('Firebase login attempt for:', emailOrUsername);
      setIsLoading(true);
      
      let email = emailOrUsername;
      
      // Check if input looks like an email or username
      if (!emailOrUsername.includes('@')) {
        console.log('👤 Input detected as username, looking up email...');
        // It's a username, get the email
        const emailFromUsername = await getEmailFromUsername(emailOrUsername);
        if (!emailFromUsername) {
          console.log(' Username not found in database');
          return { 
            success: false, 
            error: 'No account found with this username.' 
          };
        }
        console.log('Username resolved to email:', emailFromUsername);
        email = emailFromUsername;
      } else {
        console.log('Input detected as email');
      }
      
      console.log('Attempting Firebase authentication with email:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase login successful');
      return { success: true };
    } catch (error: any) {
      console.error(' Firebase login error:', error.code, error.message);
      return { 
        success: false, 
        error: getFirebaseErrorMessage(error.code) 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      console.log('Firebase signup attempt for:', email, 'username:', username);
      setIsLoading(true);
      
      // Validate username
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        console.log('Username validation failed:', usernameValidation.error);
        return { 
          success: false, 
          error: usernameValidation.error 
        };
      }
      
      // Check if username already exists
      console.log('Checking if username exists:', username);
      const exists = await usernameExists(username);
      if (exists) {
        console.log(' Username already taken');
        return { 
          success: false, 
          error: 'This username is already taken.' 
        };
      }
      
      // Create user account
      console.log('👤 Creating Firebase auth account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth account created, UID:', userCredential.user.uid);
      
      // Store username in Firestore
      const userData = {
        email: email,
        username: username.toLowerCase(),
        displayUsername: username,
        createdAt: new Date().toISOString(),
      };
      console.log('Storing user data in Firestore:', userData);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      console.log('User data stored in Firestore successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('Firebase signup error:', error.code, error.message);
      return { 
        success: false, 
        error: getFirebaseErrorMessage(error.code) 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Firebase password reset attempt for:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('Firebase password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('Firebase password reset error:', error.code);
      return { 
        success: false, 
        error: getFirebaseErrorMessage(error.code) 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('Firebase logout called');
      await signOut(auth);
      console.log('Firebase logout successful');
      
      // Force navigation on web platform
      if (Platform.OS === 'web') {
        console.log('Web platform - forcing navigation to login');
        setTimeout(() => {
          router.replace('/login' as any);
        }, 50);
      }
    } catch (error) {
      console.error('Firebase logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Component that handles the navigation protection
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Allow initial route to load before redirecting
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      console.log('Initial load complete, allowing route to render');
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
    }
  }, [isLoading, isInitialLoad]);

  useEffect(() => {
    console.log('NavigationHandler triggered - isLoading:', isLoading, 'isInitialLoad:', isInitialLoad, 'segments:', JSON.stringify(segments), 'isAuthenticated:', isAuthenticated);
    
    if (isLoading) {
      console.log('NavigationHandler - Still loading, skipping...');
      return;
    }

    if (isInitialLoad) {
      console.log('NavigationHandler - Initial load, skipping navigation logic...');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const publicRoutes = ['login', 'signup', 'shared-shelf', 'shared-review'];
    const currentRoute = segments[0];
    const isPublicRoute = publicRoutes.includes(currentRoute as string);
    
    console.log('NavigationHandler Details:');
    console.log('  - currentRoute:', currentRoute);
    console.log('  - inAuthGroup:', inAuthGroup);
    console.log('  - isPublicRoute:', isPublicRoute);

    if (isPublicRoute) {
      console.log('On public route, allowing access');
      return;
    }

    if (!isAuthenticated && inAuthGroup) {
      console.log('Redirecting to login - not authenticated');
      setTimeout(() => {
        router.replace('/login' as any);
      }, 100);
      return;
    }

    const authPages = ['login', 'signup'];
    if (isAuthenticated && authPages.includes(currentRoute as string)) {
      console.log('Redirecting to main app - already authenticated');
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 100);
      return;
    }

    if (isAuthenticated && !inAuthGroup && !isPublicRoute && !currentRoute) {
      console.log('Redirecting to main app - authenticated at root');
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 100);
    }
  }, [isAuthenticated, isLoading, segments, router, isInitialLoad]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299E1" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
  },
});