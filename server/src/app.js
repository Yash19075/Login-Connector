import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173", // your React app
  credentials: true
}));

// parsers
app.use(express.json()); 
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRoute from "./routes/user.routes.js";
import itemRoute from "./routes/item.routes.js";
import chatRoute from "./routes/chat.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";

app.use("/api/v1/razorpay", razorpayRoutes);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/items", itemRoute);
app.use("/api/v1/chats", chatRoute);

export { app };