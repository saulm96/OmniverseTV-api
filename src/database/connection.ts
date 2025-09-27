import "dotenv/config";
import { Sequelize } from "sequelize";

//Get url of database from .env
const dbUrl = process.env.DATABASE_URL;

if(!dbUrl){
    console.error("FATAL ERROR: DATABASE_URL is not defined in .env");
    process.exit(1);
}

export const sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false //Disable logging, if you want to see the database queryes remove this line
});

export async function connectToDatabase(){
    try {
       await sequelize.authenticate();
       console.log('✅Database connection has been established successfully.'); 
    } catch (error) {
        console.error('❌Unable to connect to the database:', error);
    }
}

