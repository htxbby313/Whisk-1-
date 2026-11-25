import parisImg from '../assets/images/paris_landmark_eiffel_1794881785157.jpg';
import tokyoImg from '../assets/images/tokyo_landmark_shibuya_1794881785563.jpg';
import amalfiImg from '../assets/images/amalfi_coast_positano_1794881785045.jpg';
import santoriniImg from '../assets/images/santorini_oia_blue_domes_1794881788416.jpg';
import marrakechImg from '../assets/images/marrakech_medina_courtyard_1794881788065.jpg';
import swissAlpsImg from '../assets/images/swiss_alps_zermatt_1794881791167.jpg';
import romeImg from '../assets/images/rome_colosseum_sunset_1794882517197.jpg';
import machuPicchuImg from '../assets/images/machu_picchu_peru_1794882518980.jpg';
import tajMahalImg from '../assets/images/taj_mahal_india_1794882518945.jpg';
import petraImg from '../assets/images/petra_jordan_treasury_1794882518528.jpg';
import rioImg from '../assets/images/rio_sugarloaf_brazil_1794882519663.jpg';
import gizaImg from '../assets/images/giza_pyramids_egypt_1794882520367.jpg';
import fujiImg from '../assets/images/kyoto_arashiyama_pagoda_1794882876062.jpg';
import barcelonaImg from '../assets/images/barcelona_park_guell_1794882877425.jpg';
import baliImg from '../assets/images/bali_ulun_danu_temple_1794882878164.jpg';
import icelandImg from '../assets/images/iceland_kirkjufell_waterfall_1794882877511.jpg';
import veniceImg from '../assets/images/venice_grand_canal_1794882877992.jpg';
import nycImg from '../assets/images/new_york_brooklyn_bridge_1794882879436.jpg';
import capeTownImg from '../assets/images/cape_town_bo_kaap_1794882879751.jpg';
import sydneyImg from '../assets/images/sydney_harbour_opera_1794882880146.jpg';
import cappadociaImg from '../assets/images/cappadocia_turkey_balloons_1795582004308.jpg';
import banffImg from '../assets/images/banff_moraine_lake_1795582005514.jpg';
import boraBoraImg from '../assets/images/bora_bora_lagoon_1795582006617.jpg';
import havanaImg from '../assets/images/havana_classic_street_1795582007582.jpg';
import serengetiImg from '../assets/images/serengeti_safari_sunset_1795582008492.jpg';
import lofotenImg from '../assets/images/lofoten_norway_cabins_1795582008972.jpg';

export interface PolaroidLandmark {
  name: string;
  region: string;
  url: string;
  accentColor: string;
  fallbackGradient: string;
  visualTags: string[];
  similarTo: string[];
}

export const LANDMARK_POLAROIDS: PolaroidLandmark[] = [
  {
    name: 'Paris, France',
    region: 'Eiffel Tower · Cafés',
    url: parisImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#FFCC00]',
    visualTags: ['street-corridor', 'tall-spire', 'golden-sunset', 'europe-city'],
    similarTo: ['Tokyo, Japan', 'New York, USA', 'Venice, Italy', 'Rome, Italy'],
  },
  {
    name: 'Tokyo, Japan',
    region: 'Asakusa · Skytree',
    url: tokyoImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#00B4FF]',
    visualTags: ['street-corridor', 'tall-spire', 'night-dusk', 'japan'],
    similarTo: ['Paris, France', 'Mount Fuji, Japan', 'New York, USA', 'Sydney, Australia'],
  },
  {
    name: 'Amalfi Coast, Italy',
    region: 'Positano Cliffs',
    url: amalfiImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF3B30]',
    visualTags: ['mediterranean-coast', 'blue-water-day', 'pink-bougainvillea', 'italy', 'coastal-bay'],
    similarTo: ['Santorini, Greece', 'Rio de Janeiro, Brazil', 'Venice, Italy', 'Barcelona, Spain'],
  },
  {
    name: 'Santorini, Greece',
    region: 'Oia Blue Domes',
    url: santoriniImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FF1CF7]',
    visualTags: ['mediterranean-coast', 'blue-water-day', 'pink-bougainvillea', 'bright-blue-sky'],
    similarTo: ['Amalfi Coast, Italy', 'Rio de Janeiro, Brazil', 'Barcelona, Spain', 'Cape Town, South Africa'],
  },
  {
    name: 'Marrakech, Morocco',
    region: 'Medina · Riad',
    url: marrakechImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#00E676]',
    visualTags: ['terracotta-warm', 'desert-ochre', 'archways-market'],
    similarTo: ['Petra, Jordan', 'Rome, Italy', 'Giza, Egypt'],
  },
  {
    name: 'Swiss Alps, Zermatt',
    region: 'Matterhorn Peaks',
    url: swissAlpsImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#00B4FF]',
    visualTags: ['green-mountains', 'snow-peak', 'bright-blue-sky'],
    similarTo: ['Machu Picchu, Peru', 'Mount Fuji, Japan', 'Kirkjufell, Iceland', 'Rio de Janeiro, Brazil'],
  },
  {
    name: 'Rome, Italy',
    region: 'Colosseum',
    url: romeImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF3B30]',
    visualTags: ['ancient-stone', 'golden-sunset', 'italy', 'terracotta-warm'],
    similarTo: ['Giza, Egypt', 'Petra, Jordan', 'Marrakech, Morocco', 'Venice, Italy', 'Paris, France'],
  },
  {
    name: 'Machu Picchu, Peru',
    region: 'Inca Citadel',
    url: machuPicchuImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#FFCC00]',
    visualTags: ['green-mountains', 'ancient-stone', 'bright-blue-sky'],
    similarTo: ['Swiss Alps, Zermatt', 'Rio de Janeiro, Brazil', 'Bali, Indonesia'],
  },
  {
    name: 'Agra, India',
    region: 'Taj Mahal',
    url: tajMahalImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#FFCC00]',
    visualTags: ['water-reflection', 'pastel-sunset-sky', 'iconic-domes'],
    similarTo: ['Bali, Indonesia', 'Venice, Italy', 'Sydney, Australia'],
  },
  {
    name: 'Petra, Jordan',
    region: 'The Treasury',
    url: petraImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#FF1CF7]',
    visualTags: ['desert-ochre', 'terracotta-warm', 'ancient-stone'],
    similarTo: ['Giza, Egypt', 'Marrakech, Morocco', 'Rome, Italy'],
  },
  {
    name: 'Rio de Janeiro, Brazil',
    region: 'Sugarloaf Bay',
    url: rioImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#00E676]',
    visualTags: ['coastal-bay', 'blue-water-day', 'green-mountains'],
    similarTo: ['Amalfi Coast, Italy', 'Santorini, Greece', 'Machu Picchu, Peru', 'Swiss Alps, Zermatt'],
  },
  {
    name: 'Giza, Egypt',
    region: 'Great Pyramids',
    url: gizaImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#00B4FF]',
    visualTags: ['desert-ochre', 'ancient-stone', 'golden-sunset'],
    similarTo: ['Petra, Jordan', 'Rome, Italy', 'Marrakech, Morocco'],
  },
  {
    name: 'Mount Fuji, Japan',
    region: 'Chureito Pagoda',
    url: fujiImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#FFCC00]',
    visualTags: ['asian-pagoda', 'snow-peak', 'bright-blue-sky', 'japan'],
    similarTo: ['Bali, Indonesia', 'Swiss Alps, Zermatt', 'Tokyo, Japan', 'Kirkjufell, Iceland'],
  },
  {
    name: 'Barcelona, Spain',
    region: 'Park Güell',
    url: barcelonaImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FF3B30]',
    visualTags: ['vibrant-colorful', 'bright-blue-sky', 'mediterranean-coast', 'europe-city'],
    similarTo: ['Cape Town, South Africa', 'Santorini, Greece', 'Amalfi Coast, Italy'],
  },
  {
    name: 'Bali, Indonesia',
    region: 'Ulun Danu Temple',
    url: baliImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#FF1CF7]',
    visualTags: ['asian-pagoda', 'water-reflection', 'pastel-sunset-sky', 'green-mountains'],
    similarTo: ['Agra, India', 'Mount Fuji, Japan', 'Machu Picchu, Peru'],
  },
  {
    name: 'Kirkjufell, Iceland',
    region: 'Northern Lights',
    url: icelandImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#00B4FF]',
    visualTags: ['night-dusk', 'snow-peak', 'water-reflection'],
    similarTo: ['Swiss Alps, Zermatt', 'Mount Fuji, Japan', 'Tokyo, Japan', 'Sydney, Australia'],
  },
  {
    name: 'Venice, Italy',
    region: 'Grand Canal',
    url: veniceImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#00B4FF]',
    visualTags: ['golden-sunset', 'iconic-domes', 'italy', 'waterfront-boats', 'europe-city'],
    similarTo: ['Amalfi Coast, Italy', 'Rome, Italy', 'Agra, India', 'Sydney, Australia', 'Paris, France'],
  },
  {
    name: 'New York, USA',
    region: 'Brooklyn Bridge',
    url: nycImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF1CF7]',
    visualTags: ['golden-sunset', 'bridge-skyline', 'night-dusk', 'street-corridor'],
    similarTo: ['Sydney, Australia', 'Paris, France', 'Tokyo, Japan'],
  },
  {
    name: 'Cape Town, South Africa',
    region: 'Bo-Kaap · Table Mountain',
    url: capeTownImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#00E676]',
    visualTags: ['vibrant-colorful', 'bright-blue-sky', 'street-corridor'],
    similarTo: ['Barcelona, Spain', 'Santorini, Greece', 'Paris, France'],
  },
  {
    name: 'Sydney, Australia',
    region: 'Opera House',
    url: sydneyImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FFCC00]',
    visualTags: ['bridge-skyline', 'waterfront-boats', 'pastel-sunset-sky', 'night-dusk'],
    similarTo: ['New York, USA', 'Venice, Italy', 'Agra, India', 'Tokyo, Japan', 'Kirkjufell, Iceland'],
  },
  {
    name: 'Cappadocia, Turkey',
    region: 'Fairy Chimneys · Balloons',
    url: cappadociaImg,
    accentColor: '#FF8A3D',
    fallbackGradient: 'from-[#FFC300] to-[#FF3B30]',
    visualTags: ['pastel-sunset-sky', 'desert-ochre', 'hot-air-balloons'],
    similarTo: ['Giza, Egypt', 'Petra, Jordan', 'Serengeti, Tanzania'],
  },
  {
    name: 'Banff, Canada',
    region: 'Moraine Lake · Rockies',
    url: banffImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#00E676]',
    visualTags: ['snow-peak', 'water-reflection', 'blue-water-day', 'green-mountains'],
    similarTo: ['Lofoten, Norway', 'Swiss Alps, Zermatt', 'Kirkjufell, Iceland', 'Rio de Janeiro, Brazil'],
  },
  {
    name: 'Bora Bora, Polynesia',
    region: 'Lagoon · Mount Otemanu',
    url: boraBoraImg,
    accentColor: '#00D97E',
    fallbackGradient: 'from-[#00B4FF] to-[#00D97E]',
    visualTags: ['coastal-bay', 'blue-water-day', 'green-mountains', 'bright-blue-sky'],
    similarTo: ['Rio de Janeiro, Brazil', 'Amalfi Coast, Italy', 'Santorini, Greece', 'Machu Picchu, Peru'],
  },
  {
    name: 'Havana, Cuba',
    region: 'Old Town · Classic Cars',
    url: havanaImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#00B4FF]',
    visualTags: ['street-corridor', 'vibrant-colorful', 'terracotta-warm'],
    similarTo: ['Cape Town, South Africa', 'Paris, France', 'Tokyo, Japan', 'Marrakech, Morocco'],
  },
  {
    name: 'Serengeti, Tanzania',
    region: 'Savanna · Safari',
    url: serengetiImg,
    accentColor: '#FFC300',
    fallbackGradient: 'from-[#FF4D2E] to-[#FFC300]',
    visualTags: ['golden-sunset', 'desert-ochre', 'pastel-sunset-sky', 'savanna-wildlife'],
    similarTo: ['Giza, Egypt', 'Cappadocia, Turkey', 'Sydney, Australia', 'New York, USA'],
  },
  {
    name: 'Lofoten, Norway',
    region: 'Reine · Arctic Fjords',
    url: lofotenImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#FF3B30] to-[#00B4FF]',
    visualTags: ['snow-peak', 'water-reflection', 'waterfront-boats', 'night-dusk'],
    similarTo: ['Banff, Canada', 'Kirkjufell, Iceland', 'Swiss Alps, Zermatt', 'Venice, Italy'],
  },
];

export const DESTINATION_IMAGE_BY_KEY: Record<string, string[]> = {
  paris: [parisImg],
  france: [parisImg],
  tokyo: [tokyoImg],
  japan: [tokyoImg, fujiImg],
  fuji: [fujiImg],
  kyoto: [fujiImg],
  amalfi: [amalfiImg],
  positano: [amalfiImg],
  italy: [amalfiImg, romeImg, veniceImg],
  rome: [romeImg],
  venice: [veniceImg],
  santorini: [santoriniImg],
  greece: [santoriniImg],
  marrakech: [marrakechImg],
  morocco: [marrakechImg],
  swiss: [swissAlpsImg],
  alps: [swissAlpsImg],
  zermatt: [swissAlpsImg],
  switzerland: [swissAlpsImg],
  machu: [machuPicchuImg],
  peru: [machuPicchuImg],
  cusco: [machuPicchuImg],
  taj: [tajMahalImg],
  agra: [tajMahalImg],
  india: [tajMahalImg],
  petra: [petraImg],
  jordan: [petraImg],
  rio: [rioImg],
  brazil: [rioImg],
  giza: [gizaImg],
  cairo: [gizaImg],
  egypt: [gizaImg],
  barcelona: [barcelonaImg],
  spain: [barcelonaImg],
  bali: [baliImg],
  indonesia: [baliImg],
  iceland: [icelandImg],
  reykjavik: [icelandImg],
  newyork: [nycImg],
  nyc: [nycImg],
  brooklyn: [nycImg],
  capetown: [capeTownImg],
  southafrica: [capeTownImg],
  sydney: [sydneyImg],
  australia: [sydneyImg],
  cappadocia: [cappadociaImg],
  turkey: [cappadociaImg],
  banff: [banffImg],
  canada: [banffImg],
  borabora: [boraBoraImg],
  tahiti: [boraBoraImg],
  polynesia: [boraBoraImg],
  havana: [havanaImg],
  cuba: [havanaImg],
  serengeti: [serengetiImg],
  tanzania: [serengetiImg],
  lofoten: [lofotenImg],
  norway: [lofotenImg],
};

export const LOCAL_TRAVEL_IMAGE_POOL = [
  parisImg,
  tokyoImg,
  amalfiImg,
  santoriniImg,
  marrakechImg,
  swissAlpsImg,
  romeImg,
  machuPicchuImg,
  tajMahalImg,
  petraImg,
  rioImg,
  gizaImg,
  fujiImg,
  barcelonaImg,
  baliImg,
  icelandImg,
  veniceImg,
  nycImg,
  capeTownImg,
  sydneyImg,
  cappadociaImg,
  banffImg,
  boraBoraImg,
  havanaImg,
  serengetiImg,
  lofotenImg,
];

const LOCAL_TRAVEL_IMAGE_SET = new Set<string>(LOCAL_TRAVEL_IMAGE_POOL);

const SORTED_DESTINATION_KEYS = Object.keys(DESTINATION_IMAGE_BY_KEY).sort(
  (a, b) => b.length - a.length
);

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getVerifiedDestinationImage(
  destination?: string,
  seed?: string
): string {
  const dest = (destination || '').trim();
  const cleanDest = dest.toLowerCase().replace(/[^a-z]/g, '');
  const seedKey = `${dest.toLowerCase()}|${(seed || '').trim()}`;

  if (cleanDest) {
    for (const key of SORTED_DESTINATION_KEYS) {
      if (cleanDest.includes(key)) {
        const matches = DESTINATION_IMAGE_BY_KEY[key];
        if (matches && matches.length > 0) {
          return matches[hashSeed(seedKey) % matches.length];
        }
      }
    }
  }

  return LOCAL_TRAVEL_IMAGE_POOL[hashSeed(seedKey || 'whisk') % LOCAL_TRAVEL_IMAGE_POOL.length];
}

export function resolvePostImage(post: {
  imageUrl?: string;
  destination?: string;
  id?: string;
  title?: string;
}): string {
  const raw = typeof post.imageUrl === 'string' ? post.imageUrl.trim() : '';
  const fallback = () =>
    getVerifiedDestinationImage(post.destination, post.id || post.title);

  if (!raw || raw === '/' || raw === '#') {
    return fallback();
  }

  if (LOCAL_TRAVEL_IMAGE_SET.has(raw)) {
    return raw;
  }

  if (raw.startsWith('/assets/') || raw.startsWith('/src/assets/')) {
    // Stale Vite build hash or dev asset path stored in Firestore — resolve to current bundled image
    return fallback();
  }

  if (raw.startsWith('data:image/')) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      if (parsed.hostname.includes('source.unsplash.com')) {
        return fallback();
      }
      return raw;
    }
  } catch {
    // Invalid URL — fall back to verified local destination image
  }

  return fallback();
}

