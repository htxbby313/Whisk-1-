import React, { useState } from 'react';
import {
  User,
  Mail,
  Crown,
  CreditCard,
  CheckCircle,
  X,
  Compass,
  Shield,
  Sparkles,
  Receipt,
  QrCode,
  LogOut,
  Plane,
} from 'lucide-react';
import { UserProfile } from './AuthModal';
import { LegalTab } from './LegalModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  isSubscribed: boolean;
  onOpenPassport: () => void;
  onOpenLegal: (tab: LegalTab) => void;
  onLogOut: () => void;
  onToggleSubscription?: () => void;
  onLoadExampleTrip?: (destination: 'tokyo' | 'amalfi' | 'paris') => void;
}

type ProfileTab = 'passport' | 'billing' | 'emails';
type EmailType = 'welcome' | 'receipt' | 'booking';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  isSubscribed,
  onOpenPassport,
  onOpenLegal,
  onLogOut,
  onToggleSubscription,
  onLoadExampleTrip,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('passport');
  const [selectedEmail, setSelectedEmail] = useState<EmailType>('welcome');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !userProfile) return null;

  const passportNumber = `WPA-${Math.abs(
    userProfile.name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 1000) * 73
  )
    .toString()
    .slice(0, 6)}`;

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl border-4 border-orange-100 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {userProfile.name}
                </h2>
                {isSubscribed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-amber-700 text-amber-700" />{' '}
                    Passport Member
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                    Free Scout Preview
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Passport ID:{' '}
                <strong className="text-slate-700 font-bold">
                  {passportNumber}
                </strong>{' '}
                • {userProfile.email}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin VIP Demonstration & Client Simulator Banner */}
        {userProfile.isAdmin && (
          <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white shadow-lg border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  Admin Demo Control Center
                </span>
                <span className="text-xs text-white/90 font-medium">
                  Simulate client paywall or jump to instant verified master
                  examples:
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleSubscription}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isSubscribed
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-md'
                }`}
              >
                {isSubscribed
                  ? '👑 Mode: VIP Unlocked'
                  : '🔒 Mode: Free Paywall Simulated'}
              </button>
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleTrip?.('tokyo');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-200 transition-colors cursor-pointer"
                >
                  ⛩️ Tokyo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleTrip?.('amalfi');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-200 transition-colors cursor-pointer"
                >
                  🍋 Amalfi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleTrip?.('paris');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-200 transition-colors cursor-pointer"
                >
                  🗼 Paris
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 my-5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('passport')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'passport'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" /> Traveler Passport
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Subscription & Plan
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'emails'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" /> Confirmation Emails (3)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* TAB 1: TRAVELER PASSPORT */}
          {activeTab === 'passport' && (
            <div className="space-y-6">
              {/* Luxury Passport Card */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-6 md:p-8 shadow-2xl border border-amber-500/30">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 block">
                          Official Digital Travel Document
                        </span>
                        <h3 className="text-xl font-black tracking-tight">
                          Whisk International Passport
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Status
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        {isSubscribed
                          ? 'Unlimited Pro Access'
                          : 'Trial Preview Tier'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-white/10 my-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Explorer
                      </span>
                      <span className="font-black text-sm text-white">
                        {userProfile.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Passport No.
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {passportNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Travel Vibe
                      </span>
                      <span className="font-bold text-white">
                        {userProfile.travelStyle}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Issued By
                      </span>
                      <span className="font-bold text-slate-300">
                        Whisk Concierge AI
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Verified Scout Network Credential</span>
                    </div>
                    {!isSubscribed && (
                      <button
                        onClick={onOpenPassport}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
                      >
                        Upgrade to Passport Pro ($4.99)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" /> Account
                    Identity
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        Display Name
                      </span>
                      <strong className="text-slate-800">
                        {userProfile.name}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        Verified Email
                      </span>
                      <strong className="text-slate-800">
                        {userProfile.email}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        Membership Level
                      </span>
                      <strong className="text-orange-600 font-bold">
                        {isSubscribed
                          ? 'Whisk Passport Pro'
                          : 'Free Preview Scout'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">
                        Member Since
                      </span>
                      <strong className="text-slate-800">November 2026</strong>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-orange-500" /> Expedition
                    DNA & Vibe
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        Primary Style
                      </span>
                      <strong className="text-slate-800">
                        {userProfile.travelStyle}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        First Trip Status
                      </span>
                      <span className="font-bold text-emerald-600">
                        Active (50% Preview Unlocked)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        Partner Booking Access
                      </span>
                      <span
                        className={`font-bold ${isSubscribed ? 'text-emerald-600' : 'text-amber-600'}`}
                      >
                        {isSubscribed
                          ? 'Full Partner Links (Kayak, Uber, Dining)'
                          : 'Locked (Requires Passport)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">
                        24/7 AI Concierge
                      </span>
                      <strong className="text-slate-800">Enabled</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & SUBSCRIPTION */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-2 border-orange-200/70">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 block mb-1">
                      Active Subscription Tier
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">
                      {isSubscribed
                        ? 'Whisk Passport Explorer Membership'
                        : 'Free First Trip Preview Tier'}
                    </h3>
                    <p className="text-slate-600 text-xs md:text-sm mt-1">
                      {isSubscribed
                        ? 'Unlimited day-by-day itineraries, complete scout secrets, and unlocked affiliate partner links.'
                        : 'Your first planned journey preview is active with 50% of days visible. Upgrade to reveal all.'}
                    </p>
                  </div>
                  {!isSubscribed ? (
                    <button
                      onClick={onOpenPassport}
                      className="px-6 py-3.5 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all shrink-0 cursor-pointer"
                    >
                      Upgrade to Passport
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider border border-emerald-300">
                      ✓ Active & Good Standing
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-orange-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Billing Frequency
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {isSubscribed
                        ? 'Annual ($79.99/year)'
                        : 'None (Complimentary Preview)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Payment Method
                    </span>
                    <strong className="text-slate-800 text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      {isSubscribed ? 'Visa ending in 4242' : 'No card on file'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      Renewal & Cancellation
                    </span>
                    <strong className="text-slate-800 text-sm">
                      FTC Click-to-Cancel
                    </strong>
                  </div>
                </div>
              </div>

              {/* FTC Click-to-Cancel Compliance Guarantee Card */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-900">
                      FTC Click-to-Cancel & 30-Day Money-Back Guarantee
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      In full compliance with Federal Trade Commission (FTC)
                      negative option rules, you may cancel your Whisk Passport
                      subscription at any time with a single click. There are
                      zero retention hoops, cancellation phone numbers, or
                      administrative fees. If you cancel within the first 30
                      days of any annual membership, you receive a full refund
                      back to your original payment method.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
                      <button
                        onClick={() => onOpenLegal('subscription')}
                        className="text-orange-600 hover:underline cursor-pointer"
                      >
                        Read Subscription & Refund Policy →
                      </button>
                      {isSubscribed && (
                        <button
                          onClick={() =>
                            alert(
                              'Subscription cancellation requested. Your Passport will remain active until the end of the current billing cycle.'
                            )
                          }
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Cancel Subscription in 1 Click
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIRMATION EMAILS VIEWER */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              {/* Email Selector */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEmail('welcome')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedEmail === 'welcome'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ✉️ 1. Profile Verification & Welcome
                </button>
                <button
                  onClick={() => setSelectedEmail('receipt')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedEmail === 'receipt'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💳 2. Payment Receipt & Tax Invoice
                </button>
                <button
                  onClick={() => setSelectedEmail('booking')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedEmail === 'booking'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏨 3. Partner Booking Verification
                </button>
              </div>

              {/* Email Client Shell Simulation */}
              <div className="rounded-[2.5rem] bg-white border-2 border-slate-200 overflow-hidden shadow-xl">
                {/* Email Client Top Bar */}
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-slate-400">From: </span>
                      <strong className="text-slate-800">
                        Whisk Travel Concierge &lt;concierge@whisk.travel&gt;
                      </strong>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400">To: </span>
                      <span className="text-slate-700">
                        {userProfile.name} &lt;{userProfile.email}&gt;
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400">
                        Subject:{' '}
                      </span>
                      <strong className="text-slate-900">
                        {selectedEmail === 'welcome' &&
                          `🎉 Welcome to Whisk, ${userProfile.name}! Verify your account & claim Free First Trip`}
                        {selectedEmail === 'receipt' &&
                          `🧾 Official Receipt: Whisk Passport Pro Membership (Order #WPK-2026-9812)`}
                        {selectedEmail === 'booking' &&
                          `✈️ Booking Verified: Whisk Scout Partner Reservation Voucher (#WH-BK-4091)`}
                      </strong>
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-[11px] shrink-0">
                    <span className="block font-bold">
                      2026-11-16 20:30 UTC
                    </span>
                    <span className="text-emerald-600 font-bold">
                      ✓ DKIM & SPF Verified
                    </span>
                  </div>
                </div>

                {/* Email Body: EMAIL 1 - WELCOME & VERIFICATION */}
                {selectedEmail === 'welcome' && (
                  <div className="p-8 md:p-10 space-y-6 text-slate-800 font-sans max-w-2xl mx-auto">
                    {/* Brand Banner */}
                    <div className="text-center pb-6 border-b border-slate-100">
                      <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg mb-3">
                        <Plane className="w-6 h-6 -rotate-45" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Welcome to Whisk!
                      </h2>
                      <span className="text-xs uppercase tracking-widest text-orange-600 font-black">
                        Bespoke Itineraries Worldwide
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed">
                      Hello <strong>{userProfile.name}</strong>,
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Thank you for joining Whisk! Your traveler profile has
                      been created with the travel persona{' '}
                      <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 font-bold text-xs">
                        {userProfile.travelStyle}
                      </span>
                      . Your complimentary <strong>First Trip Preview</strong>{' '}
                      is active immediately.
                    </p>

                    {/* Verification Code Box */}
                    <div className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-200 text-center space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 block">
                        Your 6-Digit Email Verification Code
                      </span>
                      <div className="text-3xl font-mono font-black tracking-widest text-orange-600">
                        849-204
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        This verification code expires in 15 minutes. Enter it
                        to confirm ownership of your email.
                      </p>
                    </div>

                    {/* Free Preview Perk Card */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <strong className="text-slate-900 block font-black">
                        What your Free First Trip includes:
                      </strong>
                      <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                        <li>
                          AI-crafted day-by-day expedition route for any world
                          destination
                        </li>
                        <li>
                          First 50% of days completely revealed with morning,
                          afternoon & evening activities
                        </li>
                        <li>
                          Option to upgrade to Whisk Passport ($4.99 Single /
                          $79.99 Annual) at any time
                        </li>
                      </ul>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        onClick={() => handleCopyCode('849204')}
                        className="px-8 py-3.5 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all cursor-pointer"
                      >
                        {copiedCode
                          ? '✓ Code Copied to Clipboard'
                          : 'Verify My Profile Email'}
                      </button>
                    </div>

                    <div className="pt-8 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                      <p>
                        Whisk Technologies Inc., 100 Global Scout Way, Suite
                        400.
                      </p>
                      <p>
                        You received this because an account was registered with{' '}
                        {userProfile.email}. If you did not create this account,
                        please ignore this email.
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Body: EMAIL 2 - PAYMENT RECEIPT & INVOICE */}
                {selectedEmail === 'receipt' && (
                  <div className="p-8 md:p-10 space-y-6 text-slate-800 font-sans max-w-2xl mx-auto">
                    <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-5 h-5 text-orange-500" />
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Official Payment Receipt
                          </h2>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Order #WPK-2026-9812 • Paid in Full
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 block">
                          $79.99 USD
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          PAID
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Billed To
                        </span>
                        <strong className="text-slate-900 block">
                          {userProfile.name}
                        </strong>
                        <span className="text-slate-600">
                          {userProfile.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Payment Method
                        </span>
                        <strong className="text-slate-900 block">
                          Visa Card •••• 4242
                        </strong>
                        <span className="text-slate-600">
                          Processed securely via Stripe 256-bit
                        </span>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                      <div className="bg-slate-50 px-4 py-2.5 font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 flex justify-between">
                        <span>Description</span>
                        <span>Amount</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                          <div>
                            <strong className="text-slate-900 block">
                              Whisk Passport Annual Explorer Pass
                            </strong>
                            <span className="text-slate-500 text-[11px]">
                              1-Year Unlimited Worldwide Itineraries & Unlocked
                              Partner Booking Links
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            $79.99
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px] pt-2 border-t border-slate-100">
                          <span>Subtotal</span>
                          <span>$79.99</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Sales Tax (0%)</span>
                          <span>$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                          <span>Total Paid</span>
                          <span className="text-orange-600">$79.99 USD</span>
                        </div>
                      </div>
                    </div>

                    {/* Legal FTC Notice in Receipt */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                      <strong className="text-slate-900 block font-bold">
                        FTC Click-to-Cancel & Refund Disclosure:
                      </strong>
                      <p>
                        Your Whisk Passport subscription is covered by our{' '}
                        <strong>30-Day Money-Back Guarantee</strong>. If you are
                        unsatisfied for any reason, request a refund from your
                        profile for a 100% full return. Your subscription will
                        renew on November 16, 2027. You can cancel auto-renewal
                        anytime in 1 click from your Traveler Profile or by
                        emailing billing@whisk.travel with no penalty.
                      </p>
                    </div>

                    <div className="pt-4 text-center">
                      <button
                        onClick={() => onOpenLegal('subscription')}
                        className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                      >
                        View Full Subscription & Refund Policy →
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Body: EMAIL 3 - PARTNER BOOKING CONFIRMATION */}
                {selectedEmail === 'booking' && (
                  <div className="p-8 md:p-10 space-y-6 text-slate-800 font-sans max-w-2xl mx-auto">
                    <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Plane className="w-5 h-5 text-orange-500" />
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Expedition Booking Voucher
                          </h2>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Confirmation Ref: WH-BK-4091
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                        <QrCode className="w-10 h-10 text-slate-800" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <strong>
                          Reservation Confirmed with Travel Partner!
                        </strong>
                        <p className="text-emerald-700 text-[11px]">
                          Your check-in voucher is guaranteed under the Whisk
                          Scout Network.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Lead Guest
                        </span>
                        <strong className="text-slate-900 block">
                          {userProfile.name}
                        </strong>
                        <span className="text-slate-600">
                          Whisk Passport #{passportNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Destination
                        </span>
                        <strong className="text-slate-900 block">
                          Amalfi Coast & Positano, Italy
                        </strong>
                        <span className="text-slate-600">
                          4 Nights • Executive Cliffside Suite
                        </span>
                      </div>
                    </div>

                    {/* Booking Details Box */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Partner Operator</span>
                        <strong className="text-slate-800">
                          Le Sirenuse / Kayak Partner Network
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Check-in Date</span>
                        <strong className="text-slate-800">
                          June 14, 2027 (15:00 CET)
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Check-out Date</span>
                        <strong className="text-slate-800">
                          June 18, 2027 (11:00 CET)
                        </strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">
                          Commuter / Transit Transfer
                        </span>
                        <strong className="text-emerald-600">
                          Private Hydrofoil + Chauffeur Included
                        </strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                      <strong>Important Check-in Instructions:</strong> Please
                      present this digital voucher and a valid government-issued
                      photo ID upon arrival at the concierge desk. For 24/7
                      concierge assistance during your stay, message our in-app
                      scout bot or email priority@whisk.travel.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => {
              onClose();
              onLogOut();
            }}
            className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Whisk
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
