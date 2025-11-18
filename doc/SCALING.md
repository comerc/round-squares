# Масштабирование и архитектура

## 1. Поддержка нескольких инстансов бекенда (1 база, 3 nodejs app)

### ✅ Что уже реализовано:

#### Stateless архитектура

- **JWT аутентификация**: Токены хранятся в HTTP-only cookies, не требуют server-side session storage
- **Stateless API endpoints**: Все REST endpoints не хранят состояние между запросами
- **Общая база данных**: Все инстансы подключаются к одной PostgreSQL базе

#### Консистентность данных при параллельных запросах

- **Транзакции с блокировками**: Используется `SELECT FOR UPDATE` для предотвращения race conditions
- **Пессимистичные блокировки**: Гарантируют корректность при параллельных тапах с разных инстансов
- **Атомарные операции**: Обновление счетчиков происходит в одной транзакции

```typescript
// backend/src/routes/tap.ts
const result = await db.transaction(async (tx) => {
  // Блокируем раунд (SELECT FOR UPDATE)
  const [round] = await tx
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId))
    .for('update')  // ← Ключевая блокировка для multi-instance
    .limit(1)

  // Блокируем запись пользователя
  const [existingUserRound] = await tx
    .select()
    .from(userRounds)
    .where(...)
    .for('update')  // ← Блокировка для консистентности
    .limit(1)

  // Атомарное обновление
  // ...
})
```

#### Health check endpoint

- `/health` endpoint для проверки работоспособности инстансов
- Можно использовать в load balancer для health checks

### ✅ Реализовано для multi-instance:

#### PostgreSQL LISTEN/NOTIFY для межсерверного WebSocket broadcast

- **Решение**: Используется встроенный механизм Pub/Sub PostgreSQL (LISTEN/NOTIFY)
- **Преимущества**: Не требует дополнительных зависимостей (Redis), использует существующую БД
- **Как работает**: При тапе отправляется NOTIFY, все инстансы получают через LISTEN и broadcast через WebSocket

```typescript
// backend/src/db/pubsub.ts
// Подписка на каналы при старте сервера
await setupPostgresPubSub((channel, payload) => {
  const message = JSON.parse(payload);
  if (channel === 'round_updates') {
    wsManager.broadcastToRound(message.roundId, message);
  }
});

// backend/src/routes/tap.ts
// При тапе отправляем NOTIFY (все инстансы получат)
await notify('round_updates', {
  type: 'round:update',
  roundId,
  data: { totalScore, userScore, userId },
});
```

**Преимущества PostgreSQL LISTEN/NOTIFY:**

- ✅ Встроено в PostgreSQL, не требует Redis
- ✅ Работает в рамках транзакций (NOTIFY отправляется после COMMIT)
- ✅ Надежно и консистентно с данными БД
- ✅ Подходит для нашего случая (~10 пользователей)

**Ограничения:**

- Payload ограничен 8000 байт (достаточно для JSON сообщений)
- Требует отдельное соединение для LISTEN (не блокирует основное)

---

## 2. Масштабируемость при нагрузке ~10 пользователей

### ✅ Что реализовано:

#### Эффективные запросы к БД

- **Индексы**: UUID primary keys обеспечивают быстрый поиск
- **JOIN оптимизация**: Используются индексы для связей между таблицами
- **Ограничение выборки**: `LIMIT 10` для топ игроков

#### Оптимизация транзакций

- **Короткие транзакции**: Минимальное время блокировки (только необходимые операции)
- **Точечные блокировки**: Блокируются только нужные строки, не вся таблица
- **Быстрая валидация**: Проверка статуса раунда происходит до блокировки

#### Stateless WebSocket

- **Легковесные соединения**: Каждое соединение хранит только минимальные данные
- **Автоматическая очистка**: При отключении connection сразу удаляется из памяти

#### Кэширование (потенциал)

- **Статус раунда**: Можно кэшировать вычисляемый статус (cooldown/active/finished)
- **Статистика**: Можно кэшировать топ игроков с TTL

### 📊 Ожидаемая производительность:

При 10 пользователях в раунде:

- **Тапы**: ~100-1000 тапов/минуту (10-100 тапов/сек на пользователя)
- **Транзакции**: Каждый тап = 1 транзакция (~50-100ms на транзакцию)
- **Пропускная способность**: ~10-20 тапов/сек на инстанс
- **3 инстанса**: ~30-60 тапов/сек общая пропускная способность

**Вывод**: Текущая реализация легко справляется с нагрузкой 10 пользователей.

### 🚀 Потенциал для масштабирования:

#### Вертикальное масштабирование

- Увеличить connection pool в PostgreSQL
- Увеличить количество worker threads в Node.js

#### Горизонтальное масштабирование

- Добавить больше инстансов бекенда (уже поддерживается через PostgreSQL LISTEN/NOTIFY)
- Использовать connection pooling (pgBouncer) для оптимизации соединений с БД
- Настроить load balancer с sticky sessions для WebSocket соединений

#### Оптимизация БД

- Добавить индексы на часто используемые поля:
  ```sql
  CREATE INDEX idx_user_rounds_round_id ON user_rounds(round_id);
  CREATE INDEX idx_user_rounds_user_id ON user_rounds(user_id);
  CREATE INDEX idx_rounds_start_time ON rounds(start_time);
  ```

---

## 3. Рекомендации для production

### Обязательно:

1. **Connection pooling**: Настроить pool size для PostgreSQL (уже используется через postgres библиотеку)
2. **Load balancer**: Nginx или AWS ALB с sticky sessions для WebSocket соединений
3. **Мониторинг**: Логирование метрик производительности и отслеживание соединений
4. **Health checks**: Использовать `/health` endpoint для проверки работоспособности инстансов

### Опционально:

1. **Кэширование**: In-memory кэш для статистики раундов (можно добавить позже при росте нагрузки)
2. **Rate limiting**: Ограничение количества тапов в секунду на пользователя
3. **Database replication**: Read replicas для чтения статистики (при очень высокой нагрузке)
4. **Connection pooling**: pgBouncer для дополнительной оптимизации соединений с БД

### Docker Compose для multi-instance:

```yaml
services:
  postgres:
    # ... существующая конфигурация

  backend1:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - PORT=3000
    ports:
      - '3001:3000'

  backend2:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - PORT=3000
    ports:
      - '3002:3000'

  backend3:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - PORT=3000
    ports:
      - '3003:3000'

  nginx:
    image: nginx
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```
