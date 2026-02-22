import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { db } from '../../../firebaseConfig';
import { typography } from '../../../styles/Typography';

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  rating?: number;
  overallThoughts?: string;
  feelings?: string;
  recommendedFor?: string;
  contentWarnings?: string;
}

interface Bookshelf {
  id: string;
  name: string;
  color: string;
}

export default function SharedReviewPage() {
  const { shelfId, bookId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [book, setBook] = useState<ShelfBook | null>(null);
  const [shelf, setShelf] = useState<Bookshelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

  useEffect(() => {
    loadSharedReview();
  }, [bookId, shelfId]);

  const loadSharedReview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch book review data
      const bookRef = doc(db, 'shelf_books', bookId as string);
      const bookDoc = await getDoc(bookRef);

      if (!bookDoc.exists()) {
        setError('Review not found');
        setLoading(false);
        return;
      }

      const bookData = {
        id: bookDoc.id,
        ...bookDoc.data()
      } as ShelfBook;

      setBook(bookData);

      // Fetch shelf data for context
      const shelfRef = doc(db, 'bookshelves', shelfId as string);
      const shelfDoc = await getDoc(shelfRef);

      if (shelfDoc.exists()) {
        setShelf({
          id: shelfDoc.id,
          ...shelfDoc.data()
        } as Bookshelf);
      }
    } catch (error) {
      console.error('Error loading shared review:', error);
      setError('Failed to load review');
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
        <Text style={styles.ratingText}> {rating.toFixed(1)} / 5.0</Text>
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
    headerTitle: {
      ...typography.h3,
      color: theme.textPrimary,
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
    scrollContent: {
      padding: 20,
    },
    bookHeader: {
      alignItems: 'center',
      marginBottom: 32,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    bookCover: {
      width: 150,
      height: 225,
      borderRadius: 12,
      backgroundColor: theme.neutral200,
      marginBottom: 16,
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    bookTitle: {
      ...typography.h2,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    bookAuthor: {
      ...typography.h4,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    reviewSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.textPrimary,
      marginBottom: 12,
    },
    sectionContent: {
      ...typography.body,
      color: theme.textSecondary,
      lineHeight: 24,
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
    },
    noReviewText: {
      ...typography.body,
      color: theme.textMuted,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    warningSection: {
      backgroundColor: theme.error + '10',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },
    warningTitle: {
      ...typography.h4,
      color: theme.error,
      marginBottom: 8,
    },
    warningContent: {
      ...typography.body,
      color: theme.textSecondary,
      lineHeight: 24,
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
    shelfLink: {
      marginTop: 32,
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    shelfLinkText: {
      ...typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    displayStarWrapper: {
      position: 'relative',
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 2,
    },
    displayStarFilledOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 20,
      overflow: 'hidden',
    },
    starIcon: {
      fontSize: 20,
      lineHeight: 20,
      color: theme.primaryMain,
      position: 'absolute',
    },
    starFilled: {
      color: theme.primaryMain,
    },
    ratingText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginLeft: 8,
      fontWeight: '600',
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
            <Text style={styles.loadingText}>Loading review...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📖</Text>
            <Text style={styles.errorTitle}>Review Not Found</Text>
            <Text style={styles.errorText}>
              This review may have been deleted or the link is invalid.
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
                  {/* rest of header content stays the same */}
                </View>
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedBadgeText}>📖 Shared Review</Text>
                </View>
              </View>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bookHeader}>
            {book.coverUrl && (
              <Image
                source={{ uri: book.coverUrl }}
                style={styles.bookCover}
                resizeMode="cover"
              />
            )}
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>by {book.author}</Text>
            {renderStars(book.rating)}
          </View>

          {book.overallThoughts ? (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Overall Thoughts</Text>
              <Text style={styles.sectionContent}>{book.overallThoughts}</Text>
            </View>
          ) : null}

          {book.feelings ? (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>How It Made Me Feel</Text>
              <Text style={styles.sectionContent}>{book.feelings}</Text>
            </View>
          ) : null}

          {book.recommendedFor ? (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Who Would Like This Book</Text>
              <Text style={styles.sectionContent}>{book.recommendedFor}</Text>
            </View>
          ) : null}

          {book.contentWarnings ? (
            <View style={styles.reviewSection}>
              <View style={styles.warningSection}>
                <Text style={styles.warningTitle}>⚠️ Content Warnings</Text>
                <Text style={styles.warningContent}>{book.contentWarnings}</Text>
              </View>
            </View>
          ) : null}

          {!book.rating && !book.overallThoughts && !book.feelings && !book.recommendedFor && !book.contentWarnings && (
            <View style={styles.reviewSection}>
              <Text style={styles.noReviewText}>
                No review has been added for this book yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}