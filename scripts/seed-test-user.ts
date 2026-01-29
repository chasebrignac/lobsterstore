#!/usr/bin/env tsx
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/db/client'

async function main() {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'testpass123'
  const name = 'Test User'

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: {
      email,
      name,
      passwordHash,
      username: 'testuser',
    },
  })

  console.log('✅ Seeded test user:', user.email)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
