require('dotenv').config()
import mongoose from 'mongoose'
import crypto from 'crypto'

// --- Password hashing (same logic as @utils/crypt) ---
const BCRYPT_SALT_ROUNDS = 12

const generateSalt = (rounds: number): string => {
  const saltLength = Math.ceil(rounds * 1.5)
  return crypto.randomBytes(saltLength).toString('hex').slice(0, 22)
}

const hashValue = (value: string): string => {
  const salt = generateSalt(BCRYPT_SALT_ROUNDS)
  const iterations = Math.pow(2, BCRYPT_SALT_ROUNDS)
  const hash = crypto
    .pbkdf2Sync(value, salt, iterations, 64, 'sha512')
    .toString('hex')
  return `$${BCRYPT_SALT_ROUNDS}$${salt}$${hash}`
}

// --- User schema (same as @database/models/user.model) ---
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, minlength: 5, maxlength: 160 },
    name: { type: String, maxlength: 160 },
    password: { type: String, required: true, minlength: 6, maxlength: 160 },
    date_of_birth: { type: Date, maxlength: 160 },
    address: { type: String, maxlength: 160 },
    phone: { type: String, maxlength: 20 },
    roles: { type: [String], required: true, default: ['User'] },
    avatar: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
)
UserSchema.index({ email: 1 }, { unique: true })

const User = mongoose.model('users', UserSchema)

// --- Accounts to seed ---
const SEED_ACCOUNTS = [
  {
    email: 'langtupro0456@gmail.com',
    password: '28052000@Trong',
    name: 'Lê Hoàng Trọng',
    roles: ['User'],
  },
  {
    email: 'admin@lehoangtrong.com',
    password: '28052000@Trong',
    name: 'Admin',
    roles: ['Admin'],
  },
]

async function main() {
  const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

  try {
    console.log('🔌 Connecting to MongoDB Atlas...')
    await mongoose.connect(dbURL)
    console.log('✅ Connected to MongoDB Atlas\n')

    for (const account of SEED_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email })

      if (existing) {
        console.log(`⚠️  [SKIP] ${account.email} already exists (id: ${existing._id})`)
        continue
      }

      const hashedPassword = hashValue(account.password)
      const user = await User.create({
        email: account.email,
        password: hashedPassword,
        name: account.name,
        roles: account.roles,
      })

      console.log(`✅ [CREATED] ${account.email}`)
      console.log(`   ID:    ${user._id}`)
      console.log(`   Roles: ${account.roles.join(', ')}`)
      console.log()
    }

    console.log('--- Verification ---')
    const allUsers = await User.find({}, 'email name roles createdAt').sort({ createdAt: -1 })
    console.log(`Total users in database: ${allUsers.length}`)
    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} — roles: [${(u as any).roles.join(', ')}]`)
    })

    console.log('\n🎉 Seed completed!')
  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Connection closed')
  }
}

main()
