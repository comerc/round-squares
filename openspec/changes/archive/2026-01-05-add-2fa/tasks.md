## 1. Backend Changes

### 1.1 Email Service Setup

- [x] Создать HTML шаблоны для email с OTP кодами
- [x] Добавить валидацию email адресов пользователей

### 1.2 Authentication Logic

- [x] Добавить утилиты для генерации 5-значных OTP кодов (использовать паттерны, легко запоминаемые человеком)
- [x] Создать email сервис с nodemailer для отправки OTP кодов
- [x] Модифицировать /login endpoint для поддержки 2FA:
  - Добавить поле email в запрос логина
  - После успешной аутентификации генерировать OTP и отправлять на предоставленный email
  - Возвращать challenge вместо полного токена
  - Добавить новый endpoint /verify-2fa для верификации OTP кода
- [x] Реализовать хранение OTP кодов в памяти с expiration (5-10 минут)

### 1.3 Security Updates

- [ ] Добавить middleware для защиты чувствительных операций
- [x] Реализовать In-Memory OTP store с expiration (1 минута)
- [x] Реализовать rate limiting (макс 3 попытки на OTP)
- [x] Добавить автоматическую очистку истекших кодов

## 2. Frontend Changes

### 2.1 API Layer

- [x] Модифицировать authApi.login() для поддержки email в запросе
- [x] Добавить метод verify2FA(code) для верификации OTP
- [x] Обновить типы для новых API ответов (challenge, verification)

### 2.2 State Management

- [x] Модифицировать authStore для поддержки 2FA flow
- [x] Добавить состояния: loginStep ('credentials' | 'otp'), pendingLoginData
- [x] Обновить login flow: credentials → OTP challenge → OTP verification

### 2.3 UI Components

- [x] Обновить LoginForm для двухэтапного процесса:
  - Шаг 1: username + password + email
  - Шаг 2: OTP код
- [x] Добавить компонент OTPInput для ввода 5-значного кода
- [x] Добавить возможность вернуться к шагу 1 при ошибке

### 2.4 Pages

- [x] Обновить LoginPage для поддержки 2FA верификации

## 3. Dependencies

- [x] Добавить nodemailer для отправки email
- [x] Добавить @types/nodemailer для TypeScript типов
- [x] Обновить package.json и установить зависимости

## 4. Testing

- [ ] Написать unit-тесты для OTP генерации и email сервиса
- [ ] Написать интеграционные тесты для 2FA flow
- [ ] Протестировать edge cases (неверные коды, expired OTP, rate limiting)

## 6. Documentation

- [x] Обновить API документацию
- [x] Добавить инструкции для пользователей по настройке 2FA
- [x] Документировать процесс тестирования email с Mailpit
