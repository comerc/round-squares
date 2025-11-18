import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  bigint,
  integer,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const userRoleEnum = pgEnum('user_role', ['admin', 'survivor', 'nikita'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const rounds = pgTable('rounds', {
  id: uuid('id').defaultRandom().primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  cooldownDuration: integer('cooldown_duration').notNull(),
  totalScore: bigint('total_score', { mode: 'number' }).default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userRounds = pgTable(
  'user_rounds',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roundId: uuid('round_id')
      .notNull()
      .references(() => rounds.id, { onDelete: 'cascade' }),
    tapCount: integer('tap_count').default(0).notNull(),
    score: bigint('score', { mode: 'number' }).default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: unique().on(table.userId, table.roundId),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  userRounds: many(userRounds),
}))

export const roundsRelations = relations(rounds, ({ many }) => ({
  userRounds: many(userRounds),
}))

export const userRoundsRelations = relations(userRounds, ({ one }) => ({
  user: one(users, {
    fields: [userRounds.userId],
    references: [users.id],
  }),
  round: one(rounds, {
    fields: [userRounds.roundId],
    references: [rounds.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Round = typeof rounds.$inferSelect
export type NewRound = typeof rounds.$inferInsert
export type UserRound = typeof userRounds.$inferSelect
export type NewUserRound = typeof userRounds.$inferInsert
