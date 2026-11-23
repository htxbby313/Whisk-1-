import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (executed once per container)
initializeApp();
const db = getFirestore();

/**
 * Callable function to create a new itinerary.
 * Expects an object with {userId, destination, dates, isPublic?}.
 * Stores the document under /itineraries/{autoId} and returns the doc ID.
 */
export const createItinerary = onCall(
  { region: 'us-central1' },
  async (request) => {
    const data = request.data as {
      userId: string;
      destination: string;
      dates: number[]; // timestamps in ms
      isPublic?: boolean;
      // optional planning fields
      flights?: string[];
      hotels?: string[];
      businessHours?: Record<string, { open: string; close: string }>;
      anchors?: string[];
    };

    // Basic validation (mirrors Firestore rules)
    if (!data.userId || !data.destination || !Array.isArray(data.dates)) {
      throw new Error('Invalid itinerary payload');
    }

    const docRef = await db.collection('itineraries').add({
      userId: data.userId,
      destination: data.destination,
      dates: data.dates,
      isPublic: data.isPublic ?? false,
      createdAt: new Date(),
      // optional planning fields
      flights: data.flights ?? [],
      hotels: data.hotels ?? [],
      businessHours: data.businessHours ?? {},
      anchors: data.anchors ?? [],
    });

    return { success: true, itineraryId: docRef.id };
  }
);
