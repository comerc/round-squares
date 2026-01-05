# Project Context

## Purpose

"The Last of Guss" — веб-приложение (игра-кликер) с механикой раундов. Пользователи участвуют в раундах, "тапают" (кликают) для набора очков. Система поддерживает авторизацию, статистику в реальном времени через WebSocket и оптимистичные обновления интерфейса для мгновенного отклика.

## Tech Stack

### Frontend

- **Runtime/Build:** Vite, Node.js
- **Framework:** React 19
- **Language:** TypeScript
- **State Management:** Zustand
- **Routing:** React Router DOM (v7)
- **UI Kit:** Ant Design (v5)
- **Styling:** Tailwind CSS (v4)
- **Utilities:** date-fns

### Backend

- **Runtime:** Node.js (v24+), tsx
- **Framework:** Fastify (v5)
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Auth:** JWT (jsonwebtoken), BCrypt
- **Realtime:** @fastify/websocket

### Infrastructure

- Docker & Docker Compose (PostgreSQL container)

## Project Conventions

### Code Style

- **Компоненты:** PascalCase (например, `UserCard.tsx`)
- **Страницы:** PascalCase с суффиксом `Page` (например, `BoardPage.tsx`)
- **Layouts:** PascalCase с суффиксом `Layout` (например, `AppLayout.tsx`)
- **Хуки:** camelCase с префиксом `use` (например, `useAuth.ts`)
- **Утилиты:** camelCase (например, `formatDate.ts`)

### Architecture Patterns

- **Frontend:**
  - `src/app/` — Конфигурация роутера и стора.
  - `src/api/` — Клиентские вызовы API.
  - `src/stores/` — Zustand сторы, разделенные по доменам (`authStore`, `roundsStore`, `tapStore`).
  - `src/components/ui/` — Переиспользуемые UI компоненты.
- **Backend:**
  - `src/routes/` — Определение маршрутов (Rest API).
  - `src/db/` — Схемы Drizzle и миграции.
  - `src/websocket/` — Логика обработки WebSocket соединений.
- **Optimistic UI:** Используется для действия "Tap". Счетчик обновляется мгновенно, затем синхронизируется с сервером. При ошибке происходит откат.

### Git Workflow

- Используется стандартный подход с ветками для фич.

## Domain Context

- **Round (Раунд):** Игровая сессия с определенным статусом (active, finished и т.д.) и временем жизни.
- **Tap (Тап):** Действие пользователя в рамках раунда, увеличивающее его счет.
- **Events:**
  - `round:update` — обновление общей статистики.
  - `user:score` — обновление личного счета.
  - `round:status` — изменение статуса раунда.

## Important Constraints

- **База данных:** PostgreSQL 16 является единственным источником истины для персистентных данных.
- **API:** REST для CRUD операций, WebSocket для реал-тайм событий.

## External Dependencies

- PostgreSQL (запускается через `docker-compose.yml`)
