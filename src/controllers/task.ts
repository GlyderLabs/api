//users can create task for agents
//users can get all tasks
//users can get a task by id
//users can update a task by id
//users can delete a task by id
//users can get all tasks by agent id
//users can get all tasks by user id

import { taskManager, TaskManager } from "../automation/TaskManager"
import { Task, scheduler } from "../automation/Scheduler"
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { Request, Response } from 'express';
import AgentModel from "../models/agent";
config()

/**
 * Create a scheduled task
 * @route POST /api/tasks/scheduled
 * @access Private
 */

/**
 * taskQuery: {
 *  userId: string,
 *  taskMessage: string,
 *  thread_id: string,
 *  stateOption: any,
 *  teams: [{
 *       teamId: string,
 *       members: string[],
 *       supervisorPrompr?:string,
 *       extraInfo?: string[]
 *     }]
 *  }
 */

    interface TaskQuery {
        userId: string;
        taskMessage: string;
        thread_id: string;
        stateOption: any;
        teams: {    
            teamId: string;
            members: string[];
            supervisorPrompr?:string;
            extraInfo?: string[];
        }[];
    }
    
    const getTaskQuery = async ({userId, agentId, taskMessage, thread_id}: any) : Promise<TaskQuery> => {
        const agentTeam = await AgentModel.findOne({id: agentId})
        if (!agentTeam) {
            throw new Error("Agent team not found");
        }
        
        // Extract teams from agentTeam and format them according to the required structure
        const formattedTeams = agentTeam.teams.map(team => {
            return {
                teamId: team.id,
                members: team.agentIds || [],
                supervisorPrompt: team.supervisorPrompt || undefined,
                extraInfo: team.extraInfo || undefined
            };
        });
        
        // Filter out teams with supervisorPrompt and extraInfo
        const filteredTeams = formattedTeams.map(team => {
            return {
                teamId: team.teamId,
                members: team.members
            };
        });
        const stateOption = {
            id: userId,
            agentId: agentId,
            teams: filteredTeams,
        }


        const taskQuery = {
            userId,
            taskMessage,
            teams: formattedTeams,
            stateOption,
            thread_id: thread_id,
        }
        
        return taskQuery
    }


export const createScheduledTask = async (req: any, res: any) => {
    try {
        const { agentId, taskMessage, description, scheduledTime, recurrenceInterval, recurrenceEndTime } = req.body;
        const taskDescription = description ? "No description" : description;
        const userId = req.user.id;
        // Validate required fields
        if (!agentId || !taskMessage) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                data: null 
            });
        }

        // Parse scheduled time
        const parsedScheduledTime = new Date(scheduledTime);
        if (isNaN(parsedScheduledTime.getTime())) {
            return res.status(400).json({ 
                message: "Invalid scheduledTime format", 
                data: null 
            });
        }

        // Parse recurrence end time if provided
        let parsedRecurrenceEndTime = undefined;
        if (recurrenceEndTime) {
            parsedRecurrenceEndTime = new Date(recurrenceEndTime);
            if (isNaN(parsedRecurrenceEndTime.getTime())) {
                return res.status(400).json({ 
                    message: "Invalid recurrenceEndTime format", 
                    data: null 
                });
            }
        }

        const threadId = `${userId}-${agentId}-${Date.now()}`

        const taskQuery = await getTaskQuery({userId, agentId, taskMessage: taskMessage, thread_id: threadId})

        // Create task object
        const task: Task = {
            id: uuidv4(),
            userId,
            agentId: agentId,
            taskQuery: JSON.stringify(taskQuery),
            taskDescription,
            thread_id: threadId,
            scheduledTime: parsedScheduledTime,
            status: "pending",
            recurrenceInterval: recurrenceInterval || undefined,
            recurrenceEndTime: parsedRecurrenceEndTime
        };
        
        // Schedule the task
        const taskId = await scheduler.scheduleTask(task);

        return res.status(201).json({
            message: "Task scheduled successfully",
            data: taskId
        });
    } catch (error: any) {
        console.log("error", error)
        console.error('Error scheduling task:', error);
        return res.status(500).json({ 
            message: "Failed to schedule task", 
            error: error.message, 
            data: null 
        });
    }
}

// /**
//  * Create a new task
//  * @route POST /api/tasks
//  * @access Private
//  */
// export const createTask = async (req: any, res: any) => {
//     try {
//         const { agentId, taskDescription, scheduledTime, recurrenceInterval, recurrenceEndTime } = req.body;
//         const userId = req.user.id;

//         // Validate required fields
//         if (!agentId || !taskDescription || !scheduledTime) {
//             return res.status(400).json({ 
//                 message: "Missing required fields", 
//                 data: null 
//             });
//         }

//         // Parse dates and validate
//         const parsedScheduledTime = new Date(scheduledTime);
//         if (isNaN(parsedScheduledTime.getTime())) {
//             return res.status(400).json({ 
//                 message: "Invalid scheduledTime format", 
//                 data: null 
//             });
//         }

//         let parsedRecurrenceEndTime = null;
//         if (recurrenceEndTime) {
//             parsedRecurrenceEndTime = new Date(recurrenceEndTime);
//             if (isNaN(parsedRecurrenceEndTime.getTime())) {
//                 return res.status(400).json({ 
//                     message: "Invalid recurrenceEndTime format", 
//                     data: null 
//                 });
//             }
//         }

//         // Create task object
//         const task: Task = {
//             id: uuidv4(),
//             userId,
//             agentId,
//             taskDescription,
//             scheduledTime: parsedScheduledTime,
//             status: "pending",
//             recurrenceInterval: recurrenceInterval || undefined,
//             recurrenceEndTime: parsedRecurrenceEndTime || undefined
//         };

//         // Get scheduler instance and schedule the task
//         const taskId = await scheduler.scheduleTask(task);

//         return res.status(201).json({
//             message: "Task created successfully",
//             data: {
//                 taskId,
//                 task: {
//                     id: task.id,
//                     agentId: task.agentId,
//                     taskDescription: task.taskDescription,
//                     scheduledTime: task.scheduledTime,
//                     status: task.status,
//                     recurrenceInterval: task.recurrenceInterval,
//                     recurrenceEndTime: task.recurrenceEndTime
//                 }
//             }
//         });
//     } catch (error: any) {
//         console.error('Error creating task:', error);
//         return res.status(500).json({ 
//             message: "Failed to create task", 
//             error: error.message, 
//             data: null 
//         });
//     }
// }

/**
 * Get all tasks for the current user
 * @route GET /api/tasks
 * @access Private
 */
export const getUserTasks = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const lastTaskId = req.query.lastTaskId;

        // Get task manager instance
        const taskManager = new TaskManager();

        // Get tasks with pagination
        const tasks = await taskManager.getUserTasks(userId, pageSize, lastTaskId);
        
        return res.status(200).json({
            message: "Tasks retrieved successfully",
            data: tasks
        });
    } catch (error: any) {
        console.error('Error retrieving tasks:', error);
        return res.status(500).json({ 
            message: "Failed to retrieve tasks", 
            error: error.message, 
            data: null 
        });
    }
}

/**
 * Get a task by ID
 * @route GET /api/tasks/:id
 * @access Private
 */
export const getUserTaskSummary = async (req: any, res: any) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        // Get task manager instance
        const taskManager = new TaskManager();

        // Get task by ID
        const taskSummary = await taskManager.getUserTaskSummary(userId);

        return res.status(200).json({
            message: "Task summary retrieved successfully",
            data: taskSummary
        });
    } catch (error: any) {
        console.error('Error retrieving task:', error);
        return res.status(500).json({ 
            message: "Failed to retrieve task", 
            error: error.message
        });
    }
}

/**
 * Get all scheduled tasks for the current user
 * @route GET /api/tasks/scheduled
 * @access Private
 */
export const getUserScheduledTasks = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        
        // TODO: Implement task retrieval logic
        // This would typically involve querying your database or task repository
        
        // Placeholder for task retrieval
        const tasks: Task[] = []; // Replace with actual implementation
        
        return res.status(200).json({
            message: "Scheduled tasks retrieved successfully",
            data: tasks
        });
    } catch (error: any) {
        console.error('Error retrieving scheduled tasks:', error);
        return res.status(500).json({ 
            message: "Failed to retrieve scheduled tasks", 
            error: error.message, 
            data: null 
        });
    }
}

/**
 * Get a specific scheduled task by ID
 * @route GET /api/tasks/scheduled/:taskId
 * @access Private
 */
export const getTaskById = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        
        if (!taskId) {
            return res.status(400).json({
                message: "Task ID is required",
                data: null
            });
        }
        
        // TODO: Implement task retrieval logic
        // This would typically involve querying your database or task repository
        
        // Placeholder for task retrieval
        const task = null; // Replace with actual implementation
        
        if (!task) {
            return res.status(404).json({
                message: "Scheduled task not found",
                data: null
            });
        }
        
        return res.status(200).json({
            message: "Scheduled task retrieved successfully",
            data: task
        });
    } catch (error: any) {
        console.error('Error retrieving scheduled task:', error);
        return res.status(500).json({ 
            message: "Failed to retrieve scheduled task", 
            error: error.message, 
            data: null 
        });
    }
}

/**
 * Update a scheduled task
 * @route PUT /api/tasks/scheduled/:taskId
 * @access Private
 */
export const updateScheduledTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        const { taskDescription, scheduledTime, recurrenceInterval, recurrenceEndTime } = req.body;
        const userId = req.user.id;
        
        if (!taskId) {
            return res.status(400).json({
                message: "Task ID is required",
                data: null
            });
        }
        
        // TODO: Implement task update logic
        // This would typically involve updating your database or task repository
        
        // Placeholder for task update
        const updatedTask = null; // Replace with actual implementation
        
        if (!updatedTask) {
            return res.status(404).json({
                message: "Scheduled task not found",
                data: null
            });
        }
        
        return res.status(200).json({
            message: "Scheduled task updated successfully",
            data: updatedTask
        });
    } catch (error: any) {
        console.error('Error updating scheduled task:', error);
        return res.status(500).json({ 
            message: "Failed to update scheduled task", 
            error: error.message, 
            data: null 
        });
    }
}

/**
 * Delete a scheduled task
 * @route DELETE /api/tasks/scheduled/:taskId
 * @access Private
 */
export const deleteScheduledTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        
        if (!taskId) {
            return res.status(400).json({
                message: "Task ID is required",
                data: null
            });
        }
        
        // TODO: Implement task deletion logic
        // This would typically involve deleting from your database or task repository
        
        // Placeholder for task deletion
        const deleted = false; // Replace with actual implementation
        
        if (!deleted) {
            return res.status(404).json({
                message: "Scheduled task not found",
                data: null
            });
        }
        
        return res.status(200).json({
            message: "Scheduled task deleted successfully",
            data: null
        });
    } catch (error: any) {
        console.error('Error deleting scheduled task:', error);
        return res.status(500).json({ 
            message: "Failed to delete scheduled task", 
            error: error.message, 
            data: null 
        });
    }
}

/**
 * Send a message to an agent
 * @route POST /api/tasks/message
 * @access Private
 */
export const sendMessage = async (req: any, res: any) => {
    try {
        const { agentId, taskMessage, thread_id } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!agentId || !taskMessage) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                data: null 
            });
        }

        // Generate a new thread_id if not provided
        const messageThreadId = thread_id || `${userId}-${agentId}-${Date.now()}`;
        
        const taskQuery = await getTaskQuery({
            userId, 
            agentId, 
            taskMessage, 
            thread_id: messageThreadId
        });

        // Create task object for immediate execution
        const task: Task = {
            id: uuidv4(),
            userId,
            agentId,
            thread_id: messageThreadId,
            taskQuery: JSON.stringify(taskQuery),
            taskDescription: "Direct message",
            scheduledTime: new Date(), // Schedule for immediate execution
            status: "pending"
        };
        
        // Schedule the task for immediate execution
        const taskId = await scheduler.scheduleTask(task);
        await taskManager.createTaskMessage({taskId: taskId.taskId, message: taskMessage, thread_id: messageThreadId}); 
        const {id, isNewChat} = await taskManager.saveChatHistory({teamId: agentId, threadId: messageThreadId, message: taskMessage, user: "User"});

        return res.status(201).json({
            message: "Message sent successfully",
            data: {
                taskId: taskId.taskId,
                threadId: messageThreadId,
                chatId: id,
                isNewChat: isNewChat
            }
        });
    } catch (error: any) {
        console.log("error", error);
        console.error('Error sending message:', error);
        return res.status(500).json({ 
            message: "Failed to send message", 
            error: error.message, 
            data: null 
        });
    }
}


