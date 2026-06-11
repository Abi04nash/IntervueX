import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import interviewRoute from "./routes/interview.route.js";
import reportRoute from "./routes/report.route.js";
import resumeRoute from "./routes/resume.route.js";
import path from "path";


// dotenv.config({});


const app = express();

const PORT = process.env.PORT || 3000;


const _dirname = path.resolve();


// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin:'http://localhost:5173',
    credentials:true
}

app.use(cors(corsOptions));


// app.get("/", (req, res) => {
//   res.send("PrepAI Backend Running 🚀");
// });

// routes
app.use("/api/user", userRoute);
app.use("/api/interview", interviewRoute);
app.use("/api/report", reportRoute);
app.use("/api/resume", resumeRoute);



app.use(express.static(path.join(_dirname , "/frontend/dist")));
app.get(/.*/,(_, res) => {
  res.sendFile(path.join(_dirname, "frontend", "dist", "index.html"));
});



app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});