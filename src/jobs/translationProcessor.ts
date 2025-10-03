import { Job } from 'bullmq';
import { Translation } from '../models/Translation';
import { fetchTranslation } from '../utils/translator';

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

  console.log(
    `-------> Starting translation for ${itemType} #${itemId} to ${languageCode.toUpperCase()}...`
  );

  try {
    // 1. Call the translation utility for both texts.
    // We use Promise.all to run both API calls in parallel.
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
    // This block will catch any error thrown from fetchTranslation.
    console.error(
      `🔴 [PROCESSOR] Failed to process translation job #${job.id}. Reason: ${error.message}`
    );
    // By re-throwing the error, we ensure the BullMQ job is marked as failed.
    throw error;
  }
};

