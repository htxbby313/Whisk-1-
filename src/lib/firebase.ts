// Re-export the shared singleton Firebase app and services from src/firebase.ts
export {
  app,
  db,
  auth,
  crashlytics,
  googleProvider,
  appleProvider,
  OperationType,
  handleFirestoreError,
  reportCrashlyticsError,
  sendCrashlyticsTestError,
} from '../firebase';
export type { FirestoreErrorInfo } from '../firebase';
