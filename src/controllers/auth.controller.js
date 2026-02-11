import pool from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function register(req, res) {
  try {
    const { email, password, nomeMarmoraria } = req.body || {}
    if (!email || !password || !nomeMarmoraria) {
      return res.status(400).json({ error: 'INVALID_FIELDS' })
    }
    const passwordHash = await bcrypt.hash(String(password), 10)
    await pool.query('BEGIN')
    const { rows: marmRows } = await pool.query(
      `INSERT INTO marmorarias (nome, email, status) VALUES ($1, $2, $3) RETURNING id`,
      [nomeMarmoraria, email, 'ACTIVE']
    )
    const marmorariaId = marmRows[0].id
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, password_hash, marmoraria_id, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, passwordHash, marmorariaId, 'USER']
    )
    const userId = userRows[0].id
    await pool.query(
      `INSERT INTO user_marmoraria (user_id, marmoraria_id) VALUES ($1, $2)`,
      [userId, marmorariaId]
    )
    await pool.query('COMMIT')
    return res.status(201).json({ userId, marmorariaId })
  } catch (err) {
    try { await pool.query('ROLLBACK') } catch {}
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'EMAIL_IN_USE' })
    }
    return res.status(500).json({ error: 'REGISTER_FAILED' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'INVALID_FIELDS' })
    }
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email])
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    }
    const ok = await bcrypt.compare(String(password), user.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    }
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET_NOT_SET' })
    }
    let mId = user.marmoraria_id
    if (!mId) {
      const { rows: linkRows } = await pool.query(
        `SELECT marmoraria_id FROM user_marmoraria WHERE user_id = $1 LIMIT 1`,
        [user.id]
      )
      mId = linkRows[0]?.marmoraria_id || null
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email, marmorariaId: mId, role: user.role },
      secret,
      { expiresIn: '7d' }
    )
    return res.json({ token, marmorariaId: mId })
  } catch {
    return res.status(500).json({ error: 'LOGIN_FAILED' })
  }
}
