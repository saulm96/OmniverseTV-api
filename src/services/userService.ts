import { User } from "../models/User";
import {ConflictError, NotFoundError} from "../utils/errors";


export const updateUsername = async (userId: number, newUsername: string) => {
    const existingUser=  await User.findOne({where: {username: newUsername}});
    if(existingUser && existingUser.id !== userId) throw new ConflictError("Username already exists");

    const userToUpdate = await User.findByPk(userId);
    if(!userToUpdate) throw new NotFoundError("User not found");

    userToUpdate.username = newUsername;
    await userToUpdate.save();

    return {
        id: userToUpdate.id,
        username: userToUpdate.username,
        email: userToUpdate.email,
        role: userToUpdate.role,
    };
}