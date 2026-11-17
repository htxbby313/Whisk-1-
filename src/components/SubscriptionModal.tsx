import React, { useState } from 'react';
import { LegalTab } from './LegalModal';
import {
  Sparkles,
  Check,
  Shield,
  CreditCard,
  Lock,
  X,
  Zap,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
  unlockReason?: string;
  onOpenLegal?: (tab: LegalTab) => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  unlockReason = 'Unlock all itinerary days, secret local activities, and direct booking links with Whisk Passport.',
  onOpenLegal,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<
    'annual' | 'monthly' | 'single'
  >('annual');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSubscribe(selectedPlan);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9F2] rounded-[3rem] p-8 md:p-12 shadow-2xl border-4 border-amber-200/60 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close subscription modal"
          className="absolute top-6 right-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-lg mb-4">
            <Sparkles className="w-4 h-4 fill-current text-yellow-200" /> Whisk
            Passport
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Unlock the World in Full Color
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto font-medium">
            {unlockReason}
          </p>
        </div>

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Single Pass */}
          <div
            onClick={() => setSelectedPlan('single')}
            className={`cursor-pointer rounded-3xl p-5 border-2 transition-all relative ${
              selectedPlan === 'single'
                ? 'border-orange-500 bg-orange-50/60 shadow-lg scale-102'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Single Trip
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">$4.99</div>
            <div className="text-[11px] text-slate-500">
              One-time pass for 1 full itinerary
            </div>
          </div>

          {/* Annual Plan (Best Value) */}
          <div
            onClick={() => setSelectedPlan('annual')}
            className={`cursor-pointer rounded-3xl p-5 border-2 transition-all relative ${
              selectedPlan === 'annual'
                ? 'border-amber-500 bg-amber-50/70 shadow-xl scale-105 ring-4 ring-amber-400/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-md">
              Most Popular
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
              Annual Explorer
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              $6.67{' '}
              <span className="text-xs font-bold text-slate-500">/ mo</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Billed $79.99/yr (Save 35%)
            </div>
          </div>

          {/* Monthly Plan */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`cursor-pointer rounded-3xl p-5 border-2 transition-all relative ${
              selectedPlan === 'monthly'
                ? 'border-orange-500 bg-orange-50/60 shadow-lg scale-102'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Monthly Pass
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              $9.99{' '}
              <span className="text-xs font-bold text-slate-500">/ mo</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Flexible monthly access
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="bg-white/80 rounded-3xl p-6 border border-amber-100 shadow-sm mb-8 space-y-3">
          {[
            'Complete day-by-day itineraries (all days unlocked, no paywalls)',
            'Verified hotel, tour & restaurant booking links with exclusive rates',
            'Full commuter hub (Uber, Lyft, local rail & car rental links)',
            'Unlimited custom AI itinerary revisions & 24/7 Concierge Chat',
          ].map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-xs md:text-sm font-semibold text-slate-700"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Simulated Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Name on Card
              </label>
              <input
                type="text"
                required
                placeholder="Jane Explorer"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Card Number
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Expires (MM/YY)
              </label>
              <input
                type="text"
                required
                placeholder="12/28"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                CVC
              </label>
              <input
                type="text"
                required
                placeholder="123"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-6 py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-sm uppercase tracking-[0.25em] shadow-xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 animate-spin" /> Unlocking Passport...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  {selectedPlan === 'single'
                    ? 'Pay $4.99 & Unlock Trip'
                    : selectedPlan === 'annual'
                      ? 'Activate Passport ($79.99/yr)'
                      : 'Activate Passport ($9.99/mo)'}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-semibold text-center">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> 256-bit
            Encrypted
          </span>
          <span>•</span>
          <span>Cancel anytime in 1-click</span>
          <span>•</span>
          <span>30-Day Guarantee</span>
        </div>

        <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
          By subscribing, you agree to our{' '}
          <button
            type="button"
            onClick={() => onOpenLegal?.('subscription')}
            className="underline font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            Subscription & Refund Policy (FTC Click-to-Cancel)
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onOpenLegal?.('terms')}
            className="underline font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          , and{' '}
          <button
            type="button"
            onClick={() => onOpenLegal?.('privacy')}
            className="underline font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          . Subscriptions auto-renew unless cancelled prior to period end.
        </p>
      </div>
    </div>
  );
}
