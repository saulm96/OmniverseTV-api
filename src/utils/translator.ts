/**
 * Fetches a translation from the DeepL API using the native fetch.
 * Includes a timeout to prevent the process from hanging.
 * @param text - The text to translate.
 * @param lang - The target language code.
 * @returns A promise that resolves to the translated text.
 * @throws An error if the API call fails or times out.
 */
export const fetchTranslation = async (text: string, lang: string): Promise<string> => {
    const apiUrl = 'https://api-free.deepl.com/v2/translate';
    const apiKey = process.env.DEEPL_API_KEY;
  
    if (!apiKey) {
      console.error('🔴 ERROR: DeepL API key is not configured.');
      // If the key is missing, we throw an error to fail the job immediately.
      throw new Error('DeepL API key is not configured.');
    }
  
    // AbortController is the standard way to implement timeouts with fetch.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: lang,
        }),
        signal: controller.signal, // Pass the abort signal to fetch
      });
  
      // Clear the timeout if the fetch completes in time
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        // If the API returns an error (like 400 for an invalid language),
        // we can get more details from the response body.
        const errorData = await response.json();
        throw new Error(
          `DeepL API Error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }
  
      const data = await response.json();
      return data.translations[0].text;
    } catch (error: any) {
      // Clear the timeout in case of an error as well
      clearTimeout(timeoutId);
  
      // Differentiate between a timeout error and other errors
      if (error.name === 'AbortError') {
        throw new Error('DeepL API Error: Request timed out after 10 seconds.');
      }
      // Re-throw the original error to be caught by the worker.
      throw error;
    }finally {
      clearTimeout(timeoutId);
    }
  };
  
  