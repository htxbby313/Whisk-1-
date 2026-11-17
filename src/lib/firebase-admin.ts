import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
    if (parsed?.projectId) {
      projectId = parsed.projectId;
      break;
    }
  }
}

if (!getApps().length) {
  initializeApp(projectId ? { projectId } : undefined);
}

export const adminAuth = getAuth();
