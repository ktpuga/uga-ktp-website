const { query } = require("../database")

async function findAll(groupFilter) {
  let sql = `SELECT authentik_id AS id, username, first_name, last_name,
                    preferred_name, member_group, major, graduation_date,
                    pledge_class, profile_picture_asset_id
             FROM users
             WHERE profile_complete = true`
  const params = []
  if (groupFilter) {
    sql += ` AND member_group = $1`
    params.push(groupFilter)
  }
  sql += ` ORDER BY last_name ASC NULLS LAST, first_name ASC NULLS LAST`

  const result = await query(sql, params)
  return result.rows
}

async function findById(id) {
  const result = await query(
    `SELECT authentik_id AS id, username, first_name, last_name,
            preferred_name, member_group, major, graduation_date,
            pledge_class, profile_picture_asset_id
     FROM users
     WHERE authentik_id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}

module.exports = { findAll, findById }
