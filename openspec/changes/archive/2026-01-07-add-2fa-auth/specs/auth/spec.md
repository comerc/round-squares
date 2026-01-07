## ADDED Requirements

### Requirement: Email Two-Factor Authentication
Users MUST provide an email and verify an OTP code to login. 2FA is mandatory for all users. OTP codes are sent via email (mocked) and stored in-memory.

#### Scenario: Successful Login with 2FA
- **WHEN** user submits valid username, password, and email to `/auth/login`
- **THEN** system generates a 6-digit OTP code
- **AND** stores it in memory associated with the username
- **AND** responds with `require2fa: true`
- **WHEN** user submits valid OTP code to `/auth/2fa/verify`
- **THEN** system validates the code
- **AND** returns an authentication token
- **AND** removes the used OTP code

#### Scenario: Missing Email
- **WHEN** user submits login request without email
- **THEN** system returns 400 Bad Request error

#### Scenario: Invalid OTP
- **WHEN** user submits invalid OTP code
- **THEN** system returns 401 Unauthorized error

#### Scenario: Expired OTP
- **WHEN** user submits OTP code after 5 minutes
- **THEN** system returns 401 Unauthorized error or indicates expiration
