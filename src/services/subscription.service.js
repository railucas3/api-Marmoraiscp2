import pool from '../db.js'
export const isDbConfigured = !!process.env.DATABASE_URL

export async function getActiveByMarmoraria(marmorariaId) {
  const { rows } = await pool.query(
    `SELECT * FROM subscriptions
     WHERE marmoraria_id = $1
       AND status = 'ACTIVE'
       AND expires_at > NOW()
     ORDER BY expires_at DESC
     LIMIT 1`,
    [marmorariaId]
  )
  return rows[0] || null
}

export async function createSubscription(marmorariaId, planoId, months) {
  const startedAt = new Date()
  const expiresAt = new Date(startedAt.getTime())
  expiresAt.setMonth(expiresAt.getMonth() + Number(months || 1))
  const { rows } = await pool.query(
    `INSERT INTO subscriptions (marmoraria_id, plano_id, status, started_at, expires_at)
     VALUES ($1, $2, 'ACTIVE', $3, $4)
     RETURNING *`,
    [marmorariaId, planoId, startedAt, expiresAt]
  )
  return rows[0]
}

export async function expireOldSubscriptions() {
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'EXPIRED'
     WHERE status = 'ACTIVE'
       AND expires_at < NOW()`
  )
  console.log('[SUBSCRIPTIONS] Expiradas:', result.rowCount)
  return result.rowCount
}

export async function renewActive(marmorariaId, months) {
  const { rows } = await pool.query(
    `SELECT * FROM subscriptions
     WHERE marmoraria_id = $1
       AND status = 'ACTIVE'
     ORDER BY expires_at DESC
     LIMIT 1`,
    [marmorariaId]
  )
  const current = rows[0]
  if (!current) return null
  const expiresAt = new Date(current.expires_at)
  expiresAt.setMonth(expiresAt.getMonth() + Number(months || 1))
  const { rows: updatedRows } = await pool.query(
    `UPDATE subscriptions SET expires_at = $1 WHERE id = $2 RETURNING *`,
    [expiresAt, current.id]
  )
  return updatedRows[0]
}
