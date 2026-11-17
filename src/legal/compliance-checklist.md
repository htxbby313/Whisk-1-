# Whisk Launch & Legal Compliance Checklist

**Effective Date:** November 17, 2026  
**Entity:** Whisk, Inc.  
**Compliance Contact:** privacy@whisk.travel  

Internal operational checklist for production deployments on **Firebase Hosting** and **Google AI Studio**.

| Domain | Action Item | Verification |
| :--- | :--- | :--- |
| **Legal Placement & Consent** | Serve `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/ugc`, `/legal/refunds`, and `/legal/disclaimer` + `/api/legal/:docId`; enforce clickwrap acceptance on signup, OAuth onboarding, and Passport checkout. | Implemented |
| **Authentication & OAuth** | Verify Firebase Auth Email/Password, Username, Google OAuth, and Apple Sign-In flows record consent before activating user profiles. | Implemented |
| **Firestore Rules & PII Isolation** | Keep user emails segregated in `/users/{uid}/private/info` (`allow list: if false;`), require `legalConsentVersion` & `legalConsentAcceptedAt` on new profile creation in `firestore.rules`. | Implemented |
| **Encryption & Secrets** | Enforce HTTPS/TLS; keep `GEMINI_API_KEY` and Firebase Admin credentials server-side only. | Implemented |
| **GDPR & CCPA Readiness** | Honor Global Privacy Control (`navigator.globalPrivacyControl`), provide cookie/privacy choices controls and `privacy@whisk.travel` opt-out workflow. | Implemented |
