import express from "express";
import { adminSignup, adminSignin, forgotPassword, resetPassword, signOut } from "../controllers/adminAuth";
import { authenticateAdmin } from "../middlewares/adminAuthMiddleware";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/signin", adminSignin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/signout", authenticateAdmin, signOut)

export default router;