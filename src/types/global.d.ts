// src/types/globals.d.ts

// 1. Importamos nuestro modelo User pero le damos un alias para evitar ambigüedad
import { User as SequelizeUser } from '../models/User';

// 2. Usamos la 'fusión de declaraciones' para decirle a TypeScript
//    que la interfaz 'User' genérica de Express (usada por Passport)
//    debe tener las mismas propiedades que nuestro modelo de Sequelize.
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends SequelizeUser {}
  }
}