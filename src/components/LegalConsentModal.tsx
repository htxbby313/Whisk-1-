import * as React from 'react';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { LegalDocId } from '../legal/catalog';
import { useAuth } from '../context/AuthContext';

interface LegalConsentModalProps {
  isOpen: boolean;
  onOpenLegalDoc: (docId: LegalDocId) => void;
}

export const LegalConsentModal: React.FC<LegalConsentModalProps> = ({
  isOpen,
  onOpenLegalDoc,
}) => {
  const {
    user,
    signingIn,
    authError,
    clearAuthError,
    acceptLegalConsent,
    declineLegalConsent,
  } = useAuth();

  const [agreedToLegal, setAgreedToLegal] = React.useState(false);
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!agreedToLegal) {
      setLocalError(
        'Please check the required agreement box to accept the Terms of Service and Privacy Policy before completing your profile.'
      );
      return;
    }

    await acceptLegalConsent({ marketingOptIn });
  };

  const displayError = localError || authError;

  return (
    <div
      className="fixed inset-0 z-[340] flex items-center justify-center p-4 sm:p-6 bg-[var(--whisk-navy)]/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-consent-heading"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-white space-y-5 my-auto">
        <div className="text-center space-y-2">
          <div className="vibrant-gradient w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2
            id="legal-consent-heading"
            className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight"
          >
            Review & Accept Terms to Complete Your Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Before activating your Whisk traveler profile
            {user.email ? ` (${user.email})` : ''}, please review and agree to our legal policies.
          </p>
        </div>

        {displayError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer text-left">
              <input
                type="checkbox"
                checked={agreedToLegal}
                onChange={(e) => {
                  setAgreedToLegal(e.target.checked);
                  if (localError) setLocalError(null);
                }}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--whisk-terracotta)] shrink-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                <strong className="text-[var(--whisk-navy)]">Required:</strong> I have read and agree to Whisk&apos;s{' '}
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
                  User-Generated Content Policy
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('refunds')}
                  className="text-[var(--whisk-terracotta)] font-bold underline cursor-pointer"
                >
                  Refund & Cancellation Policy
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

            <label className="flex items-start gap-3 cursor-pointer text-left pt-2 border-t border-slate-200/80">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--whisk-terracotta)] shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-500 leading-relaxed">
                Optional: Send me travel inspiration, destination tips, and Whisk updates by email (you can unsubscribe anytime).
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              disabled={signingIn}
              onClick={declineLegalConsent}
              className="sm:flex-1 min-h-[46px] px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              Decline & Sign Out
            </button>
            <button
              type="submit"
              disabled={signingIn}
              className="sm:flex-[1.5] min-h-[46px] px-5 py-3 rounded-2xl vibrant-gradient text-white text-xs font-bold uppercase tracking-wider shadow-[var(--shadow-orange)] hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {signingIn ? 'Saving Consent...' : 'Accept & Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
