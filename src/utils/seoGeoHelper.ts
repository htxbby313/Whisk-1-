// src/utils/seoGeoHelper.ts
// Comprehensive Search Engine Optimization (SEO) and Geographical (Geo) Targeting Engine

import { GeoData, SeoMetadata, TripItinerary } from '../../types';

export const GEO_DATABASE: Record<string, GeoData> = {
  paris: {
    latitude: 48.8566,
    longitude: 2.3522,
    city: 'Paris',
    region: 'Île-de-France',
    country: 'France',
    countryCode: 'FR',
    timezone: 'Europe/Paris',
  },
  tokyo: {
    latitude: 35.6762,
    longitude: 139.6503,
    city: 'Tokyo',
    region: 'Kanto',
    country: 'Japan',
    countryCode: 'JP',
    timezone: 'Asia/Tokyo',
  },
  kyoto: {
    latitude: 35.0116,
    longitude: 135.7681,
    city: 'Kyoto',
    region: 'Kansai',
    country: 'Japan',
    countryCode: 'JP',
    timezone: 'Asia/Tokyo',
  },
  amalfi: {
    latitude: 40.634,
    longitude: 14.6027,
    city: 'Amalfi',
    region: 'Campania',
    country: 'Italy',
    countryCode: 'IT',
    timezone: 'Europe/Rome',
  },
  positano: {
    latitude: 40.6281,
    longitude: 14.485,
    city: 'Positano',
    region: 'Campania',
    country: 'Italy',
    countryCode: 'IT',
    timezone: 'Europe/Rome',
  },
  rome: {
    latitude: 41.9028,
    longitude: 12.4964,
    city: 'Rome',
    region: 'Lazio',
    country: 'Italy',
    countryCode: 'IT',
    timezone: 'Europe/Rome',
  },
  santorini: {
    latitude: 36.3932,
    longitude: 25.4615,
    city: 'Santorini (Thira)',
    region: 'South Aegean',
    country: 'Greece',
    countryCode: 'GR',
    timezone: 'Europe/Athens',
  },
  bali: {
    latitude: -8.3405,
    longitude: 115.092,
    city: 'Bali (Ubud & Seminyak)',
    region: 'Bali Province',
    country: 'Indonesia',
    countryCode: 'ID',
    timezone: 'Asia/Makassar',
  },
  marrakech: {
    latitude: 31.6295,
    longitude: -7.9811,
    city: 'Marrakech',
    region: 'Marrakesh-Safi',
    country: 'Morocco',
    countryCode: 'MA',
    timezone: 'Africa/Casablanca',
  },
  swiss: {
    latitude: 45.9765,
    longitude: 7.7491,
    city: 'Zermatt (Swiss Alps)',
    region: 'Valais',
    country: 'Switzerland',
    countryCode: 'CH',
    timezone: 'Europe/Zurich',
  },
  'new york': {
    latitude: 40.7128,
    longitude: -74.006,
    city: 'New York City',
    region: 'New York',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
  },
  london: {
    latitude: 51.5074,
    longitude: -0.1278,
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    countryCode: 'GB',
    timezone: 'Europe/London',
  },
  barcelona: {
    latitude: 41.3879,
    longitude: 2.1699,
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    countryCode: 'ES',
    timezone: 'Europe/Madrid',
  },
  banff: {
    latitude: 51.1784,
    longitude: -115.5708,
    city: 'Banff National Park',
    region: 'Alberta',
    country: 'Canada',
    countryCode: 'CA',
    timezone: 'America/Edmonton',
  },
  cairo: {
    latitude: 30.0444,
    longitude: 31.2357,
    city: 'Cairo & Giza',
    region: 'Cairo Governorate',
    country: 'Egypt',
    countryCode: 'EG',
    timezone: 'Africa/Cairo',
  },
  sydney: {
    latitude: -33.8688,
    longitude: 151.2093,
    city: 'Sydney',
    region: 'New South Wales',
    country: 'Australia',
    countryCode: 'AU',
    timezone: 'Australia/Sydney',
  },
};

/**
 * Resolves precise geographical metadata for any destination.
 */
export function getDestinationGeo(destination: string): GeoData {
  const clean = (destination || '').toLowerCase().trim();
  for (const [key, geo] of Object.entries(GEO_DATABASE)) {
    if (clean.includes(key)) {
      return geo;
    }
  }

  // Fallback global coordinate (Prime Meridian/Greenwich baseline)
  return {
    latitude: 45.0,
    longitude: 10.0,
    city: destination || 'Global Escapes',
    region: 'International Expedition',
    country: 'Worldwide',
    countryCode: 'WW',
    timezone: 'UTC',
  };
}

/**
 * Creates high-ranking, SEO-optimized metadata and slugs for any itinerary.
 */
export function generateItinerarySeo(
  destination: string,
  duration?: string,
  summary?: string
): SeoMetadata {
  const cleanDest = (destination || 'World').trim();
  const slug = `${cleanDest.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(
    duration || 'travel-guide'
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

  const metaTitle = `${cleanDest} Itinerary: ${duration || 'Curated'} Travel Guide & Hidden Gems | Whisk`;
  const metaDescription = summary
    ? summary.slice(0, 155)
    : `Explore the ultimate ${cleanDest} travel itinerary with day-by-day routes, vetted boutique hotels, local culinary spots, and transit hubs. Curated by Whisk Scouts.`;

  const keywords = [
    `${cleanDest} itinerary`,
    `${cleanDest} travel guide`,
    `${cleanDest} things to do`,
    `best boutique hotels ${cleanDest}`,
    `${cleanDest} hidden gems`,
    `plan a trip to ${cleanDest}`,
    'Whisk travel concierge',
    'bespoke itinerary blog',
  ];

  return {
    metaTitle,
    metaDescription,
    slug,
    keywords,
    canonicalUrl: `https://whisk.travel/expeditions/${slug}`,
  };
}

/**
 * Injects dynamic JSON-LD and updates document meta tags in the browser DOM.
 */
export function applyDynamicSeoAndGeo(itinerary: TripItinerary) {
  if (typeof document === 'undefined') return;

  const geo = itinerary.geo || getDestinationGeo(itinerary.destination);
  const seo =
    itinerary.seo ||
    generateItinerarySeo(
      itinerary.destination,
      itinerary.duration,
      itinerary.summary
    );

  // Update Title
  document.title = seo.metaTitle;

  // Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', seo.metaDescription);

  // Update Meta Keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', seo.keywords.join(', '));

  // Update Geo Tags
  let metaGeoPos = document.querySelector('meta[name="geo.position"]');
  if (!metaGeoPos) {
    metaGeoPos = document.createElement('meta');
    metaGeoPos.setAttribute('name', 'geo.position');
    document.head.appendChild(metaGeoPos);
  }
  metaGeoPos.setAttribute('content', `${geo.latitude};${geo.longitude}`);

  let metaICBM = document.querySelector('meta[name="ICBM"]');
  if (!metaICBM) {
    metaICBM = document.createElement('meta');
    metaICBM.setAttribute('name', 'ICBM');
    document.head.appendChild(metaICBM);
  }
  metaICBM.setAttribute('content', `${geo.latitude}, ${geo.longitude}`);

  let metaGeoRegion = document.querySelector('meta[name="geo.region"]');
  if (!metaGeoRegion) {
    metaGeoRegion = document.createElement('meta');
    metaGeoRegion.setAttribute('name', 'geo.region');
    document.head.appendChild(metaGeoRegion);
  }
  metaGeoRegion.setAttribute('content', geo.countryCode || 'WW');

  // Update Open Graph tags
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', seo.metaTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', seo.metaDescription);

  // Inject or Update Schema.org JSON-LD (TouristTrip & TouristDestination)
  let scriptSchema = document.getElementById('whisk-dynamic-jsonld');
  if (!scriptSchema) {
    scriptSchema = document.createElement('script');
    scriptSchema.id = 'whisk-dynamic-jsonld';
    scriptSchema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptSchema);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: itinerary.title,
    description: itinerary.summary,
    touristType: itinerary.budget || 'Bespoke Traveler',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: itinerary.days.length,
      itemListElement: itinerary.days.map((day, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `Day ${day.dayNumber}: ${day.theme}`,
        description: day.activities
          .map((a) => `${a.time} - ${a.location}: ${a.description}`)
          .join('; '),
      })),
    },
    destination: {
      '@type': 'TouristDestination',
      name: itinerary.destination,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: geo.city,
        addressRegion: geo.region,
        addressCountry: geo.countryCode,
      },
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'Whisk Travel Technologies Inc.',
      url: 'https://whisk.travel',
    },
  };

  scriptSchema.textContent = JSON.stringify(structuredData);
}
