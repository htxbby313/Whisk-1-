/*  src/components/AuthModal.tsx  */
import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Mail,
  Compass,
  X,
  Globe,
  ShieldCheck,
  Crown,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { LegalTab } from './LegalModal';

/* ----------  USER PROFILE INTERFACE ---------- */
export interface UserProfile {
  name: string;
  email: string;
  travelStyle: string;
  avatarSeed: string;
  isSubscribed: boolean;
  isAdmin?: boolean;
  tripsCount: number;
}

/* ----------  COMPONENT PROPS ---------- */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

/* ----------  MAIN COMPONENT ---------- */
export default function AuthModal({
  isOpen,
  onClose,
  onSaveProfile,
  onOpenLegal,
}: AuthModalProps) {
  /* ----------- UI STATE ----------- */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [travelStyle, setTravelStyle] = useState('Cultural Explorer');
  const avatarSeed = 'Explorer_1';

  // ----------- NEW: login mode ----------
  const [isLogin, setIsLogin] = useState(false); // false = sign‑up, true = sign‑in
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // ----------- ADMIN DEMO ----------
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  /* ----------- FIREBASE INITIALISATION (ESM‑compatible) ----------- */
  // Dynamically require modules so the file works when the project is an ES‑module
  // (package.json contains `"type": "module"`).
  // eslint‑disable-next-line @typescript-eslint/no-var-requires
  const { createRequire } = require('module');
  const require = createRequire(import.meta.url);

  // eslint‑disable-next-line @typescript-eslint/no-var-requires
  const firebaseConfig = require('../firebase-applet-config.json');

  // eslint‑disable-next-line @typescript-eslint/no-var-requires
  const { initializeApp, getApps } = require('firebase/app');
  // eslint‑disable-next-line @typescript-eslint/no-var-requires
  const {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
  } = require('firebase/auth');

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  /* ----------- EMAIL / PASSWORD HANDLER ----------- */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isLogin) {
        // ----- SIGN‑IN -----
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const user = cred.user;
        onSaveProfile({
          name: user.displayName || email.split('@')[0],
          email: user.email || email,
          travelStyle: 'Explorer',
          avatarSeed: user.uid,
          isSubscribed: false,
          tripsCount: 0,
        });
      } else {
        // ----- SIGN‑UP -----
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const user = cred.user;
        onSaveProfile({
          name: user.displayName || email.split('@')[0],
          email: user.email || email,
          travelStyle: 'Explorer',
          avatarSeed: user.uid,
          isSubscribed: false,
          tripsCount: 0,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message ?? 'Authentication failed');
    }
  };

  /* ----------- GOOGLE SIGN‑IN ----------- */
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onSaveProfile({
        name: user.displayName || 'Guest',
        email: user.email || '',
        travelStyle: 'Explorer',
        avatarSeed: user.uid,
        isSubscribed: false,
        tripsCount: 0,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message ?? 'Google sign‑in failed');
    }
  };

  /* ----------- ADMIN DEMO HANDLER ---------- */
  const handleAdminDemoSignIn = () => {
    onSaveProfile({
      name: 'Coleman (Admin & Chief Scout)',
      email: 'admin@whisk.travel',
      travelStyle: 'Global Expedition Director',
      avatarSeed: 'AdminMaster',
      isSubscribed: true,
      isAdmin: true,
      tripsCount: 24,
    });
    onClose();
  };

  const handleVerifyAdminPassword = () => {
    const clean = adminPassword.trim().toLowerCase();
    if (['whisk2026', 'admin2026', 'admin', 'whiskadmin'].includes(clean)) {
      handleAdminDemoSignIn();
    } else {
      setAdminError('Incorrect Admin Passcode. Access denied.');
    }
  };

  /* ----------- EARLY EXIT ----------- */
  if (!isOpen) return null;

  /* --------------------------------------------------------------
     RENDER
  -------------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9F2] rounded-[3rem] p-8 md:p-10 shadow-2xl border-4 border-orange-200/70">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close auth modal"
          className="absolute top-6 right-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Traveler
            Membership
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isLogin ? 'Sign In to Whisk' : 'Create Your Whisk Profile'}
          </h2>
          <p className="text-slate-600 text-sm font-medium">
            {isLogin
              ? 'Enter your credentials to continue.'
              : 'Join Whisk to start planning. '}
            <span className="text-orange-600 font-bold">
              Your first trip itinerary preview is on us!
            </span>
          </p>
        </div>

        {/* ====================  FREE‑PLAN BANNER  ==================== */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-black text-slate-900 block">
              First Trip Preview: 100% Free
            </span>
            <span className="text-slate-500">
              Includes AI day‑by‑day preview. Upgrade to Passport anytime to
              reveal all days &amp; bookings.
            </span>
          </div>
        </div>

        {/* ====================  AUTH FORM  ==================== */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Name – used only for sign‑up */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              type="password"
              placeholder={isLogin ? 'Password' : 'Choose a password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          {/* Auth error */}
          {authError && (
            <p className="text-sm text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {authError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-[1.01] transition-transform"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle between Sign‑Up / Sign‑In */}
        <div className="text-center mt-3 text-xs text-slate-600">
          {isLogin ? (
            <>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-orange-600 font-semibold underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-orange-600 font-semibold underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* -------------------  GOOGLE SIGN‑IN  ------------------- */}
        <div className="my-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4"
            />
            Continue with Google
          </button>
        </div>

        {/* -------------------  ADMIN DEMO  ------------------- */}
        {!showAdminLogin ? (
          <button
            type="button"
            onClick={() => setShowAdminLogin(true)}
            className="w-full mb-3 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-amber-300"
          >
            <Lock className="w-4 h-4 text-yellow-200" />
            <span>Admin VIP Access (Password Required)</span>
          </button>
        ) : (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border-2 border-orange-300 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
                Admin Master Passcode Verification
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminError(null);
                  setAdminPassword('');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter master key (whisk2026)"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (adminError) setAdminError(null);
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleVerifyAdminPassword()
                }
                className="flex-1 px-3 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleVerifyAdminPassword}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow cursor-pointer transition-all shrink-0"
              >
                Verify
              </button>
            </div>
            {adminError && (
              <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {adminError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
