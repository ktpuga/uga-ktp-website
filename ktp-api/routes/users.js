const express = require("express")
const { requireAuth } = require("../middleware/auth")
const userController = require("../controllers/userController")

const router = express.Router()

// All user routes require a valid Authentik JWT
router.use(requireAuth)

router.post("/sync", userController.syncUser)
router.get("/me", userController.getMe)
router.put("/me/profile", userController.updateProfile)

module.exports = router
