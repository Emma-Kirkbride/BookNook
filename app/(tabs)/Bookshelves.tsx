import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ColorPicker from 'react-native-wheel-color-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Bookshelf,
  createBookshelf,
  createDefaultShelves,
  DEFAULT_SHELF_COLORS,
  deleteBookshelf,
  generateShelfShareLink,
  getUserBookshelves,
  setOnBookshelfUpdate,
  updateBookshelf
} from '../../services/bookshelvesService';
import { typography } from '../../styles/Typography';

interface CreateShelfModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => void;
  editingShelf?: Bookshelf;
  loading: boolean;
}

const CreateShelfModal: React.FC<CreateShelfModalProps> = ({
  visible,
  onClose,
  onSubmit,
  editingShelf,
  loading
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SHELF_COLORS[0]);

  useEffect(() => {
    if (editingShelf) {
      setName(editingShelf.name);
      setDescription(editingShelf.description || '');
      setSelectedColor(editingShelf.color);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(DEFAULT_SHELF_COLORS[0]);
    }
  }, [editingShelf, visible]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), description.trim(), selectedColor);
    }
  };

  // Helper function to soften colors (same as in bookshelf cards)
  const softenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const blendR = Math.round(r * 0.6 + 176 * 0.4);
    const blendG = Math.round(g * 0.6 + 196 * 0.4);
    const blendB = Math.round(b * 0.6 + 220 * 0.4);
    
    return `#${blendR.toString(16).padStart(2, '0')}${blendG.toString(16).padStart(2, '0')}${blendB.toString(16).padStart(2, '0')}`;
  };

  const softColor = softenColor(selectedColor);

  const modalStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderMedium,
      backgroundColor: theme.backgroundSecondary,
    },
    modalCancelButton: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
    },
    modalSaveButton: {
      ...typography.button,
      color: theme.primaryMain,
    },
    modalButtonDisabled: {
      color: theme.textMuted,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 24,
    },
    inputLabel: {
      ...typography.overline,
      color: theme.textPrimary,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.borderMedium,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.backgroundSecondary,
      color: theme.textPrimary,
    },
    textAreaInput: {
      height: 80,
      textAlignVertical: 'top',
    },
    colorPickerSection: {
      marginBottom: 24,
    },
    colorPickerContainer: {
      height: 280,
      marginBottom: 20,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
    },
    previewSection: {
      marginTop: 16,
    },
    previewLabel: {
      ...typography.overline,
      color: theme.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
    },
    previewRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    previewCard: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      minHeight: 100,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderMedium,
    },
    previewBookSpine: {
      width: 18,
      height: 70,
      borderRadius: 3,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      position: 'relative',
    },
    spineLine1: {
      position: 'absolute',
      top: 12,
      left: 3,
      right: 3,
      height: 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      borderRadius: 1,
    },
    spineLine2: {
      position: 'absolute',
      top: 17,
      left: 3,
      right: 3,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 1,
    },
    spineLine3: {
      position: 'absolute',
      bottom: 17,
      left: 3,
      right: 3,
      height: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: 1,
    },
    spineLine4: {
      position: 'absolute',
      bottom: 12,
      left: 3,
      right: 3,
      height: 1.5,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 1,
    },
    previewCardLabel: {
      ...typography.caption,
      color: theme.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    previewSwatch: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: theme.borderMedium,
    },
    previewDescription: {
      ...typography.caption,
      color: theme.textTertiary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 4,
      paddingHorizontal: 8,
    },
    helperText: {
      fontSize: 12,
      color: theme.textSecondary,
     marginTop: -16,
      marginBottom: 24,
      fontStyle: 'italic',
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={modalStyles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.modalTitle}>
            {editingShelf ? 'Edit Shelf' : 'New Shelf'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !name.trim()}>
            <Text style={[
              modalStyles.modalSaveButton,
              (!name.trim() || loading) && modalStyles.modalButtonDisabled
            ]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={modalStyles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.inputLabel}>Shelf Name *</Text>
            <TextInput
              style={modalStyles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Fantasy Favorites"
              placeholderTextColor={theme.textMuted}
              maxLength={50}
              editable={!loading && !editingShelf?.isDefault}
            />
          </View>
          {editingShelf?.isDefault && (
          <Text style={modalStyles.helperText}>
           Default shelf names cannot be changed
          </Text>
          )}

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[modalStyles.textInput, modalStyles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="What books will you keep here?"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!loading}
            />
          </View>

          <View style={modalStyles.colorPickerSection}>
            <Text style={modalStyles.inputLabel}>Choose Color</Text>
            
            {/* Color Picker Wheel */}
            <View style={modalStyles.colorPickerContainer}>
              <ColorPicker
                color={selectedColor}
                onColorChange={setSelectedColor}
                onColorChangeComplete={setSelectedColor}
                thumbSize={30}
                sliderSize={30}
                noSnap={true}
                row={false}
                swatches={false}
              />
            </View>

            {/* Live Preview */}
            <View style={modalStyles.previewSection}>
              <Text style={modalStyles.previewLabel}>Color Preview</Text>
              
              <View style={modalStyles.previewRow}>
                {/* Original Color Preview */}
                <View style={modalStyles.previewCard}>
                  <View style={[modalStyles.previewBookSpine, { backgroundColor: selectedColor }]}>
                    <View style={modalStyles.spineLine1} />
                    <View style={modalStyles.spineLine2} />
                    <View style={modalStyles.spineLine3} />
                    <View style={modalStyles.spineLine4} />
                  </View>
                  <Text style={modalStyles.previewCardLabel}>Book Icon Color</Text>
                  <Text style={modalStyles.previewDescription}>
                    How your shelf color will appear
                  </Text>
                </View>

                {/* Softened Color Preview */}
                <View style={[modalStyles.previewCard, { backgroundColor: softColor + '20' }]}>
                  <View style={[modalStyles.previewSwatch, { backgroundColor: softColor }]} />
                  <Text style={modalStyles.previewCardLabel}>Card Background</Text>
                  <Text style={modalStyles.previewDescription}>
                    Softened color for cards & headers
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface ShelfCardProps {
  shelf: Bookshelf;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
  onShare: () => void;
}

const ShelfCard: React.FC<ShelfCardProps> = ({ shelf, onEdit, onDelete, onPress, onShare }) => {
  const { theme } = useTheme();

  // Helper function to convert hex to rgba for tinting
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Soften bright colors to match app theme
  const softenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Blend with a soft blue-gray to tone down bright colors
    const blendR = Math.round(r * 0.6 + 176 * 0.4); // 176 is #B0
    const blendG = Math.round(g * 0.6 + 196 * 0.4); // 196 is #C4
    const blendB = Math.round(b * 0.6 + 220 * 0.4); // 220 is #DC
    
    return `#${blendR.toString(16).padStart(2, '0')}${blendG.toString(16).padStart(2, '0')}${blendB.toString(16).padStart(2, '0')}`;
  };

  const softColor = softenColor(shelf.color);

  const cardStyles = StyleSheet.create({
    shelfCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
      overflow: 'hidden',
    },
    // Subtle color tint overlay
    colorTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: hexToRgba(shelf.color, 0.03),
      pointerEvents: 'none',
    },
    shelfHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
      zIndex: 1,
    },
    shelfTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      gap: 14,
    },
    // Enhanced book spine that looks more like a book - NOW WITH SOFTENED COLOR
    bookSpine: {
      width: 18,
      minHeight: 70,
      borderRadius: 3,
      backgroundColor: softColor,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    // Multiple decorative lines to look more book-like
    spineLine1: {
      position: 'absolute',
      top: 12,
      left: 3,
      right: 3,
      height: 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      borderRadius: 1,
    },
    spineLine2: {
      position: 'absolute',
      top: 17,
      left: 3,
      right: 3,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 1,
    },
    spineLine3: {
      position: 'absolute',
      bottom: 17,
      left: 3,
      right: 3,
      height: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: 1,
    },
    spineLine4: {
      position: 'absolute',
      bottom: 12,
      left: 3,
      right: 3,
      height: 1.5,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 1,
    },
    // Edge shadow for depth
    spineEdge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 2,
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    shelfInfo: {
      flex: 1,
    },
    shelfName: {
      ...typography.bookTitle,
      color: theme.textTitle,
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.05)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      letterSpacing: -0.3,
    },
    bookEmoji: {
      fontSize: 18,
      marginRight: 4,
    },
    shelfDescription: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      lineHeight: 20,
      fontStyle: 'italic',
      textShadowColor: 'rgba(255, 255, 255, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    shelfActions: {
      flexDirection: 'row',
      gap: 8,
      zIndex: 2,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.neutral200,
    },
    editButton: {
      backgroundColor: hexToRgba(theme.primaryMain, 0.15),
      borderWidth: 1,
      borderColor: theme.primaryMain,
    },
    shareButton: {
      backgroundColor: hexToRgba(theme.primaryMain, 0.15),
      borderWidth: 1,
      borderColor: theme.primaryMain,
    },
    actionButtonText: {
      ...typography.buttonSmall,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    editButtonText: {
      color: theme.primaryMain,
    },
    shareButtonText: {
      color: theme.primaryMain,
    },
    shelfStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.borderMedium,
      zIndex: 1,
    },
    bookCount: {
      ...typography.caption,
      color: theme.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    defaultBadge: {
      backgroundColor: theme.primaryBackground,
      color: theme.primaryMain,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deleteButtonBottom: {
      backgroundColor: hexToRgba(theme.error, 0.15),
      borderWidth: 1,
      borderColor: theme.error,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    deleteButtonBottomText: {
      ...typography.buttonSmall,
      color: theme.error,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity 
      style={cardStyles.shelfCard} 
      onPress={() => {
        setTimeout(() => onPress(), 100);
      }}
      activeOpacity={0.7}
    >
      {/* Color tint overlay */}
      <View style={cardStyles.colorTint} />
      
      <View style={cardStyles.shelfHeader}>
        <View style={cardStyles.shelfTitleRow}>
          {/* Enhanced book spine with multiple lines and edge shadow */}
          <View style={cardStyles.bookSpine}>
            <View style={cardStyles.spineEdge} />
            <View style={cardStyles.spineLine1} />
            <View style={cardStyles.spineLine2} />
            <View style={cardStyles.spineLine3} />
            <View style={cardStyles.spineLine4} />
          </View>
          
          <View style={cardStyles.shelfInfo}>
            <Text style={cardStyles.shelfName}>
              {shelf.name}
            </Text>
            {shelf.description ? (
              <Text style={cardStyles.shelfDescription} numberOfLines={2}>
                {shelf.description}
              </Text>
            ) : null}
          </View>
        </View>
        
        {/* Only Edit and Share buttons at the top - NO DELETE */}
        <View style={cardStyles.shelfActions}>
          <TouchableOpacity 
            onPress={(e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              onEdit();
            }} 
            style={[cardStyles.actionButton, cardStyles.editButton]}
          >
            <Text style={[cardStyles.actionButtonText, cardStyles.editButtonText]}>
              Edit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={(e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              onShare();
            }} 
            style={[cardStyles.actionButton, cardStyles.shareButton]}
          >
            <Text style={[cardStyles.actionButtonText, cardStyles.shareButtonText]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete button moved to bottom, where Default badge is */}
      <View style={cardStyles.shelfStats}>
        <Text style={cardStyles.bookCount}>
          {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
        </Text>
        {shelf.isDefault ? (
          <Text style={cardStyles.defaultBadge}>Default</Text>
        ) : (
          <TouchableOpacity 
            onPress={(e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              onDelete();
            }} 
            style={cardStyles.deleteButtonBottom}
          >
            <Text style={cardStyles.deleteButtonBottomText}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function BookshelvesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Bookshelf | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
      borderTopWidth: 1,
      borderTopColor: '#FFFFFF',
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textSecondary,
    },
    header: {
      marginBottom: 30,
    },
    title: {
      ...typography.h1,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      backgroundColor: theme.backgroundSecondary,
      padding: 40,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    emptyStateText: {
      ...typography.h3,
      color: theme.primaryMain,
      marginBottom: 10,
    },
    emptyStateSubtext: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    shelvesContainer: {
      gap: 15,
      marginBottom: 20,
    },
    createButton: {
      backgroundColor: theme.primaryMain,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    createButtonText: {
      ...typography.button,
      color: theme.textInverse,
    },
  });

  // Use useCallback to create a stable reference
  const loadBookshelves = useCallback(async (showLoader = false) => {
    console.log('📚 loadBookshelves called, showLoader:', showLoader);
    if (showLoader) setLoading(true);
    
    try {
      const result = await getUserBookshelves();
      console.log('📚 Bookshelves result:', result.success, 'count:', result.data?.length);

      if (result.success && result.data) {
        console.log('📚 ALL SHELF DETAILS:');
        result.data.forEach(shelf => {
          console.log(`"${shelf.name}" (${shelf.id}): ${shelf.bookCount} books, color: ${shelf.color}`);
        });

        setBookshelves(result.data);
        console.log('✅ Bookshelves updated in state');
        
        if (result.data.length === 0) {
          console.log('📚 No shelves found, creating default shelves...');
          const defaultResult = await createDefaultShelves();
          
          if (defaultResult.success) {
            const reloadResult = await getUserBookshelves();
            if (reloadResult.success && reloadResult.data) {
              setBookshelves(reloadResult.data);
              console.log('📚 Default shelves created and loaded');
            }
          }
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load bookshelves');
        console.log('❌ Error loading bookshelves:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading bookshelves:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('📚 loadBookshelves completed');
    }
  }, []); // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    console.log('🔧 Setting up bookshelf update callback');
    
    // Set the callback when component mounts
    setOnBookshelfUpdate(() => {
      console.log('🔔 Bookshelf update callback triggered!');
      loadBookshelves();
    });
    
    // Load bookshelves on initial mount
    loadBookshelves(true);
    
    // Clean up when component unmounts
    return () => {
      console.log('🧹 Cleaning up bookshelf update callback');
      setOnBookshelfUpdate(null);
    };
  }, [loadBookshelves]); // Now depends on the stable loadBookshelves reference

  const onRefresh = () => {
    setRefreshing(true);
    loadBookshelves();
  };

  const handleCreateShelf = () => {
    setEditingShelf(undefined);
    setModalVisible(true);
  };

  const handleEditShelf = (shelf: Bookshelf) => {
    setEditingShelf(shelf);
    setModalVisible(true);
  };

  const handleSubmitShelf = async (name: string, description: string, color: string) => {
    setSubmitting(true);
    try {
      let result;
      
      if (editingShelf) {
        result = await updateBookshelf(editingShelf.id, { name, description, color });
      } else {
        result = await createBookshelf({ name, description, color }, user!.uid);
      }

      if (result.success) {
        setModalVisible(false);
        loadBookshelves();
        Alert.alert(
          'Success',
          `Shelf ${editingShelf ? 'updated' : 'created'} successfully!`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save shelf');
      }
    } catch (error) {
      console.error('Error saving shelf:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShelf = (shelf: Bookshelf) => {
    console.log('Delete button clicked for shelf:', shelf.name);
    console.log('Is default shelf?', shelf.isDefault);
    
    if (shelf.isDefault) {
      Alert.alert('Cannot Delete', 'Default shelves cannot be deleted.');
      return;
    }
    
    console.log('Showing delete confirmation dialog...');
    
    // Simple web detection and fallback
    const isWeb = typeof window !== 'undefined';
    
    if (isWeb) {
      // Use browser's native confirm for web
      const isConfirmed = window.confirm(
        `Are you sure you want to delete "${shelf.name}"? This will also remove all books from this shelf.`
      );
      
      if (isConfirmed) {
        console.log('User confirmed delete, calling deleteBookshelf...');
        deleteBookshelf(shelf.id).then(result => {
          if (result.success) {
            loadBookshelves();
            alert('Shelf deleted successfully.');
          } else {
            alert(`Error: ${result.error || 'Failed to delete shelf'}`);
          }
        });
      }
    } else {
      // Use React Native Alert for mobile (your existing code)
      setTimeout(() => {
        Alert.alert(
          'Delete Shelf',
          `Are you sure you want to delete "${shelf.name}"? This will also remove all books from this shelf.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => console.log('Delete cancelled')
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                console.log('User confirmed delete, calling deleteBookshelf...');
                const result = await deleteBookshelf(shelf.id);
                if (result.success) {
                  loadBookshelves();
                  Alert.alert('Deleted', 'Shelf deleted successfully.');
                } else {
                  Alert.alert('Error', result.error || 'Failed to delete shelf');
                }
              }
            }
          ],
          { cancelable: true }
        );
      }, 10);
    }
  };

  const handleShareShelf = async (shelf: Bookshelf) => {
    try {
      const shareLink = generateShelfShareLink(shelf);
      const result = await Share.share({
        message: `Check out my "${shelf.name}" bookshelf with ${shelf.bookCount} books!\n\n${shareLink}`,
        title: `${shelf.name} - BookNook`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Shelf shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share bookshelf');
      console.error('Share error:', error);
    }
  };

  const handleShelfPress = (shelf: Bookshelf) => {
    router.push({
      pathname: '/BookshelfDetails',
      params: { 
        shelfId: shelf.id,
        shelfName: shelf.name,
        shelfColor: shelf.color,
        shelfDescription: shelf.description || '',
        isDefault: shelf.isDefault.toString(),
        bookCount: shelf.bookCount.toString()
      }
    });
  };

  if (loading) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SafeAreaView style={themedStyles.container}>
          <View style={themedStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryMain} />
            <Text style={themedStyles.loadingText}>Loading your bookshelves...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={themedStyles.container}>
        <ScrollView 
          contentContainerStyle={themedStyles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.primaryMain}
              colors={[theme.primaryMain]}
            />
          }
        >
          <View style={themedStyles.header}>
            <Text style={themedStyles.title}>My Bookshelves</Text>
            <Text style={themedStyles.subtitle}>
              {bookshelves.length === 0 
                ? 'Create your first bookshelf!' 
                : `${bookshelves.length} ${bookshelves.length === 1 ? 'shelf' : 'shelves'}`
              }
            </Text>
          </View>

          {bookshelves.length === 0 ? (
            <View style={themedStyles.emptyState}>
              <Text style={themedStyles.emptyStateText}>📖 No bookshelves yet</Text>
              <Text style={themedStyles.emptyStateSubtext}>
                Create your first shelf to start organizing your books!
              </Text>
            </View>
          ) : (
            <View style={themedStyles.shelvesContainer}>
              {bookshelves.map(shelf => (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  onPress={() => handleShelfPress(shelf)}
                  onEdit={() => handleEditShelf(shelf)}
                  onDelete={() => {
                    console.log('onDelete called for shelf:', shelf.name);
                    handleDeleteShelf(shelf);
                  }}
                  onShare={() => handleShareShelf(shelf)}
                />
              ))}
            </View>
          )}

          <TouchableOpacity style={themedStyles.createButton} onPress={handleCreateShelf}>
            <Text style={themedStyles.createButtonText}>+ Create New Shelf</Text>
          </TouchableOpacity>
        </ScrollView>

        <CreateShelfModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmitShelf}
          editingShelf={editingShelf}
          loading={submitting}
        />
      </SafeAreaView>
    </>
  );
}