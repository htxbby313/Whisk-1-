import * as React from 'react';
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LegalDocId } from '../legal/catalog';
import { isValidUsernameFormat, normalizeUsername } from '../services/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegalDoc: (docId: LegalDocId) => void;
  title?: string;
  subtitle?: string;
}

type AuthMode = 'signin' | 'signup' | 'reset';
type CredentialMethod = 'email' | 'username';

const GoogleMark = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

const AppleMark = () => (
  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenLegalDoc,
  title,
  subtitle,
}) => {
  const {
    signingIn,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signInWithUsername,
    signUpWithUsername,
    sendResetPassword,
  } = useAuth();

  const [mode, setMode] = React.useState<AuthMode>('signin');
  const [method, setMethod] = React.useState<CredentialMethod>('email');

  const [email, setEmail] = React.useState('');
  const [usernameInput, setUsernameInput] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [recoveryEmail, setRecoveryEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const [agreedToLegal, setAgreedToLegal] = React.useState(false);
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);

  const [localError, setLocalError] = React.useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resetMessages = React.useCallback(() => {
    setLocalError(null);
    setResetSentTo(null);
    clearAuthError();
  }, [clearAuthError]);

  if (!isOpen) return null;

  const normalizedHandle = normalizeUsername(usernameInput);
  const isHandleValid = !normalizedHandle || isValidUsernameFormat(normalizedHandle);
  const displayedError = localError || authError;

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
  };

  const handleMethodChange = (nextMethod: CredentialMethod) => {
    setMethod(nextMethod);
    resetMessages();
  };

  const handleGoogleClick = async () => {
    resetMessages();
    if (mode === 'signup' && !agreedToLegal) {
      setLocalError(
        'Please agree to the Terms of Service, Privacy Policy, and legal policies below before creating your profile.'
      );
      return;
    }
    const ok = await signInWithGoogle(
      mode === 'signup' ? { acceptedLegal: true, marketingOptIn } : undefined
    );
    if (ok) onClose();
  };

  const handleAppleClick = async () => {
    resetMessages();
    if (mode === 'signup' && !agreedToLegal) {
      setLocalError(
        'Please agree to the Terms of Service, Privacy Policy, and legal policies below before creating your profile.'
      );
      return;
    }
    const ok = await signInWithApple(
      mode === 'signup' ? { acceptedLegal: true, marketingOptIn } : undefined
    );
    if (ok) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (mode === 'reset') {
      const ok = await sendResetPassword(email);
      if (ok) {
        setResetSentTo(email.trim().toLowerCase());
      }
      return;
    }

    if (mode === 'signup' && !agreedToLegal) {
      setLocalError(
        'Please agree to the Terms of Service, Privacy Policy, Cookie Policy, UGC Policy, Refund Policy, and Travel Disclaimer before creating your profile.'
      );
      return;
    }

    if (method === 'email') {
      if (mode === 'signin') {
        const ok = await signInWithEmail(email, password);
        if (ok) onClose();
      } else {
        const ok = await signUpWithEmail({
          email,
          password,
          displayName,
          username: usernameInput.trim() || undefined,
          acceptedLegal: agreedToLegal,
          marketingOptIn,
        });
        if (ok) onClose();
      }
      return;
    }

    if (mode === 'signin') {
      const ok = await signInWithUsername(usernameInput, password);
      if (ok) onClose();
    } else {
      const ok = await signUpWithUsername({
        username: usernameInput,
        password,
        email: recoveryEmail.trim() || undefined,
        displayName: displayName.trim() || undefined,
        acceptedLegal: agreedToLegal,
        marketingOptIn,
      });
      if (ok) onClose();
    }
  };

  const heading =
    title ||
    (mode === 'reset'
      ? 'Reset Your Password'
      : mode === 'signup'
      ? 'Create Your Whisk Profile'
      : 'Sign in to Whisk');

  const subheading =
    subtitle ||
    (mode === 'reset'
      ? 'Enter the email address on your account and we will send a reset link.'
      : 'Choose Google, Apple, Email, or a Whisk Username — whichever suits you best.');

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-[var(--whisk-navy)]/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-white relative space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-1">
          <div className="vibrant-gradient w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md">
            <User className="w-6 h-6" />
          </div>
          <h2 id="auth-modal-heading" className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">
            {heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium px-2">
            {subheading}
          </p>
        </div>

        {mode !== 'reset' && (
          <>
            {/* Mode Switcher: Sign In vs Create Account */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-[var(--whisk-navy)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--whisk-navy)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[var(--whisk-navy)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--whisk-navy)]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* 1-Click OAuth Providers */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleClick}
                className="min-h-[46px] flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-[var(--whisk-navy)] text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
              >
                <GoogleMark />
                <span>Google</span>
              </button>
              <button
                type="button"
                disabled={signingIn}
                onClick={handleAppleClick}
                className="min-h-[46px] flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
              >
                <AppleMark />
                <span>Apple</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                or with credentials
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Credential Method Chooser: Email vs Username */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange('email')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  method === 'email'
                    ? 'border-[var(--whisk-orange)] bg-orange-50/70 text-[var(--whisk-navy)]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-[var(--whisk-orange)]" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('username')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  method === 'username'
                    ? 'border-[var(--whisk-orange)] bg-orange-50/70 text-[var(--whisk-navy)]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <AtSign className="w-3.5 h-3.5 text-[var(--whisk-cyan)]" />
                <span>Username</span>
              </button>
            </div>
          </>
        )}

        {displayedError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayedError}</span>
          </div>
        )}

        {resetSentTo && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Password reset instructions were sent to {resetSentTo}.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {mode === 'reset' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-reset-email" className="block text-xs font-bold text-[var(--whisk-navy)]">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && method === 'email' && (
            <>
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-email-name" className="block text-xs font-bold text-[var(--whisk-navy)]">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email-name"
                      type="text"
                      required
                      autoComplete="name"
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email-input" className="block text-xs font-bold text-[var(--whisk-navy)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-email-optional-username" className="block text-xs font-bold text-[var(--whisk-navy)]">
                    Username <span className="font-medium text-slate-400">(optional, lets you sign in by @handle too)</span>
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email-optional-username"
                      type="text"
                      autoComplete="username"
                      maxLength={25}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="alex_wanders"
                      className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                    />
                  </div>
                  {usernameInput.trim().length > 0 && !isHandleValid && (
                    <p className="text-[11px] font-semibold text-rose-600">
                      Use 3–24 characters: lowercase letters, numbers, underscores, or hyphens.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {mode !== 'reset' && method === 'username' && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="auth-username-input" className="block text-xs font-bold text-[var(--whisk-navy)]">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-username-input"
                    type="text"
                    required
                    autoComplete="username"
                    maxLength={25}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="alex_wanders"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                  />
                </div>
                {mode === 'signup' && (
                  <p className={`text-[11px] font-semibold ${usernameInput.trim().length > 0 && !isHandleValid ? 'text-rose-600' : 'text-slate-400'}`}>
                    3–24 characters: letters, numbers, underscores, or hyphens.
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="auth-username-name" className="block text-xs font-bold text-[var(--whisk-navy)]">
                      Display Name <span className="font-medium text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="auth-username-name"
                      type="text"
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex"
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="auth-username-recovery" className="block text-xs font-bold text-[var(--whisk-navy)]">
                      Recovery Email <span className="font-medium text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="auth-username-recovery"
                      type="email"
                      autoComplete="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[46px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password-input" className="block text-xs font-bold text-[var(--whisk-navy)]">
                  Password
                </label>
                {mode === 'signin' && method === 'email' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('reset')}
                    className="text-xs font-bold text-[var(--whisk-terracotta)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full min-h-[46px] pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToLegal}
                  onChange={(e) => {
                    setAgreedToLegal(e.target.checked);
                    if (localError) setLocalError(null);
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--whisk-terracotta)] shrink-0 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs text-slate-700 leading-relaxed font-medium">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('terms')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('privacy')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('cookies')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    Cookie Policy
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('ugc')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    UGC Policy
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('refunds')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    Refund Policy
                  </button>
                  , and{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('disclaimer')}
                    className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                  >
                    Travel Disclaimer
                  </button>
                  .
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/80">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--whisk-terracotta)] shrink-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 leading-relaxed">
                  Optional: Email me travel inspiration and Whisk updates (unsubscribe anytime).
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full min-h-[48px] vibrant-gradient text-white py-3 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-[var(--shadow-orange)] hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'reset'
              ? signingIn
                ? 'Sending Reset Link...'
                : 'Send Reset Link'
              : mode === 'signup'
              ? signingIn
                ? 'Creating Profile...'
                : method === 'username'
                ? 'Agree & Create Username Profile'
                : 'Agree & Create Email Profile'
              : signingIn
              ? 'Signing In...'
              : method === 'username'
              ? 'Sign In with Username'
              : 'Sign In with Email'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className="w-full min-h-[44px] text-xs font-bold text-slate-500 hover:text-[var(--whisk-navy)] transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          )}

          {mode === 'signin' && (
            <p className="text-[11px] text-center text-slate-400 leading-relaxed pt-1">
              New travelers will be asked to review and accept our{' '}
              <button
                type="button"
                onClick={() => onOpenLegalDoc('terms')}
                className="underline hover:text-slate-600 cursor-pointer"
              >
                Terms
              </button>{' '}
              &{' '}
              <button
                type="button"
                onClick={() => onOpenLegalDoc('privacy')}
                className="underline hover:text-slate-600 cursor-pointer"
              >
                Privacy Policy
              </button>{' '}
              upon first sign-in.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
