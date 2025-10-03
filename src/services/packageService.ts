import { Package } from '../models/Package';
import { Translation } from '../models/Translation';
import { NotFoundError } from '../utils/errors';
import { translationQueue } from '../queues/translationQueue';
import { redisClient } from '../config/reddis/reddisClient';
import { getPendingMessage } from '../utils/localization';

// Defines the shape of the API response for a package.
interface TranslatedPackageResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  createdAt: Date;
  updatedAt: Date;
  channels: any[];
  translation?: {
    status: 'completed' | 'pending';
    languageCode: string;
    name?: string;
    description?: string;
    message?: string;
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

  const response = tvPackage.toJSON() as unknown as TranslatedPackageResponse;

  if (!languageCode) {
    return response;
  }

  // 2. If translation is requested, check the cache first.
  const cacheKey = `translation:package:${packageId}:${languageCode}`;
  const cachedTranslation = await redisClient.get(cacheKey);

  if (cachedTranslation) {
    console.log(`CACHE HIT: Using cached translation for ${cacheKey}`);
    response.translation = JSON.parse(cachedTranslation);
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
      languageCode,
      status: 'completed' as const,
      name: dbTranslation.translatedName,
      description: dbTranslation.translatedDescription,
    };
    await redisClient.set(cacheKey, JSON.stringify(translationData), { EX: 3600 });
    response.translation = translationData;
    return response;
  }

  // 4. If it doesn't exist anywhere, add a job and return a 'pending' status.
  console.log(`TRANSLATION MISS: Adding job to the queue for ${cacheKey}`);
  await translationQueue.add('translate', {
    itemType: 'package',
    itemId: packageId,
    languageCode,
    originalName: tvPackage.name,
    originalDescription: tvPackage.description,
  });

  // Add the 'pending' translation object to the response as a signal for the frontend.
  response.translation = {
    languageCode,
    status: 'pending',
    message: getPendingMessage(languageCode),
  };

  return response;
};


