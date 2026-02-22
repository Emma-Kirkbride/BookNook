import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebaseConfig';
import { typography } from '../../styles/Typography';

interface Bookshelf {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  bookCount: number;
}

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  rating?: number;
}

export default function SharedShelfPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [shelf, setShelf] = useState<Bookshelf | null>(null);
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const softenColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const blendR = Math.round(r * 0.6 + 176 * 0.4);
  const blendG = Math.round(g * 0.6 + 196 * 0.4);
  const blendB = Math.round(b * 0.6 + 220 * 0.4);
  
  return `#${blendR.toString(16).padStart(2, '0')}${blendG.toString(16).padStart(2, '0')}${blendB.toString(16).padStart(2, '0')}`;
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const softColor = shelf ? softenColor(shelf.color) : '#CBD5E0';

  useEffect(() => {
    loadSharedShelf();
  }, [id]);

  const loadSharedShelf = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading shared shelf with ID:', id);
      console.log('🔍 ID type:', typeof id);

      // Fetch shelf data
      const shelfRef = doc(db, 'bookshelves', id as string);
      const shelfDoc = await getDoc(shelfRef);

      console.log('📄 Shelf document exists:', shelfDoc.exists());

      if (!shelfDoc.exists()) {
        console.log('❌ Shelf not found for ID:', id);
        setError('Bookshelf not found');
        setLoading(false);
        return;
      }

      const shelfData = {
        id: shelfDoc.id,
        ...shelfDoc.data()
      } as Bookshelf;

      console.log('✅ Shelf loaded:', shelfData.name);
      setShelf(shelfData);

      // Fetch books in this shelf
      const booksQuery = query(
        collection(db, 'shelf_books'),
        where('bookshelfId', '==', id),
        orderBy('addedAt', 'desc')
      );

      const booksSnapshot = await getDocs(booksQuery);
      const booksData = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShelfBook[];

      console.log('📚 Books loaded:', booksData.length);
      setBooks(booksData);
    } catch (error) {
      console.error('❌ Error loading shared shelf:', error);
      setError('Failed to load bookshelf');
    } finally {
      setLoading(false);
    }
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

const renderBookItem: ListRenderItem<ShelfBook> = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => router.push(`/shared-review/${id}/${item.id}` as any)}
    >
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
        </View>
      </View>
    </TouchableOpacity>
  );

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
      backgroundColor: shelf ? hexToRgba(shelf.color, 0.03) : 'transparent',
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
    sharedBadge: {
      backgroundColor: theme.primaryMain + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    sharedBadgeText: {
      ...typography.caption,
      color: theme.primaryMain,
      fontWeight: '600',
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    errorTitle: {
      ...typography.h3,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    backHomeButton: {
      backgroundColor: theme.primaryMain,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backHomeButtonText: {
      ...typography.button,
      color: theme.textInverse,
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
      position: 'relative',
      overflow: 'hidden',
    },
    bookCardColorTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: shelf ? hexToRgba(shelf.color, 0.03) : 'transparent',
      pointerEvents: 'none',
    },
    bookContent: {
      flexDirection: 'row',
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
      marginBottom: 8,
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
  });

  if (loading) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryMain} />
            <Text style={styles.loadingText}>Loading bookshelf...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error || !shelf) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📚</Text>
            <Text style={styles.errorTitle}>Bookshelf Not Found</Text>
            <Text style={styles.errorText}>
              This bookshelf may have been deleted or the link is invalid.
            </Text>
            <TouchableOpacity 
              style={styles.backHomeButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.backHomeButtonText}>Go to Home</Text>
            </TouchableOpacity>
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
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.shelfColorBar}>
              <View style={styles.spineLine1} />
              <View style={styles.spineLine2} />
              <View style={styles.spineLine3} />
              <View style={styles.spineLine4} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.shelfName}>
                {shelf.name}
              </Text>
              <Text style={styles.bookCount}>
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </Text>
            </View>
          </View>
          {shelf.description ? (
            <Text style={styles.shelfDescription}>{shelf.description}</Text>
          ) : null}
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedBadgeText}>📖 Shared Bookshelf</Text>
          </View>
        </View>

        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No books yet</Text>
            <Text style={styles.emptyText}>
              This bookshelf doesn't have any books yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            renderItem={renderBookItem}
            contentContainerStyle={styles.booksList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}