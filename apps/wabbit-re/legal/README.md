# Legal Documentation

This directory contains legal analysis, compliance documentation, and risk assessments for Wabbit Real Estate Platform features.

## Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [THIRD_PARTY_CREDENTIAL_INTEGRATION.md](./THIRD_PARTY_CREDENTIAL_INTEGRATION.md) | Legal analysis for Zillow/Redfin/Homes.com credential integration | Legal Review Required |

## Quick Reference

### Third-Party Integration Risk Summary

| Approach | Legal Risk | Recommendation |
|----------|------------|----------------|
| Credential Storage & Use | **HIGH** | Avoid without legal counsel |
| Browser Extension | LOW | Recommended alternative |
| Manual CSV Import | NONE | MVP approach |
| Official API Partnership | NONE | Best long-term solution |

### Key Legal Concerns

1. **Terms of Service**: All three platforms prohibit automated access and credential sharing
2. **CFAA Risk**: Using user credentials may constitute "unauthorized access" per Nosal II
3. **CCPA Compliance**: Credentials are "sensitive personal information" with strict handling requirements

### Before Implementing Any Credential-Based Feature

- [ ] Obtain formal legal counsel review
- [ ] Document risk acceptance from leadership
- [ ] Implement all security requirements
- [ ] Create compliant user disclosure and consent flows
- [ ] Establish breach response procedures

## Contact

For questions about these documents, contact the legal/compliance team.

---

*Last Updated: December 2025*
