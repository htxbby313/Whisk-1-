import {
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BlogPost,
  ChatMessage,
  ChatMode,
  MembershipTier,
  SavedPlace,
  TripItinerary,
} from '../../types';

// --- Defensive Payload Helpers ---
const safeStr = (val: unknown, maxLen: number, fallback = ''): string => {
  const trimmed = typeof val === 'string' ? val.trim() : '';
  const chosen = trimmed.length > 0 ? trimmed : fallback;
  return chosen.slice(0, maxLen);
};

export const sanitizeId = (raw: string): string => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
};

const isPlainObject = (v: unknown): v is Record<string, any> => {
  if (!v || typeof v !== 'object') return false;
  if (v instanceof Date || v instanceof Timestamp || v instanceof FieldValue) {
    return false;
  }
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      if (Array.isArray(v)) {
        result[k] = v
          .filter((item) => item !== undefined)
          .map((item) => (isPlainObject(item) ? stripUndefined(item) : item));
      } else if (isPlainObject(v)) {
        result[k] = stripUndefined(v);
      } else {
        result[k] = v;
      }
    }
  }
  return result as T;
};

const toIsoString = (val: unknown): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
};

const CANONICAL_USER_KEYS = new Set([
  'uid',
  'displayName',
  'photoURL',
  'membershipTier',
  'createdAt',
  'updatedAt',
]);

// --- User Profile & PII Isolation ---
export async function ensureUserProfile(user: User): Promise<MembershipTier> {
  const userPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;

  let tier: MembershipTier = 'Wanderer';
  const userRef = doc(db, 'users', user.uid);
  let snap;

  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const displayName = safeStr(
    user.displayName || user.email?.split('@')[0],
    100,
    'Whisk Traveler'
  );
  const photoURL = user.photoURL ? safeStr(user.photoURL, 500) : undefined;

  if (!snap.exists()) {
    try {
      const payload = stripUndefined({
        uid: user.uid,
        displayName,
        photoURL: photoURL || undefined,
        membershipTier: 'Wanderer' as MembershipTier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(userRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  } else {
    const existingData = snap.data() || {};
    if (
      existingData.membershipTier === 'Explorer' ||
      existingData.membershipTier === 'Cartographer' ||
      existingData.membershipTier === 'Wanderer'
    ) {
      tier = existingData.membershipTier;
    }

    const existingKeys = Object.keys(existingData);
    const isCanonical =
      existingData.uid === user.uid &&
      typeof existingData.displayName === 'string' &&
      existingData.displayName.length >= 1 &&
      existingData.createdAt instanceof Timestamp &&
      existingData.updatedAt instanceof Timestamp &&
      (existingData.membershipTier === 'Wanderer' ||
        existingData.membershipTier === 'Explorer' ||
        existingData.membershipTier === 'Cartographer') &&
      existingKeys.every((k) => CANONICAL_USER_KEYS.has(k));

    try {
      if (isCanonical) {
        const updatePayload = stripUndefined({
          displayName,
          photoURL: photoURL || undefined,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(userRef, updatePayload);
      } else {
        const migratedPayload = stripUndefined({
          uid: user.uid,
          displayName,
          photoURL: photoURL || undefined,
          membershipTier: tier,
          createdAt:
            existingData.createdAt instanceof Timestamp
              ? existingData.createdAt
              : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(userRef, migratedPayload);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }

  // Write isolated PII record if email exists
  if (user.email) {
    try {
      const privateRef = doc(db, 'users', user.uid, 'private', 'info');
      await setDoc(privateRef, {
        uid: user.uid,
        email: safeStr(user.email, 200, 'traveler@whisk.local'),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }

  return tier;
}

export async function updateMembershipTier(uid: string, tier: MembershipTier): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      membershipTier: tier,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Itineraries ---
export async function saveItineraryToFirestore(
  uid: string,
  itinerary: TripItinerary
): Promise<void> {
  const id = sanitizeId(itinerary.id || `trip_${Date.now()}`);
  const path = `itineraries/${id}`;
  const ref = doc(db, 'itineraries', id);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const payload = stripUndefined({
    ownerId: uid,
    title: safeStr(itinerary.title, 200, 'Whisk Trip'),
    destination: safeStr(itinerary.destination, 150, 'Destination'),
    duration: safeStr(itinerary.duration, 50, '3 days'),
    summary: safeStr(itinerary.summary, 3000, ''),
    budget: itinerary.budget ? safeStr(itinerary.budget, 50) : undefined,
    pace: itinerary.pace ? safeStr(itinerary.pace, 50) : undefined,
    interests: Array.isArray(itinerary.interests)
      ? itinerary.interests.slice(0, 15).map((s) => safeStr(s, 80))
      : [],
    accessibility: Array.isArray(itinerary.accessibility)
      ? itinerary.accessibility.slice(0, 15).map((s) => safeStr(s, 80))
      : [],
    days:
      Array.isArray(itinerary.days) && itinerary.days.length > 0
        ? itinerary.days.slice(0, 30)
        : [{ dayNumber: 1, theme: 'Arrival', activities: [] }],
    recommendations: Array.isArray(itinerary.recommendations)
      ? itinerary.recommendations.slice(0, 30)
      : [],
    groundingSources: Array.isArray(itinerary.groundingSources)
      ? itinerary.groundingSources.slice(0, 40)
      : [],
    mapsOverview: itinerary.mapsOverview ? safeStr(itinerary.mapsOverview, 5000) : undefined,
    blogPost: itinerary.blogPost ? stripUndefined(itinerary.blogPost) : undefined,
    unlocked: Boolean(itinerary.unlocked),
    overallRating:
      typeof itinerary.overallRating === 'number'
        ? Math.max(0, Math.min(5, itinerary.overallRating))
        : 0,
    updatedAt: serverTimestamp(),
  });

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(
        ref,
        stripUndefined({
          days: payload.days,
          recommendations: payload.recommendations,
          groundingSources: payload.groundingSources,
          summary: payload.summary,
          updatedAt: serverTimestamp(),
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function updateItineraryBlogPostInFirestore(
  itineraryId: string,
  blogPost: BlogPost
): Promise<void> {
  const id = sanitizeId(itineraryId);
  const path = `itineraries/${id}`;
  try {
    await updateDoc(doc(db, 'itineraries', id), {
      blogPost: stripUndefined(blogPost),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unlockItineraryInFirestore(itineraryId: string): Promise<void> {
  const id = sanitizeId(itineraryId);
  const path = `itineraries/${id}`;
  try {
    await updateDoc(doc(db, 'itineraries', id), {
      unlocked: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteItineraryFromFirestore(itineraryId: string): Promise<void> {
  const id = sanitizeId(itineraryId);
  const path = `itineraries/${id}`;
  try {
    await deleteDoc(doc(db, 'itineraries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserItineraries(
  uid: string,
  onData: (trips: TripItinerary[]) => void
): Unsubscribe {
  const path = 'itineraries';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const trips: TripItinerary[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
          updatedAt: data.updatedAt ? toIsoString(data.updatedAt) : undefined,
        };
      });
      trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(trips);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// --- Saved / Favorite Places ---
export async function saveFavoritePlace(
  uid: string,
  place: Omit<SavedPlace, 'id' | 'ownerId' | 'createdAt'>
): Promise<string> {
  const placeId = sanitizeId(
    `place_${place.destination}_${place.name}`.toLowerCase()
  );
  const path = `users/${uid}/savedPlaces/${placeId}`;
  try {
    const payload = stripUndefined({
      ownerId: uid,
      name: safeStr(place.name, 200, 'Saved Spot'),
      type: place.type || 'place',
      destination: safeStr(place.destination, 150, 'Destination'),
      description: safeStr(place.description, 1000, ''),
      price: place.price ? safeStr(place.price, 80) : undefined,
      availability: place.availability ? safeStr(place.availability, 120) : undefined,
      affiliateUrl: place.affiliateUrl ? safeStr(place.affiliateUrl, 500) : undefined,
      mapsUri: place.mapsUri ? safeStr(place.mapsUri, 500) : undefined,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', uid, 'savedPlaces', placeId), payload);
    return placeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeFavoritePlace(uid: string, placeId: string): Promise<void> {
  const safePlaceId = sanitizeId(placeId);
  const path = `users/${uid}/savedPlaces/${safePlaceId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'savedPlaces', safePlaceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSavedPlaces(
  uid: string,
  onData: (places: SavedPlace[]) => void
): Unsubscribe {
  const path = `users/${uid}/savedPlaces`;
  const q = query(collection(db, 'users', uid, 'savedPlaces'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const places: SavedPlace[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<SavedPlace, 'id' | 'createdAt'>),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        };
      });
      places.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(places);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// --- Chat Sessions & Messages ---
export async function ensureChatSession(
  uid: string,
  sessionId: string,
  title: string,
  mode: ChatMode
): Promise<void> {
  const safeSessionId = sanitizeId(sessionId);
  const path = `users/${uid}/chatSessions/${safeSessionId}`;
  try {
    const ref = doc(db, 'users', uid, 'chatSessions', safeSessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        title: safeStr(title, 150, 'Travel Bestie Chat'),
        mode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        mode,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addChatMessageToFirestore(
  uid: string,
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const safeSessionId = sanitizeId(sessionId);
  const messageId = sanitizeId(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `users/${uid}/chatSessions/${safeSessionId}/messages/${messageId}`;
  try {
    const payload = stripUndefined({
      ownerId: uid,
      role: message.role,
      text: safeStr(message.text, 20000, '...'),
      mode: message.mode,
      model: message.model ? safeStr(message.model, 80) : undefined,
      groundingSources: Array.isArray(message.groundingSources)
        ? message.groundingSources.slice(0, 25)
        : undefined,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, 'users', uid, 'chatSessions', safeSessionId, 'messages', messageId),
      payload
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeChatMessages(
  uid: string,
  sessionId: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe {
  const safeSessionId = sanitizeId(sessionId);
  const path = `users/${uid}/chatSessions/${safeSessionId}/messages`;
  const q = query(
    collection(db, 'users', uid, 'chatSessions', safeSessionId, 'messages'),
    where('ownerId', '==', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<ChatMessage, 'id' | 'createdAt'>),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        };
      });
      msgs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      onData(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// --- Public SEO & GEO Field Guides (Organic Marketing Catalog) ---
export async function publishGuideToFirestore(
  uid: string,
  post: BlogPost
): Promise<void> {
  const guideId = sanitizeId(post.id || `guide_${Date.now()}`);
  const itineraryId = sanitizeId(post.itineraryId || `trip_${Date.now()}`);
  const path = `publishedGuides/${guideId}`;

  try {
    const cleanKeywords = Array.isArray(post.keywords)
      ? post.keywords.slice(0, 20).map((k) => safeStr(k, 80)).filter(Boolean)
      : [];
    const cleanNeighborhoods = Array.isArray(post.neighborhoods)
      ? post.neighborhoods.slice(0, 15).map((n) => safeStr(n, 80)).filter(Boolean)
      : undefined;
    const cleanFaqs = Array.isArray(post.faqs)
      ? post.faqs
          .slice(0, 10)
          .filter((f) => f && typeof f.question === 'string' && typeof f.answer === 'string')
          .map((f) => ({
            question: safeStr(f.question, 240),
            answer: safeStr(f.answer, 800),
          }))
      : undefined;

    const cleanCoords =
      post.geoCoordinates &&
      typeof post.geoCoordinates.latitude === 'number' &&
      typeof post.geoCoordinates.longitude === 'number'
        ? {
            latitude: post.geoCoordinates.latitude,
            longitude: post.geoCoordinates.longitude,
          }
        : undefined;

    const payload = stripUndefined({
      ownerId: uid,
      itineraryId,
      slug: post.slug ? safeStr(post.slug, 180) : undefined,
      title: safeStr(post.title, 200, `Explore ${post.destination}`),
      seoTitle: post.seoTitle ? safeStr(post.seoTitle, 120) : undefined,
      metaDescription: safeStr(post.metaDescription, 320, `Local travel guide for ${post.destination}`),
      geoSummary: post.geoSummary ? safeStr(post.geoSummary, 1200) : undefined,
      content: safeStr(post.content, 20000, post.metaDescription),
      destination: safeStr(post.destination, 150, 'Destination'),
      imageUrl: safeStr(post.imageUrl, 500, '/'),
      keywords: cleanKeywords,
      neighborhoods: cleanNeighborhoods,
      faqs: cleanFaqs,
      geoCoordinates: cleanCoords,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'publishedGuides', guideId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribePublicGuides(
  onData: (posts: BlogPost[]) => void
): Unsubscribe {
  const path = 'publishedGuides';
  const q = query(collection(db, path), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts: BlogPost[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<BlogPost, 'id' | 'createdAt'>),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        };
      });
      posts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onData(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

