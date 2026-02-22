// services/bookshelvesService.ts - Firestore operations for bookshelves

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { generateShareUrl } from '../app/utils/shareURL';
import { auth, db } from '../firebaseConfig';

// TypeScript interfaces
export interface Bookshelf {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  bookCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface ShelfBook {
  id: string;
  userId: string;
  bookshelfId: string;
  bookId?: string;
  title: string;
  author: string;
  coverUrl?: string;
  notes?: string;
  rating?: number;
  overallThoughts?: string;
  feelings?: string;
  recommendedFor?: string;
  contentWarnings?: string;
  addedAt: any;
  updatedAt: any;
}

export interface CreateBookshelfData {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}

export interface CreateBookData {
  bookshelfId: string;
  title: string;
  author: string;
  coverUrl?: string;
  notes?: string;
  rating?: number;
}

// Service result type for error handling
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Default shelf colors
export const DEFAULT_SHELF_COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
  '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
];

// Get random color for new shelves
const getRandomColor = (): string => {
  return DEFAULT_SHELF_COLORS[Math.floor(Math.random() * DEFAULT_SHELF_COLORS.length)];
};

// ============ BOOKSHELF OPERATIONS ============

export const createBookshelf = async (data: CreateBookshelfData, userID: string): Promise<ServiceResult<Bookshelf>> => {
  try {
    const user = auth.currentUser;
    console.log(' Creating bookshelf for user:', userID);
    console.log('Debug - Current user from auth:', user?.uid);
    console.log('Debug - Passed userID:', userID);
    console.log(' Debug - Do they match?', user?.uid === userID);
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use the passed userID instead of auth.currentUser.uid
    if (user.uid !== userID) {
      console.log(' WARNING: User ID mismatch!');
      console.log('- Auth user:', user.uid);
      console.log('- Passed user:', userID);
    }

    console.log('Creating bookshelf:', data.name);

    const bookshelfData = {
      userId: userID, // Use the passed userID consistently
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || getRandomColor(),
      isDefault: data.isDefault || false,
      bookCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Debug - Bookshelf data being saved:', bookshelfData);

    const docRef = await addDoc(collection(db, 'bookshelves'), bookshelfData);
    
    const newBookshelf: Bookshelf = {
      id: docRef.id,
      ...bookshelfData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Bookshelf created:', newBookshelf.name);
    return { success: true, data: newBookshelf };

  } catch (error) {
    console.error('Error creating bookshelf:', error);
    return { success: false, error: 'Failed to create bookshelf. Please try again.' };
  }
};

export const getUserBookshelves = async (): Promise<ServiceResult<Bookshelf[]>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Fetching user bookshelves...');

    const q = query(
      collection(db, 'bookshelves'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const bookshelves: Bookshelf[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Bookshelf));

    console.log(` Found ${bookshelves.length} bookshelves`);
    return { success: true, data: bookshelves };

  } catch (error) {
    console.error('Error fetching bookshelves:', error);
    return { success: false, error: 'Failed to load bookshelves. Please try again.' };
  }
};

export const updateBookshelf = async (bookshelfId: string, updates: Partial<CreateBookshelfData>): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log(' Updating bookshelf:', bookshelfId);

    const bookshelfRef = doc(db, 'bookshelves', bookshelfId);
    
    // Verify ownership
    const bookshelfDoc = await getDoc(bookshelfRef);
    if (!bookshelfDoc.exists() || bookshelfDoc.data().userId !== user.uid) {
      return { success: false, error: 'Bookshelf not found or access denied' };
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(bookshelfRef, updateData);

    console.log('Bookshelf updated');
    return { success: true };

  } catch (error) {
    console.error(' Error updating bookshelf:', error);
    return { success: false, error: 'Failed to update bookshelf. Please try again.' };
  }
};

export const deleteBookshelf = async (bookshelfId: string): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Deleting bookshelf:', bookshelfId);

    const bookshelfRef = doc(db, 'bookshelves', bookshelfId);
    
    // Verify ownership
    const bookshelfDoc = await getDoc(bookshelfRef);
    if (!bookshelfDoc.exists() || bookshelfDoc.data().userId !== user.uid) {
      return { success: false, error: 'Bookshelf not found or access denied' };
    }

    // Check if it's a default shelf
    if (bookshelfDoc.data().isDefault) {
      return { success: false, error: 'Cannot delete default bookshelves' };
    }

    // Delete all books in this shelf first
    const booksQuery = query(
      collection(db, 'shelf_books'),
      where('bookshelfId', '==', bookshelfId)
    );
    const booksSnapshot = await getDocs(booksQuery);

    const batch = writeBatch(db);
    
    // Delete all books in the shelf
    booksSnapshot.docs.forEach(bookDoc => {
      batch.delete(bookDoc.ref);
    });
    
    // Delete the shelf
    batch.delete(bookshelfRef);
    
    await batch.commit();

    console.log('Bookshelf and all books deleted');
    return { success: true };

  } catch (error) {
    console.error(' Error deleting bookshelf:', error);
    return { success: false, error: 'Failed to delete bookshelf. Please try again.' };
  }
};

// ============ BOOK OPERATIONS ============

export const addBookToShelf = async (data: CreateBookData): Promise<ServiceResult<ShelfBook>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Adding book to shelf:', data.title, 'shelfId:', data.bookshelfId);

    // Verify bookshelf ownership
    const bookshelfRef = doc(db, 'bookshelves', data.bookshelfId);
    const bookshelfDoc = await getDoc(bookshelfRef);
    
    if (!bookshelfDoc.exists() || bookshelfDoc.data().userId !== user.uid) {
      return { success: false, error: 'Bookshelf not found or access denied' };
    }

    const currentBookCount = bookshelfDoc.data().bookCount;
    console.log('Current book count before adding:', currentBookCount);

    const bookData = {
      userId: user.uid,
      bookshelfId: data.bookshelfId,
      title: data.title.trim(),
      author: data.author.trim(),
      ...(data.coverUrl && { coverUrl: data.coverUrl }),
      ...(data.notes?.trim() && { notes: data.notes.trim() }),
      ...(data.rating && { rating: data.rating }),
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'shelf_books'), bookData);
    console.log('Book document created with ID:', docRef.id);

    // Update bookshelf book count
    console.log('Updating bookshelf book count...');
    await updateDoc(bookshelfRef, {
      bookCount: increment(1),
      updatedAt: serverTimestamp()
    });

    console.log('Bookshelf book count updated (increment(1))');

    const updatedBookshelfDoc = await getDoc(bookshelfRef);
    const updatedBookCount = updatedBookshelfDoc.data()?.bookCount;
    console.log('📊 Book count after update:', updatedBookCount);

    const newBook: ShelfBook = {
      id: docRef.id,
      userId: user.uid,
      bookshelfId: data.bookshelfId,
      title: data.title.trim(),
      author: data.author.trim(),
      coverUrl: data.coverUrl || undefined,
      notes: data.notes?.trim() || undefined,
      rating: data.rating || undefined,
      addedAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Book added to shelf');

    // FIXED: Call the callback if it exists
    if (onBookshelfUpdate) {
      console.log('Callback exists, calling it...');
      onBookshelfUpdate();
    } else {
      console.log('⚠️ No callback registered');
    }

    return { success: true, data: newBook };

  } catch (error) {
    console.error('Error adding book to shelf:', error);
    return { success: false, error: 'Failed to add book. Please try again.' };
  }
};

export const getShelfBooks = async (bookshelfId: string): Promise<ServiceResult<ShelfBook[]>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Fetching books for shelf:', bookshelfId);

    const q = query(
      collection(db, 'shelf_books'),
      where('userId', '==', user.uid),
      where('bookshelfId', '==', bookshelfId),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const books: ShelfBook[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShelfBook));

    console.log(` Found ${books.length} books in shelf`);
    return { success: true, data: books };

  } catch (error) {
    console.error(' Error fetching shelf books:', error);
    return { success: false, error: 'Failed to load books. Please try again.' };
  }
};

export const removeBookFromShelf = async (bookId: string): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log(' Removing book from shelf:', bookId);

    const bookRef = doc(db, 'shelf_books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists() || bookDoc.data().userId !== user.uid) {
      return { success: false, error: 'Book not found or access denied' };
    }

    const bookData = bookDoc.data();
    const bookshelfRef = doc(db, 'bookshelves', bookData.bookshelfId);

    // Remove book
    await deleteDoc(bookRef);

    // Update bookshelf book count
    await updateDoc(bookshelfRef, {
      bookCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    console.log(' Book removed from shelf');
    return { success: true };

  } catch (error) {
    console.error('Error removing book from shelf:', error);
    return { success: false, error: 'Failed to remove book. Please try again.' };
  }
};

// Update book review information
export const updateShelfBook = async (
  bookId: string, 
  updates: {
    notes?: string;
    rating?: number;
    overallThoughts?: string;
    feelings?: string;
    recommendedFor?: string;
    contentWarnings?: string;
  }
): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Updating shelf book:', bookId);

    const bookRef = doc(db, 'shelf_books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists() || bookDoc.data().userId !== user.uid) {
      return { success: false, error: 'Book not found or access denied' };
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(bookRef, updateData);

    console.log('Book updated successfully');
    return { success: true };

  } catch (error) {
    console.error('Error updating book:', error);
    return { success: false, error: 'Failed to update book. Please try again.' };
  }
};

// ============ UTILITY FUNCTIONS ============

export const createDefaultShelves = async (): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('createDefaultShelves called for user:', user.uid);
    console.log('About to create 3 default shelves...');

    const defaultShelves = [
      { name: 'Want to Read', color: '#3498db', isDefault: true },
      { name: 'Currently Reading', color: '#e74c3c', isDefault: true },
      { name: 'Read', color: '#2ecc71', isDefault: true }
    ];

    const batch = writeBatch(db);

    defaultShelves.forEach((shelf, index) => {
      console.log(`📖 Adding shelf ${index + 1}: ${shelf.name}`);
      const shelfRef = doc(collection(db, 'bookshelves'));
      batch.set(shelfRef, {
        userId: user.uid,
        name: shelf.name,
        description: '',
        color: shelf.color,
        isDefault: shelf.isDefault,
        bookCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    console.log('Batch commit completed - 3 shelves should be created');
    return { success: true };

  } catch (error) {
    console.error('Error creating default shelves:', error);
    return { success: false, error: 'Failed to create default shelves. Please try again.' };
  }
};

// Generate a shareable link for a bookshelf
export const generateShelfShareLink = (shelf: Bookshelf): string => {
  return generateShareUrl(`/shared-shelf/${shelf.id}`);
};

// Generate a shareable link for a book review
export const generateReviewShareLink = (bookId: string, shelfId: string): string => {
  return generateShareUrl(`/shared-review/${shelfId}/${bookId}`);
};

// Authentication state helpers
export const getCurrentUser = () => auth.currentUser;
export const isAuthenticated = (): boolean => auth.currentUser !== null;
export const getUserEmail = (): string | null => auth.currentUser?.email || null;

// Debug function to check Firebase connection
export const debugFirebaseConnection = () => {
  console.log('🔍 Firebase Debug Info:');
  console.log('- Auth instance:', !!auth);
  console.log('- Current user:', auth.currentUser?.email || 'None');
  console.log('- App name:', auth.app.name);
  console.log('- App options:', auth.app.options);
};

// Add this function to your bookshelvesService.ts file

// Move a book from one shelf to another
export const moveBookToShelf = async (
  bookId: string, 
  fromShelfId: string, 
  toShelfId: string
): Promise<ServiceResult<void>> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log(`Moving book ${bookId} from ${fromShelfId} to ${toShelfId}`);

    const bookRef = doc(db, 'shelf_books', bookId);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists() || bookDoc.data().userId !== user.uid) {
      return { success: false, error: 'Book not found or access denied' };
    }

    // Verify target bookshelf ownership
    const toShelfRef = doc(db, 'bookshelves', toShelfId);
    const toShelfDoc = await getDoc(toShelfRef);
    
    if (!toShelfDoc.exists() || toShelfDoc.data().userId !== user.uid) {
      return { success: false, error: 'Target bookshelf not found or access denied' };
    }

    const batch = writeBatch(db);

    // Update the book's bookshelfId
    batch.update(bookRef, {
      bookshelfId: toShelfId,
      updatedAt: serverTimestamp()
    });

    // Decrement the old shelf's book count
    const fromShelfRef = doc(db, 'bookshelves', fromShelfId);
    batch.update(fromShelfRef, {
      bookCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    // Increment the new shelf's book count
    batch.update(toShelfRef, {
      bookCount: increment(1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    console.log('Book moved successfully');
    return { success: true };

  } catch (error) {
    console.error('Error moving book:', error);
    return { success: false, error: 'Failed to move book. Please try again.' };
  }

};

let onBookshelfUpdate: (() => void) | null = null;

export const setOnBookshelfUpdate = (callback: (() => void) | null) => {
  onBookshelfUpdate = callback;
};