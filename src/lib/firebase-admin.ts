import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(__dirname, '../../firebase-applet-config.json'),
  path.resolve(process.cwd(), 'firebase-applet-config.json'),
];

let projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID;
let firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID;

for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
    if (parsed?.projectId) {
      projectId = parsed.projectId;
    }
    if (parsed?.firestoreDatabaseId) {
      firestoreDatabaseId = parsed.firestoreDatabaseId;
    }
    break;
  }
}

const app = !getApps().length
  ? initializeApp(projectId ? { projectId } : undefined)
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
