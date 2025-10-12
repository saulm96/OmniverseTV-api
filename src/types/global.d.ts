import { UserAttributes } from "../models/User";

declare global {
    namespace Express {
        interface User extends Partial<UserAttributes> {}
    }
}
