## Context

We need simple 2FA without DB schema changes or permanent email storage.

## Goals

- Secure login.
- Zero persistence for emails.
- Stateless-ish (except in-memory OTP).

## Decisions

- **OTP Storage**: In-Memory `Map<username, OTPData>`.
  - `OTPData`: `{ code: string, expiresAt: number, attempts: number }`.
  - **Risks**: Server restart clears all pending OTPs (acceptable for this scope).
  - **Cleanup**: `setInterval` runs every 5 mins to delete expired entries.
- **Email Delivery**:
  - **User Input**: User MUST provide email at every login.
  - **Transport**: SMTP to Mailpit (`localhost:1025`) in dev.
- **Login Flow**:
  - Split into "Initiate" and "Verify".
  - `Initiate` checks DB password -> Sends Email -> Stores OTP.
  - `Verify` checks OTP -> Issues JWT.

## Security Constraints

- **Validity**: 1 minute.
- **Attempts**: Max 3 failed attempts per generated OTP -> invalidate.
- **Email**: Not stored in DB. Vulnerable to "enter anyone's email if I know their password", but this proves user has access to _that_ email inbox at that moment.

## Trade-offs

- **UX**: User must type email every time.
- **Reliability**: Restarting server breaks pending logins.
