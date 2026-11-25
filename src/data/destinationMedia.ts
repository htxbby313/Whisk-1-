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
  newzealand: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'],
  queenstown: ['https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=80'],
  auckland: ['https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=80'],
  london: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'],
  uk: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'],
  britain: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'],
  hawaii: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
  honolulu: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
  maui: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
  costarica: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'],
  thailand: ['https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80'],
  bangkok: ['https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80'],
  phuket: ['https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80'],
  ireland: ['https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=1200&q=80'],
  dublin: ['https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=1200&q=80'],
  scotland: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80'],
  edinburgh: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80'],
  germany: ['https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80'],
  berlin: ['https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80'],
  austria: ['https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1200&q=80'],
  vienna: ['https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1200&q=80'],
  california: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80'],
  sanfrancisco: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80'],
  losangeles: ['https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1200&q=80'],
  colorado: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'],
  utah: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'],
  dallas: ['https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1200&q=80'],
  texas: ['https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1200&q=80'],
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

export function getVerifiedDestinationImage(destination: string, seed?: string): string {
  if (!destination) {
    return LOCAL_TRAVEL_IMAGE_POOL[0];
  }
  const clean = destination.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, imgs] of Object.entries(DESTINATION_IMAGE_BY_KEY)) {
    if (clean.includes(key) && imgs && imgs.length > 0) {
      return imgs[0];
    }
  }

  const hash = Array.from(destination + (seed || '')).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return LOCAL_TRAVEL_IMAGE_POOL[hash % LOCAL_TRAVEL_IMAGE_POOL.length];
}

export function resolvePostImage(post?: { destination?: string; imageUrl?: string; title?: string } | null): string {
  if (!post) return LOCAL_TRAVEL_IMAGE_POOL[0];
  const url = (post.imageUrl || '').trim();
  if (url && url !== '/' && url !== 'undefined' && !url.endsWith('/undefined')) {
    return url;
  }
  return getVerifiedDestinationImage(post.destination || '', post.title || post.destination);
}
