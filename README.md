BookNook was built to give readers a space to manage their books in a way that feels personal and intuitive — not just a static list, but a curated experience that syncs across devices and adapts to the reader's preferences.

Tech Stack
Frontend

React Native with Expo (cross-platform framework)
TypeScript (primary language)
React Navigation, Safe Area Contexts
Custom UI theme system via React Context API

Backend & Database

Firebase Authentication (email/username and password)
Cloud Firestore (database)
Firebase Security Rules
Vercel (web hosting and serverless functions)

APIs

OpenLibrary API (book search and metadata)
OpenAI API — GPT-4o-mini (AI reading recommendations)


Features

Book Search — Search millions of books via OpenLibrary, returning title, author, publication year, cover images, descriptions, excerpts, and page counts
Bookshelves — Organize books into default shelves (Read, Currently Reading, To Be Read) or create custom shelves with names, descriptions, and color-coded organization
Reviews — Review books on any shelf, including overall thoughts, feelings, and recommendations
Sharing — Share individual reviews or entire shelves via email or SMS
BookWorm AI Assistant — Receive personalized reading recommendations based on mood, favorite authors, genres, or any open-ended prompt
Themes — Choose from 8 literary-inspired UI color schemes (Dark Academia, Fantasy Realm, Sci-Fi Neon, Classics, Romance, and more), applied in real-time via dynamic StyleSheet generation


Database Structure
Three main Firestore collections:

users — user ID, email, username, displayed username, theme preference
bookshelves — user ID, name, description, color, book count
shelf_books — user ID, bookshelf ID, book data, rating, and review fields

Key Database Features

Real-time synchronization across devices
Automatic book count tracking with incrementing functions
Optimized Firestore indexes for simultaneous filtering and sorting queries
Public read access on shelves enables sharing without requiring authentication


Security & Data

Firebase Authentication manages user sessions and access control
Firebase Security Rules restrict read/write permissions by authenticated user
Sensitive credentials are managed via environment variables and excluded from version control
User preferences are stored in Firestore for cross-device persistence
