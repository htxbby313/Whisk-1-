import * as React from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ensureUserProfile, updateMembershipTier } from '../services/firestoreService';
import { syncAuthenticatedAccount } from '../../geminiService';
import { MembershipTier } from '../../types';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  membershipTier: MembershipTier;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  setTier: (tier: MembershipTier) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [membershipTier, setMembershipTier] = React.useState<MembershipTier>('Wanderer');
  const [signingIn, setSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const [tier, idToken] = await Promise.all([
            ensureUserProfile(currentUser),
            currentUser.getIdToken(),
          ]);
          setMembershipTier(tier);
          syncAuthenticatedAccount(idToken).catch((syncErr) => {
            console.error('Non-fatal account sync error:', syncErr);
          });
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        setMembershipTier('Wanderer');
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setAuthError(err?.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logOut = async () => {
    await signOut(auth);
    setMembershipTier('Wanderer');
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
        signingIn,
        authError,
        signInWithGoogle,
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
