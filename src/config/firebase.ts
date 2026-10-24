import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with auto-detect long polling to prevent 10s connection timeout & offline errors
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfigJson.firestoreDatabaseId || undefined
  );
} catch {
  firestoreInstance = firebaseConfigJson.firestoreDatabaseId
    ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Designated Super Admin Email (normalized lowercase)
export const DESIGNATED_SUPER_ADMIN_EMAIL = 'bcgmoc@gmail.com';

/**
 * Normalizes email strings for comparison
 */
export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Checks whether an authenticated Firebase User matches the designated Super Admin
 * and possesses a cryptographically verified email status from Google.
 */
export function isDesignatedSuperAdminUser(user?: { email?: string | null; emailVerified?: boolean } | null): boolean {
  if (!user || !user.email) return false;
  return normalizeEmail(user.email) === DESIGNATED_SUPER_ADMIN_EMAIL && user.emailVerified === true;
}

/**
 * Validates connection to Cloud Firestore on boot
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection probe timeout')), 4000)
    );
    await Promise.race([testPromise, timeoutPromise]);
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('timeout'))) {
      console.warn('Firestore initial probe notice: client is connecting or initializing long polling.');
      return false;
    }
    // Any permission-denied or not-found still confirms client is connected to server
    return true;
  }
}
