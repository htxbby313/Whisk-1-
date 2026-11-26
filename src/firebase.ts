import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  breadcrumbs,
  flush as flushCrashlytics,
  getCrashlytics,
  log as crashlyticsLog,
  recordError as crashlyticsRecordError,
  type Crashlytics,
  type CrashlyticsOptions,
} from 'firebase/crashlytics';
import rawFirebaseConfig from '../firebase-applet-config.json';

const activeApiKey =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
  rawFirebaseConfig.apiKey ||
  '';

const firebaseConfig = {
  ...rawFirebaseConfig,
  apiKey: activeApiKey,
};

// Guarantee singleton initialization across renders or module refreshes
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const crashlyticsOptions: CrashlyticsOptions = {
  appVersion: '1.0.0',
  captureUnhandledErrors: true,
  features: [breadcrumbs()],
  customAttributes: {
    app_name: 'whisk',
    platform: 'web',
  },
};
export const crashlytics: Crashlytics | null =
  typeof window !== 'undefined' ? getCrashlytics(app, crashlyticsOptions) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export function reportCrashlyticsError(
  error: unknown,
  attributes?: Record<string, string | number | boolean>
): void {
  if (!crashlytics) return;
  try {
    crashlyticsRecordError(crashlytics, error, attributes);
  } catch (reportErr) {
    console.warn('Crashlytics recordError skipped:', reportErr);
  }
}

export async function sendCrashlyticsTestError(
  source = 'admin_verification'
): Promise<{ message: string; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const message = `Whisk Crashlytics Web SDK test error (${timestamp})`;
  const testError = new Error(message);
  testError.name = 'CrashlyticsWebTestError';

  if (crashlytics) {
    crashlyticsLog(crashlytics, 'Initiating Crashlytics Web SDK verification test error', {
      source,
      timestamp,
    });
    crashlyticsRecordError(crashlytics, testError, {
      test_error: true,
      source,
      user_id: auth.currentUser?.uid || 'anonymous',
      timestamp,
    });
    await flushCrashlytics(crashlytics);
  }

  return { message, timestamp };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  reportCrashlyticsError(error instanceof Error ? error : new Error(errInfo.error), {
    source: 'firestore',
    operation_type: operationType,
    firestore_path: path || 'unknown',
    user_id: auth.currentUser?.uid || 'anonymous',
  });
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: the client is offline.');
    }
  }
}

testConnection();
