import { MarketingBoardingPassSpec } from './BoardingPassSocialProofCanvas';
import {
  MarketingVideoAspect,
  MarketingVideoDuration,
} from '../services/marketingService';

export type ReelContentFormatId =
  | 'soundscape-pass'
  | 'architectural-morning'
  | 'table-ritual'
  | 'golden-horizon'
  | 'quiet-passage'
  | 'twilight-courtyard'
  | 'polaroid-alive';

export type ReelCompositeMode = 'soundscape-pass' | 'cinema-outro' | 'direct';

export interface ReelContentFormat {
  id: ReelContentFormatId;
  shortLabel: string;
  title: string;
  description: string;
  spotIndex: number;
  recommendedMode: 'text' | 'animate';
  recommendedDuration: MarketingVideoDuration;
  compositeMode: ReelCompositeMode;
}

export const REEL_CONTENT_FORMATS: ReelContentFormat[] = [
  {
    id: 'soundscape-pass',
    shortLabel: '1. Pass + Trip Sounds',
    title: 'Boarding Pass + Live Trip Soundscape & Bokeh Lights',
    description:
      'Pure crisp Whisk Boarding Pass floating over softly blurred city & market lights with real destination sounds: horns, local chatter, markets & café clinking.',
    spotIndex: 0,
    recommendedMode: 'text',
    recommendedDuration: '8s',
    compositeMode: 'soundscape-pass',
  },
  {
    id: 'architectural-morning',
    shortLabel: '2. Morning Stillness',
    title: 'Architectural Stillness · Spot 1 → Boarding Pass',
    description:
      'Unhurried 35mm single-take arrival at your first verified spot with natural morning ambience, dissolving into the razor-sharp Whisk Boarding Pass.',
    spotIndex: 0,
    recommendedMode: 'text',
    recommendedDuration: '6s',
    compositeMode: 'cinema-outro',
  },
  {
    id: 'table-ritual',
    shortLabel: '3. Table & Ritual',
    title: 'Sensory Café & Table Ritual · Spot 2 → Boarding Pass',
    description:
      'Intimate 50mm film frame of espresso steam, ceramics, and light café chatter at Spot 2, finished with your crisp Boarding Pass.',
    spotIndex: 1,
    recommendedMode: 'text',
    recommendedDuration: '6s',
    compositeMode: 'cinema-outro',
  },
  {
    id: 'golden-horizon',
    shortLabel: '4. Golden Hour',
    title: 'Golden-Hour Panorama · Spot 3 → Boarding Pass',
    description:
      'Slow gliding wide shot over your sunset verified spot with warm evening street sounds, cross-dissolving cleanly into the Boarding Pass.',
    spotIndex: 2,
    recommendedMode: 'text',
    recommendedDuration: '6s',
    compositeMode: 'cinema-outro',
  },
  {
    id: 'quiet-passage',
    shortLabel: '5. Market & Street Walk',
    title: 'Walkable Market & Neighborhood · Spot 1 → Boarding Pass',
    description:
      'Calm Steadicam drift past open-air stalls and warm street lights with authentic local chatter, distant horns & footsteps.',
    spotIndex: 0,
    recommendedMode: 'text',
    recommendedDuration: '8s',
    compositeMode: 'cinema-outro',
  },
  {
    id: 'twilight-courtyard',
    shortLabel: '6. Dusk & Candlelight',
    title: 'Blue-Hour Lights & Chatter · Spot 3 → Boarding Pass',
    description:
      'Moody twilight architecture, warm glowing lanterns, clinking glasses, and unhurried luxury pacing before revealing the Boarding Pass.',
    spotIndex: 2,
    recommendedMode: 'text',
    recommendedDuration: '6s',
    compositeMode: 'cinema-outro',
  },
  {
    id: 'polaroid-alive',
    shortLabel: '7. Living Polaroid',
    title: 'Animate Whisk Polaroid Photo + Trip Soundscape → Pass',
    description:
      'Brings your chosen Whisk Polaroid landmark photo subtly to life with gentle real-world motion and authentic destination audio.',
    spotIndex: 0,
    recommendedMode: 'animate',
    recommendedDuration: '6s',
    compositeMode: 'cinema-outro',
  },
];

export interface AutoReelPromptBundle {
  format: ReelContentFormat;
  featuredSpot: { name: string; subtitle: string };
  soundscapeSummary: string;
  cinematographyPrompt: string;
  suggestedCaption: string;
}

function getThreeSpots(spec: MarketingBoardingPassSpec): [
  { name: string; subtitle: string },
  { name: string; subtitle: string },
  { name: string; subtitle: string },
] {
  const dest = spec.destLabel || 'the destination';
  const s1 = spec.anchorSpots[0]?.name
    ? spec.anchorSpots[0]
    : { name: `${dest} Historic Quarter`, subtitle: 'Quiet morning walk' };
  const s2 = spec.anchorSpots[1]?.name
    ? spec.anchorSpots[1]
    : { name: `${dest} Espresso & Market Lane`, subtitle: 'Local café ritual' };
  const s3 = spec.anchorSpots[2]?.name
    ? spec.anchorSpots[2]
    : { name: `${dest} Sunset Terrace Overlook`, subtitle: 'Golden hour vista' };
  return [s1, s2, s3];
}

export function getDestinationSoundscapeCue(
  destination: string,
  spotNames: string[]
): { audioDirective: string; shortSummary: string } {
  const d = destination.toLowerCase();
  const spotsText = spotNames.filter(Boolean).slice(0, 3).join(', ');

  if (d.includes('tokyo') || d.includes('kyoto') || d.includes('japan')) {
    return {
      shortSummary: 'Lantern street buzz · distant train chime · espresso steam · soft Japanese chatter',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'Asakusa & local cafés'}: ` +
        `warm murmur of locals talking at an open-air street market, soft distant Yamanote train chime, subtle bicycle bell and muted city traffic horns in the distance, gentle footsteps on stone, clinking ceramic cups, and warm ambient evening breeze. Strictly natural ambient soundscape, no loud synth music or voiceover.`,
    };
  }
  if (d.includes('paris') || d.includes('france')) {
    return {
      shortSummary: 'Left Bank café chatter · clinking espresso cups · distant Parisian horn · cobblestone steps',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'Left Bank bistros & Rue Cler'}: ` +
        `warm French conversation and light laughter at a sunlit outdoor café, delicate porcelain cups and wine glasses clinking, lively open-air market vendors talking softly, a brief distant Parisian car horn and scooter passing far down the boulevard, and footsteps on cobblestones. Strictly real ambient street audio, no narrator or generic background music.`,
    };
  }
  if (d.includes('amalfi') || d.includes('positano') || d.includes('rome') || d.includes('venice') || d.includes('italy')) {
    return {
      shortSummary: 'Italian market chatter · distant Vespa horn · coastal ferry & lapping water · aperitivo glasses',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'coastal alleys & sunlit piazzas'}: ` +
        `animated Italian locals talking warmly at a lemon and produce market, a classic distant Vespa scooter horn echoing softly off stone walls, gentle coastal breeze and harbor ferry hum, clinking aperitivo glasses, and relaxed footsteps on cobbled lanes. Pure authentic travel field recording, no stock music or narration.`,
    };
  }
  if (d.includes('santorini') || d.includes('greece')) {
    return {
      shortSummary: 'Aegean sea breeze · warm taverna chatter · clinking wine glasses · distant village bell',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'caldera pathways & cliffside tavernas'}: ` +
        `soft Aegean wind across whitewashed stone terraces, warm twilight taverna chatter and gentle laughter, delicate clinking of wine glasses, distant church bell chiming softly, and faint harbor boat hum below. Pure natural travel ambience, no music bed or narrator.`,
    };
  }
  if (d.includes('marrakech') || d.includes('morocco')) {
    return {
      shortSummary: 'Vibrant souk chatter · mint tea pouring · distant street horns · courtyard fountain',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'the medina souks & riad courtyards'}: ` +
        `warm rhythmic chatter of locals talking in sunlit spice markets, distant scooter horns outside the medina walls, gentle pouring of Moroccan mint tea, soft courtyard fountain water, and footsteps on tiled stone. Pure natural field recording, no narrator or synth soundtrack.`,
    };
  }
  if (d.includes('new york') || d.includes('nyc') || d.includes('brooklyn')) {
    return {
      shortSummary: 'Distant yellow-cab horn · warm neighborhood café buzz · footsteps · golden evening city hum',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'neighborhood cafés & bridge walkways'}: ` +
        `iconic distant NYC taxi horn softened by warm evening air, light conversational chatter outside a sunlit coffee shop, gentle clinking of iced coffee glasses, soft subway rumble beneath, and unhurried sidewalk footsteps. Authentic atmospheric cinema soundscape, no voiceover or loud music.`,
    };
  }
  if (d.includes('havana') || d.includes('cuba')) {
    return {
      shortSummary: 'Classic car horn · warm street chatter · distant acoustic guitar · breezy plaza ambience',
      audioDirective:
        `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'Old Havana plazas & sunlit streets'}: ` +
        `vintage classic car horn in the warm distance, lively neighborhood voices and laughter drifting from open balconies, light street market chatter, and faint distant acoustic guitar echoing softly down a sunlit alley. Authentic atmospheric audio, no narrator.`,
    };
  }

  return {
    shortSummary: 'Local market chatter · distant city horns · warm café buzz · glowing evening atmosphere',
    audioDirective:
      `Immersive natural binaural field-recording audio of ${destination} around ${spotsText || 'walkable local markets & cafés'}: ` +
      `warm ambient chatter of locals talking at an open-air neighborhood market, soft distant city traffic horns and passing scooters, gentle clinking of café cups and glasses, unhurried footsteps on stone streets, and atmospheric evening air. Strictly authentic natural travel soundscape, no narrator or generic stock music.`,
  };
}

// Strict anti-slop luxury cinema guardrails appended to every scene prompt
const LUXURY_CINEMA_GUARDRAILS =
  'Single unbroken slow camera movement with zero cuts, zero whip-pans, and zero rushed transitions. ' +
  'Shot on ARRI Alexa 35 with a 50mm prime lens, natural 35mm Kodak Portra 400 film color science, ' +
  'soft organic highlights, rich natural shadows, subtle fine film grain, authentic understated luxury atmosphere like Condé Nast Traveler or Aman Resorts. ' +
  'No artificial HDR saturation, no CGI gloss, no people looking at the camera, and strictly no on-screen text, no typography, no logos, and no floating graphics.';

export function buildAutoReelPrompts(
  spec: MarketingBoardingPassSpec,
  formatId: ReelContentFormatId,
  aspect: MarketingVideoAspect,
  _duration: MarketingVideoDuration
): AutoReelPromptBundle {
  const format =
    REEL_CONTENT_FORMATS.find((f) => f.id === formatId) || REEL_CONTENT_FORMATS[0];
  const dest = spec.destLabel || 'Tokyo';
  const [spot1, spot2, spot3] = getThreeSpots(spec);
  const spots = [spot1, spot2, spot3];
  const featuredSpot = spots[format.spotIndex] || spot1;
  const spotLabel = featuredSpot.subtitle
    ? `${featuredSpot.name} (${featuredSpot.subtitle})`
    : featuredSpot.name;
  const soundscape = getDestinationSoundscapeCue(
    dest,
    spots.map((s) => s.name)
  );
  const framePrefix =
    aspect === '9:16'
      ? 'Vertical 9:16 prestige travel cinema frame'
      : 'Widescreen 16:9 prestige travel cinema frame';

  const hashtags = [
    '#whisktravel',
    `#${dest.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    '#luxurytravel',
    '#slowtravel',
    '#travelasmr',
  ].join(' ');

  if (formatId === 'soundscape-pass') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `${framePrefix} capturing dreamy, softly out-of-focus evening city lights, warm glowing market lanterns, golden passing headlights, and sunlit café windows moving gently across ${dest} near ${spot1.name} and ${spot2.name}. ` +
        `Ultra-slow meditative bokeh drift shot through a vintage 50mm f/1.2 anamorphic lens, rich warm amber and deep indigo nocturnal highlights designed as a tranquil atmospheric background plate. ` +
        `${soundscape.audioDirective} ` +
        `Strictly no text, no logos, no harsh cuts, no frantic motion.`,
      suggestedCaption: `Turn sound on for ${dest}. 🎧\n\n${spec.viralHook || `Your walkable ${dest} Boarding Pass, mapped in seconds.`}\nRoute: ${spot1.name} · ${spot2.name} · ${spot3.name}\n\nBuild yours free at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  if (formatId === 'table-ritual') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `${framePrefix} set at ${spotLabel} in ${dest}. ` +
        `An unhurried, intimate close-to-medium slow push-in on a sunlit stone café table in crisp morning light: ` +
        `delicate steam rising gently from a ceramic espresso cup, soft tree shadows shifting slowly across warm limestone and linen, ` +
        `authentic local architecture softly out of focus in the background, tranquil unhurried motion. ` +
        `${soundscape.audioDirective} ` +
        LUXURY_CINEMA_GUARDRAILS,
      suggestedCaption: `${spec.viralHook || `Slow mornings in ${dest}, mapped within a 10-minute walk.`}\n\nFeatured stop: ${featuredSpot.name}\nRoute: ${spot1.name} · ${spot2.name} · ${spot3.name}\n\nBuild your free Boarding Pass at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  if (formatId === 'golden-horizon') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `${framePrefix} overlooking ${spotLabel} in ${dest} during late golden hour. ` +
        `A serene, ultra-smooth slow lateral dolly across weathered stone balconies and warm architectural silhouettes bathed in low amber sunbeams, ` +
        `gentle breeze moving leaves and linen in natural real-time motion, deep atmospheric perspective, peaceful editorial stillness. ` +
        `${soundscape.audioDirective} ` +
        LUXURY_CINEMA_GUARDRAILS,
      suggestedCaption: `${dest} at golden hour, without a single rushed transfer.\n\nSunset anchor: ${featuredSpot.name}\nGet the full walkable Boarding Pass at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  if (formatId === 'quiet-passage') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `${framePrefix} gliding gently past warm glowing market stalls and picturesque lanes near ${spotLabel} in ${dest}. ` +
        `A calm, steady eye-level forward Steadicam drift through dappled light falling across traditional facades, artisanal produce displays, and textured cobblestones, ` +
        `authentic local life moving calmly in the soft distance, poetic slow-travel serenity. ` +
        `${soundscape.audioDirective} ` +
        LUXURY_CINEMA_GUARDRAILS,
      suggestedCaption: `"${spec.socialProofQuote || `Every stop in ${dest} was a quiet 10-minute walk apart.`}"\n\nWalkable route: ${spot1.name} → ${spot2.name} → ${spot3.name}\nPlan yours in seconds at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  if (formatId === 'twilight-courtyard') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `${framePrefix} at ${spotLabel} in ${dest} during quiet blue hour just after sunset. ` +
        `A slow, meditative camera drift across an intimate architectural courtyard and warm glowing lanterns against a deep indigo twilight sky, ` +
        `soft candlelight flickering subtly on glass and stone, rich shadows and refined warm tungsten highlights. ` +
        `${soundscape.audioDirective} ` +
        LUXURY_CINEMA_GUARDRAILS,
      suggestedCaption: `Evening pacing in ${dest}, curated around neighborhoods worth lingering in.\n\nDusk anchor: ${featuredSpot.name}\nClaim your free Boarding Pass at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  if (formatId === 'polaroid-alive') {
    return {
      format,
      featuredSpot,
      soundscapeSummary: soundscape.shortSummary,
      cinematographyPrompt:
        `Bring this exact ${dest} travel photograph gently to life as a calm, museum-grade 35mm cinema frame: ` +
        `preserve the exact landmark architecture and composition while adding subtle, realistic natural motion—soft clouds drifting, warm sunlight shimmering across water or stone, gentle breeze stirring foliage, and tiny distant lights twinkling. ` +
        `${soundscape.audioDirective} ` +
        LUXURY_CINEMA_GUARDRAILS,
      suggestedCaption: `Wish you were here: ${dest} ✨\n\nFrom postcard dream to walkable Boarding Pass in 30 seconds at whisk.travel · @whisk.travel\n\n${hashtags}`,
    };
  }

  // Default: 'architectural-morning'
  return {
    format,
    featuredSpot,
    soundscapeSummary: soundscape.shortSummary,
    cinematographyPrompt:
      `${framePrefix} arriving at ${spotLabel} in ${dest} just after sunrise before the crowds. ` +
      `A poised, slow tripod-mounted dolly-in framing sunlit architectural details, warm stone textures, and soft morning haze catching long golden shadows, ` +
      `gentle natural breeze stirring foliage, quiet museum-grade composition and serene pacing. ` +
      `${soundscape.audioDirective} ` +
      LUXURY_CINEMA_GUARDRAILS,
    suggestedCaption: `${spec.viralHook || `How ${dest} feels when your entire day fits in one walkable Boarding Pass.`}\n\nMorning stop: ${featuredSpot.name}\nFull route: ${spot1.name} · ${spot2.name} · ${spot3.name}\n\nBuild yours free at whisk.travel · @whisk.travel\n\n${hashtags}`,
  };
}
