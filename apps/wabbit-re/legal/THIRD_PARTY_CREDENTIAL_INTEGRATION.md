# Third-Party Credential Integration: Legal & Safety Analysis

## Zillow, Redfin, and Homes.com Integration Assessment

**Document Version**: 1.0
**Last Updated**: December 2025
**Status**: Legal Review Required
**Classification**: Internal - Confidential

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Proposed Integration Model](#proposed-integration-model)
3. [Terms of Service Analysis](#terms-of-service-analysis)
4. [Federal Law: CFAA Implications](#federal-law-cfaa-implications)
5. [State Privacy Laws: CCPA/CPRA](#state-privacy-laws-ccpacpra)
6. [Risk Assessment Matrix](#risk-assessment-matrix)
7. [Official API Alternatives](#official-api-alternatives)
8. [Safer Integration Approaches](#safer-integration-approaches)
9. [Required Disclosures If Proceeding](#required-disclosures-if-proceeding)
10. [Security Requirements](#security-requirements)
11. [Recommendations](#recommendations)
12. [Legal Precedents & Case Law](#legal-precedents--case-law)
13. [Sources & References](#sources--references)

---

## Executive Summary

### Purpose

This document analyzes the legal and safety implications of implementing a credential-sharing integration with Zillow, Redfin, and Homes.com. The proposed model would allow users to provide their login credentials for these platforms, enabling Wabbit to access and extract their favorited/saved properties on their behalf.

### Critical Finding

**The proposed credential-sharing approach carries significant legal risks** that differ substantially from public data scraping. While framed as "credential verification," the technical reality involves accessing third-party platforms using user credentials without authorization from those platforms.

### Key Risks Identified

| Risk Category | Severity | Likelihood |
|---------------|----------|------------|
| Terms of Service Violation | Certain | 100% |
| CFAA Exposure | Possible | 30-50% |
| Civil Litigation | Possible | 20-40% |
| Platform Account Bans | Likely | 60-80% |
| CCPA Violations | Possible | 20-30% |
| Credential Breach Liability | Always Present | N/A |

### Recommendation

**Do not proceed with credential-based integration** without:
1. Formal legal counsel review
2. Exploration of official API partnerships
3. Implementation of lower-risk alternatives (browser extension, manual import)

---

## Proposed Integration Model

### User Flow (As Originally Conceived)

```
1. User signs up for Wabbit
2. User navigates to "Connect Accounts" section
3. User provides Zillow/Redfin/Homes.com credentials
4. Wabbit "verifies" credentials by authenticating to these platforms
5. Wabbit extracts user's favorited properties
6. Properties are imported into Wabbit for ranking
```

### Technical Implementation

The system would:
- Store encrypted user credentials in database
- Authenticate to third-party platforms programmatically
- Navigate to user's favorites/saved homes sections
- Extract property data (addresses, prices, details, images)
- Sync this data periodically or on-demand

### User Value Proposition

- Consolidate favorites from multiple platforms
- Apply Wabbit's ranking algorithm to existing saved properties
- Track properties across platforms in one place
- Receive unified notifications for price changes

---

## Terms of Service Analysis

### Zillow Terms of Use

**Source**: [zillowgroup.com/terms-of-use](https://www.zillowgroup.com/terms-of-use/)

#### Prohibited Activities

> "You agree not to... use any automated means, including, without limitation, agents, robots, scripts, or spiders, to access, monitor, copy or collect the Services or any content on the Services."

> "You may only copy information for personal use and not for any commercial purpose, without the aid of any automated processes."

#### Credential Sharing

Zillow's terms implicitly prohibit credential sharing by:
- Requiring users to maintain account security
- Prohibiting access "on behalf of" others without authorization
- Restricting automated access regardless of authentication method

#### Enforcement Mechanisms

- CAPTCHA challenges
- IP blocking and rate limiting
- Browser fingerprinting
- Account suspension/termination
- Legal action (cease-and-desist, litigation)

### Redfin Terms of Use

**Source**: [redfin.com/about/terms-of-use](https://www.redfin.com/about/terms-of-use) (Updated September 2025)

#### Key Provisions

> "You may not use any automated system or software to extract data from our website for commercial purposes."

> "No Right to Reproduce - You have no license to use, reproduce, distribute, or provide access to any portion of the Services."

#### Implications

- Explicit prohibition on automated data extraction
- No reproduction rights granted to users
- Commercial use restrictions apply

### Homes.com Terms of Use

#### Anti-Automation Measures

While specific ToS language was not located, Homes.com employs:
- JavaScript rendering requirements
- IP blocking systems
- CAPTCHA challenges
- Rate limiting

#### Industry Standard

Homes.com likely follows industry-standard prohibitions on:
- Automated access and scraping
- Third-party credential usage
- Commercial data extraction

### Summary: All Three Platforms

| Platform | Automated Access | Credential Sharing | Commercial Use |
|----------|------------------|-------------------|----------------|
| **Zillow** | Explicitly Prohibited | Implicitly Prohibited | Prohibited |
| **Redfin** | Explicitly Prohibited | Implicitly Prohibited | Prohibited |
| **Homes.com** | Prohibited (measures in place) | Likely Prohibited | Likely Prohibited |

**Conclusion**: Using user credentials to access any of these platforms for automated data extraction violates their Terms of Service.

---

## Federal Law: CFAA Implications

### Computer Fraud and Abuse Act Overview

The CFAA (18 U.S.C. § 1030) criminalizes accessing a computer "without authorization" or "exceeding authorized access."

### Relevant Case Law

#### hiQ Labs v. LinkedIn (9th Circuit, 2022)

**Holding**: Scraping publicly available data does NOT violate the CFAA.

**Key Reasoning**:
- The court applied the "gates-up-or-down" test from Van Buren v. United States
- Public websites with no authentication have no access restrictions to violate
- Scraping public data is not "unauthorized access"

**Applicability to Credential-Based Access**: **LIMITED**
- This case specifically addressed PUBLIC data
- Authenticated access is a different legal question

#### United States v. Nosal (Nosal II, 9th Circuit)

**Holding**: Accessing a computer using valid login credentials of another person violated the CFAA, even with that person's consent.

**Key Reasoning**:
- The credential owner had authorization; the accessor did not
- Using borrowed credentials to access systems is "without authorization"
- Consent from the credential owner does not transfer authorization from the system owner

**Applicability to Wabbit**: **DIRECTLY RELEVANT**
- Users consent to share credentials with Wabbit
- Platforms (Zillow, Redfin, Homes.com) do NOT authorize Wabbit's access
- This creates potential CFAA exposure

#### Van Buren v. United States (Supreme Court, 2021)

**Holding**: A person "exceeds authorized access" only when accessing areas of a computer system they are not entitled to access, not when they misuse access they otherwise have.

**Impact**: Narrowed CFAA's scope, but credential-based third-party access still falls outside this protection.

### 2024-2025 Case Updates

| Case | Court | Ruling | Relevance |
|------|-------|--------|-----------|
| **Meta v. Bright Data (2024)** | N.D. Cal. | Scraping public pages without login doesn't violate ToS | Public data only |
| **X Corp. v. Bright Data (2024)** | N.D. Cal. | ToS violations best resolved via Copyright Act | Slightly favorable |
| **NRA Group v. Durenleau (2025)** | 3rd Circuit | CFAA doesn't apply to workplace policy violations | Not applicable |

### CFAA Risk Assessment for Credential-Based Access

| Factor | Assessment |
|--------|------------|
| **Are we accessing "without authorization"?** | Likely yes - platforms don't authorize third-party access |
| **Does user consent transfer platform authorization?** | No - per Nosal II |
| **Could a cease-and-desist change the calculus?** | Yes - makes unauthorized access explicit |
| **Is this criminal or civil exposure?** | Primarily civil, but criminal possible |

**CFAA Conclusion**: Credential-based access to third-party platforms presents meaningful CFAA risk, particularly if platforms issue cease-and-desist notices.

---

## State Privacy Laws: CCPA/CPRA

### California Consumer Privacy Act (as amended by CPRA)

**Effective**: Updated regulations effective January 1, 2026

### Credentials as Sensitive Personal Information

Under CCPA, login credentials are explicitly classified as **"sensitive personal information"** alongside:
- Social Security numbers
- Financial account information
- Health information
- Precise geolocation

### Storage and Handling Requirements

If storing user credentials for third-party platforms:

#### Data Minimization
- Cannot retain credentials longer than reasonably necessary
- Must inform users how long each data category will be retained
- Must justify retention period

#### Security Requirements
- Implement "reasonable security procedures"
- Encryption at rest and in transit
- Access controls and audit logging

#### Consumer Rights
- Right to know what credentials are stored
- Right to delete credentials on request
- Right to opt-out of "sale" or "sharing"

#### Third-Party Contractual Requirements
When using credentials to access third-party platforms:
- Must have written agreements specifying limited purposes
- Must provide equivalent privacy protections
- Must notify users if unable to meet obligations

### Recent CCPA Enforcement Actions

| Date | Company | Violation | Fine |
|------|---------|-----------|------|
| July 2025 | Healthline | Sharing data without proper protections | $1.55M |
| November 2025 | Sling TV | Opt-out method violations | $530K |

### CCPA Risk Assessment

| Requirement | Wabbit Compliance Status |
|-------------|--------------------------|
| Sensitive PI disclosure | Not yet implemented |
| Retention policy | Not yet defined |
| Deletion capability | Not yet implemented |
| Security measures | Partially specified |
| Third-party agreements | N/A - no platform authorization |

---

## Risk Assessment Matrix

### Comprehensive Risk Evaluation

| Risk Type | Probability | Impact | Mitigation Cost | Overall Risk |
|-----------|-------------|--------|-----------------|--------------|
| **ToS Breach (Civil)** | 100% | Medium-High | Cannot mitigate | **HIGH** |
| **CFAA Violation** | 30-50% | Very High | Cannot fully mitigate | **HIGH** |
| **Platform Account Bans** | 60-80% | Medium | Low | **MEDIUM** |
| **Cease-and-Desist Letters** | 50-70% | Medium | Legal fees | **MEDIUM** |
| **Civil Litigation** | 20-40% | Very High | $50K-500K+ | **HIGH** |
| **CCPA Violations** | 20-30% | High | $2.5K-7.5K per violation | **MEDIUM** |
| **Credential Breach** | 5-15% | Very High | Unlimited | **HIGH** |
| **Reputational Damage** | 30-50% | High | Unquantifiable | **MEDIUM-HIGH** |

### Risk Scenarios

#### Scenario 1: Platform Discovers Activity
- **Trigger**: Unusual access patterns, user reports, technical detection
- **Response**: Cease-and-desist letter, account bans
- **Impact**: Service disruption, legal fees, potential litigation

#### Scenario 2: Credential Breach
- **Trigger**: Database compromise, insider threat, vulnerability
- **Response**: Notification requirements, user credential exposure
- **Impact**: Liability for unauthorized access to user accounts, class action potential

#### Scenario 3: Competitor or Whistleblower Report
- **Trigger**: Industry complaint, former employee, user complaint
- **Response**: Regulatory inquiry, platform investigation
- **Impact**: Enforcement action, injunctive relief, damages

---

## Official API Alternatives

### Zillow Group APIs

**Available Through**: Bridge Interactive (now part of Zillow Group)

#### Available APIs

| API | Data Available | Access Method |
|-----|----------------|---------------|
| **Public Records API** | Tax assessments, transaction records (148M+ properties) | Application required |
| **Public Data Archives** | Research-grade data, looser ToS | Download access |
| **Partner APIs** | Tailored solutions for real estate professionals | Partner ID required |
| **Bridge Listing Output** | Modern RESTful API for MLS data | MLS partner discretion |

#### Application Process

1. Email: api@bridgeinteractive.com
2. Describe use case and company
3. Await approval (timeline varies)
4. Receive API credentials upon approval

#### Usage Restrictions

> "You may use the API only to retrieve and display dynamic content from Zillow. You are not permitted to store information locally."

### Redfin APIs

**Status**: No official public API available

#### Alternatives
- Downloadable housing market data on website
- Partner program inquiry (no public process)

### MLS Direct Access

#### Benefits
- Official data source
- Fully compliant
- Comprehensive property data
- Professional credibility

#### Process
- Contact local MLS boards (Arizona Regional MLS for Maricopa County)
- Apply for data feed access
- Pay licensing fees
- Integrate via RETS or RESO Web API

---

## Safer Integration Approaches

### Option A: Browser Extension Model

**How It Works**:
1. User installs Wabbit browser extension
2. User navigates to Zillow/Redfin/Homes.com in their browser
3. User clicks "Export to Wabbit" button
4. Extension extracts favorites from the page DOM
5. Data is sent to Wabbit servers (no credentials transmitted)

**Legal Basis**: User accessing their own data on their own device and choosing to share it.

**Advantages**:
- No credential storage
- User maintains control
- Platform cannot distinguish from normal user activity
- Lower legal risk

**Disadvantages**:
- Requires user action
- Browser extension development/maintenance
- Limited to users who install extension

### Option B: Manual CSV/JSON Import

**How It Works**:
1. Provide users instructions for each platform's export feature
2. User exports their favorites manually
3. User uploads file to Wabbit
4. Wabbit parses and imports property data

**Legal Basis**: No automated access; user provides their own data.

**Advantages**:
- Zero legal risk
- No technical integration needed
- Works with any platform

**Disadvantages**:
- Manual user effort
- Not all platforms offer easy export
- Data may be less structured

### Option C: OAuth Integration (If Available)

**How It Works**:
1. Platforms provide OAuth endpoints
2. Users authenticate directly with platform
3. Platform returns access token to Wabbit
4. Wabbit uses token for authorized API access

**Legal Basis**: Platform-authorized integration.

**Status**: Currently none of the three platforms offer public OAuth for third-party apps.

### Option D: Partner Agreement

**How It Works**:
1. Wabbit approaches platforms for partnership
2. Negotiate data sharing or integration terms
3. Implement authorized integration
4. Operate under contractual protection

**Advantages**:
- Fully compliant
- Sustainable long-term
- Professional credibility

**Disadvantages**:
- Requires business development effort
- May involve licensing fees
- Long negotiation timeline

### Comparison Matrix

| Approach | Legal Risk | Implementation | User Experience | Data Freshness |
|----------|------------|----------------|-----------------|----------------|
| **Credential Storage** | High | Medium | Good | Excellent |
| **Browser Extension** | Low | Medium | Good | On-demand |
| **Manual Import** | None | Low | Fair | Manual |
| **OAuth** | None | Low (if available) | Excellent | Excellent |
| **Partner Agreement** | None | High (business dev) | Excellent | Excellent |

---

## Required Disclosures If Proceeding

### User Consent Requirements

If the decision is made to proceed with credential-based integration despite risks, the following disclosures are **mandatory**:

#### Pre-Collection Disclosure

```markdown
## Third-Party Account Connection

By providing your login credentials for [Zillow/Redfin/Homes.com], you understand and agree:

1. **How We Use Your Credentials**
   - We will use your credentials to sign into your account on your behalf
   - We will access your saved/favorited properties
   - We will extract property details, images, and your notes
   - We will store this data in your Wabbit account

2. **Terms of Service Implications**
   - This activity may violate the Terms of Service of [Platform]
   - Your [Platform] account may be suspended or terminated
   - We are not responsible for any account actions taken by [Platform]

3. **Data Storage**
   - Your credentials will be stored using AES-256 encryption
   - We retain credentials only while your connection is active
   - You may delete your credentials at any time

4. **No Affiliation**
   - Wabbit is not affiliated with, endorsed by, or partnered with [Platform]
   - We do not have official authorization from [Platform]

5. **Your Rights**
   - You may disconnect your account at any time
   - Upon disconnection, we will delete your stored credentials within 24 hours
   - You may request a copy of all data we hold
```

#### Explicit Consent Checkboxes

```
[ ] I understand my [Platform] account may be suspended for this activity
[ ] I authorize Wabbit to access my [Platform] account on my behalf
[ ] I accept responsibility for any consequences from [Platform]
[ ] I have read and agree to the credential storage terms
```

#### Indemnification Clause

```markdown
You agree to indemnify and hold harmless Wabbit, its officers, directors,
employees, and agents from any claims, damages, losses, or expenses
(including reasonable attorney fees) arising from:
- Your use of the third-party account connection feature
- Any action taken by third-party platforms regarding your account
- Any breach of third-party Terms of Service through this feature
```

---

## Security Requirements

### Credential Storage

#### Encryption Standards

| Requirement | Specification |
|-------------|---------------|
| **Algorithm** | AES-256-GCM |
| **Key Derivation** | PBKDF2 with 100,000+ iterations |
| **Salt** | Unique per-credential, 256-bit random |
| **Key Storage** | Hardware Security Module (HSM) or cloud KMS |

#### Implementation Requirements

```typescript
// Minimum security implementation
interface CredentialStorage {
  // Encryption
  algorithm: 'aes-256-gcm';
  keyDerivation: 'pbkdf2';
  iterations: 100000;
  saltLength: 32; // bytes

  // Storage
  encryptedCredential: string;
  iv: string; // Initialization vector
  authTag: string; // GCM authentication tag
  salt: string;

  // Metadata
  createdAt: Date;
  lastUsed: Date;
  expiresAt: Date; // Auto-deletion
}
```

### Access Controls

| Control | Requirement |
|---------|-------------|
| **Authentication** | Multi-factor required for admin access |
| **Authorization** | Role-based, principle of least privilege |
| **Audit Logging** | All credential access logged with user, timestamp, purpose |
| **Separation** | Credentials isolated from application data |

### Breach Response Plan

1. **Detection**: Automated monitoring for unauthorized access
2. **Containment**: Immediate credential rotation capability
3. **Notification**:
   - Affected users within 72 hours
   - Platform notification if accounts may be compromised
   - Regulatory notification per CCPA/state law
4. **Remediation**: Forced password reset guidance for affected users

---

## Recommendations

### Primary Recommendation

**Do not implement credential-based integration** without formal legal review and risk acceptance from company leadership.

### Alternative Implementation Path

```
Phase 1 (Immediate): Manual Import
- Provide CSV upload for property data
- Create import templates for each platform
- Zero legal risk, immediate availability

Phase 2 (Short-term): Browser Extension
- Develop Chrome/Firefox extension
- User-controlled data export
- Low legal risk, better user experience

Phase 3 (Medium-term): Official Partnerships
- Apply for Zillow API access
- Contact Redfin business development
- Explore MLS direct integration
- Full compliance, sustainable operation

Phase 4 (If Required): Credential Integration
- Only after legal review and sign-off
- Implement all security requirements
- Full disclosure and consent framework
- Accept ongoing legal risk
```

### Decision Framework

| If You Need... | Then Choose... |
|----------------|----------------|
| MVP with no legal risk | Manual Import |
| Good UX with low risk | Browser Extension |
| Long-term sustainable solution | Official API/Partnership |
| Maximum data freshness despite risk | Credential Integration (with legal review) |

---

## Legal Precedents & Case Law

### Scraping and CFAA Cases

| Case | Year | Court | Holding | Relevance |
|------|------|-------|---------|-----------|
| **hiQ Labs v. LinkedIn** | 2022 | 9th Cir. | Public scraping ≠ CFAA violation | Supports public data access only |
| **Van Buren v. United States** | 2021 | SCOTUS | "Exceeds authorized access" narrowly defined | Narrows CFAA but doesn't help credential use |
| **United States v. Nosal (II)** | 2016 | 9th Cir. | Using another's credentials = unauthorized | Directly threatens credential model |
| **Meta v. Bright Data** | 2024 | N.D. Cal. | Public scraping without login OK | Limited to unauthenticated access |
| **X Corp. v. Bright Data** | 2024 | N.D. Cal. | ToS claims may be preempted by Copyright | Slightly favorable for ToS violations |

### Key Takeaways from Case Law

1. **Public vs. Authenticated Access**: Courts distinguish between accessing public data (generally OK) and authenticated access (more restricted)

2. **Consent vs. Authorization**: User consent to share credentials does NOT equal platform authorization for access

3. **Post-Revocation Access**: If platform issues cease-and-desist, continued access is clearly "without authorization"

4. **Contract vs. CFAA**: Many ToS violation claims are now treated as contract disputes rather than CFAA violations

---

## Sources & References

### Terms of Service
- Zillow Terms of Use: https://www.zillowgroup.com/terms-of-use/
- Redfin Terms of Use: https://www.redfin.com/about/terms-of-use

### Legal Analysis
- "Is Scraping Zillow Legal? A Complete Guide" - SoftwarePair
- "Ninth Circuit Holds Data Scraping is Legal in hiQ v. LinkedIn" - California Lawyers Association
- "CFAA Clarity From 9th Circuit Password-Sharing Decisions" - Fenwick & West
- "District Court Adopts Broad View of Copyright Preemption" - Skadden

### Privacy Regulations
- California Consumer Privacy Act (CCPA) - Official Text
- CPRA Amendments - California Privacy Protection Agency
- "CCPA Privacy Policy Requirements 2025" - Secure Privacy

### API Documentation
- Zillow Group Data & APIs: https://www.zillowgroup.com/developers/
- Bridge Interactive API Access: api@bridgeinteractive.com

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Legal/Engineering Review | Initial comprehensive analysis |

---

## Approval & Sign-Off

This document requires review and sign-off before any credential-based integration is implemented:

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Legal Counsel | | | |
| CTO/Engineering Lead | | | |
| CEO/Business Owner | | | |
| Privacy Officer | | | |

---

*This document is for internal planning purposes only and does not constitute legal advice. Consult with qualified legal counsel before implementing any features discussed herein.*
