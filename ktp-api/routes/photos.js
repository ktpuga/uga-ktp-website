const express = require("express")
const photosController = require("../controllers/photosController")

const router = express.Router()

router.get("/", photosController.getPhotos)
router.post("/", photosController.createPhoto)

module.exports = router
