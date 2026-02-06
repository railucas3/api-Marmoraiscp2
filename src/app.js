import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import marmoriaRoutes from './routes/marmoria.routes.js'
import planosRoutes from './routes/planos.routes.js'
import cuponsRoutes from './routes/cupons.routes.js'
import subscriptionRoutes from './routes/subscription.routes.js'
import subscriptionGuard from './middlewares/subscriptionGuard.js'
import pool from './db.js'

const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Marmoraria API',
    version: '1.0.0',
  })
})

app.get('/health', async (req, res) => {
  let dbOk = false
  let subOk = false
  try {
    await pool.query('SELECT 1')
    dbOk = true
    await pool.query('SELECT 1 FROM subscriptions LIMIT 1')
    subOk = true
  } catch {
  }
  res.json({ status: 'ok', db: dbOk ? 'ok' : 'error', subscriptions: subOk ? 'ok' : 'error' })
})

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/marmoria', subscriptionGuard, marmoriaRoutes)
app.use('/planos', subscriptionGuard, planosRoutes)
app.use('/cupons', subscriptionGuard, cuponsRoutes)
app.use('/subscriptions', subscriptionRoutes)
export default app
