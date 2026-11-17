import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  getLegalUrls,
  isRealDeliverableEmail,
  sendTransactionalEmail,
} from './emailService';

if (!getApps().length) {
  initializeApp();
}

const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-whisk-9e848280-c7d4-4f26-b450-202664126b21';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/;

const adminDb = getFirestore(FIRESTORE_DATABASE_ID);
const adminAuth = getAuth();

async function resolveOwnerEmail(uid: string): Promise<string | null> {
  try {
    const privateSnap = await adminDb
      .collection('users')
      .doc(uid)
      .collection('private')
      .doc('info')
      .get();
    const privateEmail = privateSnap.data()?.email;
    if (isRealDeliverableEmail(privateEmail)) {
      return privateEmail;
    }
  } catch (err) {
    logger.warn('Could not read private email subcollection', { uid, err });
  }

  try {
    const authUser = await adminAuth.getUser(uid);
    if (isRealDeliverableEmail(authUser.email)) {
      return authUser.email;
    }
  } catch (err) {
    logger.warn('Could not look up Firebase Auth user email', { uid, err });
  }

  return null;
}

/**
 * Callable: Sends an official Firebase email verification link using the verifyEmail template.
 */
export const sendVerificationEmail = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required to verify your email.');
  }

  const uid = request.auth.uid;
  const email = await resolveOwnerEmail(uid);
  if (!email) {
    throw new HttpsError(
      'failed-precondition',
      'No deliverable email address is associated with this profile.'
    );
  }

  const userRecord = await adminAuth.getUser(uid);
  const { appUrl } = getLegalUrls();
  const verificationLink = await adminAuth.generateEmailVerificationLink(email, {
    url: appUrl,
  });

  const result = await sendTransactionalEmail({
    to: email,
    subject: 'Verify your Whisk email address',
    template: 'verifyEmail',
    variables: {
      userName: userRecord.displayName || 'Traveler',
      verificationLink,
    },
  });

  return result;
});

/**
 * Callable: Generates and sends a password-reset email for either email or @username accounts.
 * Never reveals whether an email or username exists in public responses.
 */
export const sendPasswordReset = onCall({ cors: true }, async (request) => {
  const rawIdentifier =
    typeof request.data?.identifier === 'string'
      ? request.data.identifier.trim().toLowerCase()
      : '';

  if (!rawIdentifier) {
    throw new HttpsError('invalid-argument', 'An email address or username is required.');
  }

  let targetEmail: string | null = null;
  let userName = 'Traveler';

  try {
    if (rawIdentifier.includes('@') && !rawIdentifier.startsWith('@')) {
      const userRecord = await adminAuth.getUserByEmail(rawIdentifier);
      targetEmail = isRealDeliverableEmail(userRecord.email) ? userRecord.email : null;
      userName = userRecord.displayName || 'Traveler';
    } else {
      const handle = rawIdentifier.replace(/^@+/, '');
      if (USERNAME_PATTERN.test(handle)) {
        const usernameSnap = await adminDb.collection('usernames').doc(handle).get();
        const uid = usernameSnap.data()?.uid;
        if (typeof uid === 'string' && uid) {
          const userRecord = await adminAuth.getUser(uid);
          targetEmail = await resolveOwnerEmail(uid);
          userName = userRecord.displayName || `@${handle}`;
        }
      }
    }

    if (targetEmail) {
      const { appUrl } = getLegalUrls();
      const resetLink = await adminAuth.generatePasswordResetLink(targetEmail, {
        url: appUrl,
      });
      await sendTransactionalEmail({
        to: targetEmail,
        subject: 'Reset your Whisk password',
        template: 'passwordReset',
        variables: {
          userName,
          resetLink,
        },
      });
    }
  } catch (err) {
    // Log internally while preserving non-enumerating external response
    logger.warn('Password reset handling note', { err });
  }

  return {
    submitted: true,
    message: 'If an eligible account with a recovery email exists, reset instructions have been sent.',
  };
});

/**
 * Firestore Trigger: Sends welcome email when a consented traveler profile is created.
 */
export const onUserProfileCreated = onDocumentCreated(
  {
    document: 'users/{userId}',
    database: FIRESTORE_DATABASE_ID,
  },
  async (event) => {
    const userId = event.params.userId;
    const data = event.data?.data();
    if (!data || !data.legalConsentVersion) {
      return;
    }

    const email = await resolveOwnerEmail(userId);
    if (!email) return;

    await sendTransactionalEmail({
      to: email,
      subject: 'Welcome to Whisk — Start Planning Your Next Adventure',
      template: 'welcome',
      variables: {
        userName: typeof data.displayName === 'string' ? data.displayName : 'Traveler',
      },
    });
  }
);

/**
 * Firestore Trigger: Automatically emails a payment receipt when membershipTier upgrades to Passport.
 */
export const onUserTierUpgraded = onDocumentUpdated(
  {
    document: 'users/{userId}',
    database: FIRESTORE_DATABASE_ID,
  },
  async (event) => {
    const beforeTier = event.data?.before.data()?.membershipTier;
    const afterData = event.data?.after.data();
    const afterTier = afterData?.membershipTier;

    if (!afterData || beforeTier === afterTier) return;
    if (afterTier !== 'Explorer' && afterTier !== 'Cartographer') return;

    const userId = event.params.userId;
    const email = await resolveOwnerEmail(userId);
    if (!email) return;

    const { appUrl } = getLegalUrls();
    const isAnnual = afterTier === 'Cartographer';
    const paymentId = `PASSPORT-${Date.now()}`;

    await sendTransactionalEmail({
      to: email,
      subject: `Whisk Payment Receipt (${paymentId})`,
      template: 'paymentReceipt',
      variables: {
        userName: typeof afterData.displayName === 'string' ? afterData.displayName : 'Traveler',
        paymentId,
        currency: 'USD',
        amount: isAnnual ? '79.99' : '9.99',
        itemDescription: isAnnual
          ? 'Whisk Annual Passport Subscription'
          : 'Whisk Monthly Passport Subscription',
        invoiceLink: `${appUrl}/`,
      },
    });
  }
);

/**
 * Callable: Sends an itinerary / booking verification confirmation email to the itinerary owner.
 */
export const sendBookingConfirmation = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in is required.');
  }

  const uid = request.auth.uid;
  const itineraryId =
    typeof request.data?.itineraryId === 'string' ? request.data.itineraryId.trim() : '';
  if (!itineraryId) {
    throw new HttpsError('invalid-argument', 'itineraryId is required.');
  }

  const tripSnap = await adminDb.collection('itineraries').doc(itineraryId).get();
  if (!tripSnap.exists || tripSnap.data()?.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'Itinerary not found for this traveler.');
  }

  const email = await resolveOwnerEmail(uid);
  if (!email) {
    throw new HttpsError('failed-precondition', 'No deliverable email address on file.');
  }

  const trip = tripSnap.data()!;
  const userRecord = await adminAuth.getUser(uid);
  const { appUrl } = getLegalUrls();
  const bookingId =
    typeof request.data?.bookingId === 'string' && request.data.bookingId.trim()
      ? request.data.bookingId.trim()
      : `WHISK-${itineraryId.slice(-6).toUpperCase()}`;

  return sendTransactionalEmail({
    to: email,
    subject: `Whisk Booking Confirmed – ${bookingId}`,
    template: 'bookingConfirmation',
    variables: {
      bookingId,
      userName: userRecord.displayName || 'Traveler',
      itineraryName: String(trip.title || trip.destination || 'Curated Whisk Itinerary'),
      startDate:
        typeof request.data?.startDate === 'string' && request.data.startDate.trim()
          ? request.data.startDate.trim()
          : 'Flexible Dates',
      endDate:
        typeof request.data?.endDate === 'string' && request.data.endDate.trim()
          ? request.data.endDate.trim()
          : String(trip.duration || 'Scheduled Trip'),
      bookingLink: `${appUrl}/`,
    },
  });
});

/**
 * Callable: Sends a payment receipt on demand (for example, Single-Trip Unlock purchases).
 */
export const sendPaymentReceipt = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in is required.');
  }

  const uid = request.auth.uid;
  const email = await resolveOwnerEmail(uid);
  if (!email) {
    throw new HttpsError('failed-precondition', 'No deliverable email address on file.');
  }

  const userRecord = await adminAuth.getUser(uid);
  const { appUrl } = getLegalUrls();
  const paymentId =
    typeof request.data?.paymentId === 'string' && request.data.paymentId.trim()
      ? request.data.paymentId.trim()
      : `RCPT-${Date.now()}`;
  const amount = typeof request.data?.amount === 'string' ? request.data.amount : '4.99';
  const currency = typeof request.data?.currency === 'string' ? request.data.currency : 'USD';
  const itemDescription =
    typeof request.data?.itemDescription === 'string' && request.data.itemDescription.trim()
      ? request.data.itemDescription.trim()
      : 'Whisk Passport Single-Trip Unlock';

  return sendTransactionalEmail({
    to: email,
    subject: `Whisk Payment Receipt (${paymentId})`,
    template: 'paymentReceipt',
    variables: {
      userName: userRecord.displayName || 'Traveler',
      paymentId,
      currency,
      amount,
      itemDescription,
      invoiceLink: `${appUrl}/`,
    },
  });
});
