import {
  generateDemoItinerary,
  type Itinerary,
} from '../src/utils/newItinerary';

test('generateDemoItinerary creates a valid itinerary object', () => {
  const userId = 'user123';
  const destination = 'Paris';
  const start = new Date('2024-01-01T00:00:00Z');
  const days = 3;
  const isPublic = true;

  const itinerary: Itinerary = generateDemoItinerary(
    userId,
    destination,
    start,
    days,
    isPublic
  );

  // Basic shape checks
  expect(itinerary.userId).toBe(userId);
  expect(itinerary.destination).toBe(destination);
  expect(itinerary.isPublic).toBe(isPublic);
  expect(Array.isArray(itinerary.dates)).toBe(true);
  expect(itinerary.dates.length).toBe(days);
  // Verify timestamps are in ascending order
  for (let i = 1; i < itinerary.dates.length; i++) {
    expect(itinerary.dates[i]).toBeGreaterThan(itinerary.dates[i - 1]);
  }
});
