import jwt from 'jsonwebtoken'
import pool from '../db.js'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    req.user = user
    next()
  })
}

export function isSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  next()
}

export async function checkMarmorariaStatus(req, res, next) {
  try {
    // SUPER_ADMIN ignora bloqueio
    if (req.user?.role === 'SUPER_ADMIN') {
      return next()
    }

    const marmorariaId = req.user?.marmorariaId
    if (!marmorariaId) {
      // Se não tem marmorariaId (e não é super admin), algo está errado ou é um user sem vinculo
      return next()
    }

    const { rows } = await pool.query(
      'SELECT status FROM marmorarias WHERE id = $1 LIMIT 1',
      [marmorariaId]
    )

    if (rows[0]?.status === 'BLOCKED') {
      return res.status(403).json({ error: 'MARMORARIA_BLOCKED' })
    }

    next()
  } catch (err) {
    console.error('[AUTH] Erro ao verificar status da marmoraria:', err)
    res.status(500).json({ error: 'Erro interno de verificação' })
  }
}
