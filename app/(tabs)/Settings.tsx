import { deleteUser } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';
import { typography } from '../../styles/Typography';
import { themes } from '../../styles/themeColors'; // Make sure this import path is correct

// Define the theme keys type
type ThemeKey = keyof typeof themes;

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme(); // Assuming setTheme function exists in ThemeContext
  const { user, logout } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUsername, setLoadingUsername] = useState<boolean>(true);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [themeModalVisible, setThemeModalVisible] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [updatingUsername, setUpdatingUsername] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('default');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    content: {
      padding: 20,
    },
    title: {
      ...typography.h1,
      color: theme.textTitle,
      marginBottom: 8,
      textAlign: 'center', 
    },
    subtitle: {
      ...typography.body,
      marginBottom: 30,
      textAlign: 'center',
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      ...typography.h2,
      color: theme.textPrimary,
      marginBottom: 10,
    },
    userInfo: {
      backgroundColor: theme.backgroundSecondary,
      padding: 15,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginBottom: 10,
    },
    userLabel: {
      ...typography.overline,
      color: theme.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    userUsername: {
      ...typography.h3,
      color: theme.textPrimary,
      flex: 1,
    },
    editButton: {
      padding: 8,
      marginLeft: 12,
    },
    editIcon: {
     width: 35,
     height: 35,
     tintColor: theme.primaryMain,
    },
    userEmail: {
      ...typography.body,
      color: theme.textPrimary,
      marginBottom: 16,
    },
    userUid: {
      ...typography.caption,
      color: theme.textSecondary,
    },
    loadingContainer: {
      padding: 15,
      alignItems: 'center',
    },
    placeholder: {
      backgroundColor: theme.backgroundSecondary,
      padding: 15,
      borderRadius: 8,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginBottom: 10,
    },
    placeholderText: {
      ...typography.body,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    Button: {
      backgroundColor: theme.primaryMain,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    themeButton: {
      backgroundColor: theme.backgroundSecondary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.primaryMain,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    themeButtonText: {
      color: theme.primaryMain,
      ...typography.button,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    logoutButton: {
      backgroundColor: theme.primaryMain,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutButtonText: {
      color: theme.textInverse,
      ...typography.button,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deleteButton: {
      backgroundColor: '#E53E3E',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.error,
    },
    deleteButtonText: {
      color: '#FFFFFF' ,
      ...typography.button,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      ...typography.body,
      color: theme.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalInputLabel: {
      ...typography.overline,
      color: theme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    modalInput: {
      ...typography.body,
      color: theme.textPrimary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.borderMedium,
      borderRadius: 8,
      backgroundColor: theme.backgroundPrimary,
      marginBottom: 8,
    },
    modalInputFocused: {
      borderColor: theme.primaryMain,
      borderWidth: 2,
    },
    helperText: {
      ...typography.caption,
      color: theme.textSecondary,
      marginBottom: 20,
      lineHeight: 18,
    },
    errorText: {
      ...typography.caption,
      color: theme.semanticError,
      marginBottom: 12,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.backgroundPrimary,
      borderWidth: 1,
      borderColor: theme.borderMedium,
    },
    cancelButtonText: {
      ...typography.button,
      color: theme.textSecondary,
    },
    saveButton: {
      backgroundColor: theme.primaryMain,
    },
    saveButtonDisabled: {
      backgroundColor: theme.neutral300,
    },
    saveButtonText: {
      ...typography.button,
      color: theme.textInverse,
    },
    // Delete Modal Styles
    deleteModalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
    },
    warningIcon: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: 16,
    },
    deleteModalTitle: {
      ...typography.h3,
      color: theme.semanticError,
      marginBottom: 8,
      textAlign: 'center',
    },
    deleteModalText: {
      ...typography.body,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 22,
    },
    deleteModalWarning: {
      ...typography.bodyMedium,
      color: theme.semanticError,
      marginBottom: 20,
      textAlign: 'center',
      fontWeight: '600',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    deleteConfirmButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: theme.error,
    },
    deleteConfirmButtonText: {
      ...typography.button,
      color: theme.textInverse,
    },
    // Theme Modal Styles
    themeModalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 500,
      maxHeight: '80%',
    },
    themeScrollView: {
      marginBottom: 16,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    themeCard: {
      width: '48%',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      marginBottom: 12,
    },
    themeCardSelected: {
      borderColor: theme.primaryMain,
      borderWidth: 3,
    },
    themePreview: {
      padding: 16,
      minHeight: 120,
    },
    themePreviewTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    themePreviewDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    themePreviewBar: {
      height: 8,
      borderRadius: 4,
      marginBottom: 6,
    },
    themePreviewBarShort: {
      width: '60%',
      height: 8,
      borderRadius: 4,
    },
    themeInfo: {
      padding: 12,
    },
    themeName: {
      ...typography.bodyMedium,
      fontWeight: '600',
      marginBottom: 4,
    },
    themeDescription: {
      ...typography.caption,
      fontSize: 11,
    },
    themeModalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
  });

  // Fetch username from Firestore
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user?.uid) {
        setLoadingUsername(false);
        return;
      }

      try {
        console.log('📖 Fetching username for user:', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ Username fetched:', userData.displayUsername);
          setUsername(userData.displayUsername || userData.username || null);
          
          // Load saved theme preference
          if (userData.theme) {
            setSelectedThemeKey(userData.theme);
          }
        } else {
          console.log('⚠️ No user document found in Firestore');
          setUsername(null);
        }
      } catch (error) {
        console.error('❌ Error fetching username:', error);
        setUsername(null);
      } finally {
        setLoadingUsername(false);
      }
    };

    fetchUsername();
  }, [user?.uid]);

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleEditUsername = () => {
    setNewUsername(username || '');
    setEditModalVisible(true);
  };

  const handleUpdateUsername = async () => {
    if (!user?.uid || !newUsername.trim()) return;

    // Validate username
    if (!validateUsername(newUsername.trim())) {
      Alert.alert(
        'Invalid Username',
        'Username must be 3-20 characters and contain only letters, numbers, and underscores.'
      );
      return;
    }

    // Check if username is the same
    if (newUsername.trim() === username) {
      setEditModalVisible(false);
      return;
    }

    setUpdatingUsername(true);

    try {
      // Check if username already exists
      const exists = await checkUsernameExists(newUsername.trim());
      if (exists) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another one.');
        setUpdatingUsername(false);
        return;
      }

      // Update username in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: newUsername.toLowerCase(),
        displayUsername: newUsername.trim(),
      });

      console.log('✅ Username updated successfully');
      setUsername(newUsername.trim());
      setEditModalVisible(false);
      
      Alert.alert('Success', 'Your username has been updated!');
    } catch (error) {
      console.error('❌ Error updating username:', error);
      Alert.alert('Error', 'Failed to update username. Please try again.');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleThemeSelect = async (themeKey: string) => {
    if (!user?.uid) return;
    
    try {
      // Update theme in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        theme: themeKey,
      });

      // Update local state and context
      setSelectedThemeKey(themeKey);
      setTheme(themeKey as ThemeKey); // This should update the theme context
      setThemeModalVisible(false);
      
    Alert.alert('Theme Updated', `Your theme has been changed to ${themes[themeKey as ThemeKey].name}!`);
    } catch (error) {
      console.error('❌ Error updating theme:', error);
      Alert.alert('Error', 'Failed to update theme. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    
    if (Platform.OS === 'web') {
      console.log('Using web confirm dialog');
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        console.log('User confirmed logout via web confirm');
        logout();
      } else {
        console.log('User cancelled logout');
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: () => {
              console.log('User confirmed logout via RN Alert');
              logout();
            }
          }
        ]
      );
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);

    try {
      console.log('🗑️ Starting account deletion process...');

      // Delete user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      console.log('User document deleted from Firestore');

      // Delete the Firebase Auth account
      await deleteUser(user);
      console.log('Firebase Auth account deleted');

      setDeleteModalVisible(false);
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      // Handle re-authentication requirement
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security reasons, please log out and log back in before deleting your account.'
        );
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const renderThemePreview = (themeKey: string, themeData: any) => {
    const isSelected = themeKey === selectedThemeKey;
    
    return (
      <TouchableOpacity
        key={themeKey}
        style={[styles.themeCard, isSelected && styles.themeCardSelected]}
        onPress={() => handleThemeSelect(themeKey)}
        activeOpacity={0.7}
      >
        <View style={[styles.themePreview, { backgroundColor: themeData.backgroundPrimary }]}>
          <View style={styles.themePreviewTop}>
            <View style={[styles.themePreviewDot, { backgroundColor: themeData.primaryMain }]} />
            <View style={[styles.themePreviewDot, { backgroundColor: themeData.textSecondary }]} />
          </View>
          <View style={[styles.themePreviewBar, { backgroundColor: themeData.primaryMain }]} />
          <View style={[styles.themePreviewBar, { backgroundColor: themeData.textTertiary }]} />
          <View style={[styles.themePreviewBarShort, { backgroundColor: themeData.textMuted }]} />
        </View>
        <View style={[styles.themeInfo, { backgroundColor: themeData.backgroundSecondary }]}>
          <Text style={[styles.themeName, { color: themeData.textPrimary }]}>
            {themeData.name}
          </Text>
          <Text style={[styles.themeDescription, { color: themeData.textSecondary }]}>
            {themeData.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your BookNook experience</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {loadingUsername ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primaryMain} />
            </View>
          ) : (
            <View style={styles.userInfo}>
              {username && (
                <>
                  <Text style={styles.userLabel}>Username</Text>
                  <View style={styles.usernameRow}>
                    <Text style={styles.userUsername}>{username}</Text>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={handleEditUsername}
                      activeOpacity={0.6}
                    >
                      <Image 
                        source={require('../../assets/images/edit.png')} 
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              <Text style={styles.userLabel}>Email</Text>
              <Text style={styles.userEmail}>{user?.email || 'Loading...'}</Text>
              
              <Text style={styles.userLabel}>User ID</Text>
              <Text style={styles.userUid}>{user?.uid}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <TouchableOpacity 
            style={styles.themeButton} 
            onPress={() => setThemeModalVisible(true)}
          >
            <Text style={styles.themeButtonText}>Change Theme</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Username Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Username</Text>
            <Text style={styles.modalSubtitle}>
              Choose a new username for your account
            </Text>

            <Text style={styles.modalInputLabel}>New Username</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new username"
              placeholderTextColor={theme.textSecondary}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!updatingUsername}
              maxLength={20}
            />
            
            <Text style={styles.helperText}>
              Username must be 3-20 characters and can only contain letters, numbers, and underscores.
            </Text>

            {newUsername.length > 0 && !validateUsername(newUsername) && (
              <Text style={styles.errorText}>
                Invalid username format
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={updatingUsername}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (updatingUsername || !validateUsername(newUsername) || newUsername === username) && styles.saveButtonDisabled
                ]}
                onPress={handleUpdateUsername}
                disabled={updatingUsername || !validateUsername(newUsername) || newUsername === username}
              >
                {updatingUsername ? (
                  <ActivityIndicator size="small" color={theme.textInverse} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.themeModalContent}>
            <Text style={styles.modalTitle}>Choose Your Theme</Text>
            <Text style={styles.modalSubtitle}>
              Select a literary-inspired color palette
            </Text>

            <ScrollView style={styles.themeScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.themeGrid}>
                {Object.entries(themes).map(([key, themeData]) => 
                  renderThemePreview(key, themeData)
                )}
              </View>
            </ScrollView>

            <View style={styles.themeModalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setThemeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete your account?
            </Text>
            <Text style={styles.deleteModalWarning}>
              This action cannot be undone. All of your data, including bookshelves and books, will be permanently deleted.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color={theme.textInverse} />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}