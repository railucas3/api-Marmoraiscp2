import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.json({ module: 'admin' })
})

export default router
