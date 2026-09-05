# Application Security & Threat Model

**AyurSetu Clinical Platform**
**Ministry of Ayush / AIIA Healthcare Information Security Policy**

---

## 🔒 1. Cryptographic Standards
- **Encryption at Rest**:
  - Application-level field encryption via **AES-256-GCM** ([`lib/security/crypto.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/security/crypto.ts)).
  - 96-bit unique IV per record + 128-bit authentication tag to prevent ciphertext tampering.
  - Sensitive protected fields: `User.abhaId`, `Patient.phone`, diagnostic prescription notes.
- **Encryption in Transit**: Strict TLS 1.3 encryption enforced with HSTS (`max-age=63072000; includeSubDomains; preload`).

---

## 🛡️ 2. Defense-in-Depth HTTP Security Headers
- `X-Frame-Options: DENY`: Prevents UI redressing & clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Mitigates MIME-confusion attacks.
- `Permissions-Policy`: Restricts browser hardware access strictly to origin for microphone and camera.
- `poweredByHeader: false`: Masks server identity banner.

---

## 🛑 3. OWASP Health Top 10 Mitigation Checklist

| OWASP Risk | Implementation Countermeasure |
|---|---|
| **A01: Broken Access Control** | Strict RBAC (`ADMIN`, `DOCTOR`, `PATIENT`) enforced via middleware and database ownership validation. |
| **A02: Cryptographic Failures** | AES-256-GCM at rest, SHA-256 password hashing, zero PHI in plain log streams. |
| **A03: Injection** | Parameterized Prisma ORM queries, Zod schema validation on 100% of API endpoints. |
| **A04: Insecure Design** | Explicit non-diagnostic physician safety directive and mandatory doctor sign-off. |
| **A05: Security Misconfiguration** | Automated Next.js security headers, secure cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`). |
