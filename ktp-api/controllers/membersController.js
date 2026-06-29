const memberModel = require("../models/memberModel")

async function getMembers(req, res) {
  try {
    const group = req.query.group ?? null
    const members = await memberModel.findAll(group)
    res.json(members)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch members" })
  }
}

async function getMemberById(req, res) {
  try {
    const member = await memberModel.findById(req.params.id)
    if (!member) return res.status(404).json({ message: "Member not found" })
    res.json(member)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch member" })
  }
}

module.exports = { getMembers, getMemberById }
