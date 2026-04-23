import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const secondaryConfig = {
  apiKey: import.meta.env.VITE_SECOND_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_SECOND_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_SECOND_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_SECOND_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_SECOND_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_SECOND_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_SECOND_FIREBASE_MEASUREMENT_ID
};

// Primary App
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Secondary App (for Orders and Admin Analytics)
const secondaryApp = initializeApp(secondaryConfig, "SecondaryApp");

// Modern way to enable offline persistence (removes deprecation warning)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

const adminDb = initializeFirestore(secondaryApp, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { app, analytics, db, adminDb, auth, googleProvider, facebookProvider };
