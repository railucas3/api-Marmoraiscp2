import pool from '../db.js'
import { getActiveByMarmoraria } from '../services/subscription.service.js'

export default async function subscriptionGuard(req, res, next) {
  try {
    if (!process.env.DATABASE_URL) {
      return next()
    }
    const mId = req.headers['x-marmoraria-id']
    if (!mId) {
      return res.status(400).json({ error: 'MARMORARIA_ID_REQUIRED' })
    }
    const active = await getActiveByMarmoraria(Number(mId))
    if (!active) {
      return res.status(403).json({ error: 'PLANO_VENCIDO' })
    }
    const now = new Date()
    const exp = new Date(active.expires_at)
    if (exp < now) {
      await pool.query(
        'UPDATE subscriptions SET status = $1 WHERE id = $2 AND status = $3',
        ['EXPIRED', active.id, 'ACTIVE']
      )
      return res.status(403).json({ error: 'PLANO_VENCIDO' })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: 'SUBSCRIPTION_CHECK_FAILED' })
  }
}
