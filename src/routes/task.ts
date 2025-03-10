import express from 'express';
import { 
    createScheduledTask, 
    getUserScheduledTasks, 
    getTaskById, 
    updateScheduledTask, 
    deleteScheduledTask,
    sendMessage,
    getUserTaskSummary
} from '../controllers/task';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authenticateJWT);

// Scheduled task routes
router.post('/new', createScheduledTask);
router.get('/user/summary', getUserTaskSummary);
router.get('/task', getUserScheduledTasks);
router.get('/task/:taskId', getTaskById);
router.put('/task/:taskId', updateScheduledTask);
router.delete('/task/:taskId', deleteScheduledTask);

// Message route
router.post('/message', sendMessage);

export default router; 