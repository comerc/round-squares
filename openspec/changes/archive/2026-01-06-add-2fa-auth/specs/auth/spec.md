## ADDED Requirements
### Requirement: User Authentication
Users MUST authenticate using credentials and Email-based OTP.

#### Scenario: Login initiation
- **WHEN** user submits valid username, password, and email
- **THEN** system generates 6-digit OTP
- **AND** sends OTP to provided email
- **AND** returns "OTP required" status

#### Scenario: OTP Verification Success
- **WHEN** user submits valid OTP for their username
- **AND** OTP is not expired (< 1 min)
- **THEN** system issues authentication token

#### Scenario: OTP Verification Failure
- **WHEN** user submits invalid OTP
- **THEN** system increments attempt counter
- **WHEN** attempts exceed 3
- **THEN** OTP is invalidated

#### Scenario: OTP Expiration
- **WHEN** user submits OTP after 1 minute
- **THEN** system rejects request

### Requirement: Email Configuration
The system SHALL be configurable for email delivery via environment variables.

#### Scenario: Configuration loading
- **WHEN** application starts
- **THEN** it must load SMTP settings (Host, Port, User, Pass, From) from environment

### Requirement: E2E Testing Support
The system SHALL support end-to-end testing of the authentication flow.

#### Scenario: Mailpit Integration
- **WHEN** running in development/test mode
- **THEN** emails are delivered to Mailpit for verification by tests
