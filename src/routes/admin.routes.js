import { Router } from 'express'
import { authenticateToken, isSuperAdmin } from '../middlewares/auth.middleware.js'
import { listMarmorarias } from '../controllers/admin.controller.js'

const router = Router()

// Aplica proteção para todas as rotas abaixo
router.use(authenticateToken, isSuperAdmin)

router.get('/', (req, res) => {
  res.json({ module: 'admin' })
})

router.get('/test', (req, res) => {
  res.json({ message: 'Bem-vindo SUPER_ADMIN' })
})

router.get('/marmorarias', listMarmorarias)

export default router
