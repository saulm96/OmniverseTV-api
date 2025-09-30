import { Package } from '../models/Package';
import { Translation } from '../models/Translation';
import { NotFoundError } from '../utils/errors';
import { translationQueue } from '../queues/translationQueue';
import { redisClient } from '../config/reddis/reddisClient';

// Defines the shape of the API response for a package, including optional translation.
interface TranslatedPackageResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  createdAt: Date;
  updatedAt: Date;
  channels: any[];
  translation?: {
    languageCode: string;
    name: string;
    description: string;
  };
}

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
): Promise<TranslatedPackageResponse> => {
  // 1. Fetch the original package with its channels.
  const tvPackage = await Package.findByIdWithChannels(packageId);
  if (!tvPackage) {
    throw new NotFoundError(`Package with ID ${packageId} not found.`);
  }

  // Convert the Sequelize model instance to a plain JSON object and assert its type.
  // Using 'as unknown as Type' is the safest way to perform a type assertion.
  const response = tvPackage.toJSON() as unknown as TranslatedPackageResponse;

  // If no translation is requested, return the original object.
  if (!languageCode) {
    return response;
  }

  // 2. If translation is requested, check the cache first.
  const cacheKey = `translation:package:${packageId}:${languageCode}`;
  const cachedTranslation = await redisClient.get(cacheKey);

  if (cachedTranslation) {
    console.log(`CACHE HIT: Using cached translation for ${cacheKey}`);
    const parsedTranslation = JSON.parse(cachedTranslation);
    // Add the translation object to our response.
    response.translation = {
      languageCode,
      name: parsedTranslation.name,
      description: parsedTranslation.description,
    };
    return response;
  }

  // 3. If not in cache, check the database.
  const dbTranslation = await Translation.findExisting(
    'package',
    packageId,
    languageCode
  );

  if (dbTranslation) {
    console.log(`DB HIT: Using database translation for ${cacheKey}`);
    const translationData = {
      name: dbTranslation.translatedName,
      description: dbTranslation.translatedDescription,
    };
    // Store in cache for future requests (expires in 1 hour).
    await redisClient.set(cacheKey, JSON.stringify(translationData), { EX: 3600 });
    
    // Add the translation object to our response.
    response.translation = {
      languageCode,
      name: translationData.name,
      description: translationData.description,
    };
    return response;
  }

  // 4. If it doesn't exist anywhere, add a job to the queue.
  console.log(`TRANSLATION MISS: Adding job to the queue for ${cacheKey}`);
  await translationQueue.add('translate-package', {
    packageId,
    languageCode,
    originalName: tvPackage.name,
    originalDescription: tvPackage.description,
  });

  // Return the original package immediately without the translation object.
  return response;
};

