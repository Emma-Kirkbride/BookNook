import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';
import {
  addBookToShelf,
  Bookshelf,
  getUserBookshelves
} from '../../services/bookshelvesService';
import { typography } from '../../styles/Typography';


// Type definitions for our book data
interface Book {
  id: string;
  title: string;
  authors: string[];
  publishYear?: number | null;
  coverUrl?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language: string[];
  subjects: string[];
}

// Extended book details from Works API
interface BookDetails extends Book {
  description?: string;
  excerpts?: string[];
  firstSentence?: string;
  pageCount?: number;
  largeCoverUrl?: string;
}

// Shelf Selection Modal Component
interface ShelfSelectionModalProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onSelectShelf: (shelfId: string) => void;
}

const ShelfSelectionModal: React.FC<ShelfSelectionModalProps> = ({
  visible,
  book,
  onClose,
  onSelectShelf
}) => {
  const { theme } = useTheme();
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBookshelves();
    }
  }, [visible]);

  const loadBookshelves = async () => {
    setLoading(true);
    try {
      const result = await getUserBookshelves();
      if (result.success && result.data) {
        setBookshelves(result.data);
      } else {
        Alert.alert('Error', 'Failed to load bookshelves');
      }
    } catch (error) {
      console.error('Error loading bookshelves:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
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
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: theme.textSecondary,
      fontWeight: '300',
    },
    bookPreview: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 8,
      marginBottom: 20,
    },
    previewCover: {
      width: 40,
      height: 60,
      borderRadius: 4,
      marginRight: 12,
      backgroundColor: theme.neutral200,
    },
    previewInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    previewTitle: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    previewAuthor: {
      ...typography.caption,
      color: theme.textSecondary,
    },
    shelvesContainer: {
      gap: 12,
    },
    shelfOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    shelfColorIndicator: {
      width: 4,
      height: 40,
      borderRadius: 2,
      marginRight: 12,
    },
    shelfInfo: {
      flex: 1,
    },
    shelfName: {
      ...typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    shelfCount: {
      ...typography.caption,
      color: theme.textSecondary,
    },
    defaultBadge: {
      fontSize: 10,
      color: theme.primaryMain,
      backgroundColor: theme.primaryBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      fontWeight: '600',
      marginLeft: 8,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: theme.textSecondary,
      marginTop: 12,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to Bookshelf</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {book && (
            <View style={styles.bookPreview}>
              {book.coverUrl && (
                <Image 
                  source={{ uri: book.coverUrl }} 
                  style={styles.previewCover}
                  resizeMode="cover"
                />
              )}
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.previewAuthor} numberOfLines={1}>
                  by {book.authors.join(', ')}
                </Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primaryMain} />
              <Text style={styles.loadingText}>Loading your bookshelves...</Text>
            </View>
          ) : bookshelves.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No bookshelves found. Create a bookshelf first in the Shelves tab.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.shelvesContainer} showsVerticalScrollIndicator={false}>
              {bookshelves.map((shelf) => (
                <TouchableOpacity
                  key={shelf.id}
                  style={styles.shelfOption}
                  onPress={() => onSelectShelf(shelf.id)}
                >
                  <View style={[styles.shelfColorIndicator, { backgroundColor: shelf.color }]} />
                  <View style={styles.shelfInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.shelfName}>{shelf.name}</Text>
                      {shelf.isDefault && (
                        <Text style={styles.defaultBadge}>Default</Text>
                      )}
                    </View>
                    <Text style={styles.shelfCount}>
                      {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<BookDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [shelfModalVisible, setShelfModalVisible] = useState<boolean>(false);
  const [bookToAdd, setBookToAdd] = useState<Book | null>(null);
  const [addingBook, setAddingBook] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUsername, setLoadingUsername] = useState<boolean>(true);


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

  // Popular search suggestions
  const searchSuggestions = [
    'Harry Potter', 'Lord of the Rings', 'Pride and Prejudice',
    'To Kill a Mockingbird', 'The Great Gatsby', '1984',
    'Jane Austen', 'Stephen King', 'Agatha Christie'
  ];

  // Genre categories
  const genres = [
    { name: 'Fiction', query: 'fiction' },
    { name: 'Mystery', query: 'mystery' },
    { name: 'Romance', query: 'romance' },
    { name: 'Sci-Fi', query: 'science fiction' },
    { name: 'Biography', query: 'biography' },
    { name: 'History', query: 'history' }
  ];

  const searchWithQuery = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const performSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      Alert.alert('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i,isbn,publisher,language,subject`
      );
      const data = await response.json();
      
      // Filter and format the results
      const formattedBooks: Book[] = data.docs.map((book: any) => {
        return {
          id: book.key,
          title: book.title || 'Unknown Title',
          authors: book.author_name || ['Unknown Author'],
          publishYear: book.first_publish_year || null,
          coverUrl: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          isbn: book.isbn ? book.isbn[0] : null,
          publisher: book.publisher ? book.publisher[0] : null,
          language: book.language || ['en'],
          subjects: book.subject ? book.subject.slice(0, 3) : []
        };
      });

      setBooks(formattedBooks);
      setShowResults(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to search for books. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookDetails = async (book: Book): Promise<void> => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`https://openlibrary.org${book.id}.json`);
      const data = await response.json();
      
      // Create enhanced book details
      const bookDetails: BookDetails = {
        ...book,
        description: data.description?.value || data.description || undefined,
        excerpts: data.excerpts?.map((excerpt: any) => excerpt.text) || [],
        firstSentence: data.first_sentence?.value || undefined,
        pageCount: data.number_of_pages || undefined,
        largeCoverUrl: book.coverUrl ? book.coverUrl.replace('-M.jpg', '-L.jpg') : undefined
      };

      setSelectedBook(bookDetails);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch book details. Please try again.');
      console.error('Details error:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openShelfSelection = (book: Book): void => {
    setBookToAdd(book);
    setShelfModalVisible(true);
  };

  const handleAddToShelf = async (shelfId: string): Promise<void> => {
    if (!bookToAdd || !user) return;

    setAddingBook(true);
    try {
      const result = await addBookToShelf({
        bookshelfId: shelfId,
        title: bookToAdd.title,
        author: bookToAdd.authors.join(', '),
        coverUrl: bookToAdd.coverUrl || undefined,
      });

      if (result.success) {
        setShelfModalVisible(false);
        Alert.alert('Success', `"${bookToAdd.title}" has been added to your bookshelf!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to add book to shelf');
      }
    } catch (error) {
      console.error('Error adding book to shelf:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setAddingBook(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
  };

  const renderBookItem: ListRenderItem<Book> = ({ item }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookContent}>
        {item.coverUrl && (
          <Image 
            source={{ uri: item.coverUrl }} 
            style={styles.bookCover}
            resizeMode="cover"
          />
        )}
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {item.authors.join(', ')}
          </Text>
          {item.publishYear && (
            <Text style={styles.bookYear}>
              Published: {item.publishYear}
            </Text>
          )}
          {item.subjects.length > 0 && (
            <Text style={styles.bookSubjects} numberOfLines={1}>
              {item.subjects.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openShelfSelection(item)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => fetchBookDetails(item)}
            disabled={loadingDetails}
          >
            {loadingDetails ? (
              <ActivityIndicator size="small" color={theme.primaryMain} />
            ) : (
              <Text style={styles.detailsButtonText}>Details</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBookDetailsModal = () => {
    if (!selectedBook) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedBook.title}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Book Cover and Basic Info */}
              <View style={styles.modalBookInfo}>
                {selectedBook.largeCoverUrl && (
                  <Image 
                    source={{ uri: selectedBook.largeCoverUrl }} 
                    style={styles.modalCover}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.modalMetadata}>
                  <Text style={styles.modalAuthor}>
                    by {selectedBook.authors.join(', ')}
                  </Text>
                  {selectedBook.publishYear && (
                    <Text style={styles.modalYear}>
                      Published: {selectedBook.publishYear}
                    </Text>
                  )}
                  {selectedBook.pageCount && (
                    <Text style={styles.modalPages}>
                      Pages: {selectedBook.pageCount}
                    </Text>
                  )}
                  {selectedBook.publisher && (
                    <Text style={styles.modalPublisher}>
                      Publisher: {selectedBook.publisher}
                    </Text>
                  )}
                  {selectedBook.subjects.length > 0 && (
                    <Text style={styles.modalGenres}>
                      Genres: {selectedBook.subjects.slice(0, 3).join(' • ')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Description */}
              {selectedBook.description && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>
                    {selectedBook.description}
                  </Text>
                </View>
              )}

              {/* First Sentence */}
              {selectedBook.firstSentence && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Opening Lines</Text>
                  <Text style={styles.modalExcerpt}>
                    "{selectedBook.firstSentence}"
                  </Text>
                </View>
              )}

              {/* Excerpts */}
              {selectedBook.excerpts && selectedBook.excerpts.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Excerpt</Text>
                  <Text style={styles.modalExcerpt}>
                    "{selectedBook.excerpts[0]}"
                  </Text>
                </View>
              )}

              {/* Subjects/Genres */}
              {selectedBook.subjects.length > 0 && selectedBook.subjects.length > 3 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Additional Genres</Text>
                  <Text style={styles.modalSubjects}>
                    {selectedBook.subjects.slice(3).join(' • ')}
                  </Text>
                </View>
              )}

              {/* Add to Bookshelf Button */}
              <TouchableOpacity 
                style={styles.modalAddButton}
                onPress={() => {
                  closeModal();
                  openShelfSelection(selectedBook);
                }}
              >
                <Text style={styles.modalAddButtonText}>Add to Bookshelf</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
      paddingTop: 20,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      ...typography.h1,
      color: theme.textTitle,
      marginBottom: 20,
      textAlign: 'center',
    },
    intro: {
      ...typography.h3,
      color:theme.textPrimary,
      marginBottom: 1,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.h4,
      color: theme.textSecondary,
      marginBottom: 15,
      textAlign: 'center',
    },
    description: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 5,
    },
    searchContainer: {
      marginBottom: 32,
    },
    searchInput: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...typography.body,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderLight,
      marginBottom: 12,
    },
    searchButton: {
      backgroundColor: theme.primaryMain,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonText: {
      ...typography.button,
      color: theme.textInverse,
    },
    resultsContainer: {
      flex: 1,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    resultsTitle: {
      ...typography.h3,
      color: theme.textPrimary,
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    clearButtonText: {
      ...typography.buttonSmall,
      color: theme.textSecondary,
    },
    bookItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      paddingVertical: 16,
    },
    bookContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bookCover: {
      width: 60,
      height: 90,
      borderRadius: 8,
      marginRight: 16,
      backgroundColor: theme.neutral200,
    },
    bookInfo: {
      flex: 1,
      marginRight: 12,
    },
    bookTitle: {
      ...typography.bookTitle,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookAuthor: {
      ...typography.authorName,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    bookYear: {
      ...typography.caption,
      color: theme.textTertiary,
      marginBottom: 4,
    },
    bookSubjects: {
      ...typography.caption,
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    buttonContainer: {
      alignItems: 'center',
      gap: 8,
    },
    addButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryMain,
      minWidth: 60,
    },
    addButtonText: {
      ...typography.buttonSmall,
      color: theme.textInverse,
    },
    detailsButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.primaryMain,
      minWidth: 60,
      minHeight: 32,
    },
    detailsButtonText: {
      ...typography.buttonSmall,
      color: theme.primaryMain,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    sectionContainer: {
      marginBottom: 32,
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.textPrimary,
      marginBottom: 16,
    },
    genreContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    genreButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.borderLight,
      marginRight: 8,
      marginBottom: 8,
    },
    genreButtonText: {
      ...typography.buttonSmall,
      color: theme.textPrimary,
    },
    suggestionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    suggestionChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.textInverse,
      borderColor: theme.primaryMain,
      marginRight: 8,
      marginBottom: 8,
    },
    suggestionText: {
      ...typography.caption,
      fontWeight: '500',
      color: theme.primaryMain,
    },
    featuresContainer: {
      gap: 16,
    },
    featureItem: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
    },
    featureIcon: {
      width: 40,
      height: 40,
      marginBottom: 12,
      tintColor: theme.primaryMain,
    },
    featureTitle: {
      ...typography.h4,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    featureDescription: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      textAlign: 'center',
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
      padding: 20,
      maxHeight: '90%',
      width: '90%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    modalTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      flex: 1,
      marginRight: 16,
    },
    closeButton: {
      padding: 4,
      backgroundColor: theme.primaryMain,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textInverse,
    },
    modalBookInfo: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    modalCover: {
      width: 100,
      height: 150,
      borderRadius: 12,
      marginRight: 16,
      backgroundColor: theme.neutral200,
    },
    modalMetadata: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    modalAuthor: {
      ...typography.bodyMedium,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    modalYear: {
      ...typography.caption,
      color: theme.textTertiary,
      marginBottom: 4,
    },
    modalPages: {
      ...typography.caption,
      color: theme.textTertiary,
      marginBottom: 4,
    },
    modalPublisher: {
      ...typography.caption,
      color: theme.textTertiary,
    },
    modalGenres: {
      ...typography.caption,
      color: theme.textTertiary,
      marginTop: 4,
    },
    modalSection: {
      marginBottom: 20,
    },
    modalSectionTitle: {
      ...typography.h4,
      color: theme.textPrimary,
      marginBottom: 8,
    },
    modalDescription: {
      ...typography.body,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    modalExcerpt: {
      ...typography.quote,
      color: theme.textSecondary,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    modalSubjects: {
      ...typography.bodySmall,
      color: theme.textTertiary,
    },
    modalAddButton: {
      backgroundColor: theme.primaryMain,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    modalAddButtonText: {
      ...typography.button,
      color: theme.textInverse,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!showResults ? (
  <>
    <View style={styles.header}>
      {loadingUsername ? (
        <Text style={styles.intro}>Welcome to</Text>
      ) : (
        <Text style={styles.intro}>
          Welcome{username ? `, ${username},` : ''} to
        </Text>
      )}
      <Text style={styles.title}>BookNook</Text>


                <Text style={styles.description}>
                  Discover books you'll love, organize them in personal collections, </Text>
                <Text style={styles.description}>and share your literary world—all at your own pace.</Text>
              </View>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for books..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={() => performSearch(searchQuery)}
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => performSearch(searchQuery)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.textInverse} />
                  ) : (
                    <Text style={styles.searchButtonText}>Search Books</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Genre Categories */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  Browse by Genre
                </Text>
                <View style={styles.genreContainer}>
                  {genres.map((genre, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.genreButton}
                      onPress={() => searchWithQuery(genre.query)}
                    >
                      <Text style={styles.genreButtonText}>
                        {genre.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Popular Searches */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  Popular Searches
                </Text>
                <View style={styles.suggestionsContainer}>
                  {searchSuggestions.slice(0, 6).map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => searchWithQuery(suggestion)}
                    >
                      <Text style={styles.suggestionText}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* App Features */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  What You Can Do
                </Text>
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Image 
                      source={require('../../assets/images/magnifyingGlass.png')} 
                      style={styles.featureIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.featureTitle}>Search Books</Text>
                    <Text style={styles.featureDescription}>
                      Find any book from millions of titles
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Image 
                      source={require('../../assets/images/bookstack.png')} 
                      style={styles.featureIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.featureTitle}>Create Shelves</Text>
                    <Text style={styles.featureDescription}>
                      Organize books into custom bookshelves
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Image 
                      source={require('../../assets/images/envelope.png')} 
                      style={styles.featureIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.featureTitle}>Share & Discover</Text>
                    <Text style={styles.featureDescription}>
                      Share your reading lists with friends
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  Search Results ({books.length})
                </Text>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setShowResults(false);
                    setBooks([]);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.clearButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                renderItem={renderBookItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      No books found. Try a different search term.
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        </ScrollView>
      </View>
      
      {renderBookDetailsModal()}
      
      <ShelfSelectionModal
        visible={shelfModalVisible}
        book={bookToAdd}
        onClose={() => {
          setShelfModalVisible(false);
          setBookToAdd(null);
        }}
        onSelectShelf={handleAddToShelf}
      />
    </SafeAreaView>
  );
}