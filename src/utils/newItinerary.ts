export interface Itinerary {
  userId: string;
  destination: string;
  dates: number[]; // timestamps (ms)
  isPublic: boolean;
  createdAt: number; // timestamp of creation
  publicSlug?: string; // slug for public blog page
  // Optional detailed planning fields
  flights?: string[]; // e.g., flight numbers or IDs
  hotels?: string[]; // hotel names or IDs
  businessHours?: Record<string, {open: string; close: string}>; // e.g., "2024-05-01": {open: "09:00", close: "17:00"}
  anchors?: string[]; // must-see anchor spots (e.g., favorite spots, non-negotiables)
}

/**
 * Generate a simple demo itinerary for a given user.
 * Returns an Itinerary object that can be stored in Firestore.
 */
export function generateDemoItinerary(
  userId: string,
  destination: string,
  startDate: Date,
  days: number,
  isPublic: boolean = false,
  flights?: string[],
  hotels?: string[],
  businessHours?: Record<string, {open: string; close: string}>,
  anchors?: string[]
): Itinerary {
  const dates: number[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    dates.push(day.getTime());
  }
  return {
    userId,
    destination,
    dates,
    isPublic,
    createdAt: Date.now(),
    flights,
    hotels,
    businessHours,
    anchors,
  };
}
