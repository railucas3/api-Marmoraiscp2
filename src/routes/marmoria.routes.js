import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.json({ module: 'marmoria' })
})

export default router
