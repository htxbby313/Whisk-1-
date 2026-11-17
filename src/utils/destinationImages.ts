// src/utils/destinationImages.ts
// Verified, curated high-resolution landmark photography

export interface PolaroidItem {
  id: string;
  destination: string;
  country: string;
  tag: string;
  image: string;
  rotation: string; // Tailwind rotation class
  pinColor: string;
  rating: number;
}

export const POLAROID_HERO_COLLECTION: PolaroidItem[] = [
  {
    id: 'p1',
    destination: 'Santorini',
    country: 'Greece',
    tag: 'Cyclades Islands',
    image:
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-6 hover:-rotate-1',
    pinColor: '#0284C7',
    rating: 4.9,
  },
  {
    id: 'p2',
    destination: 'Tokyo',
    country: 'Japan',
    tag: 'Shinjuku Neon & Fuji',
    image:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-3 hover:rotate-0',
    pinColor: '#EC4899',
    rating: 5.0,
  },
  {
    id: 'p3',
    destination: 'Positano',
    country: 'Amalfi Coast, Italy',
    tag: 'Pastel Cliffside Haven',
    image:
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-6 hover:rotate-1',
    pinColor: '#F59E0B',
    rating: 4.9,
  },
  {
    id: 'p4',
    destination: 'Kyoto',
    country: 'Japan',
    tag: 'Torii Gates & Bamboo',
    image:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-4 hover:rotate-0',
    pinColor: '#EF4444',
    rating: 4.8,
  },
  {
    id: 'p5',
    destination: 'Marrakech',
    country: 'Morocco',
    tag: 'Spices & Medina Courtyards',
    image:
      'https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-4 hover:rotate-2',
    pinColor: '#EA580C',
    rating: 4.9,
  },
  {
    id: 'p6',
    destination: 'Swiss Alps',
    country: 'Zermatt, Switzerland',
    tag: 'Matterhorn Alpine Ridge',
    image:
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-3 hover:rotate-0',
    pinColor: '#10B981',
    rating: 5.0,
  },
  {
    id: 'p7',
    destination: 'Bali',
    country: 'Ubud, Indonesia',
    tag: 'Emerald Tegalalang Terraces',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-5 hover:rotate-1',
    pinColor: '#059669',
    rating: 4.9,
  },
  {
    id: 'p8',
    destination: 'Paris',
    country: 'France',
    tag: 'Eiffel & Haussmann Cafés',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-6 hover:-rotate-1',
    pinColor: '#8B5CF6',
    rating: 4.9,
  },
  {
    id: 'p9',
    destination: 'Machu Picchu',
    country: 'Cusco, Peru',
    tag: 'Inca Sanctuary Clouds',
    image:
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-3 hover:rotate-0',
    pinColor: '#D97706',
    rating: 5.0,
  },
  {
    id: 'p10',
    destination: 'Rio de Janeiro',
    country: 'Brazil',
    tag: 'Sugarloaf & Ipanema Waves',
    image:
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-5 hover:rotate-0',
    pinColor: '#10B981',
    rating: 4.8,
  },
  {
    id: 'p11',
    destination: 'Cairo & Giza',
    country: 'Egypt',
    tag: 'Great Pyramids Sunset',
    image:
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=800&auto=format&fit=crop',
    rotation: 'rotate-6 hover:rotate-2',
    pinColor: '#F59E0B',
    rating: 4.9,
  },
  {
    id: 'p12',
    destination: 'Banff National Park',
    country: 'Alberta, Canada',
    tag: 'Glacial Turquoise Waters',
    image:
      'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=800&auto=format&fit=crop',
    rotation: '-rotate-4 hover:rotate-0',
    pinColor: '#0284C7',
    rating: 5.0,
  },
];

// Verified city mapping
const CITY_IMAGE_MAP: Record<string, string> = {
  paris:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
  france:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
  tokyo:
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
  japan:
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
  kyoto:
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
  amalfi:
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
  positano:
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
  italy:
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop',
  santorini:
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop',
  greece:
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
  indonesia:
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
  marrakech:
    'https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=1200&auto=format&fit=crop',
  morocco:
    'https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=1200&auto=format&fit=crop',
  swiss:
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
  alps: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
  switzerland:
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
  zermatt:
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
  'new york':
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop',
  nyc: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop',
  london:
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop',
  peru: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1200&auto=format&fit=crop',
  'machu picchu':
    'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1200&auto=format&fit=crop',
  rio: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1200&auto=format&fit=crop',
  brazil:
    'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1200&auto=format&fit=crop',
  cairo:
    'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=1200&auto=format&fit=crop',
  egypt:
    'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=1200&auto=format&fit=crop',
  banff:
    'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
  canada:
    'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
  barcelona:
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1200&auto=format&fit=crop',
  spain:
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1200&auto=format&fit=crop',
  hawaii:
    'https://images.unsplash.com/photo-1542259009477-d625272157b7?q=80&w=1200&auto=format&fit=crop',
  sydney:
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop',
  australia:
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop',
  iceland:
    'https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=1200&auto=format&fit=crop',
  dubai:
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
};

export function getDestinationImage(destination: string): string {
  if (!destination) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop';
  }
  const clean = destination.toLowerCase().trim();
  for (const [key, url] of Object.entries(CITY_IMAGE_MAP)) {
    if (clean.includes(key)) {
      return url;
    }
  }
  // If no direct key match, return a breathtaking adventure landscape
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';
}
