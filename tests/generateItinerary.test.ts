import { describe, it, expect, vi } from 'vitest';
import { generateItinerary } from '../geminiService';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            title: 'Alpine Escape',
            destination: 'Swiss Alps',
            duration: '3 Days',
            summary: 'A breathtaking adventure.',
            days: [
              {
                dayNumber: 1,
                theme: 'Arrival & Views',
                activities: [
                  {
                    time: '09:00',
                    description: 'Take the cable car',
                    location: 'Zermatt',
                  },
                ],
              },
            ],
            recommendations: [
              {
                name: 'The Peak Lodge',
                type: 'hotel',
                description: 'Cozy mountain hotel',
                affiliateUrl: 'https://example.com/hotel',
              },
            ],
          }),
        }),
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
    },
  };
});

describe('generateItinerary', () => {
  it('returns valid itinerary and wraps affiliate links', async () => {
    const params = {
      destination: 'Swiss Alps',
      duration: '3 Days',
      interests: ['Hiking'],
      budget: 'Moderate',
      pace: 'Active',
      accessibility: [],
    };

    const result = await generateItinerary(params as any);
    expect(result).toBeDefined();
    expect(result.title).toBe('Alpine Escape');
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].affiliateUrl).toContain('ref=whisk');
  });
});
