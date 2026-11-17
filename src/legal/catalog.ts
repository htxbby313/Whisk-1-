import termsMd from './terms.md?raw';
import privacyMd from './privacy.md?raw';
import cookiesMd from './cookies.md?raw';
import ugcMd from './ugc.md?raw';
import refundsMd from './refunds.md?raw';
import disclaimerMd from './disclaimer.md?raw';

export const CURRENT_LEGAL_VERSION = '2026-11-17';
export const CURRENT_LEGAL_EFFECTIVE_DATE = 'November 17, 2026';

export type LegalDocId =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'ugc'
  | 'refunds'
  | 'disclaimer';

export interface LegalDocumentMeta {
  id: LegalDocId;
  title: string;
  shortTitle: string;
  path: string;
  apiPath: string;
  summary: string;
  markdown: string;
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    shortTitle: 'Terms',
    path: '/legal/terms',
    apiPath: '/api/legal/terms',
    summary: 'Account rules, Passport subscriptions, arbitration, and California governing law.',
    markdown: termsMd,
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    path: '/legal/privacy',
    apiPath: '/api/legal/privacy',
    summary: 'Data collection, Firebase & AI processing, GDPR, CCPA/CPRA, and opt-outs.',
    markdown: privacyMd,
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    shortTitle: 'Cookies & Privacy Choices',
    path: '/legal/cookies',
    apiPath: '/api/legal/cookies',
    summary: 'Essential session storage, optional analytics, and Global Privacy Control (GPC).',
    markdown: cookiesMd,
  },
  {
    id: 'ugc',
    title: 'User-Generated Content Policy',
    shortTitle: 'User Content',
    path: '/legal/ugc',
    apiPath: '/api/legal/ugc',
    summary: 'Ownership of your itinerary edits, notes, field guides, and DMCA takedowns.',
    markdown: ugcMd,
  },
  {
    id: 'refunds',
    title: 'Refund & Cancellation Policy',
    shortTitle: 'Refunds',
    path: '/legal/refunds',
    apiPath: '/api/legal/refunds',
    summary: 'Passport tier cancellations, 7-day unused refunds, and third-party bookings.',
    markdown: refundsMd,
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer & Limitation of Liability',
    shortTitle: 'Disclaimer',
    path: '/legal/disclaimer',
    apiPath: '/api/legal/disclaimer',
    summary: 'Travel & AI verification notice, warranty disclaimers, and liability limits.',
    markdown: disclaimerMd,
  },
];

export const LEGAL_DOCS_BY_ID: Record<LegalDocId, LegalDocumentMeta> = LEGAL_DOCUMENTS.reduce(
  (acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  },
  {} as Record<LegalDocId, LegalDocumentMeta>
);

export function isLegalDocId(value: string): value is LegalDocId {
  return Object.prototype.hasOwnProperty.call(LEGAL_DOCS_BY_ID, value);
}
