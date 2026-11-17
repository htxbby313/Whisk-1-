"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentReceipt = exports.sendBookingConfirmation = exports.onUserTierUpgraded = exports.onUserProfileCreated = exports.sendPasswordReset = exports.sendVerificationEmail = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-functions/v2/firestore");
const emailService_1 = require("./emailService");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-whisk-9e848280-c7d4-4f26-b450-202664126b21';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/;
const adminDb = (0, firestore_1.getFirestore)(FIRESTORE_DATABASE_ID);
const adminAuth = (0, auth_1.getAuth)();
async function resolveOwnerEmail(uid) {
    try {
        const privateSnap = await adminDb
            .collection('users')
            .doc(uid)
            .collection('private')
            .doc('info')
            .get();
        const privateEmail = privateSnap.data()?.email;
        if ((0, emailService_1.isRealDeliverableEmail)(privateEmail)) {
            return privateEmail;
        }
    }
    catch (err) {
        firebase_functions_1.logger.warn('Could not read private email subcollection', { uid, err });
    }
    try {
        const authUser = await adminAuth.getUser(uid);
        if ((0, emailService_1.isRealDeliverableEmail)(authUser.email)) {
            return authUser.email;
        }
    }
    catch (err) {
        firebase_functions_1.logger.warn('Could not look up Firebase Auth user email', { uid, err });
    }
    return null;
}
/**
 * Callable: Sends an official Firebase email verification link using the verifyEmail template.
 */
exports.sendVerificationEmail = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required to verify your email.');
    }
    const uid = request.auth.uid;
    const email = await resolveOwnerEmail(uid);
    if (!email) {
        throw new https_1.HttpsError('failed-precondition', 'No deliverable email address is associated with this profile.');
    }
    const userRecord = await adminAuth.getUser(uid);
    const { appUrl } = (0, emailService_1.getLegalUrls)();
    const verificationLink = await adminAuth.generateEmailVerificationLink(email, {
        url: appUrl,
    });
    const result = await (0, emailService_1.sendTransactionalEmail)({
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
exports.sendPasswordReset = (0, https_1.onCall)({ cors: true }, async (request) => {
    const rawIdentifier = typeof request.data?.identifier === 'string'
        ? request.data.identifier.trim().toLowerCase()
        : '';
    if (!rawIdentifier) {
        throw new https_1.HttpsError('invalid-argument', 'An email address or username is required.');
    }
    let targetEmail = null;
    let userName = 'Traveler';
    try {
        if (rawIdentifier.includes('@') && !rawIdentifier.startsWith('@')) {
            const userRecord = await adminAuth.getUserByEmail(rawIdentifier);
            targetEmail = (0, emailService_1.isRealDeliverableEmail)(userRecord.email) ? userRecord.email : null;
            userName = userRecord.displayName || 'Traveler';
        }
        else {
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
            const { appUrl } = (0, emailService_1.getLegalUrls)();
            const resetLink = await adminAuth.generatePasswordResetLink(targetEmail, {
                url: appUrl,
            });
            await (0, emailService_1.sendTransactionalEmail)({
                to: targetEmail,
                subject: 'Reset your Whisk password',
                template: 'passwordReset',
                variables: {
                    userName,
                    resetLink,
                },
            });
        }
    }
    catch (err) {
        // Log internally while preserving non-enumerating external response
        firebase_functions_1.logger.warn('Password reset handling note', { err });
    }
    return {
        submitted: true,
        message: 'If an eligible account with a recovery email exists, reset instructions have been sent.',
    };
});
/**
 * Firestore Trigger: Sends welcome email when a consented traveler profile is created.
 */
exports.onUserProfileCreated = (0, firestore_2.onDocumentCreated)({
    document: 'users/{userId}',
    database: FIRESTORE_DATABASE_ID,
}, async (event) => {
    const userId = event.params.userId;
    const data = event.data?.data();
    if (!data || !data.legalConsentVersion) {
        return;
    }
    const email = await resolveOwnerEmail(userId);
    if (!email)
        return;
    await (0, emailService_1.sendTransactionalEmail)({
        to: email,
        subject: 'Welcome to Whisk — Start Planning Your Next Adventure',
        template: 'welcome',
        variables: {
            userName: typeof data.displayName === 'string' ? data.displayName : 'Traveler',
        },
    });
});
/**
 * Firestore Trigger: Automatically emails a payment receipt when membershipTier upgrades to Passport.
 */
exports.onUserTierUpgraded = (0, firestore_2.onDocumentUpdated)({
    document: 'users/{userId}',
    database: FIRESTORE_DATABASE_ID,
}, async (event) => {
    const beforeTier = event.data?.before.data()?.membershipTier;
    const afterData = event.data?.after.data();
    const afterTier = afterData?.membershipTier;
    if (!afterData || beforeTier === afterTier)
        return;
    if (afterTier !== 'Explorer' && afterTier !== 'Cartographer')
        return;
    const userId = event.params.userId;
    const email = await resolveOwnerEmail(userId);
    if (!email)
        return;
    const { appUrl } = (0, emailService_1.getLegalUrls)();
    const isAnnual = afterTier === 'Cartographer';
    const paymentId = `PASSPORT-${Date.now()}`;
    await (0, emailService_1.sendTransactionalEmail)({
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
});
/**
 * Callable: Sends an itinerary / booking verification confirmation email to the itinerary owner.
 */
exports.sendBookingConfirmation = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in is required.');
    }
    const uid = request.auth.uid;
    const itineraryId = typeof request.data?.itineraryId === 'string' ? request.data.itineraryId.trim() : '';
    if (!itineraryId) {
        throw new https_1.HttpsError('invalid-argument', 'itineraryId is required.');
    }
    const tripSnap = await adminDb.collection('itineraries').doc(itineraryId).get();
    if (!tripSnap.exists || tripSnap.data()?.ownerId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Itinerary not found for this traveler.');
    }
    const email = await resolveOwnerEmail(uid);
    if (!email) {
        throw new https_1.HttpsError('failed-precondition', 'No deliverable email address on file.');
    }
    const trip = tripSnap.data();
    const userRecord = await adminAuth.getUser(uid);
    const { appUrl } = (0, emailService_1.getLegalUrls)();
    const bookingId = typeof request.data?.bookingId === 'string' && request.data.bookingId.trim()
        ? request.data.bookingId.trim()
        : `WHISK-${itineraryId.slice(-6).toUpperCase()}`;
    return (0, emailService_1.sendTransactionalEmail)({
        to: email,
        subject: `Whisk Booking Confirmed – ${bookingId}`,
        template: 'bookingConfirmation',
        variables: {
            bookingId,
            userName: userRecord.displayName || 'Traveler',
            itineraryName: String(trip.title || trip.destination || 'Curated Whisk Itinerary'),
            startDate: typeof request.data?.startDate === 'string' && request.data.startDate.trim()
                ? request.data.startDate.trim()
                : 'Flexible Dates',
            endDate: typeof request.data?.endDate === 'string' && request.data.endDate.trim()
                ? request.data.endDate.trim()
                : String(trip.duration || 'Scheduled Trip'),
            bookingLink: `${appUrl}/`,
        },
    });
});
/**
 * Callable: Sends a payment receipt on demand (for example, Single-Trip Unlock purchases).
 */
exports.sendPaymentReceipt = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in is required.');
    }
    const uid = request.auth.uid;
    const email = await resolveOwnerEmail(uid);
    if (!email) {
        throw new https_1.HttpsError('failed-precondition', 'No deliverable email address on file.');
    }
    const userRecord = await adminAuth.getUser(uid);
    const { appUrl } = (0, emailService_1.getLegalUrls)();
    const paymentId = typeof request.data?.paymentId === 'string' && request.data.paymentId.trim()
        ? request.data.paymentId.trim()
        : `RCPT-${Date.now()}`;
    const amount = typeof request.data?.amount === 'string' ? request.data.amount : '4.99';
    const currency = typeof request.data?.currency === 'string' ? request.data.currency : 'USD';
    const itemDescription = typeof request.data?.itemDescription === 'string' && request.data.itemDescription.trim()
        ? request.data.itemDescription.trim()
        : 'Whisk Passport Single-Trip Unlock';
    return (0, emailService_1.sendTransactionalEmail)({
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
//# sourceMappingURL=index.js.map