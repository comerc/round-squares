# Технический дизайн: Минимальная email-based OTP

## Обзор архитектуры

Самая простая реализация email-based OTP. При каждой попытке входа отправляется код на email пользователя. OTP хранится только в памяти сервера, без какой-либо привязки к аккаунту пользователя.

## Компоненты

### Backend

#### Схема базы данных
Нет изменений в схеме БД - OTP работает без состояния пользователя.

#### API структура
```
POST /api/auth/login-with-otp
- Body: { username: string, email: string, password: string }
- Проверяет credentials, отправляет OTP на email, сохраняет код в памяти
- Response: { otpSent: boolean }

POST /api/auth/verify-otp
- Body: { username: string, email: string, otp: string }
- Проверяет OTP из памяти и возвращает JWT токен
- Response: { token: string } или { error: string }
```

#### Кэширование OTP
```typescript
// Простой in-memory Map для OTP
const otpCache = new Map<string, string>();

// Ключ: email (или хэш email)
// Значение: 6-значный код
// Автоматическая очистка через 5 минут
```

### Frontend

#### Компоненты
- Обновленная форма входа с полями: username, email, password, OTP
- Кнопка "Получить код" для отправки OTP

#### Flow аутентификации
1. Пользователь вводит username, email и password
2. Нажимает "Получить код" → система проверяет credentials и отправляет OTP на email
3. Пользователь вводит полученный OTP код
4. При успешной верификации → получает доступ

## Безопасность

### Безопасность
- OTP коды живут 5 минут в памяти
- Rate limiting: максимум 3 попытки в минуту на email
- HTTPS обязателен

## Производительность
- In-memory Map для быстрого доступа
- Минимальный overhead

## Тестирование

### Vitest Preview Provider
Тесты запускаются в браузерном preview через @vitest/browser-preview:
- Тесты компонентов OTP формы
- Интеграционные тесты с мок-сервером
- Быстрая проверка UX потока входа в разработке