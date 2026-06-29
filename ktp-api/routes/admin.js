const express = require("express")
const { requireAuth } = require("../middleware/auth")
const { requireGroup } = require("../middleware/requireGroup")
const adminController = require("../controllers/adminController")

const router = express.Router()

router.use(requireAuth)
router.use(requireGroup("eboard"))

router.get("/users", adminController.listUsers)

module.exports = router
