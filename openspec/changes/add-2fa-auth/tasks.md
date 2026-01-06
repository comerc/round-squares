## 1. Backend Implementation
- [ ] 1.1 Install `nodemailer` and `@types/nodemailer`.
- [ ] 1.2 Implement `OtpStore` service (In-Memory `Map`, expiration 1 min, cleanup 5 mins, max 3 attempts).
- [ ] 1.3 Add email config to `.env` and `backend/src/utils/constants.ts` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
- [ ] 1.4 Implement `EmailService` using `nodemailer` and config.
- [ ] 1.5 Refactor `POST /auth/login`:
    - Accept `email` in body.
    - Verify username/password.
    - Generate OTP, store in `OtpStore`, send via `EmailService`.
    - Return `{ message: "OTP sent" }` (do not issue JWT yet).
- [ ] 1.6 Implement `POST /auth/verify-otp`:
    - Accept `username` and `otp`.
    - Validate OTP from `OtpStore`.
    - Issue JWT (HttpOnly cookie) upon success.
    - Clear OTP after success.

## 2. Frontend Implementation
- [ ] 2.1 Update Login Form:
    - Add `email` input field (always visible or revealable).
    - Handle 2-step flow:
        1. Submit Credentials + Email.
        2. If success, show OTP input.
        3. Submit OTP.
- [ ] 2.2 Add UI handling for "OTP Sent" and error states (wrong OTP, expired).

## 3. Testing
- [ ] 3.1 Setup Vitest Browser Mode in `frontend/`.
    - Install `vitest`, `@vitest/browser`, `playwright` (as browser provider).
    - Configure `vitest.config.ts`.
- [ ] 3.2 Implement e2e test: Successful login flow (mock email or check Mailpit API).
- [ ] 3.3 Implement e2e test: Invalid OTP.
- [ ] 3.4 Implement e2e test: Expired OTP (wait 1 min).
