import { Job } from 'bullmq';
import { Translation } from '../models/Translation';

// Interface for the job data
interface TranslationJobData {
  itemType: 'package' | "channel";
  itemId: number;
  languageCode: string;
  originalName: string;
  originalDescription: string;
}

/**
 * Simulates a call to an external translation API.
 * @param text - The text to translate.
 * @param lang - The language code.
 * @returns The "translated" text.
 */
const mockTranslateAPI = (text: string, lang: string): string => {
  // In a real app, you would call a service like Google Translate here.
  // We'll just append the language code for a cleaner simulation.
  console.log(`   - Simulating translation of "${text}" to ${lang}...`);
  return `${text}`;
};

/**
 * Processes a translation job: it "translates" and saves it to the database.
 * @param job - The BullMQ job object.
 */
export const processTranslationJob = async (job: Job<TranslationJobData>) => {
  const { itemType, itemId, languageCode, originalName, originalDescription } =
    job.data;

  // 1. Simulate the call to the translation API.
  const translatedName = mockTranslateAPI(originalName, languageCode);
  const translatedDescription = mockTranslateAPI(
    originalDescription,
    languageCode
  );

  // 2. Save the result in the database.
  // This logic now works for any itemType passed in the job data.
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
      `   - Translation for ${itemType} #${itemId} saved with ID: ${translation.id}`
    );
  } else {
    console.log(
      `   - Translation for ${itemType} #${itemId} already existed. No new entry created.`
    );
  }
};
