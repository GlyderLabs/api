import { Config, RedisClient, RabbitMQService, TaskRepository, AgentTaskScheduler } from "agentic-automation-lib"
import { TaskManager } from "./TaskManager"
import { config } from 'dotenv';
config()


interface ConfigData {
    redis_url: string
    rabbitmq_url: string
    cron_schedule?: string
}

export interface Task {
    id: string;
    userId: string;
    agentId: string;
    taskQuery: string;
    taskDescription: string;
    scheduledTime: Date;
    status: "pending" | "queued" | "running" | "completed" | "failed";
    recurrenceInterval?: number; // milliseconds (optional for recurring tasks)
    recurrenceEndTime?: Date; // optional end time for recurrence
    thread_id?: string;
    result?: string;
}

export class Scheduler {
    
    config: Config
    redisClient: RedisClient
    rabbitMQService: RabbitMQService
    taskRepository: TaskRepository
    agentTaskScheduler: AgentTaskScheduler
    isInitialized: boolean
    rabbitMqInitialized: boolean
    taskManager: TaskManager
    private static instance: Scheduler;

    constructor(configData: ConfigData) {
        this.config = new Config(configData)
        this.redisClient = new RedisClient(this.config.redisUrl)
        this.rabbitMQService = new RabbitMQService(this.config, "automation")
        this.isInitialized = false
        this.rabbitMqInitialized = false
        this.taskManager = TaskManager.getInstance()
    }

    // Static method to get the Scheduler instance
    public static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            const configData = {
                redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
                rabbitmq_url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
            };
            Scheduler.instance = new Scheduler(configData);
            // Initialize the instance immediately
            Scheduler.instance.init().catch(err => {
                console.error('Failed to initialize Scheduler:', err);
            });
        }
        return Scheduler.instance;
    }

    async init() {
        try {
            await this.rabbitMQService.init()
            this.rabbitMqInitialized = true
            this.taskRepository = new TaskRepository(this.redisClient)
            this.agentTaskScheduler = new AgentTaskScheduler(this.config, this.taskRepository, this.rabbitMQService)
            this.isInitialized = true
            console.log("Scheduler initialized successfully")
            return this;
        } catch (error) {
            console.error("Failed to initialize Scheduler:", error)
            throw error
        }
    }

    async scheduleTask(task: Task) {
        if (!this.isInitialized) {
            throw new Error("Scheduler not initialized")
        }
        const taskId = await this.agentTaskScheduler.scheduleTask(task.agentId, task.userId, task.taskQuery, task.taskDescription, task.scheduledTime, task.recurrenceInterval, task.recurrenceEndTime)
        const createdTask = await this.taskManager.createTask({taskId, description: task.taskDescription, thread_id: task.thread_id, userId: task.userId, agentId: task.agentId})
        return { taskId, createdTask }
    }

    getRabbitMqService() {
        if (!this.rabbitMqInitialized) {
            throw new Error("RabbitMQ service not initialized")
        }
        return this.rabbitMQService
    }
}

// Export a singleton instance
export const scheduler = Scheduler.getInstance();