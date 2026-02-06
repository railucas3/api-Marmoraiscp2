import 'dotenv/config'
import app from './app.js'
import initDb from './db/init.js'

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
