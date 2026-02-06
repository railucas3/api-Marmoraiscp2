import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import marmoriaRoutes from './routes/marmoria.routes.js'
import planosRoutes from './routes/planos.routes.js'
import cuponsRoutes from './routes/cupons.routes.js'

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/marmoria', marmoriaRoutes)
app.use('/planos', planosRoutes)
app.use('/cupons', cuponsRoutes)

export default app
