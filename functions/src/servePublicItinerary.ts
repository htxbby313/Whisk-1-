import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin';


initializeApp();
const db = getFirestore();

/** Simple SEO‑optimized HTML page for a public itinerary */
export const servePublicItinerary = onRequest({
  region: 'us-central1',
  // Increase timeout for rendering if needed
  timeoutSeconds: 10,
}, async (req, res) => {
  const slug = req.path.replace('/blog/', '').replace(/^\/|\/$/g, '');
  if (!slug) {
    res.status(400).send('Missing slug');
    return;
  }

  const docRef = db.collection('publicItineraries').doc(slug);
  // Transaction: read doc, increment clicks, return data
  const result = await db.runTransaction(async t => {
    const snap = await t.get(docRef);
    if (!snap.exists) return null;
    const data = snap.data();
    const newClicks = (data?.clicks ?? 0) + 1;
    t.update(docRef, { clicks: newClicks });
    // Log analytics entry
    const analyticsRef = db.collection('pageViews').doc();
    t.set(analyticsRef, {
      slug,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.headers['x-forwarded-for'] || req.ip || null,
    });
    return { ...data, clicks: newClicks };
  });

  if (!result) {
    res.status(404).send('Itinerary not found');
    return;
  }

  const { destination, season, days, clicks, createdAt } = result;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${destination} – ${season} Travel Itinerary</title>
  <meta name="description" content="Explore a ${season.toLowerCase()} ${destination} trip plan spanning ${days} days." />
  <meta name="robots" content="index,follow" />
  <!-- Open Graph for SEO -->
  <meta property="og:title" content="${destination} – ${season} Itinerary" />
  <meta property="og:description" content="A ${days}-day ${season.toLowerCase()} travel plan for ${destination}." />
  <meta property="og:type" content="website" />
</head>
<body>
  <h1>${destination} – ${season} Itinerary</h1>
  <p>Duration: ${days} days</p>
  <p>Views: ${clicks}</p>
  <p>Published: ${createdAt instanceof Object && createdAt.toDate ? createdAt.toDate().toDateString() : new Date(createdAt).toDateString()}</p>
  <!-- Placeholder for affiliate widgets -->
  <div id="affiliate-widgets">
    <!-- Skyscanner & Booking.com widgets will be injected here -->
  </div>
</body>
</html>`;
  res.set('Cache-Control', 'public, max-age=300'); // short cache for freshness
  res.send(html);
});
