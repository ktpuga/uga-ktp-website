const userModel = require("../models/userModel")

async function listUsers(req, res) {
  try {
    const users = await userModel.findAll()
    res.json(users)
  } catch (err) {
    console.error("[listUsers]", err)
    res.status(500).json({ message: "Failed to fetch users" })
  }
}

module.exports = { listUsers }
