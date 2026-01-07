# Технический дизайн

## Стек
- **Backend**: Node.js (In-Memory `Map`).
- **No Database Changes**.

## Хранение данных (In-Memory)
```typescript
interface OtpSession {
  code: string;
  expiresAt: number; // Date.now() + 5 * 60 * 1000
}

// Глобальная переменная или синглтон в модуле auth
const otpStore = new Map<string, OtpSession>(); // Key: username
```

## API Интерфейс

### `POST /auth/login`
- **Body**: `{ username, password, email }` (Все поля обязательны)
- **Logic**:
  1. Валидация: `email` обязателен.
  2. Найти пользователя по `username`.
  3. Проверить `password`.
  4. Сгенерировать `code` (6 случайных цифр).
  5. `otpStore.set(username, { code, expiresAt... })`.
  6. `console.log(\`Sending OTP \${code} to \${email}\`)`.
  7. **Response**: `{ require2fa: true, message: "Code sent" }`. (Не возвращаем токен!).

### `POST /auth/2fa/verify`
- **Body**: `{ username, code }`
- **Logic**:
  1. Получить сессию из `otpStore.get(username)`.
  2. Проверить существование, срок действия и совпадение кода.
  3. Если ОК:
     - `otpStore.delete(username)`.
     - Сгенерировать JWT.
     - **Response**: `{ accessToken, user: ... }`.
  4. Если Ошибка: 401 Unauthorized.

## Frontend
- Логин форма всегда отображает 3 поля: Username, Password, Email.
- Валидация на клиенте требует заполнения всех полей.
- При успешном сабмите меняем UI на ввод 6 цифр.
