import pool from '../db.js'

async function ensureConnected() {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL ausente; seguindo sem conexão para ambiente local.')
    return false
  }
  try {
    console.log('[DB] Conectando ao PostgreSQL...')
    await pool.query('SELECT NOW()')
    console.log('[DB] Conexão estabelecida.')
    return true
  } catch (err) {
    console.error('[DB] Falha na conexão:', err.message)
    return false
  }
}

async function createTables() {
  console.log('[DB] Criando tabelas se não existirem...')
  const statements = [
    `CREATE TABLE IF NOT EXISTS marmorarias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      logo_url TEXT,
      status TEXT NOT NULL CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      google_id TEXT UNIQUE,
      marmoraria_id INTEGER REFERENCES marmorarias(id) ON DELETE SET NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN','USER'))
    );`,
    `CREATE TABLE IF NOT EXISTS user_marmoraria (
      user_id INTEGER REFERENCES users(id),
      marmoraria_id INTEGER REFERENCES marmorarias(id),
      PRIMARY KEY (user_id, marmoraria_id)
    );`,
    `CREATE TABLE IF NOT EXISTS planos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      valor NUMERIC(12,2) NOT NULL,
      periodicidade TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      percent INTEGER NOT NULL,
      expires_at TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS app_status (
      id SERIAL PRIMARY KEY,
      global_block BOOLEAN NOT NULL DEFAULT FALSE,
      reason TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      marmoraria_id INTEGER REFERENCES marmorarias(id) ON DELETE CASCADE,
      plano_id INTEGER REFERENCES planos(id),
      status TEXT NOT NULL CHECK (status IN ('ACTIVE','EXPIRED','CANCELED')),
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      subscription_id INTEGER REFERENCES subscriptions(id),
      amount NUMERIC(12,2),
      method TEXT,
      status TEXT,
      transaction_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
  ]
  for (const sql of statements) {
    await pool.query(sql)
  }
  await pool.query(`ALTER TABLE marmorarias ADD COLUMN IF NOT EXISTS email TEXT`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`)
  console.log('[DB] Tabelas criadas/garantidas com sucesso.')
}

export default async function initDb() {
  const connected = await ensureConnected()
  if (!connected) return
  await createTables()
}
