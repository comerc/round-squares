# Project Context

## Purpose

"The Last of Guss" - браузерная multiplayer игра, где игроки соревнуются, кто быстрее и больше натапает по виртуальному гусю.

**Основные возможности:**
- Создание и управление игровыми раундами (только администраторы)
- Real-time тапы по гусю с мгновенным обновлением счетчиков
- Лидерборды и статистика игроков
- WebSocket для real-time обновлений
- JWT-аутентификация с ролевой системой

**Правила игры:**
- 1 тап = 1 очко
- Каждый 11-й тап дает 10 очков (бонусная механика)
- Тапать можно только в активном раунде
- Специальная роль "nikita" - тапы не считаются в статистике

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify 5.x (веб-фреймворк)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL с Drizzle ORM
- **Authentication**: JWT токены в HTTP-only cookies
- **Real-time**: WebSocket + PostgreSQL LISTEN/NOTIFY для межсерверного broadcast
- **Password hashing**: bcrypt
- **Validation**: Zod schemas

### Frontend
- **Framework**: React 19
- **Build tool**: Vite 7.x
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x + Ant Design 5.x (с патчем для React 19)
- **State management**: Zustand
- **Routing**: React Router DOM 7.x
- **HTTP client**: Fetch API (custom wrapper)
- **Date handling**: date-fns

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Database migrations**: Drizzle Kit
- **Code formatting**: Prettier с Tailwind plugin
- **Linting**: ESLint
- **Process management**: tsx для development

## Project Conventions

### Code Style

**Prettier конфигурация:**
```json
{
  "trailingComma": "all",
  "semi": false,
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Именование:**
- Компоненты: `PascalCase` (`UserCard.tsx`, `RoundsList.tsx`)
- Хуки: `camelCase` с префиксом `use` (`useAuth.ts`)
- Утилиты: `camelCase` (`formatDate.ts`, `calculateScore.ts`)
- Страницы: `PascalCase` с суффиксом `Page` (`RoundsListPage.tsx`)
- Layout'ы: `PascalCase` с суффиксом `Layout` (`AppLayout.tsx`)
- Типы: `PascalCase` (`User`, `Round`, `AuthState`)
- API файлы: `camelCase` с суффиксом `.api.ts` (`auth.api.ts`, `rounds.api.ts`)

### Architecture Patterns

**Backend:**
- **Stateless API**: Все endpoints не хранят состояние, аутентификация через JWT
- **Transaction-based consistency**: Критические операции (тапы) выполняются в транзакциях с `SELECT FOR UPDATE`
- **Pub/Sub для масштабирования**: PostgreSQL LISTEN/NOTIFY для межсерверного WebSocket broadcast
- **Domain separation**: Отдельные модули для auth, rounds, tap логики

**Frontend:**
- **Component composition**: Переиспользуемые UI компоненты в `/components`
- **Store-based state**: Zustand stores для глобального состояния (auth, rounds, tap, websocket)
- **Optimistic updates**: UI обновляется сразу, затем синхронизируется с сервером
- **Route-based pages**: Страницы организованы по роутам в `/pages`

**Общая архитектура:**
- **Multi-instance ready**: Поддержка горизонтального масштабирования (3+ инстанса бекенда)
- **Real-time first**: WebSocket для мгновенных обновлений интерфейса
- **Database-first**: Все бизнес-логика валидируется на уровне БД

### Testing Strategy

**Текущий статус:** Тесты не реализованы в проекте.

**Рекомендуемый подход:**
- Unit тесты для утилит и бизнес-логики (Jest + Testing Library)
- Integration тесты для API endpoints (Supertest)
- E2E тесты для критических пользовательских сценариев (Playwright)
- Фокус на тестировании транзакций и real-time функциональности

### Git Workflow

**Рекомендуемый подход:**
- **Main branch**: Стабильная production версия
- **Feature branches**: `feature/feature-name` для новых возможностей
- **Bugfix branches**: `bugfix/bug-description` для исправлений
- **Pull requests**: Code review обязательно для всех изменений
- **Conventional commits**: `<type>(<scope>): <description>`

**Типы коммитов:**
- `feat:` - новая функциональность
- `fix:` - исправление багов
- `refactor:` - рефакторинг без изменения функциональности
- `docs:` - изменения в документации
- `style:` - форматирование кода

## Domain Context

**Игровые сущности:**
- **Users**: Игроки с ролями (admin, survivor, nikita)
- **Rounds**: Игровые сессии с временем начала/окончания и cooldown периодами
- **UserRounds**: Связь игрок-раунд с счетчиками тапов и очков

**Бизнес-правила:**
- Раунды создаются только администраторами
- Активный раунд: текущее время между start_time и end_time
- Cooldown период: после окончания раунда нельзя тапать некоторое время
- Специальная роль "nikita": тапы регистрируются но не учитываются в статистике

**Real-time аспекты:**
- WebSocket подключение обязательно для игры
- Подписка на конкретный раунд (`roundId`)
- События: `round:update`, `user:score`, `round:status`

## Important Constraints

**Технические ограничения:**
- **Stateless architecture**: Все инстансы бекенда должны быть идентичны
- **Database consistency**: Транзакции обязательны для предотвращения race conditions
- **Real-time requirements**: WebSocket соединения должны поддерживать 10+ одновременных пользователей
- **Multi-instance deployment**: Горизонтальное масштабирование без shared state

**Производительность:**
- **Тапы**: ~10-100 тапов/сек на раунд (10 игроков)
- **Транзакции**: Короткие блокировки только необходимых строк
- **WebSocket**: Легковесные соединения без server-side session storage

**Безопасность:**
- **JWT в HTTP-only cookies**: Предотвращение XSS атак
- **Password hashing**: bcrypt с salt rounds
- **Role-based access**: Админские функции только для admin роли

## External Dependencies

**Обязательные:**
- **PostgreSQL 16+**: Основная база данных с Pub/Sub
- **Node.js 18+**: Runtime для бекенда
- **Docker & Docker Compose**: Для локальной разработки и развертывания

**Production considerations:**
- **Load balancer**: Nginx/AWS ALB с sticky sessions для WebSocket
- **Connection pooling**: pgBouncer для оптимизации БД соединений
- **Monitoring**: Health checks и метрики производительности

**Размер payload:** PostgreSQL LISTEN/NOTIFY ограничен 8000 байтами (достаточно для игровых обновлений)
