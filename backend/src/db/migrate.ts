import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './index.js'
import dotenv from 'dotenv'

dotenv.config()

async function runMigrations() {
  console.log('Running migrations...')
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed!')
  } catch (error: any) {
    if (error.message?.includes('_journal.json')) {
      console.error(
        'Migration files not found. Please run "npm run migrate" first to generate migrations.',
      )
      console.error('Then run "npm run migrate:push" to apply them.')
    } else {
      throw error
    }
  }
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
