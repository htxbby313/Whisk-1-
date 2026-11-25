# Security Policy — Whisk

**Product:** Whisk  
**Entity:** Coleman & Co Holdings LLC dba Whisk (Dallas, Texas)  
**Security Contact:** [whisk@colemanholdingsllc.com](mailto:whisk@colemanholdingsllc.com)  

At Coleman & Co Holdings LLC dba Whisk, we take the security of our application, user data, and partner integrations seriously. This document outlines our supported versions and the process for responsibly reporting potential security vulnerabilities.

---

## Supported Versions

Whisk operates on a continuous deployment model. Security patches and updates are applied directly to the active production branch and live deployments.

| Version / Environment | Supported | Notes |
| --------------------- | --------- | ----- |
| **Production (`whisk.travel` / `whisk.colemanholdingsllc.com`)** | :white_check_mark: | Currently active release |
| **`master` / `main` branch** | :white_check_mark: | Actively maintained repository branches |
| Legacy / Archived branches | :x: | Not actively maintained |

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential data exposure in Whisk, please report it directly to us via email rather than opening a public issue.

### 1. Where to Send Reports
Please email your findings to:  
👉 **`whisk@colemanholdingsllc.com`**  
*(Subject line: `[Security Vulnerability] <Brief Description>`)*

### 2. Information to Include
To help us investigate and triage as quickly as possible, please provide:
* A description of the issue and its potential impact.
* Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
* Any relevant URLs, parameters, sample payloads, or HTTP requests/responses.
* Your contact information and preferred name for acknowledgement (optional).

### 3. What to Expect
* **Initial Acknowledgement:** We will acknowledge receipt of your report within **48 business hours**.
* **Triage & Assessment:** Our engineering team will assess and validate the finding within **3–5 business days**.
* **Remediation & Communication:** If confirmed, we will work promptly to deploy a fix and keep you updated on progress.
* **Coordinated Disclosure:** We kindly request that you give our team reasonable time to remediate the issue prior to public disclosure.

---

## Safe Harbor & Research Guidelines

We consider security research conducted in good faith to be authorized. We commit not to pursue legal action against researchers who:
* Make a good-faith effort to avoid privacy violations, data destruction, and service interruption.
* Do not access, modify, or download sensitive personal data belonging to other users.
* Do not perform Denial of Service (DoS/DDoS) attacks, spamming, or social engineering against Whisk users or infrastructure.
* Promptly report any discovered vulnerability and maintain confidentiality until resolved.

---

*Last Updated: November 2026 — Coleman & Co Holdings LLC dba Whisk*
