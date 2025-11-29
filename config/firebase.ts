import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we should use mock data
let USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Initialize Firebase only if not using mock data
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (!USE_MOCK_DATA) {
  // Validate Firebase configuration
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing Firebase environment variables: ${missingVars.join(', ')}. Falling back to mock data.`
    );
    // Force mock data mode if config is incomplete
    USE_MOCK_DATA = true;
  } else {
    try {
      app = initializeApp(firebaseConfig);
      
      // Support for named databases (e.g. nxthub-app-db-dev)
      const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
      if (databaseId) {
        db = getFirestore(app, databaseId);
        console.log(`📊 Firestore Database: Connected to '${databaseId}'`);
      } else {
        db = getFirestore(app);
        console.log('📊 Firestore Database: Connected to (default)');
      }
      
      auth = getAuth(app);
      console.log('🔥 Firebase Connected Successfully!');
      console.log('🔐 Authentication: Ready');
      console.log('✅ All Firebase services initialized');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      console.warn('⚠️ Falling back to mock data mode');
      USE_MOCK_DATA = true;
    }
  }
} else {
  console.log('📦 Using mock data (localStorage)');
}

export { USE_MOCK_DATA };

export { app, db, auth };
export default app;


