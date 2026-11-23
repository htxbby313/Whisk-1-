import React from 'react';
import type { Itinerary } from '../utils/newItinerary';

interface Props {
  itinerary: Itinerary;
}

export const ItineraryCard: React.FC<Props> = ({ itinerary }) => {
  const { destination, dates, isPublic, anchors } = itinerary;
  const startDate = new Date(dates[0]).toLocaleDateString();
  const endDate = new Date(dates[dates.length - 1]).toLocaleDateString();
  return (
    <div className="border rounded p-4 shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-2">{destination}</h2>
      <p className="text-gray-600 mb-1">
        {startDate} – {endDate}
      </p>
      {anchors && anchors.length > 0 && (
        <div className="mt-2 mb-2">
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider block mb-1">
            Locked Anchors:
          </span>
          <div className="flex flex-wrap gap-1">
            {anchors.map((anchor, idx) => (
              <span
                key={idx}
                className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-medium"
              >
                📍 {anchor}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm">{isPublic ? 'Public itinerary' : 'Private'}</p>
    </div>
  );
};
