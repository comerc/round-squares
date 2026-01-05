# auth Specification

## Purpose
TBD - created by archiving change add-2fa. Update Purpose after archive.
## Requirements
### Requirement: Two-Factor Authentication Login

The system SHALL require email-based two-factor authentication for all users during login. The system SHALL generate and send a 5-digit OTP code to the provided email address, then require OTP verification to complete authentication.

#### Scenario: Login with 2FA

- **WHEN** пользователь вводит username, password и email для входа
- **THEN** система проверяет credentials
- **AND** генерирует 5-значный OTP код
- **AND** отправляет код на предоставленный email
- **AND** возвращает challenge для OTP верификации

#### Scenario: OTP verification success

- **WHEN** пользователь предоставляет корректный OTP код
- **THEN** система завершает аутентификацию
- **AND** выдает JWT токен
- **AND** устанавливает cookie с токеном

#### Scenario: OTP verification failure

- **WHEN** пользователь предоставляет некорректный OTP код
- **THEN** система возвращает ошибку аутентификации
- **AND** не выдает токен доступа

### Requirement: Email OTP Generation

The system SHALL generate 5-digit OTP codes that are memorable for humans. The system SHALL use predefined patterns rather than fully random codes.

#### Scenario: OTP code generation

- **WHEN** системе требуется сгенерировать OTP код
- **THEN** выбирает код из предопределенного списка легко запоминаемых комбинаций
- **AND** код состоит из 5 цифр
- **AND** код не является полностью случайным

#### Scenario: OTP code format

- **WHEN** генерируется OTP код
- **THEN** код содержит только цифры
- **AND** длина кода равна 5 символам

### Requirement: Email Delivery

The system SHALL send OTP codes via email using a reliable email service. The system SHALL use Mailpit for local development and production email service for deployment.

#### Scenario: Email sending

- **WHEN** пользователь предоставляет email при логине
- **THEN** система отправляет email с 5-значным OTP кодом
- **AND** email содержит четкие инструкции по использованию кода

#### Scenario: Email template

- **WHEN** отправляется OTP email
- **THEN** email содержит читаемый дизайн
- **AND** 5-значный код выделен для легкого чтения
- **AND** указано время действия кода (1 минута)

### Requirement: Security Standards

The 2FA implementation SHALL comply with security standards. The system SHALL implement proper OTP expiration and rate limiting.

#### Scenario: OTP expiration

- **WHEN** генерируется OTP код
- **THEN** код действителен в течение 1 минуты
- **AND** после истечения срока код становится недействительным
- **AND** система автоматически удаляет истекшие коды из памяти

#### Scenario: Rate limiting

- **WHEN** пользователь пытается ввести OTP код
- **THEN** система разрешает максимум 3 попытки ввода
- **AND** после 3 неудачных попыток код становится недействительным

