// src/server.ts

// 1. Carga de variables de entorno - DEBE SER LO PRIMERO
import dotenv from 'dotenv';
dotenv.config();

// 2. El resto de las importaciones
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { sequelize, connectToDatabase } from "./config/database/connection";
import router from "./routes/router";
import { errorHandler } from "./middlewares/errorMiddleware";

// 3. Importar la FUNCIÓN de configuración de Passport
import { configurePassport } from "./config/passport";


const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 4. LLAMAR a la función de configuración de Passport
    // Lo hacemos aquí para asegurarnos de que dotenv.config() ya se ejecutó.
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