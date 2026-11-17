export interface Activity {
  time: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  link?: string;
  userRating?: number;
}

export interface DayPlan {
  dayNumber: number;
  theme: string;
  activities: Activity[];
}

export interface Recommendation {
  name: string;
  type: 'hotel' | 'tour' | 'restaurant' | 'flight';
  description: string;
  affiliateUrl: string;
  price?: string;
  availability?: string;
  latitude?: number;
  longitude?: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
  sourceType: 'search' | 'maps';
  snippet?: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface BlogPost {
  id: string;
  slug?: string;
  title: string;
  seoTitle?: string;
  metaDescription: string;
  geoSummary?: string;
  content: string; // Markdown content
  keywords: string[];
  neighborhoods?: string[];
  faqs?: BlogFaq[];
  geoCoordinates?: GeoCoordinates;
  itineraryId?: string;
  imageUrl: string;
  createdAt: string;
  destination: string;
  isPublished?: boolean;
}

export interface TripItinerary {
  id: string;
  ownerId?: string;
  title: string;
  destination: string;
  duration: string;
  summary: string;
  days: DayPlan[];
  recommendations: Recommendation[];
  groundingSources?: GroundingSource[];
  mapsOverview?: string;
  createdAt: string;
  updatedAt?: string;
  overallRating?: number;
  budget?: string;
  pace?: string;
  accessibility?: string[];
  interests?: string[];
  blogPost?: BlogPost;
  unlocked?: boolean;
}

export type MembershipTier = 'Wanderer' | 'Explorer' | 'Cartographer';

export interface SearchParams {
  destination: string;
  duration: string;
  interests: string[];
  budget: 'Budget' | 'Mid-range' | 'Luxury';
  pace: 'Relaxed' | 'Moderate' | 'Fast-paced';
  accessibility: string[];
  latitude?: number;
  longitude?: number;
}

export interface SavedPlace {
  id: string;
  ownerId: string;
  name: string;
  type: 'hotel' | 'tour' | 'restaurant' | 'flight' | 'place';
  destination: string;
  description: string;
  price?: string;
  availability?: string;
  affiliateUrl?: string;
  mapsUri?: string;
  createdAt: string;
}

export type ChatMode = 'standard' | 'maps' | 'fast' | 'thinking' | 'complex';

export interface PackingItem {
  id: number;
  itineraryId: string;
  destination: string;
  item: string;
  category: string;
  isPacked: boolean;
  createdAt?: string;
}

export interface TripNote {
  id: number;
  itineraryId: string;
  destination: string;
  title: string;
  content: string;
  rating: number;
  createdAt?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  mode?: ChatMode;
  model?: string;
  groundingSources?: GroundingSource[];
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  membershipTier: MembershipTier;
}
