import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırması - tüm değerler environment variable olarak tanımlanmalıdır.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase environment variables eksik: VITE_FIREBASE_API_KEY ve VITE_FIREBASE_PROJECT_ID tanımlanmalı.'
  );
}

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Authentication ve Firestore servislerini al
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

