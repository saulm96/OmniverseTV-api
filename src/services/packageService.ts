import { Package } from '../models/Package';
import { Translation } from '../models/Translation';
import { NotFoundError } from '../utils/errors';
import { translationQueue } from '../queues/translationQueue';
import { redisClient } from '../config/reddis/reddisClient';
import { getPendingMessage } from '../utils/localization';

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
    name?: string;
    description?: string;
    status: 'completed' | 'pending';
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
  const tvPackage = await Package.findByIdWithChannels(packageId);
  if (!tvPackage) {
    throw new NotFoundError(`Package with ID ${packageId} not found.`);
  }

  const response = tvPackage.toJSON() as unknown as TranslatedPackageResponse;

  if (!languageCode) {
    return response;
  }

  const cacheKey = `translation:package:${packageId}:${languageCode}`;
  const cachedTranslation = await redisClient.get(cacheKey);

  if (cachedTranslation) {
    console.log(`CACHE HIT: Using cached translation for ${cacheKey}`);
    response.translation = JSON.parse(cachedTranslation);
    return response;
  }

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

  const lockKey = `lock:translation:package:${packageId}:${languageCode}`;
  const lockAcquired = await redisClient.set(lockKey, 'processing', {
    EX: 300,
    NX: true,
  });

  if (lockAcquired) {
    console.log(`TRANSLATION MISS & LOCK ACQUIRED: Adding job for ${cacheKey}`);
    await translationQueue.add(
      'translate',
      {
        itemType: 'package',
        itemId: packageId,
        languageCode,
        originalName: tvPackage.name,
        originalDescription: tvPackage.description,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
  } else {
    console.log(`TRANSLATION MISS & LOCK EXISTS: Job already in progress for ${cacheKey}`);
  }

  response.translation = {
    languageCode,
    status: 'pending',
    message: getPendingMessage(languageCode),
  };

  return response;
};

