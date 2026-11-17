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

export interface PolaroidLandmark {
  name: string;
  region: string;
  url: string;
  accentColor: string;
  fallbackGradient: string;
}

export const LANDMARK_POLAROIDS: PolaroidLandmark[] = [
  {
    name: 'Paris, France',
    region: 'Eiffel Tower · Cafés',
    url: parisImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#FFCC00]',
  },
  {
    name: 'Tokyo, Japan',
    region: 'Asakusa · Skytree',
    url: tokyoImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#00B4FF]',
  },
  {
    name: 'Amalfi Coast, Italy',
    region: 'Positano Cliffs',
    url: amalfiImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF3B30]',
  },
  {
    name: 'Santorini, Greece',
    region: 'Oia Blue Domes',
    url: santoriniImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FF1CF7]',
  },
  {
    name: 'Marrakech, Morocco',
    region: 'Medina · Riad',
    url: marrakechImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#00E676]',
  },
  {
    name: 'Swiss Alps, Zermatt',
    region: 'Matterhorn Peaks',
    url: swissAlpsImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#00B4FF]',
  },
  {
    name: 'Rome, Italy',
    region: 'Colosseum',
    url: romeImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF3B30]',
  },
  {
    name: 'Machu Picchu, Peru',
    region: 'Inca Citadel',
    url: machuPicchuImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#FFCC00]',
  },
  {
    name: 'Agra, India',
    region: 'Taj Mahal',
    url: tajMahalImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#FFCC00]',
  },
  {
    name: 'Petra, Jordan',
    region: 'The Treasury',
    url: petraImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#FF1CF7]',
  },
  {
    name: 'Rio de Janeiro, Brazil',
    region: 'Sugarloaf Bay',
    url: rioImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#00E676]',
  },
  {
    name: 'Giza, Egypt',
    region: 'Great Pyramids',
    url: gizaImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#00B4FF]',
  },
  {
    name: 'Mount Fuji, Japan',
    region: 'Chureito Pagoda',
    url: fujiImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#FFCC00]',
  },
  {
    name: 'Barcelona, Spain',
    region: 'Park Güell',
    url: barcelonaImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FF3B30]',
  },
  {
    name: 'Bali, Indonesia',
    region: 'Ulun Danu Temple',
    url: baliImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#FF1CF7]',
  },
  {
    name: 'Kirkjufell, Iceland',
    region: 'Northern Lights',
    url: icelandImg,
    accentColor: '#00E676',
    fallbackGradient: 'from-[#00E676] to-[#00B4FF]',
  },
  {
    name: 'Venice, Italy',
    region: 'Grand Canal',
    url: veniceImg,
    accentColor: '#FF3B30',
    fallbackGradient: 'from-[#FF3B30] to-[#00B4FF]',
  },
  {
    name: 'New York, USA',
    region: 'Brooklyn Bridge',
    url: nycImg,
    accentColor: '#FFCC00',
    fallbackGradient: 'from-[#FFCC00] to-[#FF1CF7]',
  },
  {
    name: 'Cape Town, South Africa',
    region: 'Bo-Kaap · Table Mountain',
    url: capeTownImg,
    accentColor: '#FF1CF7',
    fallbackGradient: 'from-[#FF1CF7] to-[#00E676]',
  },
  {
    name: 'Sydney, Australia',
    region: 'Opera House',
    url: sydneyImg,
    accentColor: '#00B4FF',
    fallbackGradient: 'from-[#00B4FF] to-[#FFCC00]',
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
];
