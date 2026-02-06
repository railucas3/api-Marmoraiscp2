import 'dotenv/config'
import app from './app.js'
import initDb from './db/init.js'
import { expireOldSubscriptions } from './services/subscription.service.js'

const PORT = process.env.PORT || 8080

initDb()
  .catch((err) => {
    console.error('[DB] Erro ao inicializar:', err?.message)
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log('API rodando em http://localhost:' + PORT)
    })
  })

setInterval(() => {
  expireOldSubscriptions().catch(console.error)
}, 1000 * 60 * 60)
