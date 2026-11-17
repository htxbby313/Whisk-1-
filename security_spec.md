# Whisk Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Owner-Only Identity Integrity**: Every document across `users/{userId}`, `users/{userId}/private/{docId}`, `users/{userId}/savedPlaces/{placeId}`, `users/{userId}/chatSessions/{sessionId}`, `users/{userId}/chatSessions/{sessionId}/messages/{messageId}`, and `itineraries/{itineraryId}` MUST store an owner UID (`uid` or `ownerId`) strictly equal to `request.auth.uid`, and require `request.auth.token.email_verified == true`.
2. **Master Gate Relational Sync**: Subcollections (`savedPlaces`, `chatSessions`, `messages`, `private`) MUST verify the existence of their parent document using `exists(...)` on `create` and `update`, and verify path `{userId}` matches `request.auth.uid`.
3. **PII Isolation**: User email addresses are stored exclusively in `/users/{userId}/private/info` and are strictly isolated to `isOwner(userId)` (`get` and `write`). Blanket `isSignedIn()` reads on `users` or `private` are forbidden.
4. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, and `createdAt` are immutable after creation (`incoming().ownerId == existing().ownerId`, `incoming().createdAt == existing().createdAt`). `createdAt` and `updatedAt` MUST equal `request.time`.
5. **Bounded Arrays & String Lengths**: Every string enforces explicit `.size() <= maxLength` matching `firebase-blueprint.json`. All arrays (`interests`, `accessibility`, `days`, `recommendations`, `groundingSources`) enforce explicit upper `.size()` bounds. Unbounded chat histories use the `messages` subcollection instead of an array.
6. **Path Variable Hardening**: Every single-document target (`get`, `create`, `update`, `delete`) validates document IDs via `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars). `list` queries never call `isValidId()` and never use `get()`/`exists()`, instead enforcing `resource.data.ownerId == request.auth.uid`.

## 2. "Dirty Dozen" Attack Payloads (All MUST Return PERMISSION_DENIED)

1. **Identity Spoofing on Itinerary Create**: Signed-in user `alice` creates `/itineraries/trip1` with `ownerId: "bob"`.
2. **Unverified Email Write**: Signed-in user with `email_verified: false` attempts to create `/users/alice`.
3. **Ghost Field / Shadow Update**: User `alice` creates `/users/alice` with extra unknown field `isAdmin: true` or `role: "admin"`.
4. **Path ID Poisoning**: User creates `/itineraries/bad$id..with..chars` or a 200-character document ID.
5. **Cross-User PII Read**: User `bob` attempts `get` on `/users/alice/private/info` or `/users/alice`.
6. **Blanket List Scraping**: User `bob` lists `/itineraries` without a `where('ownerId', '==', 'bob')` filter.
7. **Owner Mutation on Update**: User `alice` updates `/itineraries/trip1` trying to transfer `ownerId` to `"bob"`.
8. **Timestamp Forgery**: User `alice` creates `/itineraries/trip1` with backdated client `createdAt` (`Timestamp(2020-01-01)`) instead of `request.time`.
9. **Oversized Payload / Denial of Wallet**: User `alice` sends a 10KB `destination` string or 50-item `interests` array.
10. **Orphaned Chat Message Create**: User `alice` creates `/users/alice/chatSessions/missingSession/messages/msg1` when `missingSession` does not exist.
11. **Tiered Update Bypass**: User `alice` updates `/users/alice` trying to change `createdAt` or `uid` alongside `membershipTier`.
12. **Type Poisoning on Update**: User `alice` updates `/itineraries/trip1` setting `unlocked: "yes"` (string instead of boolean) or `overallRating: 99`.
