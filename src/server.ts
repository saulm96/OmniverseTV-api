import "dotenv/config";
import express, { Request, Response } from "express";
import { sequelize, connectToDatabase } from "./database/connection";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("¡El servidor de OmniverseTV API está funcionando! 📺");
});

async function startServer() {
  try {
    //Connect to database attempt
    await connectToDatabase();
    //sincronize database models
    await sequelize.sync({ force: false });
    console.log("✅ Database synchronized successfully.");

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();

