# Whisk Privacy Policy

**Effective Date:** November 17, 2026  
**Controller:** Whisk, Inc. ("Whisk," "we," "us," or "our")  
**Privacy & DPO Contact:** privacy@whisk.travel  

This Privacy Policy explains how **Whisk, Inc.**, a U.S.-based company organized under the laws of California, collects, stores, uses, shares, and protects personal data worldwide when you use Whisk.

## 1. Personal Data We Collect

| Category | Specific Data Elements | Source |
| :--- | :--- | :--- |
| **Profile & Identity Data** | Name, email address, username handle, travel-style preferences, avatar URL/seed, unique user ID (UID) | Directly from you or OAuth provider |
| **Authentication & Security Data** | Hashed password (managed by Firebase Auth), OAuth tokens, sign-in timestamps, legal consent records | Directly from you / Authentication provider |
| **Travel & Location Hints** | Destinations, trip durations, interests, accessibility needs, saved places, edited itinerary text | Your itinerary prompts & edits |
| **Transaction & Billing Metadata** | Subscription tier ("Passport"), billing status, receipt records (card numbers are processed solely by our payment processor) | Third-party payment processor |
| **Usage & Analytics Data** | Page views, feature interactions, device/browser type, approximate IP-derived region, session duration | Google Analytics & Firebase Hosting logs |
| **Communications** | Profile verification confirmations, booking verification emails, payment receipts, support emails | Transactional email service & your messages |

## 2. How We Use Your Data & Legal Bases (GDPR)
For users in the European Economic Area (EEA), the United Kingdom, and Switzerland, we rely on the following legal bases under the GDPR / UK GDPR:
- **Performance of a Contract:** Creating your profile, authenticating sign-ins, generating/saving/editing AI itineraries, fulfilling Passport subscriptions, and sending verification and receipt emails.
- **Legitimate Interests:** Improving AI travel quality, preventing fraud and abuse, maintaining analytics, and protecting system security (balanced against your privacy rights).
- **Consent:** Placing non-essential analytics cookies, recording your acceptance of legal terms, or sending optional promotional/marketing emails (withdrawable at any time).
- **Legal Obligation:** Retaining financial receipts and responding to valid legal process.

## 3. Infrastructure, Storage & Third-Party Sharing
We do **not** sell your personal data for monetary consideration. We share data strictly with vetted service providers operating under data-processing agreements:
- **Google Firebase (Auth, Firestore, Hosting) & Cloud SQL:** Stores user profiles, authentication credentials, saved itineraries, packing checklists, and serves web assets on Google Cloud infrastructure.
- **Google AI Studio / Gemini API:** Processes itinerary prompts and location hints to generate travel previews and local guides over encrypted channels.
- **Google Analytics:** Measures aggregated app usage, performance, and feature adoption.
- **Third-Party Payment Processor:** Handles Passport subscription checkout, recurring billing, fraud screening, and payment receipt generation. We never store raw full credit card numbers on Whisk servers.
- **Transactional Email Provider:** Delivers profile verification messages, booking confirmations, and receipts.

## 4. Admin Demo Access & Safeguards
- Whisk provides strict isolation between any stakeholder demonstration mode and live production user data. Demo views do **not** confer unrestricted production administrative access over live customer records or infrastructure keys. All live production data remains governed by Firebase Security Rules, IAM least-privilege roles, and multi-factor authentication.

## 5. Security Measures
- **Encryption in Transit & At Rest:** All traffic between your browser/app, Firebase, AI endpoints, and payment processors uses TLS/HTTPS encryption. Stored Firestore, Cloud SQL, and Auth data are encrypted at rest by Google Cloud.
- **Access Isolation:** User email addresses and private records are logically isolated from public itinerary or field-guide collections via strict Firestore security rules.
- **Two-Factor Protection:** Administrative consoles and internal tools enforce two-factor authentication and audit logging.

## 6. Opt-Out Mechanisms (Marketing & CCPA Data Sharing)
- **Marketing Email Opt-Out:** Whisk sends mandatory transactional emails (profile verification, booking confirmations, payment receipts). For any promotional or newsletter emails, you can opt out at any time by leaving marketing consent unchecked, clicking **"Unsubscribe"** in any promotional email, or emailing **privacy@whisk.travel** with the subject line `"Marketing Opt-Out"`.
- **CCPA "Do Not Sell or Share My Personal Information":** California residents have the right to direct businesses not to "sell" or "share" (for cross-context behavioral advertising) personal information. You can exercise this right via our **Cookie Policy & Privacy Choices** link or by emailing **privacy@whisk.travel** with the subject line `"Do Not Sell or Share"`. We also honor Global Privacy Control (GPC) browser signals where legally required.

## 7. Your Rights Under GDPR (EEA/UK) & CCPA/CPRA (California)
- **GDPR Rights:** Access, rectification, erasure ("right to be forgotten"), restriction of processing, data portability, objection to processing, withdrawal of consent, and the right to lodge a complaint with your local Data Protection Authority.
- **CCPA/CPRA Rights:** Right to know/access categories and specific pieces of personal data collected, right to delete personal data, right to correct inaccurate personal data, right to opt out of sale/sharing, and right to non-discrimination for exercising privacy rights.
- **International Data Transfers:** Data transferred from the EEA/UK to the United States relies on Standard Contractual Clauses (SCCs) or applicable adequacy frameworks maintained with Google Cloud and our sub-processors.
- To submit any privacy request, email **privacy@whisk.travel**. We verify your identity via your registered account before fulfilling requests.

## 8. Data Retention & Children's Privacy
We retain account and itinerary data while your account remains active and delete or anonymize personal data within 30–60 days of verified deletion requests (except tax/payment receipts retained as required by law). Whisk is not directed to individuals under 18 (or 16 in the EEA where higher), and we do not knowingly collect data from minors.

## 9. Governing Law & Local Protections
This Policy is governed by **California** and U.S. federal law, subject to mandatory local data-protection and consumer-protection laws applicable in your jurisdiction of residence.

---

**Signed:**  
**Whisk, Inc.**  
Privacy Office  
Date: November 17, 2026
