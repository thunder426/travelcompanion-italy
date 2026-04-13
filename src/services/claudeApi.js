import { ANTHROPIC_API_KEY } from '@env';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

/**
 * Send a message to Claude with an optional image.
 * @param {string} prompt - Text prompt to send
 * @param {string|null} base64Image - Base64-encoded image (without data URI prefix)
 * @param {string} mediaType - e.g. 'image/jpeg'
 * @returns {Promise<string>} - Claude's text response
 */
async function askClaude(prompt, base64Image = null, mediaType = 'image/jpeg') {
  const content = [];

  if (base64Image) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Image,
      },
    });
  }

  content.push({ type: 'text', text: prompt });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export const translateImage = (base64Image) =>
  askClaude(
    'You are a travel companion. Translate all text in this image into English. ' +
    'After the translation, add a brief note about any cultural context or practical tips ' +
    'a tourist should know (e.g. if it\'s a menu item, describe the dish; if it\'s a sign, ' +
    'explain what action to take). Keep your response concise and practical.',
    base64Image
  );

export const describeArtwork = (base64Image, depth = 'standard') => {
  const depthPrompt =
    depth === 'quick'
      ? 'Give a short 2-3 sentence description suitable for a quick visit.'
      : depth === 'deep'
      ? 'Give a detailed explanation including historical context, artistic techniques, symbolism, and the artist\'s biography. Aim for 3-4 paragraphs.'
      : 'Give a 1-2 paragraph explanation covering what the artwork is, who created it, and why it\'s significant.';

  return askClaude(
    `You are an expert museum guide. Identify this artwork or exhibit and explain it. ${depthPrompt}`,
    base64Image
  );
};

export const describeStreet = (base64Image) =>
  askClaude(
    'You are a knowledgeable travel guide. Look at this photo and identify any visible landmarks, ' +
    'buildings, or points of interest. Provide their history and interesting facts. ' +
    'If you cannot identify a specific landmark, describe the architectural style and likely time period.',
    base64Image
  );
