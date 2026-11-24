import * as React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminLoginView } from './AdminLoginView';

interface AdminRouteGuardProps {
  currentPath: string;
  onUnauthorizedRedirect: (message: string) => void;
  onNavigateHome: () => void;
  onNormalizeToAdmin: () => void;
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  currentPath,
  onUnauthorizedRedirect,
  onNavigateHome,
  onNormalizeToAdmin,
  children,
}) => {
  const { user, authReady, roleResolved, isAdmin, needsLegalConsent } = useAuth();

  const isCheckingAccess = !authReady || (Boolean(user) && !roleResolved);

  React.useEffect(() => {
    if (isCheckingAccess) return;
    if (user && !needsLegalConsent && !isAdmin) {
      onUnauthorizedRedirect(
        'Access denied: Administrator privileges are required to open /admin.'
      );
      return;
    }
    if (user && !needsLegalConsent && isAdmin && currentPath === '/admin/login') {
      onNormalizeToAdmin();
    }
  }, [
    isCheckingAccess,
    user,
    needsLegalConsent,
    isAdmin,
    currentPath,
    onUnauthorizedRedirect,
    onNormalizeToAdmin,
  ]);

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-7 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--whisk-navy)]">
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            <span>Verifying administrator access...</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Checking your Firestore role permissions.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginView onNavigateHome={onNavigateHome} />;
  }

  if (needsLegalConsent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-7 text-center max-w-md w-full">
          <h2 className="text-base font-bold text-[var(--whisk-navy)]">
            Complete Account Consent
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Review and accept the Whisk Terms of Service and Privacy Policy to finish verifying your administrator profile.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-6 flex items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span>Redirecting to Whisk...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
