# Security Check Framework

Perform a comprehensive security audit of $ARGUMENTS. Analyze for vulnerabilities and provide actionable recommendations.

## Audit Scope

Examine the target (file, directory, codebase, or specific feature) for security issues across these categories:

### 1. Authentication & Authorization
- [ ] Authentication bypass vulnerabilities
- [ ] Weak password policies or storage
- [ ] Missing or improper session management
- [ ] Broken access control (IDOR, privilege escalation)
- [ ] Missing authentication on sensitive endpoints
- [ ] JWT/token vulnerabilities (weak signing, no expiry)

### 2. Injection Vulnerabilities
- [ ] SQL injection
- [ ] NoSQL injection
- [ ] Command injection
- [ ] LDAP injection
- [ ] XPath injection
- [ ] Template injection (SSTI)

### 3. Cross-Site Scripting (XSS)
- [ ] Reflected XSS
- [ ] Stored XSS
- [ ] DOM-based XSS
- [ ] Improper output encoding
- [ ] Missing Content-Security-Policy headers

### 4. Data Exposure
- [ ] Sensitive data in logs
- [ ] Hardcoded secrets/credentials
- [ ] Exposed API keys
- [ ] Unencrypted sensitive data at rest
- [ ] Unencrypted data in transit
- [ ] Excessive data exposure in API responses

### 5. Configuration & Infrastructure
- [ ] Debug mode enabled in production
- [ ] Default credentials
- [ ] Misconfigured CORS
- [ ] Missing security headers (HSTS, X-Frame-Options, etc.)
- [ ] Exposed error messages/stack traces
- [ ] Insecure dependencies (outdated packages)

### 6. Input Validation
- [ ] Missing server-side validation
- [ ] Type confusion vulnerabilities
- [ ] Path traversal
- [ ] File upload vulnerabilities
- [ ] XML External Entity (XXE) attacks

### 7. API Security
- [ ] Rate limiting absent
- [ ] Missing request validation
- [ ] Mass assignment vulnerabilities
- [ ] Broken function-level authorization
- [ ] Improper inventory management

### 8. Cryptography
- [ ] Weak algorithms (MD5, SHA1 for passwords)
- [ ] Insufficient key length
- [ ] Insecure random number generation
- [ ] Missing encryption where needed

### 9. Database Security (Supabase/PostgreSQL)
- [ ] Missing Row Level Security (RLS) policies
- [ ] Overly permissive RLS policies
- [ ] Service role key exposure to client
- [ ] Unvalidated user input in queries
- [ ] Missing foreign key constraints

### 10. Client-Side Security
- [ ] Sensitive logic in client-side code
- [ ] LocalStorage/SessionStorage of sensitive data
- [ ] Insecure postMessage handlers
- [ ] Clickjacking vulnerabilities

---

## Output Format

After analysis, provide:

### Vulnerabilities Found

For each vulnerability:
```
**[SEVERITY: CRITICAL/HIGH/MEDIUM/LOW]** - [Vulnerability Name]
- Location: [file:line or component]
- Description: [What the issue is]
- Impact: [What could happen if exploited]
- Remediation: [How to fix it]
```

### Security Score

Rate the current security posture on a scale of 1-10:

| Score | Rating | Description |
|-------|--------|-------------|
| 1-2 | Critical | Multiple critical vulnerabilities, immediate action required |
| 3-4 | Poor | Significant security gaps, high risk of exploitation |
| 5-6 | Fair | Some vulnerabilities present, needs improvement |
| 7-8 | Good | Minor issues, follows most best practices |
| 9-10 | Excellent | Strong security posture, minimal risk |

**Current Score: X/10**

Justification: [Brief explanation of the score]

### Top Recommendations to Improve Score

Provide at least TWO actionable recommendations:

**Recommendation 1: [Title]**
- Current State: [What's happening now]
- Target State: [What should happen]
- Implementation Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- Expected Score Impact: +X points

**Recommendation 2: [Title]**
- Current State: [What's happening now]
- Target State: [What should happen]
- Implementation Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- Expected Score Impact: +X points

---

## Execution Instructions

1. If `$ARGUMENTS` is empty, audit the entire codebase starting from the root
2. If `$ARGUMENTS` is a file path, audit that specific file
3. If `$ARGUMENTS` is a directory, audit all files in that directory
4. If `$ARGUMENTS` is a feature name (e.g., "authentication", "API"), audit related components

Use the following tools to perform the audit:
- **Grep**: Search for patterns like `password`, `secret`, `key`, `token`, `eval`, `exec`, `dangerouslySetInnerHTML`
- **Read**: Examine suspicious files in detail
- **Glob**: Find configuration files, env files, and sensitive file patterns

Focus on OWASP Top 10 vulnerabilities and framework-specific security concerns (Next.js, Supabase, React).
