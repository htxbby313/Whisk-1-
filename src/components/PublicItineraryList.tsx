import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // your initialized firestore instance
import { Link } from 'react-router-dom';

interface PublicItinerary {
  id: string;
  slug: string;
  destination: string;
  season: string; // e.g., "Spring"
  days: number;
  clicks: number;
  createdAt: any; // Timestamp
}

export const PublicItineraryList: React.FC = () => {
  const [items, setItems] = useState<PublicItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const q = query(
          collection(db, 'publicItineraries'),
          orderBy('clicks', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const data: PublicItinerary[] = [];
        snapshot.forEach(doc => {
          const d = doc.data() as any;
          data.push({
            id: doc.id,
            slug: d.slug,
            destination: d.destination,
            season: d.season,
            days: d.days,
            clicks: d.clicks ?? 0,
            createdAt: d.createdAt,
          });
        });
        setItems(data);
      } catch (e) {
        console.error('Failed to load public itineraries', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, []);

  if (loading) return <p className="text-gray-600">Loading itineraries…</p>;
  if (!items.length) return <p className="text-gray-600">No public itineraries yet.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(it => (
        <Link
          key={it.id}
          to={`/blog/${it.slug}`}
          className="block rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-1">{it.destination}</h3>
          <p className="text-sm text-gray-500">{it.season} • {it.days} days</p>
          <p className="text-xs text-gray-400 mt-2">{it.clicks} views</p>
        </Link>
      ))}
    </div>
  );
};
