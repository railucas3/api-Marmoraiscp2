import pool from '../db.js'

export async function listMarmorarias(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        m.id,
        m.nome,
        m.created_at,
        u.id AS user_id,
        u.email
      FROM marmorarias m
      LEFT JOIN users u 
        ON u.marmoraria_id = m.id
      ORDER BY m.created_at DESC
    `)

    const result = rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      created_at: row.created_at,
      dono: row.user_id
        ? {
            user_id: row.user_id,
            email: row.email,
          }
        : null,
    }))

    res.json(result)
  } catch (err) {
    console.error('[ADMIN] Erro ao listar marmorarias:', err)
    res.status(500).json({ error: 'Erro ao listar marmorarias' })
  }
}

export async function blockMarmoraria(req, res) {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE marmorarias SET status = 'BLOCKED' WHERE id = $1`,
      [id]
    )
    res.json({ message: 'Marmoraria bloqueada com sucesso' })
  } catch (err) {
    console.error('[ADMIN] Erro ao bloquear marmoraria:', err)
    res.status(500).json({ error: 'Erro ao bloquear marmoraria' })
  }
}

export async function unblockMarmoraria(req, res) {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE marmorarias SET status = 'ACTIVE' WHERE id = $1`,
      [id]
    )
    res.json({ message: 'Marmoraria desbloqueada com sucesso' })
  } catch (err) {
    console.error('[ADMIN] Erro ao desbloquear marmoraria:', err)
    res.status(500).json({ error: 'Erro ao desbloquear marmoraria' })
  }
}
