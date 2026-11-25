export interface Activity {
  time: string;
  description: string;
  location: string;
  insiderTip?: string;
  mapsUri?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  link?: string;
  userRating?: number;
  energyLevel?: 'morning_spark' | 'recharge' | 'golden_hour' | 'evening_unwind';
  walkTime?: string;
  neighborhood?: string;
  isAnchor?: boolean;
  branchingReason?: string;
  ticketSlots?: string[];
  ticketPrice?: string;
  ticketStatus?: 'available' | 'likely_to_sell_out' | 'instant_confirmation';
  rainyDayFallback?: {
    location: string;
    description: string;
    insiderTip?: string;
    walkTime?: string;
    neighborhood?: string;
  };
}

export interface DayPlan {
  dayNumber: number;
  date?: string;
  theme: string;
  activities: Activity[];
}

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode?: string;
  airlineLogo?: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  cabinClass: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  price: string;
  currency?: string;
  seatsRemaining?: number;
  bookingUrl: string;
  baggageIncluded?: boolean;
  aircraft?: string;
}

export interface Recommendation {
  name: string;
  type: 'hotel' | 'tour' | 'restaurant' | 'flight';
  description: string;
  affiliateUrl: string;
  price?: string;
  availability?: string;
  dayNumbers?: number[];
  departureAirport?: string;
  latitude?: number;
  longitude?: number;
  ticketSlots?: string[];
  flightOffers?: FlightOffer[];
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
  ownerId?: string;
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
  updatedAt?: string;
  destination: string;
  isPublished?: boolean;
}

export interface TripItinerary {
  id: string;
  ownerId?: string;
  title: string;
  destination: string;
  departureAirport?: string;
  startDate?: string;
  endDate?: string;
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
  nicheFocus?: string;
  antiTouristTraps?: boolean;
}

export type MembershipTier = 'Wanderer' | 'Explorer' | 'Cartographer';

export interface DiscoveredSpot {
  name: string;
  destination: string;
  description: string;
  mapsUri?: string;
}

export interface SearchParams {
  destination: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  interests: string[];
  budget: 'Budget' | 'Mid-range' | 'Luxury';
  pace: 'Relaxed' | 'Moderate' | 'Fast-paced';
  accessibility: string[];
  departureLocation?: string;
  departureAirport?: string;
  publishPublicGuide?: boolean;
  preferredSpots?: DiscoveredSpot[];
  latitude?: number;
  longitude?: number;
  nicheFocus?: string;
  antiTouristTraps?: boolean;
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

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  membershipTier: MembershipTier;
  role?: UserRole;
}

export interface AdminUserRecord {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  membershipTier: MembershipTier;
  role: UserRole;
  legalConsentVersion?: string;
  legalConsentAcceptedAt?: string;
  marketingOptIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

