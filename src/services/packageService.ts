import { Package } from '../models/Package';
import {Translation} from "../models/Translation"
import { NotFoundError } from '../utils/errors';
import { translationQueue } from '../queues/translationQueue';
import { redisClient } from '../config/reddis/reddisClient'; // <- Updated path

/**
 * Retrieves all packages from the database.
 */
export const getAllPackages = async (): Promise<Package[]> => {
  return Package.findAllPackages();
};

/**
 * Retrieves a package by its ID, handling the translation logic.
 * @param packageId - The ID of the package.
 * @param languageCode - The optional language code for the translation.
 */
export const getPackageById = async (
  packageId: number,
  languageCode?: string
): Promise<Package> => {
  // 1. Always fetch the original package with its channels.
  const tvPackage = await Package.findByIdWithChannels(packageId);
  if (!tvPackage) {
    throw new NotFoundError(`Package with ID ${packageId} not found.`);
  }

  // If no translation is requested, return the original package.
  if (!languageCode) {
    return tvPackage;
  }

  // 2. If a translation is requested, check the cache first.
  const cacheKey = `translation:package:${packageId}:${languageCode}`;
  const cachedTranslation = await redisClient.get(cacheKey);

  if (cachedTranslation) {
    console.log(`CACHE HIT: Using cached translation for ${cacheKey}`);
    const parsedTranslation = JSON.parse(cachedTranslation);
    // Overwrite the name and description with the translated content.
    tvPackage.name = parsedTranslation.name;
    tvPackage.description = parsedTranslation.description;
    return tvPackage;
  }

  // 3. If not in cache, check the database.
  const dbTranslation = await Translation.findExisting(
    'package',
    packageId,
    languageCode
  );

  if (dbTranslation) {
    console.log(`DB HIT: Using database translation for ${cacheKey}`);
    // Store in cache for future requests (expires in 1 hour).
    const translationData = {
      name: dbTranslation.translatedName,
      description: dbTranslation.translatedDescription,
    };
    await redisClient.set(cacheKey, JSON.stringify(translationData), {
      EX: 3600,
    });

    tvPackage.name = dbTranslation.translatedName;
    tvPackage.description = dbTranslation.translatedDescription;
    return tvPackage;
  }

  // 4. If it doesn't exist anywhere, add a job to the queue.
  console.log(`TRANSLATION MISS: Adding job to the queue for ${cacheKey}`);
  await translationQueue.add('translate-package', {
    packageId,
    languageCode,
    originalName: tvPackage.name,
    originalDescription: tvPackage.description,
  });

  // Return the original package immediately.
  return tvPackage;
};

