import express from "express";
import { signup, verifyOtp, resendOtp, signin, forgotPassword, resetPassword, signOut } from "../controllers/auth";
import { authenticateJWT } from "../middlewares/authMiddleware"
import { validateOTP } from "../middlewares/otpMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", validateOTP, verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/signout", authenticateJWT, signOut);


export default router;