const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const marmoriaRoutes = require('./routes/marmoria.routes')
const planosRoutes = require('./routes/planos.routes')
const cuponsRoutes = require('./routes/cupons.routes')

const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/marmoria', marmoriaRoutes)
app.use('/planos', planosRoutes)
app.use('/cupons', cuponsRoutes)

module.exports = app
