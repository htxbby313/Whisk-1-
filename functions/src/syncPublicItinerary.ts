import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Admin SDK (once per container)
initializeApp();
const db = getFirestore();

/**
 * Helper to generate a URL-friendly slug from itinerary ID and destination.
 */
function generateSlug(id: string, destination: string): string {
  const clean = destination
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${id}-${clean}`;
}

/**
 * Helper to derive a season string from the start date of the itinerary.
 * Simple mapping: Dec‑Feb => Winter, Mar‑May => Spring, Jun‑Aug => Summer, Sep‑Nov => Autumn.
 */
function getSeason(timestamp: any): string {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const month = date.getMonth(); // 0‑11
  if (month === 11 || month <= 1) return 'Winter';
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  return 'Autumn';
}

export const syncPublicItinerary = onDocumentCreated(
  { document: 'itineraries/{itineraryId}' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    // Only process public itineraries
    if (!data.isPublic) return;

    const itineraryId = event.params.itineraryId;
    const slug = generateSlug(itineraryId, data.destination ?? 'itinerary');
    const startTs = data.dates?.[0];
    const season = startTs ? getSeason(startTs) : '';
    const days = data.dates?.length ?? 0;

    const publicDoc = {
      itineraryId,
      slug,
      destination: data.destination,
      season,
      days,
      clicks: 0,
      createdAt: data.createdAt ?? new Date(),
    };

    // Write to /publicItineraries collection (admin only write rule)
    await db.collection('publicItineraries').doc(slug).set(publicDoc);
  }
);
