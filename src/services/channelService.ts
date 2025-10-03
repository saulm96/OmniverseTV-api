import { Channel } from '../models/Channel';
import { Translation } from '../models/Translation';
import { NotFoundError } from '../utils/errors';
import { translationQueue } from '../queues/translationQueue';
import { redisClient } from '../config/reddis/reddisClient';

// Defines the shape of the API response for a channel.
interface TranslatedChannelResponse {
  id: number;
  name: string;
  description: string;
  dimension_origin: string;
  translation?: {
    languageCode: string;
    name?: string;
    description?: string;
    status: 'completed' | 'pending';
  };
}

/**
 * Retrieves a channel by its ID, handling the translation logic.
 * @param channelId - The ID of the channel.
 * @param languageCode - The optional language code for the translation.
 */
export const getChannelById = async (
  channelId: number,
  languageCode?: string
): Promise<TranslatedChannelResponse> => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError(`Channel with ID ${channelId} not found.`);
  }

  const response = channel.toJSON() as unknown as TranslatedChannelResponse;

  if (!languageCode) {
    return response;
  }

  const cacheKey = `translation:channel:${channelId}:${languageCode}`;
  const cachedTranslation = await redisClient.get(cacheKey);

  if (cachedTranslation) {
    console.log(`CACHE HIT: Using cached translation for ${cacheKey}`);
    response.translation = JSON.parse(cachedTranslation);
    return response;
  }

  const dbTranslation = await Translation.findExisting(
    'channel',
    channelId,
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

  console.log(`TRANSLATION MISS: Adding job to the queue for ${cacheKey}`);
  await translationQueue.add('translate', {
    itemType: 'channel',
    itemId: channelId,
    languageCode,
    originalName: channel.name,
    originalDescription: channel.description,
  });

  response.translation = {
    languageCode,
    status: 'pending',
  };

  return response;
};

