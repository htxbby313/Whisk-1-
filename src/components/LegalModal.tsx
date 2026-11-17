import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Lock,
  CreditCard,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'subscription' | 'affiliate';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export default function LegalModal({
  isOpen,
  onClose,
  initialTab = 'terms',
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl border-4 border-slate-100 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Whisk Legal & Compliance Framework
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Official Policies • Effective 2026
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 py-4 border-b border-slate-100">
          {[
            {
              id: 'terms',
              label: 'Terms & Anti-Circumvention',
              icon: FileText,
            },
            { id: 'privacy', label: 'Privacy Policy', icon: Lock },
            {
              id: 'subscription',
              label: 'Subscription & Refunds',
              icon: CreditCard,
            },
            {
              id: 'affiliate',
              label: 'FTC & AI Disclaimers',
              icon: AlertTriangle,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LegalTab)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-6 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  1. Acceptance of Terms & Proprietary Rights
                </h3>
                <p>
                  By accessing or using Whisk (&ldquo;the Service&rdquo;),
                  operated by Whisk Technologies, Inc., you agree to be bound by
                  these Terms of Service. All content, scout curation, custom
                  route algorithms, branding, trademarks, and user interfaces
                  are the exclusive intellectual property of Whisk Technologies,
                  Inc. protected under United States and international
                  copyright, trademark, and trade dress laws.
                </p>
              </div>

              {/* CRITICAL ANTI-CIRCUMVENTION SECTION */}
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300">
                <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-xs tracking-wider mb-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  2. DMCA Anti-Circumvention & Technological Protection Measures
                  (17 U.S.C. § 1201)
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  Whisk employs technological protection measures (TPMs) to
                  control access to proprietary itinerary days, exclusive
                  booking URLs, partner rates, and concierge recommendations.
                  Pursuant to the
                  <strong>
                    {' '}
                    Digital Millennium Copyright Act (17 U.S.C. § 1201)
                  </strong>{' '}
                  and the{' '}
                  <strong>
                    Computer Fraud and Abuse Act (18 U.S.C. § 1030)
                  </strong>
                  :
                </p>
                <ul className="mt-3 list-disc list-inside text-xs text-amber-900 font-semibold space-y-1.5">
                  <li>
                    Users are strictly prohibited from circumventing, bypassing,
                    removing, decrypting, or otherwise impairing any paywall,
                    access control, token validation, or technological barrier.
                  </li>
                  <li>
                    Automated scraping, crawling, bot harvesting, data mining,
                    or extraction of Whisk itineraries, partner links, or scout
                    archives without express written consent is unlawful and
                    prohibited.
                  </li>
                  <li>
                    Reverse engineering, decompiling, or intercepting API
                    payloads to access locked or unpaid itinerary segments will
                    result in immediate termination of account access and may
                    subject the violator to statutory civil damages and criminal
                    prosecution.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  3. Travel Advisory & Limitation of Liability
                </h3>
                <p>
                  Whisk provides travel planning recommendations, route
                  previews, and partner booking shortcuts for informational and
                  inspirational purposes only.{' '}
                  <strong>
                    Whisk is not a registered airline, common carrier, hotel
                    operator, or licensed travel insurer.
                  </strong>
                </p>
                <p className="mt-2">
                  Travelers are solely responsible for independently verifying
                  visa requirements, passport validity, health protocols, local
                  laws, travel advisories, and venue operating hours prior to
                  travel. Whisk Technologies, Inc. assumes no liability for
                  flight cancellations, transit delays, hotel discrepancies,
                  weather disruptions, or personal injury sustained during
                  travel.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  1. Information We Collect
                </h3>
                <p>
                  We collect information necessary to deliver bespoke travel
                  itineraries and maintain your Whisk Passport:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                  <li>
                    <strong>Account Profile:</strong> Name, email address,
                    travel style preferences, and scout avatar.
                  </li>
                  <li>
                    <strong>Expedition Preferences:</strong> Search
                    destinations, trip duration, budgets, and vibe tags.
                  </li>
                  <li>
                    <strong>Technical & Session Data:</strong> Browser type,
                    approximate geographical region, and session state.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  2. PCI-DSS Compliant Payment Security
                </div>
                <p className="text-xs text-emerald-950 font-medium">
                  Whisk does <strong>not</strong> store or process raw credit
                  card numbers on its servers. All payments are securely handled
                  directly by certified Level-1 PCI-DSS compliant payment
                  gateways (e.g. Stripe) utilizing end-to-end 256-bit
                  encryption.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  3. Your Rights (GDPR & CCPA/CPRA)
                </h3>
                <p>
                  Regardless of location, Whisk honors global privacy rights:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                  <li>
                    Right to request a copy of all saved itineraries and profile
                    data.
                  </li>
                  <li>
                    Right to request immediate and permanent deletion of your
                    profile (&ldquo;Right to Be Forgotten&rdquo;).
                  </li>
                  <li>
                    We do <strong>not sell</strong> your personal information or
                    travel history to third-party data brokers.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  1. Whisk Passport Subscription Tiers
                </h3>
                <p>
                  Whisk offers tiered access to unlock full multi-day
                  itineraries, verified partner hotel/tour reservations, direct
                  commuter shortcuts, and priority concierge access:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                  <li>
                    <strong>Single Expedition Pass ($4.99):</strong> One-time
                    fee unlocking one selected multi-day itinerary.
                  </li>
                  <li>
                    <strong>Monthly Passport ($9.99/month):</strong> Unlimited
                    itinerary generation and full partner unlocks. Billed
                    monthly.
                  </li>
                  <li>
                    <strong>Annual Explorer ($79.99/year):</strong> Unlimited
                    access with annual savings of 35%. Billed annually.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-1">
                  2. Cancellation & Auto-Renewal (FTC Click-to-Cancel
                  Compliance)
                </h4>
                <p className="text-xs text-slate-600">
                  Subscriptions automatically renew at the end of each billing
                  cycle unless cancelled prior to renewal. You may cancel your
                  recurring subscription at any time with{' '}
                  <strong>1-click</strong> in your profile settings or by
                  contacting concierge support. Upon cancellation, you retain
                  full access through the remainder of your paid billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  3. 30-Day Money-Back Guarantee
                </h3>
                <p>
                  If you are not 100% satisfied with your Whisk Passport during
                  your first 30 days of membership, contact our concierge team
                  for a full, prompt refund — no questions asked.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-orange-50 border-2 border-orange-200">
                <h3 className="text-base font-black text-orange-950 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  FTC Affiliate Marketing Disclosure (16 C.F.R. § 255.5)
                </h3>
                <p className="text-xs text-orange-950 font-medium leading-relaxed">
                  In compliance with Federal Trade Commission (FTC) guidelines,
                  please be advised that Whisk maintains affiliate and
                  commercial partnerships with travel providers, including
                  booking platforms (Kayak, Booking.com), rideshare networks
                  (Uber, Lyft), and local tour operators.
                </p>
                <p className="text-xs text-orange-900 font-bold mt-2">
                  When you click on a recommended hotel, tour, rental car, or
                  transit partner and complete a reservation, Whisk may earn a
                  referral commission. This commission comes at NO additional
                  cost to you and helps support our ongoing worldwide scout
                  operations and AI development.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Artificial Intelligence Transparency Notice
                </h3>
                <p>
                  Whisk integrates Google Gemini artificial intelligence models
                  to synthesize travel research, calculate pacing, and generate
                  customized itineraries based on user search parameters. While
                  our models are trained on vetted travel knowledge and updated
                  regularly, AI-generated descriptions and hours may
                  occasionally vary. Always verify critical reservations
                  directly with the service provider.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <span>Whisk Technologies, Inc. • All Rights Reserved © 2026</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
