import express from "express";
import { uploadFile } from "../middlewares/uploadMiddleware";
import {upload} from "../controllers/features"
import { authenticateAdmin, authorizePrivilege } from "../middlewares/adminAuthMiddleware";

const router = express.Router();

router.post("/upload", authenticateAdmin, authorizePrivilege(1), uploadFile, upload)

export default router;