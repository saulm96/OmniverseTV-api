import "dotenv/config";
import "./types";
import express from "express";
import { sequelize, connectToDatabase } from "./database/connection";
import router from "./routes/router";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    //Connect to database attempt
    await connectToDatabase();
    //sincronize database models
    await sequelize.sync({ force: false });
    console.log("✅ Database synchronized successfully.");

    //...Middlewares...
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/v1", router);

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();

