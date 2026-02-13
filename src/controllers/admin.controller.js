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
