import { Router } from 'express'
import {
  getActiveByMarmoraria,
  createSubscription,
  renewActive,
  isDbConfigured,
  validateSubscriptionsSchema,
  existsMarmoraria,
  existsPlano,
} from '../services/subscription.service.js'

const router = Router()

router.get('/me', async (req, res) => {
  try {
    if (!isDbConfigured) {
      return res.status(503).json({ error: 'DB_NOT_CONFIGURED' })
    }
    const mId = req.headers['x-marmoraria-id']
    if (!mId) return res.status(400).json({ error: 'MARMORARIA_ID_REQUIRED' })
    const sub = await getActiveByMarmoraria(Number(mId))
    if (!sub) return res.status(404).json({ error: 'NO_ACTIVE_SUBSCRIPTION' })
    res.json(sub)
  } catch {
    res.status(500).json({ error: 'SUBSCRIPTIONS_FETCH_FAILED' })
  }
})

router.post('/create', async (req, res) => {
  try {
    if (!isDbConfigured) {
      return res.status(503).json({ error: 'DB_NOT_CONFIGURED' })
    }
    const { marmorariaId, planoId, months } = req.body || {}
    const mId = marmorariaId ?? req.headers['x-marmoraria-id']
    console.log('[POST /subscriptions/create]', { marmorariaId: mId, planoId, months })
    if (!mId || !planoId) {
      return res.status(400).json({ error: 'MARMORARIA_OR_PLAN_REQUIRED' })
    }
    const monthsNum = Number(months || 1)
    if (!Number.isFinite(monthsNum) || monthsNum <= 0) {
      return res.status(400).json({ error: 'MONTHS_INVALID' })
    }
    await validateSubscriptionsSchema()
    const [hasM, hasP] = await Promise.all([
      existsMarmoraria(Number(mId)),
      existsPlano(Number(planoId)),
    ])
    if (!hasM) {
      return res.status(400).json({ error: 'MARMORARIA_NOT_FOUND' })
    }
    if (!hasP) {
      return res.status(400).json({ error: 'PLANO_NOT_FOUND' })
    }
    const created = await createSubscription(
      Number(mId),
      Number(planoId),
      monthsNum
    )
    res.status(201).json(created)
  } catch (err) {
    console.error('[POST /subscriptions/create] failed:', err?.message, err?.stack)
    res.status(500).json({ error: 'SUBSCRIPTIONS_CREATE_FAILED' })
  }
})

router.post('/renew', async (req, res) => {
  try {
    if (!isDbConfigured) {
      return res.status(503).json({ error: 'DB_NOT_CONFIGURED' })
    }
    const { marmorariaId, months } = req.body || {}
    if (!marmorariaId) {
      return res.status(400).json({ error: 'MARMORARIA_ID_REQUIRED' })
    }
    const renewed = await renewActive(Number(marmorariaId), Number(months || 1))
    if (!renewed) return res.status(404).json({ error: 'NO_ACTIVE_SUBSCRIPTION' })
    res.json(renewed)
  } catch {
    res.status(500).json({ error: 'SUBSCRIPTIONS_RENEW_FAILED' })
  }
})

export default router
