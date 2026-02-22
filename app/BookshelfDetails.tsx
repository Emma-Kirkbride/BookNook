import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateShareUrl } from '../app/utils/shareURL';
import { useTheme } from '../contexts/ThemeContext';
import {
  Bookshelf,
  ShelfBook,
  generateReviewShareLink,
  getShelfBooks,
  getUserBookshelves,
  removeBookFromShelf,
  updateShelfBook
} from '../services/bookshelvesService';
import { typography } from '../styles/Typography';

interface ReviewBookModalProps {
  visible: boolean;
  book: ShelfBook | null;
  onClose: () => void;
  onSave: (bookId: string, reviewData: ReviewData) => void;
  loading: boolean;
}

interface MoveBookModalProps {
  visible: boolean;
  book: ShelfBook | null;
  currentShelf: Bookshelf;
  bookshelves: Bookshelf[];
  onClose: () => void;
  onMove: (targetShelfId: string, targetShelfName: string) => void;
  loading: boolean;
}

interface ReviewData {
  rating?: number;
  overallThoughts?: string;
  feelings?: string;
  recommendedFor?: string;
  contentWarnings?: string;
}

const MoveBookModal: React.FC<MoveBookModalProps> = ({
  visible,
  book,
  currentShelf,
  bookshelves,
  onClose,
  onMove,
  loading
}) => {
  const { theme } = useTheme();

  const availableShelves = bookshelves.filter(shelf => shelf.id !== currentShelf.id);

  const modalStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      width: '90%',
      maxWidth: 500,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 24,
      color: theme.textSecondary,
    },
    scrollContent: {
      padding: 20,
    },
    bookHeader: {
      flexDirection: 'row',
      marginBottom: 20,
      padding: 12,
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 8,
    },
    bookCoverSmall: {
      width: 60,
      height: 90,
      borderRadius: 6,
      marginRight: 12,
      backgroundColor: theme.neutral200,
    },
    bookHeaderInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    bookTitleSmall: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookAuthorSmall: {
      ...typography.caption,
      color: theme.textSecondary,
    },
    sectionTitle: {
      ...typography.overline,
      color: theme.textPrimary,
      marginBottom: 12,
      fontWeight: '600',
    },
    shelfOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 8,
      marginBottom: 10,
    },
    shelfColorBar: {
      width: 4,
      height: 30,
      borderRadius: 2,
      marginRight: 12,
    },
    shelfOptionInfo: {
      flex: 1,
    },
    shelfOptionName: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 2,
    },
    shelfOptionCount: {
      ...typography.caption,
      color: theme.textSecondary,
    },
  });

  if (!book) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Move Book</Text>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollContent}
          >
            <View style={modalStyles.bookHeader}>
              {book.coverUrl && (
                <Image
                  source={{ uri: book.coverUrl }}
                  style={modalStyles.bookCoverSmall}
                  resizeMode="cover"
                />
              )}
              <View style={modalStyles.bookHeaderInfo}>
                <Text style={modalStyles.bookTitleSmall} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={modalStyles.bookAuthorSmall} numberOfLines={1}>
                  by {book.author}
                </Text>
              </View>
            </View>

            <Text style={modalStyles.sectionTitle}>Select Bookshelf</Text>

            {availableShelves.map((shelf) => (
              <TouchableOpacity
                key={shelf.id}
                style={modalStyles.shelfOption}
                onPress={() => onMove(shelf.id, shelf.name)}
                disabled={loading}
              >
                <View style={[modalStyles.shelfColorBar, { backgroundColor: shelf.color }]} />
                <View style={modalStyles.shelfOptionInfo}>
                  <Text style={modalStyles.shelfOptionName}>{shelf.name}</Text>
                  <Text style={modalStyles.shelfOptionCount}>
                    {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ReviewBookModal: React.FC<ReviewBookModalProps> = ({
  visible,
  book,
  onClose,
  onSave,
  loading
}) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [ratingInput, setRatingInput] = useState('');
  const [overallThoughts, setOverallThoughts] = useState('');
  const [feelings, setFeelings] = useState('');
  const [recommendedFor, setRecommendedFor] = useState('');
  const [contentWarnings, setContentWarnings] = useState('');

  useEffect(() => {
    if (book) {
      setRating(book.rating);
      setRatingInput(book.rating ? book.rating.toString() : '');
      setOverallThoughts(book.overallThoughts || '');
      setFeelings(book.feelings || '');
      setRecommendedFor(book.recommendedFor || '');
      setContentWarnings(book.contentWarnings || '');
    }
  }, [book]);

  const handleRatingChange = (text: string) => {
    setRatingInput(text);
    
    const numValue = parseFloat(text);
    
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
      const roundedValue = Math.round(numValue * 100) / 100;
      setRating(roundedValue);
    } else if (text === '') {
      setRating(undefined);
    }
  };

  const renderStarForRating = (position: number) => {
    const fillAmount = rating ? Math.max(0, Math.min(1, rating - (position - 1))) : 0;
    
    return (
      <View key={position} style={modalStyles.starWrapper}>
        <Text style={modalStyles.starEmpty}>☆</Text>
        {fillAmount > 0 && (
          <View 
            style={[
              modalStyles.starFilledContainer, 
              { width: `${fillAmount * 100}%` }
            ]}
          >
            <Text style={modalStyles.starFilledText}>★</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSave = () => {
    if (book) {
      onSave(book.id, {
        rating,
        overallThoughts: overallThoughts.trim(),
        feelings: feelings.trim(),
        recommendedFor: recommendedFor.trim(),
        contentWarnings: contentWarnings.trim()
      });
    }
  };

  const modalStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      width: '90%',
      maxWidth: 500,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 24,
      color: theme.textSecondary,
    },
    scrollContent: {
      padding: 20,
    },
    bookHeader: {
      flexDirection: 'row',
      marginBottom: 20,
      padding: 12,
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 8,
    },
    bookCoverSmall: {
      width: 60,
      height: 90,
      borderRadius: 6,
      marginRight: 12,
      backgroundColor: theme.neutral200,
    },
    bookHeaderInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    bookTitleSmall: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookAuthorSmall: {
      ...typography.caption,
      color: theme.textSecondary,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      ...typography.overline,
      color: theme.textPrimary,
      marginBottom: 8,
      fontWeight: '600',
    },
    ratingContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    ratingInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    ratingInput: {
      borderWidth: 1,
      borderColor: theme.borderMedium,
      borderRadius: 8,
      padding: 12,
      fontSize: 20,
      fontWeight: '600',
      backgroundColor: theme.backgroundPrimary,
      color: theme.textPrimary,
      width: 80,
      textAlign: 'center',
    },
    ratingOutOf: {
      fontSize: 20,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    starWrapper: {
      position: 'relative',
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
    },
    starEmpty: {
      fontSize: 44,
      lineHeight: 44,
      color: theme.primaryMain,
      position: 'absolute',
    },
    starFilledContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 44,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    starFilledText: {
      fontSize: 44,
      lineHeight: 44,
      color: theme.primaryMain,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.borderMedium,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      backgroundColor: theme.backgroundPrimary,
      color: theme.textPrimary,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    textInputLarge: {
      minHeight: 100,
    },
    helperText: {
      ...typography.caption,
      color: theme.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    saveButton: {
      backgroundColor: theme.primaryMain,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    saveButtonText: {
      ...typography.button,
      color: theme.textInverse,
    },
    saveButtonDisabled: {
      backgroundColor: theme.textMuted,
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Review Book</Text>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollContent}
          >
            {book && (
              <View style={modalStyles.bookHeader}>
                {book.coverUrl && (
                  <Image
                    source={{ uri: book.coverUrl }}
                    style={modalStyles.bookCoverSmall}
                    resizeMode="cover"
                  />
                )}
                <View style={modalStyles.bookHeaderInfo}>
                  <Text style={modalStyles.bookTitleSmall} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={modalStyles.bookAuthorSmall} numberOfLines={1}>
                    by {book.author}
                  </Text>
                </View>
              </View>
            )}

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Rating</Text>
              <View style={modalStyles.ratingContainer}>
                <View style={modalStyles.ratingInputContainer}>
                  <TextInput
                    style={modalStyles.ratingInput}
                    value={ratingInput}
                    onChangeText={handleRatingChange}
                    placeholder="0.0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    editable={!loading}
                  />
                  <Text style={modalStyles.ratingOutOf}>/ 5.0</Text>
                </View>
                <View style={modalStyles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => renderStarForRating(star))}
                </View>
              </View>
              <Text style={modalStyles.helperText}>
                Enter a number between 0 and 5 (e.g., 4.25)
              </Text>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Overall Thoughts</Text>
              <TextInput
                style={[modalStyles.textInput, modalStyles.textInputLarge]}
                value={overallThoughts}
                onChangeText={setOverallThoughts}
                placeholder="What did you think about this book overall?"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                maxLength={1000}
                editable={!loading}
              />
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>How Did It Make You Feel?</Text>
              <TextInput
                style={modalStyles.textInput}
                value={feelings}
                onChangeText={setFeelings}
                placeholder="Happy, sad, inspired, thoughtful..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!loading}
              />
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Who Would Like This Book?</Text>
              <TextInput
                style={modalStyles.textInput}
                value={recommendedFor}
                onChangeText={setRecommendedFor}
                placeholder="Fans of mystery, young adults, romance readers..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!loading}
              />
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Content Warnings</Text>
              <TextInput
                style={modalStyles.textInput}
                value={contentWarnings}
                onChangeText={setContentWarnings}
                placeholder="Violence, mature themes, language..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!loading}
              />
              <Text style={modalStyles.helperText}>
                Help others know what to watch out for
              </Text>
            </View>

            <TouchableOpacity
              style={[
                modalStyles.saveButton,
                loading && modalStyles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={modalStyles.saveButtonText}>Save Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function BookshelfDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ShelfBook | null>(null);
  const [updating, setUpdating] = useState(false);

  const shelf: Bookshelf = {
    id: params.shelfId as string,
    name: params.shelfName as string,
    color: params.shelfColor as string,
    description: params.shelfDescription as string,
    isDefault: params.isDefault === 'true',
    bookCount: parseInt(params.bookCount as string) || 0,
    userId: '',
    createdAt: null,
    updatedAt: null
  };

  const isCurrentlyReading = shelf.name === 'Currently Reading';
  const isWantToRead = shelf.name === 'Want to Read';

  const softenColor = (hex: string): string => {
    if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return '#CBD5E0'; // Default gray color
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);  
  
  // Blend with a soft blue-gray to tone down bright colors
  const blendR = Math.round(r * 0.6 + 176 * 0.4);
  const blendG = Math.round(g * 0.6 + 196 * 0.4);
  const blendB = Math.round(b * 0.6 + 220 * 0.4);

   return `#${blendR.toString(16).padStart(2, '0')}${blendG.toString(16).padStart(2, '0')}${blendB.toString(16).padStart(2, '0')}`;
};

const hexToRgba = (hex: string, alpha: number) => {
  // Add safety check for undefined or invalid hex
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(203, 213, 224, ${alpha})`; // Default gray color
  }
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const softColor = shelf.color ? softenColor(shelf.color) : '#CBD5E0';

  useEffect(() => {
    loadBooks(true);
    loadBookshelves();
  }, []);

  const loadBooks = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const result = await getShelfBooks(shelf.id);
      if (result.success && result.data) {
        setBooks(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load books');
      }
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBookshelves = async () => {
    try {
      const result = await getUserBookshelves();
      if (result.success && result.data) {
        setBookshelves(result.data);
      }
    } catch (error) {
      console.error('Error loading bookshelves:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
    loadBookshelves();
  };

  const handleReviewBook = (book: ShelfBook) => {
    setSelectedBook(book);
    setReviewModalVisible(true);
  };

  const handleMoveBook = (book: ShelfBook) => {
    setSelectedBook(book);
    setMoveModalVisible(true);
  };

  const handleSaveReview = async (bookId: string, reviewData: ReviewData) => {
    setUpdating(true);
    try {
      const result = await updateShelfBook(bookId, reviewData);
      
      if (result.success) {
        setReviewModalVisible(false);
        setSelectedBook(null);
        Alert.alert('Success', 'Review saved successfully!');
        loadBooks();
      } else {
        Alert.alert('Error', result.error || 'Failed to save review');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      Alert.alert('Error', 'Failed to save review');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmMove = async (targetShelfId: string, targetShelfName: string) => {
    if (!selectedBook) return;

    setUpdating(true);
    setMoveModalVisible(false);

    try {
      // For now, we'll use a workaround: remove from old shelf and add to new shelf
      // This requires importing your service functions
      const removeResult = await removeBookFromShelf(selectedBook.id);
      
      if (!removeResult.success) {
        Alert.alert('Error', removeResult.error || 'Failed to move book');
        setSelectedBook(null);
        setUpdating(false);
        return;
      }

      // Update the book's shelf ID (you'll need to add this to your service)
      const bookRef = {
        bookshelfId: targetShelfId,
        title: selectedBook.title,
        author: selectedBook.author,
        coverUrl: selectedBook.coverUrl,
        notes: selectedBook.notes,
        rating: selectedBook.rating,
        overallThoughts: selectedBook.overallThoughts,
        feelings: selectedBook.feelings,
        recommendedFor: selectedBook.recommendedFor,
        contentWarnings: selectedBook.contentWarnings
      };

      // Import addBookToShelf from your service
      const { addBookToShelf } = require('../services/bookshelvesService');
      const addResult = await addBookToShelf(bookRef);

      if (addResult.success) {
        const shouldPromptReview = 
          (isWantToRead || isCurrentlyReading) && 
          targetShelfName !== 'Currently Reading' && 
          targetShelfName !== 'Want to Read';

        if (shouldPromptReview && !selectedBook.rating) {
          // Store the new book ID for the review
          const movedBook = { ...selectedBook, id: addResult.data!.id, bookshelfId: targetShelfId };
          setSelectedBook(movedBook);
          
          Alert.alert(
            'Book Moved!',
            `"${selectedBook.title}" has been moved to "${targetShelfName}". Would you like to add a review?`,
            [
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => {
                  loadBooks();
                  loadBookshelves();
                  setSelectedBook(null);
                }
              },
              {
                text: 'Add Review',
                onPress: () => {
                  setReviewModalVisible(true);
                }
              }
            ]
          );
        } else {
          Alert.alert('Success', `Book moved to "${targetShelfName}"`);
          loadBooks();
          loadBookshelves();
          setSelectedBook(null);
        }
      } else {
        Alert.alert('Error', addResult.error || 'Failed to move book');
        setSelectedBook(null);
      }
    } catch (error) {
      console.error('Error moving book:', error);
      Alert.alert('Error', 'Failed to move book');
      setSelectedBook(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleShareShelf = async () => {
    try {
      const shareUrl = generateShareUrl(`/shared-shelf/${shelf.id}`);
      
      const result = await Share.share({
        message: `Check out my "${shelf.name}" bookshelf with ${books.length} books!\n\n${shareUrl}`,
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

const handleShareReview = async (book: ShelfBook) => {
  // Check if book has any review content
  const hasReview = !!(
    book.rating || 
    book.overallThoughts?.trim() || 
    book.feelings?.trim() || 
    book.recommendedFor?.trim() || 
    book.contentWarnings?.trim()
  );

  if (!hasReview) {
    Alert.alert(
      'No Review Yet',
      'Please add a review before sharing. You can add ratings, thoughts, feelings, or recommendations.',
      [{ text: 'OK' }]
    );
    return;
  }

  try {
    const shareLink = generateReviewShareLink(book.id, shelf.id)
    
    let message = `Check out my review of "${book.title}" by ${book.author}`;
    
    if (book.rating) {
      message += `\n\n⭐ Rating: ${book.rating.toFixed(1)} / 5.0`;
    }
    
    if (book.overallThoughts) {
      message += `\n\n"${book.overallThoughts.substring(0, 100)}${book.overallThoughts.length > 100 ? '...' : ''}"`;
    }
    
    message += `\n\n${shareLink}`;

    const result = await Share.share({
      message,
      title: `${book.title} - Book Review`,
    });

    if (result.action === Share.sharedAction) {
      console.log('Review shared successfully');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to share review');
    console.error('Share error:', error);
  }
};

  const handleRemoveBook = (book: ShelfBook) => {
    Alert.alert(
      'Remove Book',
      `Remove "${book.title}" from this shelf?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeBookFromShelf(book.id);
            if (result.success) {
              loadBooks();
              loadBookshelves();
              Alert.alert('Success', 'Book removed from shelf');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove book');
            }
          }
        }
      ]
    );
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fillAmount = Math.max(0, Math.min(1, rating - (i - 1)));
      
      if (fillAmount === 0) {
        stars.push(
          <View key={i} style={styles.displayStarWrapper}>
            <Text style={styles.starIcon}>☆</Text>
          </View>
        );
      } else {
        stars.push(
          <View key={i} style={styles.displayStarWrapper}>
            <Text style={styles.starIcon}>☆</Text>
            <View style={[styles.displayStarFilledOverlay, { width: `${fillAmount * 100}%` }]}>
              <Text style={[styles.starIcon, styles.starFilled]}>★</Text>
            </View>
          </View>
        );
      }
    }
    
    return (
      <View style={styles.starsContainer}>
        {stars}
        <Text style={styles.ratingText}> {rating.toFixed(1)}</Text>
      </View>
    );
  };

const renderBookItem: ListRenderItem<ShelfBook> = ({ item }) => {
  const showReviewButton = !isCurrentlyReading && !isWantToRead;
  const showMoveButton = isWantToRead || isCurrentlyReading;
  
  // Check if the book has any review content
  const hasReview = !!(
    item.rating || 
    item.overallThoughts?.trim() || 
    item.feelings?.trim() || 
    item.recommendedFor?.trim() || 
    item.contentWarnings?.trim()
  );

  return (
    <View style={styles.bookCard}>
      <View style={styles.bookCardColorTint} />
      <View style={styles.bookContent}>
        <View style={styles.coverContainer}>
          {item.coverUrl && (
            <Image
              source={{ uri: item.coverUrl }}
              style={styles.bookCover}
              resizeMode="cover"
            />
          )}
          {renderStars(item.rating)}
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {item.author}
          </Text>
          
          {item.overallThoughts && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Overall Thoughts:</Text>
              <Text style={styles.reviewText} numberOfLines={2}>
                {item.overallThoughts}
              </Text>
            </View>
          )}
          
          {item.feelings && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Feelings:</Text>
              <Text style={styles.reviewText} numberOfLines={2}>
                {item.feelings}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.bookActions}>
        {showReviewButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReviewBook(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.rating ? 'Edit Review' : 'Add Review'}
            </Text>
          </TouchableOpacity>
        )}
        {showMoveButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.moveButton]}
            onPress={() => handleMoveBook(item)}
          >
            <Text style={[styles.actionButtonText, styles.moveButtonText]}>
              Move
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.shareButton,
            !hasReview && styles.actionButtonDisabled
          ]}
          onPress={() => handleShareReview(item)}
          disabled={!hasReview}
        >
          <Text style={[
            styles.actionButtonText, 
            styles.shareButtonText,
            !hasReview && styles.actionButtonDisabledText
          ]}>
            Share
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveBook(item)}
        >
          <Text style={[styles.actionButtonText, styles.removeButtonText]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      padding: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      backgroundColor: theme.backgroundSecondary,
      position: 'relative',
      overflow: 'hidden',
    },
    headerColorTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: hexToRgba(shelf.color, 0.03),
      pointerEvents: 'none',
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    backButtonText: {
      fontSize: 24,
      color: theme.primaryMain,
    },
    shareShelfButton: {
      marginLeft: 'auto',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.primaryMain,
      borderRadius: 8,
      minWidth: 90,
      alignItems: 'center',
    },
    shareShelfButtonText: {
      ...typography.buttonSmall,
      color: theme.textInverse,
      fontWeight: '600',
    },
      shelfColorBar: {
        width: 18,
        minHeight: 45,
        borderRadius: 3,
        backgroundColor: softColor,
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
  },
  spineLine1: {
    position: 'absolute',
    top: 8,
    left: 3,
    right: 3,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  spineLine2: {
    position: 'absolute',
    top: 13,
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1,
  },
  spineLine3: {
    position: 'absolute',
    bottom: 13,
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 1,
  },
  spineLine4: {
    position: 'absolute',
    bottom: 8,
    left: 3,
    right: 3,
    height: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 1,
  },
  spineEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
    headerInfo: {
      flex: 1,
    },
    shelfName: {
      ...typography.h2,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
    shelfDescription: {
      ...typography.body,
      color: theme.textSecondary,
      marginTop: 8,
    },
    bookCount: {
      ...typography.caption,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    booksList: {
      padding: 20,
    },
    bookCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      position:'relative',
      overflow: 'hidden',
    },
    bookCardColorTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: hexToRgba(shelf.color, 0.03),
      pointerEvents: 'none',
  },
    bookContent: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    coverContainer: {
      alignItems: 'center',
      marginRight: 16,
    },
    bookCover: {
      width: 70,
      height: 105,
      borderRadius: 8,
      backgroundColor: theme.neutral200,
      marginBottom: 6,
    },
    bookInfo: {
      flex: 1,
    },
    bookTitle: {
      ...typography.bookTitle,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookAuthor: {
      ...typography.authorName,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    displayStarWrapper: {
      position: 'relative',
      width: 14,
      height: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 1,
    },
    displayStarFilledOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 14,
      overflow: 'hidden',
    },
    starIcon: {
      fontSize: 14,
      lineHeight: 14,
      color: theme.primaryMain,
      position: 'absolute',
    },
    starFilled: {
      color: theme.primaryMain,
    },
    ratingText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 4,
      fontWeight: '600',
    },
    reviewSection: {
      marginBottom: 8,
    },
    reviewLabel: {
      ...typography.caption,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 2,
    },
    reviewText: {
      ...typography.bodySmall,
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    bookActions: {
      flexDirection: 'row',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      paddingTop: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: theme.backgroundPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
    },
    actionButtonText: {
      ...typography.buttonSmall,
      color: theme.textPrimary,
      fontSize: 12,
    },
    moveButton: {
      backgroundColor: theme.primaryMain + '10',
      borderWidth: 1,
      borderColor: theme.primaryMain + '60',
    },
    moveButtonText: {
      color: theme.primaryMain,
      fontWeight: '600',
    },
    shareButton: {
      backgroundColor: theme.primaryMain + '20',
      borderWidth: 1,
      borderColor: theme.primaryMain,
    },
    shareButtonText: {
      color: theme.primaryMain,
      fontWeight: '600',
    },
    removeButton: {
      backgroundColor: theme.error + '15',
    },
    removeButtonText: {
      color: theme.error,
    },
    actionButtonDisabled: {
    backgroundColor: theme.neutral200,
    borderColor: theme.borderLight,
    opacity: 0.5,
},
actionButtonDisabledText: {
  color: theme.textMuted,
},
  });

  if (loading) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryMain} />
            <Text style={styles.loadingText}>Loading books...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>

        
   <View style={styles.header}>
      <View style={styles.headerColorTint} />
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/Bookshelves')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            {/* UPDATED: Add decorative lines to the spine */}
            <View style={styles.shelfColorBar}>
              <View style={styles.spineEdge} />
              <View style={styles.spineLine1} />
              <View style={styles.spineLine2} />
              <View style={styles.spineLine3} />
              <View style={styles.spineLine4} />
            </View>
            
            <View style={styles.headerInfo}>
              {/* UPDATED: Add book emoji to the title */}
              <Text style={styles.shelfName}>
                {shelf.name}
              </Text>
              <Text style={styles.bookCount}>
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.shareShelfButton}
              onPress={handleShareShelf}
            >
              <Text style={styles.shareShelfButtonText}>Share Shelf</Text>
            </TouchableOpacity>
          </View>
          {shelf.description ? (
            <Text style={styles.shelfDescription}>{shelf.description}</Text>
          ) : null}
        </View>
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No books yet</Text>
            <Text style={styles.emptyText}>
              Start adding books from the search page to see them here!
            </Text>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            renderItem={renderBookItem}
            contentContainerStyle={styles.booksList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primaryMain}
                colors={[theme.primaryMain]}
              />
            }
          />
        )}

        <ReviewBookModal
          visible={reviewModalVisible}
          book={selectedBook}
          onClose={() => {
            setReviewModalVisible(false);
            if (!moveModalVisible) {
              setSelectedBook(null);
            }
          }}
          onSave={handleSaveReview}
          loading={updating}
        />

        <MoveBookModal
          visible={moveModalVisible}
          book={selectedBook}
          currentShelf={shelf}
          bookshelves={bookshelves}
          onClose={() => {
            setMoveModalVisible(false);
            setSelectedBook(null);
          }}
          onMove={handleConfirmMove}
          loading={updating}
        />
      </SafeAreaView>
    </>
  );
}