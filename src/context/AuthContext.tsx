import * as React from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { appleProvider, auth, googleProvider } from '../firebase';
import {
  checkUserLegalConsentStatus,
  ensureUserProfile,
  isUsernameAvailable,
  isValidUsernameFormat,
  LegalConsentInput,
  normalizeUsername,
  reserveUsername,
  updateMembershipTier,
} from '../services/firestoreService';
import { recordLegalConsentBackend, syncAuthenticatedAccount } from '../../geminiService';
import { CURRENT_LEGAL_VERSION } from '../legal/catalog';
import { MembershipTier } from '../../types';

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  displayName: string;
  username?: string;
  acceptedLegal: boolean;
  marketingOptIn?: boolean;
}

export interface SignUpWithUsernameParams {
  username: string;
  password: string;
  email?: string;
  displayName?: string;
  acceptedLegal: boolean;
  marketingOptIn?: boolean;
}

export interface OAuthConsentParams {
  acceptedLegal: boolean;
  marketingOptIn?: boolean;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  membershipTier: MembershipTier;
  username: string | null;
  needsLegalConsent: boolean;
  legalConsentVersion: string | null;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: (oauthConsent?: OAuthConsentParams) => Promise<boolean>;
  signInWithApple: (oauthConsent?: OAuthConsentParams) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (params: SignUpWithEmailParams) => Promise<boolean>;
  signInWithUsername: (username: string, password: string) => Promise<boolean>;
  signUpWithUsername: (params: SignUpWithUsernameParams) => Promise<boolean>;
  sendResetPassword: (email: string) => Promise<boolean>;
  acceptLegalConsent: (options: { marketingOptIn: boolean }) => Promise<boolean>;
  declineLegalConsent: () => Promise<void>;
  logOut: () => Promise<void>;
  setTier: (tier: MembershipTier) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const SYNTHETIC_EMAIL_DOMAIN = 'users.whisk.app';

function formatAuthError(err: any, providerContext?: 'google' | 'apple' | 'email' | 'username'): string {
  const code = typeof err?.code === 'string' ? err.code : '';
  const msg = typeof err?.message === 'string' ? err.message : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in request was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/operation-not-allowed':
      if (providerContext === 'apple') {
        return 'Apple Sign-In is not enabled in Firebase Authentication yet. Enable Apple under Authentication > Sign-in method, or use Google, Email, or Username.';
      }
      if (providerContext === 'email' || providerContext === 'username') {
        return 'Email/Password sign-in is not enabled in Firebase Authentication yet. Enable Email/Password under Authentication > Sign-in method, or sign in with Google.';
      }
      return 'This sign-in method is not enabled in Firebase Authentication yet.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using another sign-in method. Try signing in with that method first.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return providerContext === 'username'
        ? 'Incorrect username or password.'
        : 'Incorrect email or password.';
    case 'auth/user-not-found':
      return providerContext === 'username'
        ? 'No traveler account found for that username.'
        : 'No traveler account found for that email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Network error while connecting. Check your connection and try again.';
    default:
      if (msg.includes('Missing or insufficient permissions')) {
        return 'Unable to complete profile setup due to Firestore permissions. Please try again.';
      }
      return msg || 'Sign-in failed. Please try again.';
  }
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [membershipTier, setMembershipTier] = React.useState<MembershipTier>('Wanderer');
  const [username, setUsername] = React.useState<string | null>(null);
  const [needsLegalConsent, setNeedsLegalConsent] = React.useState(false);
  const [legalConsentVersion, setLegalConsentVersion] = React.useState<string | null>(null);
  const [signingIn, setSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const manualSignupInFlightRef = React.useRef(false);
  const pendingOAuthConsentRef = React.useRef<LegalConsentInput | null>(null);

  const syncUserState = React.useCallback(
    async (
      targetUser: User,
      overrides?: {
        displayName?: string;
        username?: string;
        legalConsent?: LegalConsentInput;
      }
    ) => {
      const [profile, idToken] = await Promise.all([
        ensureUserProfile(targetUser, overrides),
        targetUser.getIdToken(),
      ]);
      setMembershipTier(profile.membershipTier);
      setUsername(profile.username || null);
      setLegalConsentVersion(profile.legalConsentVersion || null);
      setNeedsLegalConsent(false);

      syncAuthenticatedAccount(idToken).catch((syncErr) => {
        console.error('Non-fatal account sync error:', syncErr);
      });

      if (overrides?.legalConsent) {
        recordLegalConsentBackend(idToken, overrides.legalConsent).catch((consentErr) => {
          console.warn('Non-fatal backend consent audit log skipped:', consentErr);
        });
      }
    },
    []
  );

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (manualSignupInFlightRef.current) {
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        try {
          const status = await checkUserLegalConsentStatus(currentUser);
          const preConsent = pendingOAuthConsentRef.current;
          pendingOAuthConsentRef.current = null;

          if (status.hasProfile && status.hasLegalConsent) {
            await syncUserState(currentUser);
          } else if (preConsent) {
            await syncUserState(currentUser, { legalConsent: preConsent });
          } else {
            setMembershipTier(status.membershipTier);
            setUsername(status.username || null);
            setLegalConsentVersion(null);
            setNeedsLegalConsent(true);
          }
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        setMembershipTier('Wanderer');
        setUsername(null);
        setLegalConsentVersion(null);
        setNeedsLegalConsent(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [syncUserState]);

  const signInWithGoogle = async (oauthConsent?: OAuthConsentParams): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    pendingOAuthConsentRef.current = oauthConsent?.acceptedLegal
      ? {
          version: CURRENT_LEGAL_VERSION,
          marketingOptIn: Boolean(oauthConsent.marketingOptIn),
        }
      : null;
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: any) {
      pendingOAuthConsentRef.current = null;
      setAuthError(formatAuthError(err, 'google'));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithApple = async (oauthConsent?: OAuthConsentParams): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    pendingOAuthConsentRef.current = oauthConsent?.acceptedLegal
      ? {
          version: CURRENT_LEGAL_VERSION,
          marketingOptIn: Boolean(oauthConsent.marketingOptIn),
        }
      : null;
    try {
      await signInWithPopup(auth, appleProvider);
      return true;
    } catch (err: any) {
      pendingOAuthConsentRef.current = null;
      setAuthError(formatAuthError(err, 'apple'));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return false;
    }

    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      return true;
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'email'));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signUpWithEmail = async ({
    email,
    password,
    displayName,
    username: optionalUsername,
    acceptedLegal,
    marketingOptIn,
  }: SignUpWithEmailParams): Promise<boolean> => {
    if (!acceptedLegal) {
      setAuthError(
        'Please agree to the Terms of Service, Privacy Policy, and legal policies to create your profile.'
      );
      return false;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();
    const cleanUsername = optionalUsername ? normalizeUsername(optionalUsername) : '';

    if (!trimmedName) {
      setAuthError('Please enter your name.');
      return false;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return false;
    }
    if (cleanUsername && !isValidUsernameFormat(cleanUsername)) {
      setAuthError('Username must be 3-24 characters using letters, numbers, underscores, or hyphens.');
      return false;
    }

    setSigningIn(true);
    setAuthError(null);
    manualSignupInFlightRef.current = true;

    let createdUser: User | null = null;
    try {
      if (cleanUsername) {
        const available = await isUsernameAvailable(cleanUsername);
        if (!available) {
          setAuthError(`Username @${cleanUsername} is already taken.`);
          return false;
        }
      }

      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      createdUser = cred.user;
      await updateProfile(cred.user, { displayName: trimmedName });

      if (cleanUsername) {
        await reserveUsername(cred.user.uid, cleanUsername);
      }

      await syncUserState(cred.user, {
        displayName: trimmedName,
        username: cleanUsername || undefined,
        legalConsent: {
          version: CURRENT_LEGAL_VERSION,
          marketingOptIn: Boolean(marketingOptIn),
        },
      });
      setUser(cred.user);
      setAuthReady(true);
      return true;
    } catch (err: any) {
      if (createdUser && !err?.code?.startsWith?.('auth/')) {
        await createdUser.delete().catch(() => {});
        await signOut(auth).catch(() => {});
      }
      setAuthError(formatAuthError(err, 'email'));
      return false;
    } finally {
      manualSignupInFlightRef.current = false;
      setSigningIn(false);
    }
  };

  const signInWithUsername = async (rawUsername: string, password: string): Promise<boolean> => {
    const cleanUsername = normalizeUsername(rawUsername);
    if (!isValidUsernameFormat(cleanUsername)) {
      setAuthError('Username must be 3-24 characters using letters, numbers, underscores, or hyphens.');
      return false;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return false;
    }

    setSigningIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/resolve-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && typeof payload?.authEmail === 'string') {
        await signInWithEmailAndPassword(auth, payload.authEmail, password);
        return true;
      }

      if (res.status === 503 && payload?.code === 'ADMIN_UNAVAILABLE') {
        try {
          await signInWithEmailAndPassword(
            auth,
            `${cleanUsername}@${SYNTHETIC_EMAIL_DOMAIN}`,
            password
          );
          return true;
        } catch (fallbackErr: any) {
          setAuthError(formatAuthError(fallbackErr, 'username'));
          return false;
        }
      }

      setAuthError(payload?.error || `No traveler account found for @${cleanUsername}.`);
      return false;
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'username'));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signUpWithUsername = async ({
    username: rawUsername,
    password,
    email: optionalEmail,
    displayName,
    acceptedLegal,
    marketingOptIn,
  }: SignUpWithUsernameParams): Promise<boolean> => {
    if (!acceptedLegal) {
      setAuthError(
        'Please agree to the Terms of Service, Privacy Policy, and legal policies to create your profile.'
      );
      return false;
    }

    const cleanUsername = normalizeUsername(rawUsername);
    const trimmedEmail = (optionalEmail || '').trim().toLowerCase();
    const resolvedDisplayName = (displayName || '').trim() || cleanUsername;

    if (!isValidUsernameFormat(cleanUsername)) {
      setAuthError('Username must be 3-24 characters using letters, numbers, underscores, or hyphens.');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return false;
    }
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setAuthError('Please enter a valid recovery email address, or leave it blank.');
      return false;
    }

    const authEmail = trimmedEmail || `${cleanUsername}@${SYNTHETIC_EMAIL_DOMAIN}`;

    setSigningIn(true);
    setAuthError(null);
    manualSignupInFlightRef.current = true;

    let createdUser: User | null = null;
    try {
      const available = await isUsernameAvailable(cleanUsername);
      if (!available) {
        setAuthError(`Username @${cleanUsername} is already taken. Try another one.`);
        return false;
      }

      const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
      createdUser = cred.user;
      await updateProfile(cred.user, { displayName: resolvedDisplayName });
      await reserveUsername(cred.user.uid, cleanUsername);
      await syncUserState(cred.user, {
        displayName: resolvedDisplayName,
        username: cleanUsername,
        legalConsent: {
          version: CURRENT_LEGAL_VERSION,
          marketingOptIn: Boolean(marketingOptIn),
        },
      });
      setUser(cred.user);
      setAuthReady(true);
      return true;
    } catch (err: any) {
      if (createdUser && !err?.code?.startsWith?.('auth/')) {
        await createdUser.delete().catch(() => {});
        await signOut(auth).catch(() => {});
      }
      setAuthError(formatAuthError(err, 'username'));
      return false;
    } finally {
      manualSignupInFlightRef.current = false;
      setSigningIn(false);
    }
  };

  const sendResetPassword = async (email: string): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Please enter a valid email address for password reset.');
      return false;
    }
    setSigningIn(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      return true;
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'email'));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const acceptLegalConsent = async ({
    marketingOptIn,
  }: {
    marketingOptIn: boolean;
  }): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAuthError('No active session found. Please sign in again.');
      return false;
    }

    setSigningIn(true);
    setAuthError(null);
    try {
      await syncUserState(currentUser, {
        legalConsent: {
          version: CURRENT_LEGAL_VERSION,
          marketingOptIn: Boolean(marketingOptIn),
        },
      });
      return true;
    } catch (err: any) {
      setAuthError(formatAuthError(err));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const declineLegalConsent = async (): Promise<void> => {
    pendingOAuthConsentRef.current = null;
    setNeedsLegalConsent(false);
    setLegalConsentVersion(null);
    await signOut(auth);
  };

  const logOut = async () => {
    pendingOAuthConsentRef.current = null;
    await signOut(auth);
    setMembershipTier('Wanderer');
    setUsername(null);
    setLegalConsentVersion(null);
    setNeedsLegalConsent(false);
  };

  const setTier = async (tier: MembershipTier) => {
    setMembershipTier(tier);
    if (user) {
      await updateMembershipTier(user.uid, tier);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        membershipTier,
        username,
        needsLegalConsent,
        legalConsentVersion,
        signingIn,
        authError,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        signInWithUsername,
        signUpWithUsername,
        sendResetPassword,
        acceptLegalConsent,
        declineLegalConsent,
        logOut,
        setTier,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside FirebaseProvider');
  }
  return ctx;
};
