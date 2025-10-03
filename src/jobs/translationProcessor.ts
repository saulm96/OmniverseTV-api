import { Job } from 'bullmq';
import { Translation } from '../models/Translation';
import { fetchTranslation } from '../utils/translator';
import { redisClient } from '../config/reddis/reddisClient'; // Import Redis client

// Interface for the job data
interface TranslationJobData {
  itemType: 'package' | 'channel';
  itemId: number;
  languageCode: string;
  originalName: string;
  originalDescription: string;
}

/**
 * Processes a translation job: it "translates" and saves it to the database.
 * @param job - The BullMQ job object.
 */
export const processTranslationJob = async (job: Job<TranslationJobData>) => {
  const { itemType, itemId, languageCode, originalName, originalDescription } =
    job.data;

  // Reconstruct the lock key to release it after processing
  const lockKey = `lock:translation:${itemType}:${itemId}:${languageCode}`;

  console.log(
    `-------> Starting translation for ${itemType} #${itemId} to ${languageCode.toUpperCase()}...`
  );

  try {
    // 1. Call the translation utility for both texts.
    const [translatedName, translatedDescription] = await Promise.all([
      fetchTranslation(originalName, languageCode),
      fetchTranslation(originalDescription, languageCode),
    ]);

    // 2. Save the result in the database.
    const [translation, created] = await Translation.findOrCreate({
      where: {
        itemType,
        itemId,
        languageCode,
      },
      defaults: {
        itemType,
        itemId,
        languageCode,
        translatedName,
        translatedDescription,
      },
    });

    if (created) {
      console.log(
        `-------> Translation for ${itemType} #${itemId} saved with ID: ${translation.id}`
      );
    } else {
      console.log(
        `-------> Translation for ${itemType} #${itemId} already existed.`
      );
    }
  } catch (error: any) {
    console.error(
      `🔴 [PROCESSOR] Failed to process translation job #${job.id}. Reason: ${error.message}`
    );
    throw error;
  } finally {
    // This block runs whether the job succeeds or fails.
    // It's crucial to release the lock so new jobs can be created in the future.
    console.log(`-------> Releasing lock for ${lockKey}`);
    await redisClient.del(lockKey);
  }
};

