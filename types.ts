export interface Activity {
  time: string;
  description: string;
  location: string;
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
  type: 'hotel' | 'tour' | 'restaurant';
  description: string;
  affiliateUrl: string;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  country: string;
  countryCode?: string;
  region?: string;
  city: string;
  timezone?: string;
}

export interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
  canonicalUrl?: string;
}

export interface TripItinerary {
  id: string;
  title: string;
  destination: string;
  duration: string;
  summary: string;
  days: DayPlan[];
  recommendations: Recommendation[];
  createdAt: string;
  overallRating?: number;
  budget?: string;
  pace?: string;
  accessibility?: string[];
  geo?: GeoData;
  seo?: SeoMetadata;
}

export interface SearchParams {
  destination: string;
  duration: string;
  interests: string[];
  budget: 'Budget' | 'Mid-range' | 'Luxury';
  pace: 'Relaxed' | 'Moderate' | 'Fast-paced';
  accessibility: string[];
}
