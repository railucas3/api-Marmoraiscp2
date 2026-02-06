import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.json({ module: 'auth' })
})

export default router
