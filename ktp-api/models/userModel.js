const db = require("../database")

// Creates the user row on first login, updates member_group on subsequent logins.
// Returns the user's current profile_complete status.
async function upsert({ authentik_id, username, member_group }) {
  const result = await db.query(
    `INSERT INTO users (authentik_id, username, member_group)
     VALUES ($1, $2, $3)
     ON CONFLICT (authentik_id) DO UPDATE
       SET member_group = EXCLUDED.member_group
     RETURNING authentik_id, profile_complete`,
    [authentik_id, username, member_group]
  )
  return result.rows[0]
}

// Returns the full profile for the currently authenticated user.
async function findById(authentik_id) {
  const result = await db.query(
    `SELECT authentik_id, username, first_name, last_name, preferred_name,
            dob, major, graduation_date, phone, email, linkedin_url,
            pledge_class, profile_picture_asset_id, member_group,
            profile_complete, created_at, updated_at
     FROM users
     WHERE authentik_id = $1`,
    [authentik_id]
  )
  return result.rows[0] ?? null
}

// Saves profile fields and marks the profile as complete.
async function updateProfile(authentik_id, fields) {
  const result = await db.query(
    `UPDATE users
     SET first_name             = $2,
         last_name              = $3,
         preferred_name         = $4,
         dob                    = $5,
         major                  = $6,
         graduation_date        = $7,
         phone                  = $8,
         email                  = $9,
         linkedin_url           = $10,
         pledge_class           = $11,
         profile_complete       = TRUE
     WHERE authentik_id = $1
     RETURNING *`,
    [
      authentik_id,
      fields.first_name,
      fields.last_name,
      fields.preferred_name ?? null,
      fields.dob ?? null,
      fields.major ?? null,
      fields.graduation_date ?? null,
      fields.phone ?? null,
      fields.email ?? null,
      fields.linkedin_url ?? null,
      fields.pledge_class ?? null,
    ]
  )
  return result.rows[0]
}

// Updates the Immich asset ID for the user's profile picture.
async function updateProfilePicture(authentik_id, asset_id) {
  const result = await db.query(
    `UPDATE users SET profile_picture_asset_id = $2 WHERE authentik_id = $1 RETURNING profile_picture_asset_id`,
    [authentik_id, asset_id]
  )
  return result.rows[0]
}

async function findAll() {
  const result = await db.query(
    `SELECT authentik_id, username, first_name, last_name, preferred_name,
            member_group, profile_complete, email, major, graduation_date,
            pledge_class, profile_picture_asset_id, created_at
     FROM users
     ORDER BY last_name ASC NULLS LAST, first_name ASC NULLS LAST`
  )
  return result.rows
}

module.exports = { upsert, findById, updateProfile, updateProfilePicture, findAll }
