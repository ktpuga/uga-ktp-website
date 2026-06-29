const { query } = require("../database")

function toPhotoJSON(row) {
  return {
    id: String(row.id),
    immich_asset_id: row.immich_asset_id,
    title: row.title,
    caption: row.caption,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
  }
}

async function findAll() {
  const result = await query(
    "SELECT * FROM photos ORDER BY created_at DESC"
  )
  return result.rows.map(toPhotoJSON)
}

async function create({ immich_asset_id, title, caption, uploaded_by }) {
  const result = await query(
    `INSERT INTO photos (immich_asset_id, title, caption, uploaded_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [immich_asset_id, title ?? null, caption ?? null, uploaded_by ?? null]
  )
  return toPhotoJSON(result.rows[0])
}

async function remove(id) {
  const result = await query(
    "DELETE FROM photos WHERE id = $1 RETURNING id",
    [id]
  )
  return result.rows.length > 0
}

module.exports = { findAll, create, remove }
