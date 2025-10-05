import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { sequelize, connectToDatabase } from "./config/database/connection";
import router from "./routes/router";
import { errorHandler } from "./middlewares/errorMiddleware";

import { configurePassport } from "./config/passport";

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    configurePassport();

    await connectToDatabase();
    await sequelize.sync({ force: false });
    console.log("✅ Database synchronized successfully.");

    app.use(express.json());
    app.use(cookieParser());
    app.use(passport.initialize());

    app.use("/api/v1", router);
    app.use(errorHandler);

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
