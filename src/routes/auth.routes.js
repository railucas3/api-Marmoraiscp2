const { Router } = require('express')
const router = Router()

router.get('/', (req, res) => {
  res.json({ module: 'auth' })
})

module.exports = router
