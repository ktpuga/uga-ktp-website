const userModel = require("../models/userModel")

// POST /users/sync
// Called by the website on every login. Creates the DB row on first login,
// updates member_group if it changed in Authentik, returns profile_complete.
async function syncUser(req, res) {
  try {
    const { authentik_id, username, member_group } = req.body

    if (!authentik_id || !username) {
      return res.status(400).json({ message: "authentik_id and username are required" })
    }

    const user = await userModel.upsert({ authentik_id, username, member_group })
    res.json({ profile_complete: user.profile_complete })
  } catch (err) {
    console.error("[syncUser]", err)
    res.status(500).json({ message: "Failed to sync user" })
  }
}

// GET /users/me
// Returns the authenticated user's full profile from the DB.
async function getMe(req, res) {
  try {
    const user = await userModel.findById(req.user.authentik_id)
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (err) {
    console.error("[getMe]", err)
    res.status(500).json({ message: "Failed to fetch profile" })
  }
}

// PUT /users/me/profile
// Saves the user's profile fields and marks profile_complete = true.
async function updateProfile(req, res) {
  try {
    const allowed = [
      "first_name", "last_name", "preferred_name", "dob",
      "major", "graduation_date", "phone", "email",
      "linkedin_url", "pledge_class",
    ]

    const fields = {}
    for (const key of allowed) {
      fields[key] = req.body[key] ?? null
    }

    if (!fields.first_name || !fields.last_name) {
      return res.status(400).json({ message: "first_name and last_name are required" })
    }

    const user = await userModel.updateProfile(req.user.authentik_id, fields)
    res.json(user)
  } catch (err) {
    console.error("[updateProfile]", err)
    res.status(500).json({ message: "Failed to update profile" })
  }
}

module.exports = { syncUser, getMe, updateProfile }
