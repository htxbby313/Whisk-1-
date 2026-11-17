import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { packingItems, tripNotes, users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || `${uid}@users.local`,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || `${uid}@users.local`,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Database user synchronization failed.', { cause: error });
  }
}

export async function getPackingItemsForTrip(uid: string, itineraryId: string) {
  try {
    const rows = await db
      .select({
        id: packingItems.id,
        itineraryId: packingItems.itineraryId,
        destination: packingItems.destination,
        item: packingItems.item,
        category: packingItems.category,
        isPacked: packingItems.isPacked,
        createdAt: packingItems.createdAt,
      })
      .from(packingItems)
      .innerJoin(users, eq(packingItems.userId, users.id))
      .where(and(eq(users.uid, uid), eq(packingItems.itineraryId, itineraryId)))
      .orderBy(desc(packingItems.createdAt));

    return rows;
  } catch (error) {
    console.error('Failed to fetch packing items:', error);
    throw new Error('Failed to load packing checklist.', { cause: error });
  }
}

export async function createPackingItem(
  uid: string,
  email: string,
  displayName: string | undefined,
  input: {
    itineraryId: string;
    destination: string;
    item: string;
    category?: string;
  }
) {
  try {
    const userRecord = await getOrCreateUser(uid, email, displayName);
    const [created] = await db
      .insert(packingItems)
      .values({
        userId: userRecord.id,
        itineraryId: input.itineraryId,
        destination: input.destination,
        item: input.item,
        category: input.category || 'Essentials',
        isPacked: false,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Failed to create packing item:', error);
    throw new Error('Failed to save packing item.', { cause: error });
  }
}

export async function updatePackingItemStatus(
  uid: string,
  itemId: number,
  isPacked: boolean
) {
  try {
    const existing = await db
      .select({ id: packingItems.id })
      .from(packingItems)
      .innerJoin(users, eq(packingItems.userId, users.id))
      .where(and(eq(packingItems.id, itemId), eq(users.uid, uid)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const [updated] = await db
      .update(packingItems)
      .set({ isPacked })
      .where(eq(packingItems.id, itemId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Failed to update packing item:', error);
    throw new Error('Failed to update packing item.', { cause: error });
  }
}

export async function deletePackingItem(uid: string, itemId: number) {
  try {
    const existing = await db
      .select({ id: packingItems.id })
      .from(packingItems)
      .innerJoin(users, eq(packingItems.userId, users.id))
      .where(and(eq(packingItems.id, itemId), eq(users.uid, uid)))
      .limit(1);

    if (existing.length === 0) {
      return false;
    }

    await db.delete(packingItems).where(eq(packingItems.id, itemId));
    return true;
  } catch (error) {
    console.error('Failed to delete packing item:', error);
    throw new Error('Failed to delete packing item.', { cause: error });
  }
}

export async function getTripNotesForTrip(uid: string, itineraryId: string) {
  try {
    const rows = await db
      .select({
        id: tripNotes.id,
        itineraryId: tripNotes.itineraryId,
        destination: tripNotes.destination,
        title: tripNotes.title,
        content: tripNotes.content,
        rating: tripNotes.rating,
        createdAt: tripNotes.createdAt,
      })
      .from(tripNotes)
      .innerJoin(users, eq(tripNotes.userId, users.id))
      .where(and(eq(users.uid, uid), eq(tripNotes.itineraryId, itineraryId)))
      .orderBy(desc(tripNotes.createdAt));

    return rows;
  } catch (error) {
    console.error('Failed to fetch trip notes:', error);
    throw new Error('Failed to load trip journal notes.', { cause: error });
  }
}

export async function createTripNote(
  uid: string,
  email: string,
  displayName: string | undefined,
  input: {
    itineraryId: string;
    destination: string;
    title: string;
    content: string;
    rating?: number;
  }
) {
  try {
    const userRecord = await getOrCreateUser(uid, email, displayName);
    const [created] = await db
      .insert(tripNotes)
      .values({
        userId: userRecord.id,
        itineraryId: input.itineraryId,
        destination: input.destination,
        title: input.title,
        content: input.content,
        rating: typeof input.rating === 'number' ? Math.max(1, Math.min(5, Math.round(input.rating))) : 5,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Failed to create trip note:', error);
    throw new Error('Failed to save trip journal note.', { cause: error });
  }
}

export async function deleteTripNote(uid: string, noteId: number) {
  try {
    const existing = await db
      .select({ id: tripNotes.id })
      .from(tripNotes)
      .innerJoin(users, eq(tripNotes.userId, users.id))
      .where(and(eq(tripNotes.id, noteId), eq(users.uid, uid)))
      .limit(1);

    if (existing.length === 0) {
      return false;
    }

    await db.delete(tripNotes).where(eq(tripNotes.id, noteId));
    return true;
  } catch (error) {
    console.error('Failed to delete trip note:', error);
    throw new Error('Failed to delete trip journal note.', { cause: error });
  }
}
