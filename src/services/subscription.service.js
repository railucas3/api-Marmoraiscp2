import pool from '../db.js'
export const isDbConfigured = !!process.env.DATABASE_URL

export async function validateSubscriptionsSchema() {
  const { rows: regRows } = await pool.query(
    `SELECT to_regclass('public.subscriptions') AS exists`
  )
  if (!regRows[0]?.exists) {
    const err = new Error('Subscriptions table not found')
    err.code = 'SUBSCRIPTIONS_TABLE_MISSING'
    throw err
  }
  const { rows: fkRows } = await pool.query(
    `SELECT
       kcu.column_name,
       ccu.table_name AS foreign_table_name
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
     WHERE tc.table_name = 'subscriptions' AND tc.constraint_type = 'FOREIGN KEY'`
  )
  const hasFkMarmoraria = fkRows.some(
    (r) => r.column_name === 'marmoraria_id' && r.foreign_table_name === 'marmorarias'
  )
  const hasFkPlano = fkRows.some(
    (r) => r.column_name === 'plano_id' && r.foreign_table_name === 'planos'
  )
  if (!hasFkMarmoraria || !hasFkPlano) {
    const err = new Error('Foreign keys invalid or missing on subscriptions')
    err.code = 'SUBSCRIPTIONS_FK_INVALID'
    err.details = { hasFkMarmoraria, hasFkPlano }
    throw err
  }
}

export async function existsMarmoraria(id) {
  const { rows } = await pool.query(`SELECT 1 FROM marmorarias WHERE id = $1 LIMIT 1`, [id])
  return !!rows[0]
}

export async function existsPlano(id) {
  const { rows } = await pool.query(`SELECT 1 FROM planos WHERE id = $1 LIMIT 1`, [id])
  return !!rows[0]
}

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
  const sql =
    `INSERT INTO subscriptions (marmoraria_id, plano_id, status, started_at, expires_at)
     VALUES ($1, $2, 'ACTIVE', $3, $4)
     RETURNING *`
  console.log('[SQL createSubscription]', sql, {
    marmorariaId: marmorariaId,
    planoId,
    startedAt,
    expiresAt,
  })
  const { rows } = await pool.query(sql, [marmorariaId, planoId, startedAt, expiresAt])
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
