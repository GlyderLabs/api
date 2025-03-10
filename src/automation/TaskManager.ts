// tasksManager.ts

import { initializeApp } from 'firebase/app';
import { DocumentReference, getFirestore, serverTimestamp, Timestamp } from 'firebase/firestore';
import { config } from 'dotenv';
import { 
  collection, 
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion
} from 'firebase/firestore';
config()


const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const getDocId = async ({tasksCollection, taskId}:{tasksCollection: CollectionReference, taskId: string}) => {
  try{
    const q = query(tasksCollection, where("id", "==", taskId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {message: `Task with ID ${taskId} not found`, error: true, data: null}
      //throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Get the Firestore document ID from the query result
    const firestoreDocId = querySnapshot.docs[0].id;
    return {message: `Task with ID ${taskId} found`, error: false, data: firestoreDocId}
  }catch(e:any){
    console.log("error in getStoreId", e)
    return {message: `Error in getStoreId`, error: true, data: null}
  }
}


// Initialize Firebase Admin SDK if not already initialized.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
/**
 * Interface representing a Task document.
 */
export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;
  thread_id: string;
  result?: string;
  agentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processingStart?: Timestamp;
}

export interface TaskMessage {
  id: string;
  taskId: string;
  message: string;
  response?: string;
  thread_id: string;
  createdAt: Timestamp;
}
/**
 * TaskManager class provides methods for creating, updating,
 * and retrieving tasks from Firestore.
 */
export class TaskManager {
    private tasksCollection: CollectionReference;
    private taskMessagesCollection: CollectionReference;
    private static instance: TaskManager;

    constructor() {
        // Reference to the "tasks" collection in Firestore.
        this.tasksCollection = collection(db, 'tasks');
        this.taskMessagesCollection = collection(db, 'taskMessages');
    }

    /**
     * Get the singleton instance of TaskManager
     * @returns The TaskManager instance
     */
    public static getInstance(): TaskManager {
        if (!TaskManager.instance) {
            TaskManager.instance = new TaskManager();
        }
        return TaskManager.instance;
    }

  /**
   * createTask
   *
   * Creates a new task document in Firestore with an initial status of 'pending'.
   * Sets both createdAt and updatedAt timestamps.
   *
   * @param description - A brief description of the task.
   * @param userId - The identifier of the user owning the task.
   * @param agentId - (Optional) The identifier of the agent assigned to the task.
   * @returns A promise that resolves to the created Task.
   */
  public async createTask({taskId, description, userId, agentId, thread_id}:{taskId: string, description: string, userId: string, agentId?: string, thread_id?: string}): Promise<Task> {
    const taskData = {
      id: taskId,
      description: description || 'No description provided',
      status: 'pending',
      userId,
      agentId,
      thread_id: thread_id || null,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(this.tasksCollection, taskData);
    const createdDoc = await getDoc(docRef);
    return { id: docRef.id, ...createdDoc.data() } as Task;
  }


   /**
   * updateTask
   *
   * Updates an existing task document in Firestore.
   *
   * @param taskId - The Firestore document ID for the task.  
   * @param status - The new status for the task.
   * @param result - The result of the task.
   * @returns A promise that resolves to the updated Task.
   * @throws If the task is not found.
   */
   public async updateTask(taskId: string, status: 'pending' | 'processing' | 'completed' | 'failed', result?: string): Promise<Task> {
    const {message, error, data} = await getDocId({tasksCollection: this.tasksCollection, taskId: taskId})
    if(error){
      throw new Error(message)
    }
    
    // Get the Firestore document ID from the query result
    const firestoreDocId = data
    const taskRef = doc(this.tasksCollection, firestoreDocId);
    await updateDoc(taskRef, {
      result,
      status,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(taskRef);
    if (!updatedDoc.exists()) {
      throw new Error('Task not found');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Task;
  }

  /**
   * updateTaskStatus
   *
   * Updates the status of an existing task and refreshes the updatedAt timestamp.
   *
   * @param taskId - The Firestore document ID for the task.
   * @param status - The new status for the task.
   * @returns A promise that resolves to the updated Task.
   * @throws If an invalid status is provided or the task is not found.
   */
  public async updateTaskStatus(taskId: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<Task> {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid task status. Valid statuses are: ' + validStatuses.join(', '));
    }

    const {message, error, data} = await getDocId({tasksCollection: this.tasksCollection, taskId: taskId})
    if(error){
      throw new Error(message)
    }
    
    // Get the Firestore document ID from the query result
    const firestoreDocId = data

    const taskRef = doc(this.tasksCollection, firestoreDocId);
    // Update the task document with the new status and update the updatedAt timestamp.
    await updateDoc(taskRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(taskRef);
    if (!updatedDoc.exists()) {
      throw new Error('Task not found');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Task;
  }

  public async createTaskMessage({taskId, message, thread_id}:{taskId: string, message: string, thread_id: string}): Promise<TaskMessage> {
    const taskMessageData = {
      taskId,
      message,
      thread_id,
      createdAt: serverTimestamp() as Timestamp,
    };
    const docRef = await addDoc(this.taskMessagesCollection, taskMessageData);
    return { id: docRef.id, ...taskMessageData } as TaskMessage;
  }

  public async updateTaskMessage({thread_id, response}:{thread_id: string, response: string}): Promise<TaskMessage> {
    const q = query(this.taskMessagesCollection, where('thread_id', '==', thread_id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Task message not found');
    }
    const taskMessageRef = doc(this.taskMessagesCollection, snapshot.docs[0].id);
    await updateDoc(taskMessageRef, {response, updatedAt: serverTimestamp()});
    const updatedDoc = await getDoc(taskMessageRef);
    if (!updatedDoc.exists()) {
      throw new Error('Task message not found');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as TaskMessage;
  }

  public async getTaskMessages({taskId, thread_id}:{taskId: string, thread_id: string}): Promise<TaskMessage[]> {
    const q = query(this.taskMessagesCollection, where('taskId', '==', taskId), where('thread_id', '==', thread_id), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskMessage));
  }
  /**
   * getTask
   *
   * Retrieves a single task document by its Firestore ID.
   *
   * @param taskId - The Firestore document ID for the task.
   * @returns A promise that resolves to the Task.
   * @throws If the task is not found.
   */
  public async getTask(taskId: string): Promise<Task> {
    const {message, error, data} = await getDocId({tasksCollection: this.tasksCollection, taskId: taskId})
    if(error){
      throw new Error(message)
    }
    
    // Get the Firestore document ID from the query result
    const firestoreDocId = data
    const taskRef = doc(this.tasksCollection, firestoreDocId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    return { id: taskDoc.id, ...taskDoc.data() } as Task;
  }

  /**
   * getAllTasks
   *
   * Retrieves all tasks from Firestore, ordered by creation time.
   *
   * @returns A promise that resolves to an array of Tasks.
   */
  public async getAllTasks(): Promise<Task[]> {
    const q = query(this.tasksCollection, orderBy('createdAt'));
    const snapshot = await getDocs(q);
    const tasks: Task[] = [];
    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
  }

  /**
   * getUserTasks
   *
   * Retrieves a user's tasks with pagination.
   *
   * @param userId - The identifier of the user.
   * @param pageSize - The number of tasks per page.
   * @param lastTaskId - (Optional) The document ID of the last task from the previous page.
   * @returns A promise that resolves to an array of Tasks.
   */
  public async getUserTasks(userId: string, pageSize: number, lastTaskId?: string): Promise<Task[]> {
    let q = query(
      this.tasksCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // If lastTaskId is provided, start after the last document of the previous page.
    if (lastTaskId) {
      const {message, error, data} = await getDocId({tasksCollection: this.tasksCollection, taskId: lastTaskId})
      if(error){
        throw new Error(message)
      }
      
      // Get the Firestore document ID from the query result
      const firestoreDocId = data
      const lastDocRef = doc(this.tasksCollection, firestoreDocId);
      const lastDoc = await getDoc(lastDocRef);
      if (!lastDoc.exists()) {
        throw new Error('Last task not found for pagination');
      }
      q = query(q, startAfter(lastDoc));
    }
    const snapshot = await getDocs(q);
    const tasks: Task[] = [];
    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
  }

  /**
   * getTaskSummary
   *
   * Returns summary information for tasks including:
   *   - Total number of tasks.
   *   - Total completed tasks.
   *   - Total failed tasks.
   *   - For each task, the processing time (difference between createdAt and updatedAt).
   *
   * @returns A promise that resolves to an object containing the summary.
   */
  public async getUserTaskSummary(userId: string): Promise<{
    totalTasks: number;
    totalCompleted: number;
    totalFailed: number;
    averageProcessingTime: number;
  }> {
    const snapshot = await getDocs(query(this.tasksCollection, where('userId', '==', userId)));
    const totalTasks = snapshot.size;
    let totalCompleted = 0;
    let totalFailed = 0;
    const taskProcessingTimes: Array<{ id: string; processingTime: number }> = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // Count tasks by status.
      if (data.status === 'completed') {
        totalCompleted++;
      } else if (data.status === 'failed') {
        totalFailed++;
      }
      // Compute processing time if both timestamps exist.
      if (data.createdAt && data.updatedAt) {
        const createdAtMillis = data.createdAt.toMillis();
        const updatedAtMillis = data.updatedAt.toMillis();
        const processingTime = updatedAtMillis - createdAtMillis;
        taskProcessingTimes.push({ id: doc.id, processingTime });
      }
    });

    //the task processing time should be an average of the task processing times
    const averageProcessingTime = taskProcessingTimes.reduce((acc, curr) => acc + curr.processingTime, 0) / taskProcessingTimes.length;

    return { totalTasks, totalCompleted, totalFailed, averageProcessingTime };
  }

  public async getUserTaskSummaryByAgentId(userId: string, agentId: string): Promise<{
    totalTasks: number;
    totalCompleted: number;
    totalFailed: number;
    taskProcessingTimes: Array<{ id: string; processingTime: number }>;
  }> {
    const snapshot = await getDocs(query(this.tasksCollection, where('userId', '==', userId), where('agentId', '==', agentId)));
    const totalTasks = snapshot.size;
    let totalCompleted = 0;
    let totalFailed = 0;
    const taskProcessingTimes: Array<{ id: string; processingTime: number }> = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed') {
        totalCompleted++;
      } else if (data.status === 'failed') {
        totalFailed++;
      }
      if (data.createdAt && data.updatedAt) {
        const createdAtMillis = data.createdAt.toMillis();
        const updatedAtMillis = data.updatedAt.toMillis();
        const processingTime = updatedAtMillis - createdAtMillis;
        taskProcessingTimes.push({ id: doc.id, processingTime });
      }
    });

    return { totalTasks, totalCompleted, totalFailed, taskProcessingTimes };
  }

  public async saveChatHistory({ teamId,  threadId, message, user}:{ teamId: string, threadId: string, message: string, user: string}): Promise<{id: string, isNewChat: boolean}> {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('threadId', '==', threadId));
    const chatSnapshot = await getDocs(q);

   
   
      if (chatSnapshot.empty) {
        // Create a new chat document
        const newChatRef = await addDoc(collection(db, 'chats'), {
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
          teamId: teamId,
          threadId: threadId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: message,
          lastMessageAt: new Date(),
          messages: [{
            sender: user,
            message: message,
            timestamp: new Date()
          }]
        });
        const chatRef: DocumentReference = newChatRef;
        return {id: chatRef.id, isNewChat: true};
      } else {
        // Update the existing chat
        const chatDoc = chatSnapshot.docs[0];
        
        await updateDoc(doc(db, 'chats', chatDoc.id), {
          lastMessage: message,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          messages: arrayUnion({
            sender: user,
            message: message,
            timestamp: new Date()
          })
        });
        return {id: chatDoc.id, isNewChat: false};
      }
  
    }
  }

// Export a singleton instance
export const taskManager = TaskManager.getInstance();
