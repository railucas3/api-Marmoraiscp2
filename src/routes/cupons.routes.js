import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.json({ module: 'cupons' })
})

export default router
