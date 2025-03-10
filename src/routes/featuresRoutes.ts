import express from "express";
import { 
    getAgentByIds, 
    getAgentByCategory, 
    getAllAgents, 
    getAllPrebuiltAgents, 
    getUser, 
    recruitNewAgents, 
    recruitToTeam, 
    updateTeamName,
    getUserTeamById,
    getUserTeams
} from "../controllers/features";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();
router.get("/get-user", authenticateJWT, getUser);
router.get("/get-all-agents", /*authenticateJWT,*/ getAllAgents);
router.get("/get-all-prebuilt-agents", /*authenticateJWT,*/ getAllPrebuiltAgents);
router.get("/get-agent-by-ids", /*authenticateJWT,*/ getAgentByIds);
router.get("/get-agent-by-category", /*authenticateJWT,*/ getAgentByCategory);

router.post("/recruit-new-agents", authenticateJWT, recruitNewAgents);
router.post("/recruit-to-team", authenticateJWT, recruitToTeam);
router.post("/update-team-name", authenticateJWT, updateTeamName);

router.get("/get-user-team-by-id/:teamId", authenticateJWT, getUserTeamById);
router.get("/get-user-teams", authenticateJWT, getUserTeams);

export default router;