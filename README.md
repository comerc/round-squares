# The Last of Guss - Игра

Браузерная игра "The Last of Guss", где игроки соревнуются, кто быстрее и больше натапает по виртуальному гусю.

## Технологии

### Backend

- **Fastify** - веб-фреймворк
- **Drizzle ORM** - ORM для работы с БД
- **PostgreSQL** - база данных
- **TypeScript** (strict mode)
- **WebSocket** - для real-time обновлений

### Frontend

- **React 19** - UI библиотека
- **Zustand** - state management
- **Ant Design** - UI компоненты
- **Tailwind CSS** - стилизация
- **Vite** - сборщик
- **TypeScript**

## Установка и запуск

### Требования

- Node.js 18+
- Docker и Docker Compose
- npm или yarn

### Backend

1. Перейдите в директорию backend:

```bash
cd backend
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

4. Установите и запустите Mailpit (см. раздел "Email testing (Mailpit)")

5. Запустите PostgreSQL через Docker Compose:

```bash
cd ..
docker-compose up -d
```

6. Сгенерируйте и выполните миграции:

```bash
cd backend
npm run migrate:init # Генерирует файлы миграций
npm run migrate:push # Применяет миграции к БД
```

6. Заполните базу тестовыми данными:

```bash
npm run seed
```

7. Запустите сервер разработки:

```bash
npm run dev
```

Backend будет доступен на `http://localhost:3000`

### Frontend

1. Перейдите в директорию frontend:

```bash
cd frontend
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

4. Запустите dev сервер:

```bash
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## Email testing (Mailpit)

Для тестирования email функциональности (включая 2FA) используется **Mailpit** - легковесный SMTP сервер для разработки.

### Установка Mailpit

Установите Mailpit согласно [официальной документации](https://mailpit.axllent.org/docs/install/):

### Доступ к Mailpit

- **Web UI**: http://localhost:8025 - просмотр отправленных email
- **SMTP порт**: 1025 - для отправки email из приложения

### Настройка email в приложении

В `.env` файле backend добавьте:

```env
# Email configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
FROM_EMAIL=noreply@guss-game.com
```

## Тестовые пользователи

После выполнения seed скрипта будут созданы следующие пользователи (пароль для всех: `password123`):

- **admin** - администратор (может создавать раунды)
- **Никита** - специальная роль (тапы не считаются)
- **Иван** - обычный игрок
- **Мария** - обычный игрок
- **Петр** - обычный игрок

## Правила игры

- 1 тап = 1 очко
- Каждый 11-й тап дает 10 очков
- Тапать можно только в активном раунде
- Для пользователя "Никита" тапы не считаются (показываются нули в статистике)
