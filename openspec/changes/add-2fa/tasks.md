## 1. Backend Changes

### 1.1 Email Service Setup

- [ ] Настроить nodemailer с Mailpit для локальной разработки
- [ ] Создать HTML шаблоны для email с OTP кодами
- [ ] Добавить валидацию email адресов пользователей

### 1.2 Authentication Logic

- [ ] Добавить утилиты для генерации 5-значных OTP кодов (использовать паттерны, легко запоминаемые человеком)
- [ ] Создать email сервис с nodemailer для отправки OTP кодов
- [ ] Модифицировать /login endpoint для поддержки 2FA:
  - Добавить поле email в запрос логина
  - После успешной аутентификации генерировать OTP и отправлять на предоставленный email
  - Возвращать challenge вместо полного токена
  - Добавить новый endpoint /verify-2fa для верификации OTP кода
- [ ] Реализовать хранение OTP кодов в памяти с expiration (5-10 минут)

### 1.3 Security Updates

- [ ] Добавить middleware для защиты чувствительных операций
- [ ] Реализовать In-Memory OTP store с expiration (1 минута)
- [ ] Реализовать rate limiting (макс 3 попытки на OTP)
- [ ] Добавить автоматическую очистку истекших кодов

## 2. Frontend Changes

### 2.1 API Layer

- [ ] Модифицировать authApi.login() для поддержки email в запросе
- [ ] Добавить метод verify2FA(code) для верификации OTP
- [ ] Обновить типы для новых API ответов (challenge, verification)

### 2.2 State Management

- [ ] Модифицировать authStore для поддержки 2FA flow
- [ ] Добавить состояния: loginStep ('credentials' | 'otp'), pendingLoginData
- [ ] Обновить login flow: credentials → OTP challenge → OTP verification

### 2.3 UI Components

- [ ] Обновить LoginForm для двухэтапного процесса:
  - Шаг 1: username + password + email
  - Шаг 2: OTP код
- [ ] Добавить компонент OTPInput для ввода 5-значного кода
- [ ] Добавить возможность вернуться к шагу 1 при ошибке

### 2.4 Pages

- [ ] Создать страницу Settings с секцией 2FA
- [ ] Обновить LoginPage для поддержки 2FA верификации

## 3. Dependencies

- [ ] Добавить nodemailer для отправки email
- [ ] Добавить @types/nodemailer для TypeScript типов
- [ ] Настроить Mailpit для локальной разработки
- [ ] Обновить package.json и установить зависимости

## 4. Testing

- [ ] Написать unit-тесты для OTP генерации и email сервиса
- [ ] Написать интеграционные тесты для 2FA flow
- [ ] Протестировать edge cases (неверные коды, expired OTP, rate limiting)
- [ ] Настроить Mailpit для локального тестирования email

## 5. Development Setup

- [ ] Настроить Mailpit для локальной разработки
- [ ] Добавить docker-compose.override.yml с Mailpit сервисом
- [ ] Обновить README с инструкциями по запуску с Mailpit

## 6. Documentation

- [ ] Обновить API документацию
- [ ] Добавить инструкции для пользователей по настройке 2FA
- [ ] Документировать процесс тестирования email с Mailpit
