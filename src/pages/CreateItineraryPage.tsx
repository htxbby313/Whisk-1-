import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { ItineraryCard } from '../components/ItineraryCard';
import { showToast } from '../utils/toast'; // toast helper
import { generateDemoItinerary, type Itinerary } from '../utils/newItinerary';
import firebaseConfig from '../firebaseConfig'; // adjust path if needed

// Initialize Firebase app (client side)
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const createItinerary = httpsCallable(functions, 'createItinerary');

export const CreateItineraryPage: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    // format as YYYY-MM-DD for input[type=date]
    return today.toISOString().split('T')[0];
  });
  const [flights, setFlights] = useState(''); // comma‑separated list
  const [hotels, setHotels] = useState(''); // comma‑separated list
  const [anchors, setAnchors] = useState(''); // comma‑separated must-see spots
  const [isPublic, setIsPublic] = useState(true);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      setError('You must be signed in to create an itinerary.');
      return;
    }
    const start = new Date(startDate);
    const flightList = flights.split(',').map(s => s.trim()).filter(Boolean);
    const hotelList = hotels.split(',').map(s => s.trim()).filter(Boolean);
    const anchorList = anchors.split(',').map(s => s.trim()).filter(Boolean);
    const itinerary: Itinerary = generateDemoItinerary(
      user.uid,
      destination,
      start,
      days,
      isPublic,
      flightList,
      hotelList,
      undefined, // businessHours could be added later
      anchorList
    );

    try {
      const resp = await createItinerary({
        userId: itinerary.userId,
        destination: itinerary.destination,
        dates: itinerary.dates,
        isPublic: itinerary.isPublic,
        flights: itinerary.flights,
        hotels: itinerary.hotels,
        anchors: itinerary.anchors,
        // businessHours omitted for now
      });
      const data = (resp as any).data;
      setResultId(data.itineraryId);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create itinerary');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create a new itinerary</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Destination</label>
          <input
            type="text"
            required
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Start date (planned)</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Days</label>
          <input
            type="number"
            min={1}
            required
            value={days}
            onChange={e => setDays(parseInt(e.target.value, 10) || 1)}
            className="border rounded w-full p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Flights (comma‑separated IDs)</label>
          <input
            type="text"
            placeholder="e.g. AA123, DL456"
            value={flights}
            onChange={e => setFlights(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Hotels (comma‑separated IDs)</label>
          <input
            type="text"
            placeholder="e.g. Hilton, Marriott"
            value={hotels}
            onChange={e => setHotels(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold flex items-center justify-between">
            <span>Must-See Spots / Anchors (Optional)</span>
            <span className="text-xs font-normal text-orange-600 font-medium">📍 Anchor &amp; Branch</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Chez Janou, Sunset at Sacré-Cœur, Le Marais vintage shops"
            value={anchors}
            onChange={e => setAnchors(e.target.value)}
            className="border rounded w-full p-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Been here before or have non-negotiable stops? Whisk locks these in and crafts unique, off-the-radar local discoveries around each one.
          </p>
        </div>
        <div className="flex items-center">
          <input
            id="public"
            type="checkbox"
            checked={isPublic}
            onChange={e => {
              setIsPublic(e.target.checked);
              if (e.target.checked) {
                // Show toast informing about public itinerary and blog generation
                showToast('Your itinerary is public and will generate a blog post.');
              }
            }}
          />
          <label htmlFor="public" className="ml-2">Make public &amp; share</label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {resultId && (
        <div className="mt-6">
          <p className="font-medium">Itinerary created! ID: <code>{resultId}</code></p>
          {/* Show a preview card using the same data we sent */}
          <ItineraryCard
            itinerary={generateDemoItinerary('tmp', destination, new Date(startDate), days, isPublic, [], [], undefined, anchors.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
      )}
    </div>
  );
};
