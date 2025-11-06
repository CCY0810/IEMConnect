import express from "express"
import { register, login, verify2FA, logout, verifySession, resend2FA } from "../controllers/authController.js"
import { verifyTempToken, verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/verify-2fa", verifyTempToken, verify2FA)
router.post("/logout", verifyToken, logout)
router.get("/verify-session", verifyToken, verifySession)
router.post("/resend-2fa", verifyTempToken, resend2FA)

export default router