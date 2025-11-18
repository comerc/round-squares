import { db } from './index.js'
import { users } from './schema.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  console.log('Seeding database...')

  const password = 'password123'
  const passwordHash = await bcrypt.hash(password, 10)

  const testUsers = [
    {
      username: 'admin',
      passwordHash,
      role: 'admin' as const,
    },
    {
      username: 'Никита',
      passwordHash,
      role: 'nikita' as const,
    },
    {
      username: 'Иван',
      passwordHash,
      role: 'survivor' as const,
    },
    {
      username: 'Мария',
      passwordHash,
      role: 'survivor' as const,
    },
    {
      username: 'Петр',
      passwordHash,
      role: 'survivor' as const,
    },
  ]

  try {
    for (const user of testUsers) {
      await db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.username,
          set: { passwordHash: user.passwordHash, role: user.role },
        })
      console.log(`Created/updated user: ${user.username}`)
    }

    console.log('Seeding completed!')
    console.log('Test users created with password: password123')
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  }

  process.exit(0)
}

seed()
