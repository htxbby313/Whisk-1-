import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const packingItems = pgTable('packing_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  itineraryId: text('itinerary_id').notNull(),
  destination: text('destination').notNull(),
  item: text('item').notNull(),
  category: text('category').notNull().default('Essentials'),
  isPacked: boolean('is_packed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tripNotes = pgTable('trip_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  itineraryId: text('itinerary_id').notNull(),
  destination: text('destination').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  packingItems: many(packingItems),
  tripNotes: many(tripNotes),
}));

export const packingItemsRelations = relations(packingItems, ({ one }) => ({
  owner: one(users, {
    fields: [packingItems.userId],
    references: [users.id],
  }),
}));

export const tripNotesRelations = relations(tripNotes, ({ one }) => ({
  owner: one(users, {
    fields: [tripNotes.userId],
    references: [users.id],
  }),
}));
