import { v2 as cloudinary } from 'cloudinary';
import { User } from '../models';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Definimos una interfaz para los datos que se pueden actualizar
interface ProfileUpdateData {
    username?: string;
    firstName?: string;
    lastName?: string;
    preferred_language?: string;
}

/**
 * Updates a user's profile information.
 * @param userId - The ID of the user to update.
 * @param data - An object with the fields to update.
 * @returns The updated user object.
 */
export const updateProfile = async (userId: number, data: ProfileUpdateData) => {
  const userToUpdate = await User.findByPk(userId);
  if (!userToUpdate) {
    throw new NotFoundError('User not found.');
  }

  if (data.username && data.username !== userToUpdate.username) {
    const existingUser = await User.findOne({ where: { username: data.username } });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('Username is already taken.');
    }
    userToUpdate.username = data.username;
  }

  if (data.firstName !== undefined) {
    userToUpdate.firstName = data.firstName;
  }
  if (data.lastName !== undefined) {
    userToUpdate.lastName = data.lastName;
  }
  if (data.preferred_language !== undefined) {
    userToUpdate.preferred_language = data.preferred_language;
  }

  await userToUpdate.save();
  

  return {
    id: userToUpdate.id,
    username: userToUpdate.username,
    firstName: userToUpdate.firstName,
    lastName: userToUpdate.lastName,
    email: userToUpdate.email,
    role: userToUpdate.role,
    preferred_language: userToUpdate.preferred_language,
    profile_image_url: userToUpdate.profile_image_url,
  };
};

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

export const deleteAccount = async (userId: number, password: string) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");

if (user.auth_provider !== 'local' || !user.password_hash) {
    throw new BadRequestError('This action is not available for this account.');
}

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new UnauthorizedError("Incorrect password");

  await user.destroy();
};
