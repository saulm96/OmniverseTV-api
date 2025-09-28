import { Package } from '../models/Package';
import { NotFoundError } from '../utils/errors';

/**
 * Retrieves all packages from the database.
 * @returns A promise that resolves to an array of all packages.
 */
export const getAllPackages = async (): Promise<Package[]> => {
  // Use the model's static method to fetch all packages.
  return Package.findAllPackages();
};

/**
 * Retrieves a single package by its ID, including its associated channels.
 * @param packageId - The ID of the package to retrieve.
 * @returns A promise that resolves to the found package.
 * @throws {NotFoundError} if the package is not found.
 */
export const getPackageById = async (packageId: number): Promise<Package> => {
  // Use the model's static method to fetch the package with its channels.
  const tvPackage = await Package.findByIdWithChannels(packageId);

  if (!tvPackage) {
    throw new NotFoundError(`Package with ID ${packageId} not found.`);
  }
  return tvPackage;
};
