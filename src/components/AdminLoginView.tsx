import * as React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WhiskLogo } from './WhiskLogo';

interface AdminLoginViewProps {
  onNavigateHome: () => void;
  accessDeniedMessage?: string | null;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onNavigateHome,
  accessDeniedMessage,
}) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signingIn,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const displayedError = localError || authError || accessDeniedMessage || null;

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    await signInWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    if (!email.trim() || !password) {
      setLocalError('Enter both your administrator email and password.');
      return;
    }
    await signInWithEmail(email, password);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <WhiskLogo size={34} className="drop-shadow-xs" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight whisk-text-ombre">
                Whisk
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-semibold text-slate-600">
                Admin Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[var(--whisk-navy)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Whisk
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[var(--whisk-navy)]">
                Administrator Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-verified access to Whisk operations
              </p>
            </div>
          </div>

          {displayedError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2.5 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{displayedError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-[var(--whisk-navy)] flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.65Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.29v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4.01-3.1Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.1C6.23 6.87 8.88 4.76 12 4.76Z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@whisk.travel"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-sm text-[var(--whisk-navy)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 bg-white text-sm text-[var(--whisk-navy)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full h-11 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{signingIn ? 'Verifying...' : 'Sign In to Admin Console'}</span>
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Access is enforced by Firestore security rules. Only accounts assigned the{' '}
            <span className="font-semibold text-slate-700">admin</span> role can enter{' '}
            <span className="font-mono text-slate-700">/admin</span>. Non-admin accounts are automatically redirected back to Whisk.
          </p>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-slate-400">
        Whisk Operations · Protected Route
      </footer>
    </div>
  );
};
