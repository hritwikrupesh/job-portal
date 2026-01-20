import express from "express";
import dbConnection from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import { config } from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

// ✅ Load environment variables
config({ path: "./config/config.env" });

const app = express();
app.set("trust proxy", 1); 

// ✅ CORS setup
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// ✅ Body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ File upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running successfully 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ✅ API routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);

// ✅ Connect to DB (only once!)
dbConnection();

// ✅ Global error middleware
app.use(errorMiddleware);

// ✅ Export app (DO NOT connect to mongoose again here)
export default app;
