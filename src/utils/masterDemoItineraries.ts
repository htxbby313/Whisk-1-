// src/utils/masterDemoItineraries.ts
// Curated, master verified itineraries for Admin demonstration

import { TripItinerary } from '../../types';
import { getDestinationGeo, generateItinerarySeo } from './seoGeoHelper';

export const MASTER_DEMO_ITINERARIES: Record<
  'tokyo' | 'amalfi' | 'paris',
  TripItinerary
> = {
  tokyo: {
    id: 'demo-tokyo-master',
    title: 'Neon Horizons & Edo Serenity: The 5-Day Tokyo Master Route',
    destination: 'Tokyo, Japan',
    duration: '5 days',
    summary:
      'Immerse in Tokyo’s dynamic juxtaposition of ancient sensory tea rituals and cutting-edge digital art. From Tsukiji Outer Market dawn bites to golden hour over Shinjuku’s skyline.',
    createdAt: '2026-11-16T12:00:00Z',
    overallRating: 5.0,
    budget: 'Mid-range',
    pace: 'Moderate',
    geo: getDestinationGeo('tokyo'),
    seo: generateItinerarySeo(
      'Tokyo, Japan',
      '5 days',
      'The ultimate 5-day Tokyo master route'
    ),
    days: [
      {
        dayNumber: 1,
        theme: 'Asakusa Roots, Ueno Artisans & Sumida River Cruise',
        activities: [
          {
            time: '08:30 AM',
            location: 'Senso-ji Temple & Nakamise-dori',
            description:
              'Walk under the iconic Thunder Gate (Kaminarimon) before crowds arrive; sample warm ningyo-yaki bean cakes.',
            link: 'https://www.japan.travel/en/spot/1601/',
          },
          {
            time: '01:00 PM',
            location: 'Kappabashi Kitchen Town & Yanaka',
            description:
              'Explore Tokyo’s culinary artisans crafting handmade chef knives and lacquered bento boxes in nostalgic Edo alleys.',
            link: 'https://www.gotokyo.org/en/destinations/eastern-tokyo/kappabashi/index.html',
          },
          {
            time: '06:30 PM',
            location: 'Omoide Yokocho (Memory Lane)',
            description:
              'Sip smoky charcoal yakitori and draft highballs beneath red lanterns in Shinjuku’s vintage post-war alleyways.',
            link: 'https://www.gotokyo.org/en/spot/41/',
          },
        ],
      },
      {
        dayNumber: 2,
        theme: 'Harajuku Subcultures, Meiji Sanctuary & Shibuya Crossing',
        activities: [
          {
            time: '09:00 AM',
            location: 'Meiji Jingu Forest Shrine',
            description:
              'Enter the towering cedar torii gates for morning Shinto prayers in the serene urban forest.',
            link: 'https://www.meijijingu.or.jp/en/',
          },
          {
            time: '02:00 PM',
            location: 'Cat Street & Omotesando Architecture',
            description:
              'Browse independent Tokyo denim ateliers and sip pour-over matcha along the shaded pedestrian backstreets.',
            link: 'https://www.gotokyo.org/en/destinations/western-tokyo/omotesando/index.html',
          },
          {
            time: '07:30 PM',
            location: 'Shibuya Sky Observation Deck',
            description:
              'Take in the 360-degree panoramic glass vistas of the famous scramble crossing illuminated under twilight.',
            link: 'https://www.shibuya-scramble-square.com/sky/en/',
          },
        ],
      },
      {
        dayNumber: 3,
        theme: 'Tsukiji Fresh Bites, Ginza Elegance & teamLab Borderless',
        activities: [
          {
            time: '07:30 AM',
            location: 'Tsukiji Outer Market',
            description:
              'Enjoy freshly torched wagyu nigiri, tamagoyaki omelettes, and hand-cut bluefin sashimi rolls straight from seafood masters.',
            link: 'https://www.tsukiji.or.jp/english/',
          },
          {
            time: '01:30 PM',
            location: 'teamLab Borderless (Azabudai Hills)',
            description:
              'Wander through mind-bending interactive light sculptures and infinite mirrored waterfall installations.',
            link: 'https://www.teamlab.art/e/borderless-azabudai/',
          },
          {
            time: '08:00 PM',
            location: 'Ginza Six Rooftop Garden & Jazz Speakeasy',
            description:
              'Unwind with rare single-cask Japanese whisky and craft seasonal botanical cocktails in secluded Ginza lounges.',
            link: 'https://ginza6.tokyo.e.abj.hp.transer.com/',
          },
        ],
      },
      {
        dayNumber: 4,
        theme: 'Roppongi Contemporary Art & Tokyo Tower Twilight',
        activities: [
          {
            time: '10:00 AM',
            location: 'Mori Art Museum & Roppongi Hills',
            description:
              'Marvel at world-class contemporary exhibitions on the 53rd floor overlooking Tokyo Bay.',
            link: 'https://www.mori.art.museum/en/',
          },
          {
            time: '03:00 PM',
            location: 'Nezu Museum Traditional Japanese Garden',
            description:
              'Stroll through moss gardens and bamboo groves displaying pre-modern Japanese and East Asian masterpieces.',
            link: 'https://www.nezu-muse.or.jp/en/',
          },
          {
            time: '07:00 PM',
            location: 'Tokyo Tower Diamond Veil Lighting',
            description:
              'Photograph the glowing retro spire from Shiba Park followed by multi-course kaiseki dining.',
            link: 'https://www.tokyotower.co.jp/en/',
          },
        ],
      },
      {
        dayNumber: 5,
        theme: 'Shinjuku Gyoen National Garden & Golden Gai Nightcap',
        activities: [
          {
            time: '09:30 AM',
            location: 'Shinjuku Gyoen National Garden',
            description:
              'Rest beside tranquil ponds, English landscape lawns, and historic imperial greenhouses.',
            link: 'https://www.env.go.jp/garden/shinjukugyoen/english/',
          },
          {
            time: '02:00 PM',
            location: 'Akihabara Electronic Town & Anime Rare Archives',
            description:
              'Discover vintage retro gaming boutiques, rare vinyl records, and vibrant high-tech shopping arcades.',
            link: 'https://www.gotokyo.org/en/destinations/central-tokyo/akihabara/index.html',
          },
          {
            time: '08:00 PM',
            location: 'Shinjuku Golden Gai',
            description:
              'Conclude your expedition hopping between historic 6-seat micropubs run by Tokyo musicians and writers.',
            link: 'https://www.gotokyo.org/en/spot/41/',
          },
        ],
      },
    ],
    recommendations: [
      {
        name: 'Trunk Hotel (Yoyogi Park / Shibuya)',
        type: 'hotel',
        description:
          'Boutique sustainable design hotel featuring an infinity heated rooftop pool overlooking Yoyogi Park.',
        affiliateUrl:
          'https://www.kayak.com/hotels/Tokyo,Japan-c16035/Trunk-Hotel',
      },
      {
        name: 'Private Tsukiji Market & Knife Master Tour',
        type: 'tour',
        description:
          'Behind-the-scenes insider tour with a 3rd-generation sushi chef and Japanese cutlery master.',
        affiliateUrl: 'https://www.viator.com/tours/Tokyo/Private-Tsukiji-Tour',
      },
      {
        name: 'Sushi Sawada (2 Michelin Stars Ginza)',
        type: 'restaurant',
        description:
          'Intimate 6-seat edomae counter celebrated for aged wild tuna and warm seasoned red vinegar rice.',
        affiliateUrl: 'https://www.tableall.com/restaurant/sushi-sawada',
      },
    ],
  },
  amalfi: {
    id: 'demo-amalfi-master',
    title: 'Cliffside Glamour & Lemon Groves: The 4-Day Amalfi Coast Route',
    destination: 'Amalfi Coast, Italy',
    duration: '4 days',
    summary:
      'Pastel fishing villages clinging to dramatic limestone bluffs, private wooden gozzo boats to Capri, and candlelit seafood over the Tyrrhenian Sea.',
    createdAt: '2026-11-16T12:00:00Z',
    overallRating: 4.9,
    budget: 'Luxury',
    pace: 'Relaxed',
    geo: getDestinationGeo('amalfi'),
    seo: generateItinerarySeo(
      'Amalfi Coast, Italy',
      '4 days',
      'The ultimate 4-day Amalfi Coast guide'
    ),
    days: [
      {
        dayNumber: 1,
        theme: 'Positano Pastel Stairs & Spiaggia Grande Sunset',
        activities: [
          {
            time: '10:00 AM',
            location: 'Positano Village & Church of Santa Maria Assunta',
            description:
              'Meander down wisteria-draped staircases, admiring ceramic shops and the iconic majolica tiled dome.',
            link: 'https://www.positano.com/',
          },
          {
            time: '02:00 PM',
            location: 'Fornillo Beach Path',
            description:
              'Escape the main crowds along the cliffside path for chilled limoncello spritzes and grilled calamari.',
            link: 'https://www.positano.com/en/beaches',
          },
          {
            time: '07:30 PM',
            location: 'Franco’s Bar Positano',
            description:
              'Sip champagne overlooking the illuminated vertical cliffs as luxury yachts anchor in the bay below.',
            link: 'https://francosbar.com/',
          },
        ],
      },
      {
        dayNumber: 2,
        theme: 'Private Wooden Gozzo Boat to Capri & Blue Grotto',
        activities: [
          {
            time: '09:00 AM',
            location: 'Positano Pier Boarding',
            description:
              'Step aboard a classic Riva or handcrafted Fratelli Aprea gozzo for a private maritime cruise across the Gulf of Salerno.',
            link: 'https://www.capri.com/en/boat-transfers',
          },
          {
            time: '01:00 PM',
            location: 'Faraglioni Rocks & White Grotto',
            description:
              'Swim in crystal turquoise waters beneath the towering sea stacks and dive into secluded marine caverns.',
            link: 'https://www.capri.com/en/sights/faraglioni',
          },
          {
            time: '07:00 PM',
            location: 'Anacapri Monte Solaro Chairlift',
            description:
              'Ascend to the highest summit on Capri island for sweeping sunset panoramas of Mount Vesuvius.',
            link: 'https://www.capri.net/en/s/monte-solaro-chairlift',
          },
        ],
      },
      {
        dayNumber: 3,
        theme: 'Path of the Gods (Sentiero degli Dei) & Ravello Gardens',
        activities: [
          {
            time: '08:30 AM',
            location: 'Sentiero degli Dei Hike',
            description:
              'Hike high above the Mediterranean clouds from Bomerano to Nocelle with jaw-dropping coastal panoramas.',
            link: 'https://www.cazamaratea.com/sentiero-dei-dei',
          },
          {
            time: '02:00 PM',
            location: 'Villa Rufolo & Villa Cimbrone Gardens (Ravello)',
            description:
              'Stand at the Terrace of Infinity lined with classical marble busts overlooking the azure sea.',
            link: 'https://www.hotelcimbrone.com/gardens/',
          },
          {
            time: '08:00 PM',
            location: 'Ristorante Da Gemma (Amalfi Town)',
            description:
              'Savor authentic handmade scialatielli pasta with fresh clams, mussels, and Amalfi sfusato lemons.',
            link: 'https://www.trattoriadagemma.com/',
          },
        ],
      },
      {
        dayNumber: 4,
        theme: 'Historic Amalfi Cathedral, Paper Mills & Lemon Orchard Tasting',
        activities: [
          {
            time: '09:30 AM',
            location: 'Duomo di Amalfi (St. Andrew’s Cathedral)',
            description:
              'Climb the 62 steps to the 9th-century Arab-Norman cathedral and peaceful Cloister of Paradise.',
            link: 'https://www.parrocchiaamalfi.com/',
          },
          {
            time: '01:30 PM',
            location: 'Valle delle Ferriere & Historic Paper Museum',
            description:
              'Witness the centuries-old art of handmade Bambagina cotton paper crafted along waterfalls.',
            link: 'https://www.museodellacarta.it/en/',
          },
          {
            time: '06:30 PM',
            location: 'AcquaPazza Cetara',
            description:
              'Conclude with the ancient Roman Colatura di Alici (anchovy essence) and chilled Falanghina wine.',
            link: 'https://www.acquapazza.it/',
          },
        ],
      },
    ],
    recommendations: [
      {
        name: 'Le Sirenuse (Positano)',
        type: 'hotel',
        description:
          'World-legendary luxury retreat with private balconies overlooking the glowing pastel cliffs.',
        affiliateUrl:
          'https://www.kayak.com/hotels/Positano-c20986/Le-Sirenuse',
      },
      {
        name: 'Private Capri & Faraglioni Gozzo Day Charter',
        type: 'tour',
        description:
          'Full-day skippered boat tour with prosecco, fresh fruit, snorkeling gear, and Blue Grotto access.',
        affiliateUrl:
          'https://www.viator.com/tours/Amalfi-Coast/Capri-Boat-Tour',
      },
      {
        name: 'Ristorante La Sponda (Positano)',
        type: 'restaurant',
        description:
          'Romantic Michelin-starred dining illuminated solely by 400 candles each evening.',
        affiliateUrl: 'https://sirenuse.it/en/la-sponda',
      },
    ],
  },
  paris: {
    id: 'demo-paris-master',
    title: 'The Haute Bohemian Route: 3 Days of Hidden Paris',
    destination: 'Paris, France',
    duration: '3 days',
    summary:
      'Beyond the crowded queues: private salon tours of Le Marais, courtyard bistros in Saint-Germain-des-Prés, and twilight along the Seine.',
    createdAt: '2026-11-16T12:00:00Z',
    overallRating: 4.8,
    budget: 'Mid-range',
    pace: 'Relaxed',
    geo: getDestinationGeo('paris'),
    seo: generateItinerarySeo(
      'Paris, France',
      '3 days',
      '3 days of hidden Paris and couture secrets'
    ),
    days: [
      {
        dayNumber: 1,
        theme: 'Le Marais Mansions, Secret Passages & Place des Vosges',
        activities: [
          {
            time: '09:00 AM',
            location: 'Place des Vosges & Victor Hugo Residence',
            description:
              'Stroll through Paris’s oldest planned square beneath red-brick vaulted arcades with warm butter croissants.',
            link: 'https://www.paris.fr/lieux/place-des-vosges-1768',
          },
          {
            time: '01:30 PM',
            location: 'Musée Carnavalet & Rue des Rosiers',
            description:
              'Wander through the restored history museum gardens and savor world-famous warm falafel pita.',
            link: 'https://www.carnavalet.paris.fr/en',
          },
          {
            time: '07:30 PM',
            location: 'Galerie Vivienne & Wine Cellar Speakeasy',
            description:
              'Walk through 1823 mosaic passages to a hidden cellar for natural biodynamic French wines.',
            link: 'https://www.galerie-vivienne.com/',
          },
        ],
      },
      {
        dayNumber: 2,
        theme: 'Saint-Germain Philosophers, Luxembourg Gardens & Musee Rodin',
        activities: [
          {
            time: '09:30 AM',
            location: 'Café de Flore & Saint-Sulpice',
            description:
              'Sip traditional chocolat chaud in the footsteps of Simone de Beauvoir and Hemingway.',
            link: 'https://cafedeflore.fr/',
          },
          {
            time: '02:00 PM',
            location: 'Jardin du Luxembourg & Fontaine Médicis',
            description:
              'Read beneath chestnut trees beside the 1630 Italian fountain watching antique toy sailboats.',
            link: 'https://www.senat.fr/visite/jardin/',
          },
          {
            time: '06:30 PM',
            location: 'Musée Rodin Sculpture Garden',
            description:
              'Admire The Thinker and The Gates of Hell cast in bronze amidst blooming rose gardens.',
            link: 'https://www.musee-rodin.fr/en',
          },
        ],
      },
      {
        dayNumber: 3,
        theme: 'Montmartre Vineyard Secrets & Seine River Twilight Cruise',
        activities: [
          {
            time: '10:00 AM',
            location: 'Vignes du Clos Montmartre & Place du Tertre',
            description:
              'Discover Paris’s secret working vineyard on the steep northern slopes behind Sacré-Cœur.',
            link: 'https://www.parisinfo.com/musee-monument-paris/71375/Clos-Montmartre',
          },
          {
            time: '02:30 PM',
            location: 'Musée de l’Orangerie (Water Lilies)',
            description:
              'Sit in the oval sanctuary rooms immersed in Claude Monet’s monumental Water Lilies murals.',
            link: 'https://www.musee-orangerie.fr/en',
          },
          {
            time: '08:00 PM',
            location: 'Pont des Arts & Classical Seine Riverboat',
            description:
              'Watch the Eiffel Tower sparkle with golden beacons at the top of the hour from the water.',
            link: 'https://www.vedettesdupontneuf.com/home/',
          },
        ],
      },
    ],
    recommendations: [
      {
        name: 'Hôtel Madame Rêve (Louvre / 1st Arrondissement)',
        type: 'hotel',
        description:
          'Ultra-chic boutique hotel in the historic post office building with panoramic Eiffel Tower views.',
        affiliateUrl:
          'https://www.kayak.com/hotels/Paris-c15984/Hotel-Madame-Reve',
      },
      {
        name: 'Private Marais Historical Food & Wine Tasting',
        type: 'tour',
        description:
          'Expert-guided walking tour sampling aged Comté cheeses, cured charcuterie, and macaron pairings.',
        affiliateUrl: 'https://www.viator.com/tours/Paris/Marais-Food-Tour',
      },
      {
        name: 'Le Chateaubriand (11th Arrondissement)',
        type: 'restaurant',
        description:
          'Pioneering bistronomy destination by Chef Iñaki Aizpitarte serving inventive daily tasting menus.',
        affiliateUrl: 'https://www.lechateaubriand.net/',
      },
    ],
  },
};
