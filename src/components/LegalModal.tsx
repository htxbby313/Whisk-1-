import React from 'react';
import { Shield, X, CheckCircle, Lock, Globe, FileText } from 'lucide-react';

export type LegalTab = 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export default function LegalModal({
  isOpen,
  onClose,
}: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border-2 border-slate-100 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Whisk Privacy Policy &amp; Terms
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Coleman &amp; Co Holdings LLC dba Whisk • Dallas, Texas
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Policy Content */}
        <div className="flex-1 overflow-y-auto pr-2 my-4 space-y-6 text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
          <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200/70 text-orange-950">
            <div className="font-bold flex items-center gap-2 mb-1 text-sm text-orange-900">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              Summary for Travelers
            </div>
            <p className="text-xs text-orange-900/90 leading-normal">
              You own your travel plans. Whisk provides software to organize and inspire journeys. Your personal information, tickets, and exact dates remain 100% private.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              1. User-Generated Content &amp; Itinerary Ownership
            </h3>
            <p>
              When you build an itinerary in Whisk, you retain complete ownership of your personal notes, custom stops, and saved destinations. Whisk stores this data securely on your behalf to help you manage current and future trips.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              2. Public Itineraries &amp; Privacy Safeguards
            </h3>
            <p className="mb-2">
              If you choose to enable <strong>&ldquo;Make public &amp; share&rdquo;</strong>, Whisk automatically transforms your schedule into an anonymized community travel guide on our blog.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>What stays private:</strong> Your full name, email, specific calendar dates, flight confirmation numbers, hotel reservation IDs, and purchase amounts are <strong>never</strong> shared publicly.</li>
              <li><strong>What is shared:</strong> A generalized destination overview, season of travel (e.g., Spring or Autumn), trip duration (days), and curated neighborhood highlights to inspire other travelers.</li>
              <li>You may toggle an itinerary back to private at any time.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              3. AI Generation &amp; Third-Party Partners
            </h3>
            <p className="mb-2">
              Whisk leverages advanced intelligence models (including Google Gemini) to assist in discovering opening hours, route pacing, and local recommendations.
            </p>
            <p>
              Whisk partners with reputable booking providers (including Expedia, Booking.com, Skyscanner, and Travelpayouts). When you click an external booking link, you may be redirected to the partner&rsquo;s platform. Whisk may receive an affiliate referral commission at no additional cost to you.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              4. Company Information &amp; Jurisdiction
            </h3>
            <p>
              This service is operated by <strong>Coleman &amp; Co Holdings LLC dba Whisk</strong>, located at 539 W Commerce St #2604, Dallas, TX 75208. These terms are governed by the laws of the State of Texas, without regard to conflict of law principles.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
}
