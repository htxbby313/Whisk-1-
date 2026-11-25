// Re-export the shared singleton Firebase app and services from src/firebase.ts
export {
  app,
  db,
  auth,
  googleProvider,
  appleProvider,
  OperationType,
  handleFirestoreError,
} from '../firebase';
export type { FirestoreErrorInfo } from '../firebase';
