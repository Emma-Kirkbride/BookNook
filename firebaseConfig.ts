// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config from the console
const firebaseConfig = {
  apiKey: "AIzaSyBLVR9A8PK43Ap3jQ9zYlFnCdtJbNsehIU",
  authDomain: "booknook-911a0.firebaseapp.com",
  projectId: "booknook-911a0",
  storageBucket: "booknook-911a0.firebasestorage.app",
  messagingSenderId: "349264077870",
  appId: "1:349264077870:web:31226c24a8fc94a9136bbf",
  measurementId: "G-G563MQ86WH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);
