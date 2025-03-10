import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import adminAuthRoutes from "./routes/adminAuthRoutes";
import adminRoutes from "./routes/adminRoutes";
import featuresRoutes from "./routes/featuresRoutes"
import taskRoutes from './routes/task';


dotenv.config();



const app = express();

// app.use((req, res, next) => {
//     console.log("Global Log - Method:", req.method, "URL:", req.url);
//     console.log("Global Log - Headers:", req.headers);
//     next();
// });

app.use(cors());
app.use(express.json({
    // verify: (req, res, buf, encoding) => {
    //   console.log("Raw body:", buf.toString());
    // }
}));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/features", featuresRoutes)
app.use('/api/tasks', taskRoutes);

mongoose.connect(process.env.MONGO_URI as string);

export default app;