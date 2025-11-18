# Соглашения

## Структура /frontend

```
src/
├── app/
│   ├── router.tsx          # конфигурация роутера
│   └── store.ts            # конфигурация store
├── components/
│   ├── ui/              # Button, Input, Card и т.д.
│   └── common/          # общие компоненты
├── layouts/
│   ├── AppLayout.tsx
│   └── PageLayout.tsx
├── pages/
│   ├── IndexPage.tsx
│   ├── BoardPage.tsx
│   └── NotFoundPage.tsx
├── hooks/               # кастомные хуки
├── utils/               # утилиты
├── types/               # TypeScript типы
├── api/                 # API вызовы
└── assets/              # статика
```

Правила именования:

- Компоненты: PascalCase (`UserCard.tsx`)
- Хуки: camelCase с префиксом `use` (`useAuth.ts`)
- Утилиты: camelCase (`formatDate.ts`)
- Страницы: PascalCase с суффиксом `Page`
  (`IndexPage.tsx`)
- Layout'ы: PascalCase с суффиксом `Layout`
  (`AppLayout.tsx`)

## API Endpoints

### Авторизация

- `POST /api/auth/login` - вход
- `POST /api/auth/register` - регистрация
- `POST /api/auth/logout` - выход
- `GET /api/auth/me` - текущий пользователь

### Раунды

- `GET /api/rounds` - список всех раундов
- `GET /api/rounds/:id` - детали раунда
- `POST /api/rounds` - создание раунда (только admin)
- `GET /api/rounds/:id/stats` - статистика раунда

### Тапы

- `POST /api/rounds/:id/tap` - тап по гусю

## WebSocket

WebSocket подключение доступно по адресу `ws://localhost:3000/ws`

События:

- `round:update` - обновление статистики раунда
- `user:score` - обновление личного счета
- `round:status` - изменение статуса раунда

Подписка на раунд:

```json
{
  "type": "subscribe",
  "roundId": "uuid"
}
```

## Как работает optimistic-update

- Пользователь кликает → счетчик обновляется сразу (оптимистично)
- Запрос добавляется в очередь → обрабатывается последовательно
- После ответа сервера → состояние синхронизируется с сервером
- При ошибке → откат к предыдущему состоянию
