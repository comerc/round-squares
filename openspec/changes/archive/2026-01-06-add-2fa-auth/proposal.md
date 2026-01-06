# Change: Add Email-based Two-Factor Authentication (2FA)

## Why
Enhance security for user accounts (especially `admin` and `nikita`) by requiring a second factor during login.

## What Changes
- **Mechanism**: Email-based OTP (One-Time Password) instead of TOTP app.
- **Storage**: In-Memory OTP storage (no persistence).
- **Data Model**: NO database changes. Email is provided by user during login, not stored.
- **Flow**:
  1. User enters `username`, `password`, AND `email`.
  2. System verifies credentials.
  3. System generates 6-digit OTP (1 min valid) and sends to `email`.
  4. User enters OTP.
  5. System issues session.
- **Config**: Add SMTP configuration to `.env`.
- **Testing**: Add E2E tests using **Vitest Browser Mode**.
- **Dev Tooling**: Use Mailpit for local email capture.

## Impact
- **Affected specs**: Auth
- **Affected code**:
  - `backend/src/routes/auth.ts`: Update login logic.
  - `backend/src/services/otpStore.ts`: New in-memory store.
  - `backend/src/services/email.ts`: New email service.
  - Frontend Login Page.
- **Dependencies**:
    - Backend: `nodemailer`.
    - Frontend: `vitest`, `@vitest/browser` (dev).
