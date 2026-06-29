const photoModel = require("../models/photoModel")

async function getPhotos(req, res) {
  try {
    const photos = await photoModel.findAll()
    res.json(photos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch photos" })
  }
}

// POST /photos — not yet implemented, pending Immich integration
function createPhoto(req, res) {
  res.status(501).json({ message: "Photo upload not yet implemented" })
}

module.exports = { getPhotos, createPhoto }
