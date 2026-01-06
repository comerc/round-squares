# Project Context

## Purpose
"The Last of Guss" - браузерная игра, где игроки соревнуются, кто быстрее и больше натапает по виртуальному гусю. Игроки могут участвовать в раундах, накапливая очки путем тапов. Каждый 11-й тап дает 10 очков вместо 1. Существуют роли пользователей с разными правилами (например, специальная роль "nikita" для которой тапы не считаются).

**Основные возможности:**
- Авторизация пользователей с ролями (admin, survivor, nikita)
- Создание и управление раундами (только администраторы)
- Real-time тапы с WebSocket обновлениями
- Статистика раундов и личные счета игроков
- Оптимистичные обновления UI для лучшего UX

## Tech Stack

### Backend
- **Fastify** - высокопроизводительный веб-фреймворк для Node.js
- **TypeScript** (strict mode) - типизированный JavaScript
- **PostgreSQL** - реляционная база данных
- **Drizzle ORM** - типобезопасный ORM для SQL
- **WebSocket** - для real-time коммуникации
- **JWT** - аутентификация с HTTP-only cookies
- **bcrypt** - хеширование паролей
- **Zod** - валидация данных

### Frontend
- **React 19** - современная UI библиотека
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик и dev server
- **Zustand** - легковесное state management
- **React Router v7** - клиентский роутинг
- **Ant Design** - компонентная библиотека UI
- **Tailwind CSS** - утилитарный CSS фреймворк
- **date-fns** - работа с датами

### Infrastructure
- **Docker Compose** - контейнеризация PostgreSQL
- **PostgreSQL LISTEN/NOTIFY** - pub/sub для межсерверной синхронизации
- **ESM modules** - современная модульная система

## Project Conventions

### Code Style
- **TypeScript strict mode** - все проверки типов включены
- **ESLint + Prettier** - автоматическое форматирование кода
- **Именование файлов**: PascalCase для компонентов, camelCase для утилит
- **Импорты**: абсолютные пути через `@/` алиас
- **Компоненты**: PascalCase с суффиксом `Page` для страниц, `Layout` для layout'ов
- **Хуки**: camelCase с префиксом `use`
- **Утилиты**: camelCase без префиксов

### Architecture Patterns

#### Backend Architecture
- **Stateless API** - все endpoints не хранят состояние между запросами
- **Транзакционная консистентность** - использование `SELECT FOR UPDATE` для предотвращения race conditions
- **Pub/Sub паттерн** - PostgreSQL LISTEN/NOTIFY для межсерверной синхронизации WebSocket
- **Repository паттерн** - разделение логики доступа к данным
- **Middleware паттерн** - аутентификация и валидация через Fastify middleware

#### Frontend Architecture
- **Container/Presentational** - разделение логики и представления
- **Custom hooks** - переиспользование логики состояния
- **Store паттерн** - Zustand для глобального состояния
- **Optimistic updates** - немедленное обновление UI с последующей синхронизацией
- **Layout-based routing** - вложенные layout'ы для разных секций

#### Database Design
- **UUID primary keys** - для масштабируемости и безопасности
- **Many-to-many relationships** - user_rounds таблица для связи пользователей и раундов
- **Soft deletes** - каскадные удаления через foreign key constraints
- **Audit fields** - created_at/updated_at для всех сущностей

### Testing Strategy
[Тестирование не реализовано в текущей версии проекта - требуется добавить]

### Git Workflow
[Git workflow не документирован - рекомендуется добавить conventional commits]

## Domain Context

### Сущности домена:
- **User** - игрок с ролью (admin/survivor/nikita)
- **Round** - игровой раунд с временем начала/окончания
- **Tap** - действие тапа пользователя в раунде
- **Score** - накопленные очки (1 очко за тап, каждые 10 тапов дают бонус)

### Бизнес-правила:
- Только администраторы могут создавать раунды
- Тапы считаются только в активные раунды
- Каждый 11-й тап дает 10 очков (не 11)
- Пользователь "nikita" видит нулевую статистику (тапы не считаются)
- Real-time обновления через WebSocket для всех участников раунда

### Игровая механика:
- Раунды имеют cooldown период после завершения
- Счетчики обновляются атомарно для предотвращения дублирования
- Оптимистичные обновления обеспечивают плавный UX

## Important Constraints

### Технические ограничения:
- **Single database** - все инстансы бекенда работают с одной PostgreSQL БД
- **WebSocket scalability** - требуется sticky sessions в load balancer
- **Transaction isolation** - использование SERIALIZABLE уровня для консистентности
- **Memory limits** - stateless архитектура для горизонтального масштабирования

### Производительность:
- **Ожидаемая нагрузка**: ~10 пользователей одновременно
- **Пропускная способность**: 10-20 тапов/сек на инстанс бекенда
- **Database connections**: ограниченный пул соединений PostgreSQL

### Безопасность:
- **JWT в HTTP-only cookies** - защита от XSS
- **bcrypt хеширование** - безопасное хранение паролей
- **Input validation** - Zod schemas для всех входных данных
- **CORS политика** - ограничение origins для API

## External Dependencies

### Runtime Dependencies:
- **PostgreSQL 15+** - основная база данных
- **Node.js 18+** - runtime для backend и frontend сборки

### Development Dependencies:
- **Docker** - контейнеризация базы данных
- **Docker Compose** - оркестрация сервисов для разработки
