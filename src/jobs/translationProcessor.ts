import { Job } from 'bullmq';
import { Translation } from '../models/Translation';

// Interface for the job data
interface TranslationJobData {
  packageId: number;
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
  const { packageId, languageCode, originalName, originalDescription } =
    job.data;

  // 1. Simulate the call to the translation API
  const translatedName = mockTranslateAPI(originalName, languageCode);
  const translatedDescription = mockTranslateAPI(
    originalDescription,
    languageCode
  );

  // 2. Save the result in the database.
  const [translation, created] = await Translation.findOrCreate({
    where: {
      itemType: 'package',
      itemId: packageId,
      languageCode: languageCode,
    },
    defaults: {
      itemType: 'package',
      itemId: packageId,
      languageCode: languageCode,
      translatedName,
      translatedDescription,
    },
  });

  if (created) {
    console.log(
      `   - Translation saved in the database with ID: ${translation.id}`
    );
  } else {
    console.log(
      `   - The translation already existed in the database. No new entry was created.`
    );
  }
};