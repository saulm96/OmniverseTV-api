import { User } from "../models/User";
import { ConflictError, NotFoundError } from "../utils/errors";

import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadProfileImage = async (
  userId: number,
  fileBuffer: Buffer
) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");

  //If already has an profile picture, delete it from cloudinary
  if (user.profile_image_url) {
    const publicId = user.profile_image_url.split("/").pop()?.split(".")[0];
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profile_avatars" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
  user.profile_image_url = uploadResult.secure_url;
  await user.save();

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    profile_image_url: user.profile_image_url,
  };
};

export const updateUsername = async (userId: number, newUsername: string) => {
  const existingUser = await User.findOne({ where: { username: newUsername } });
  if (existingUser && existingUser.id !== userId)
    throw new ConflictError("Username already exists");

  const userToUpdate = await User.findByPk(userId);
  if (!userToUpdate) throw new NotFoundError("User not found");

  userToUpdate.username = newUsername;
  await userToUpdate.save();

  return {
    id: userToUpdate.id,
    username: userToUpdate.username,
    email: userToUpdate.email,
    role: userToUpdate.role,
  };
};
