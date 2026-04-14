import { ANTHROPIC_API_KEY } from '@env';
import { getContextString } from './destinationContext';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function askClaude(prompt, base64Image = null, mediaType = 'image/jpeg', maxTokens = 1024) {
  const content = [];

  // `base64Image` can be a single base64 string or an array for multi-image prompts.
  const images = Array.isArray(base64Image) ? base64Image : base64Image ? [base64Image] : [];
  for (const img of images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: img },
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
      max_tokens: maxTokens,
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

export const translateImage = async (base64Image) => {
  const ctx = getContextString();
  const images = Array.isArray(base64Image) ? base64Image : [base64Image];
  const multi = images.length > 1;
  const raw = await askClaude(
    `You are a travel companion helping a tourist in Italy.${ctx ? ` ${ctx}` : ''}

${multi
  ? `Look at these ${images.length} images — they are pages of the same menu, in order. Treat them as one document and merge sections that span across pages (do not duplicate a section header like "Primi" just because it repeats). Skip duplicate items. Respond with ONLY a JSON object`
  : 'Look at this image. Respond with ONLY a JSON object'} (no markdown, no code fences, no preamble). Use one of the following schemas:

IF THIS IS A MENU OR FOOD LIST:
{
  "type": "menu",
  "sections": [
    {
      "name": "Antipasti" | "Primi" | "Secondi" | "Contorni" | "Dolci" | "Bevande" | "Other",
      "original": "exact section label as written on the menu (e.g. 'Secondi Piatti Freddi', 'Pizze Classiche', 'Insalate'). Omit only if the menu has no section header at all.",
      "items": [
        {
          "name": "Italian name exactly as shown",
          "desc": "plain-English description of what it actually is — key ingredients, cooking method, texture/taste. Do NOT just translate the name.",
          "tags": ["vegetarian" | "seafood" | "meat" | "specialty" | "kid_friendly" | "challenging"],
          "allergens": ["gluten" | "dairy" | "nuts" | "shellfish" | "eggs" | "soy"],
          "price": "price string as shown, or null"
        }
      ]
    }
  ]
}

IF THIS IS A SIGN, NOTICE, RECEIPT, LABEL, PLACARD, OR OTHER READABLE TEXT:
{
  "type": "sign",
  "translation": "direct translation of the visible text",
  "note": "one short practical note on meaning or action to take"
}

IF THE IMAGE HAS NO READABLE TEXT (blurry, dark, pointed at a non-text object, etc.):
{
  "type": "none",
  "message": "short friendly explanation of what you see and a suggestion (e.g. 'No readable text in this photo. Try pointing at the menu and keeping steady.')"
}

Tag rules:
- kid_friendly: mild flavor, familiar textures (plain pasta, pizza margherita, grilled chicken, risotto, gelato, prosciutto e melone)
- challenging: very spicy, raw, offal/organs, strong anchovy/liver/tripe, unusual textures, bitter greens
- specialty: local/regional dish that's notable in this area

Skip items you cannot read clearly. Return valid JSON only.`,
    images,
    'image/jpeg',
    8192
  );
  // Strip potential code fences if Claude ignored the instruction
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
};

export const generateMenuTitle = async (translationText) => {
  // If content is JSON, flatten key fields into a plain-text summary for the prompt
  let snippet = translationText || '';
  try {
    const obj = JSON.parse(snippet.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    if (obj?.type === 'menu' && Array.isArray(obj.sections)) {
      const lines = [];
      for (const sec of obj.sections) {
        lines.push(sec.name || 'Menu');
        for (const it of (sec.items || []).slice(0, 4)) lines.push(`- ${it.name}`);
      }
      snippet = lines.join('\n');
    } else if (obj?.type === 'sign') {
      snippet = `Sign: ${obj.translation || ''}`;
    }
  } catch {}
  snippet = snippet.slice(0, 800);

  const title = await askClaude(
    `Generate a short 2-5 word title for saving this translated menu or sign to a personal review list. Return ONLY the title text — no quotes, no preamble, no period. Prefer the restaurant/venue name if visible; otherwise describe the scene concisely (e.g. "Osteria Dinner Menu", "Gelateria Flavors", "Metro Station Sign", "Trattoria Lunch Specials").\n\nText:\n${snippet}`,
    null,
    'image/jpeg',
    64
  );
  return title.trim().replace(/^["']|["']$/g, '').slice(0, 80);
};

export const describeScene = (base64Image, depth = 'standard') => {
  const ctx = getContextString();
  const depthPrompt =
    depth === 'quick'
      ? 'Give a short 2-3 sentence description suitable for a quick visit.'
      : depth === 'deep'
      ? 'Give a detailed explanation including historical context, artistic techniques or architectural style, symbolism, and biographical or cultural background. Aim for 3-4 paragraphs.'
      : 'Give a 1-2 paragraph explanation covering what it is, who or when it was made, and why it\'s significant.';

  return askClaude(
    `You are a knowledgeable cultural guide specialising in Italian art, history, and architecture.` +
    `${ctx ? ` ${ctx}` : ''} ` +
    `Look at this photo and identify whatever is in it — an artwork, a building, a landmark, a street scene, food, or any object of cultural interest. ` +
    `If you cannot identify a specific subject, describe the style and likely time period. ${depthPrompt}`,
    base64Image
  );
};

const LANGUAGE_NAMES = {
  en: 'English',
  it: 'Italian',
  zh: 'Chinese (Simplified)',
};

/**
 * Generate a custom itinerary based on user preferences.
 * Returns a JSON object with stops that can be rendered on the route map.
 *
 * @param {string} city — 'rome' or 'florence'
 * @param {string} duration — 'half-day' or 'full-day'
 * @param {string[]} interests — e.g. ['art', 'food', 'history']
 * @param {string|null} startingPoint — optional starting location description
 * @param {object|null} baseRoute — optional pre-built route to customize
 * @param {string[]} mustVisit — POI names the user wants included
 */
export const generateItinerary = (city, duration, interests, startingPoint, baseRoute, mustVisit = []) => {
  const ctx = getContextString();
  const cityName = city === 'florence' ? 'Florence' : 'Rome';

  const baseRouteCtx = baseRoute
    ? `\n\nThe user selected this pre-built route as a starting point. Adapt it to their preferences — you may reorder, add, or remove stops:\n${JSON.stringify(baseRoute.stops.map(s => ({ name: s.name, visitMin: s.visitMin, tip: s.tip })))}`
    : '';

  const mustVisitCtx = mustVisit.length
    ? `\nMust-visit places (include ALL of these as stops): ${mustVisit.join(', ')}`
    : '';

  return askClaude(
    `You are a knowledgeable Italy travel planner.${ctx ? ` ${ctx}` : ''}

Create a ${duration === 'half-day' ? 'half-day (4–5 hour)' : 'full-day (7–8 hour)'} walking itinerary for ${cityName}.

${startingPoint ? `Starting from: ${startingPoint}` : 'Start from the most logical point for this route.'}
${mustVisitCtx}
${interests.length ? `General interests (use to fill gaps or choose between options): ${interests.join(', ')}` : ''}
${baseRouteCtx}

Respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "title": "Short catchy route title",
  "subtitle": "Stop1 → Stop2 → Stop3",
  "description": "1-2 sentence overview",
  "stops": [
    {
      "name": "Place Name",
      "latitude": 43.7731,
      "longitude": 11.2560,
      "walkMin": 0,
      "visitMin": 60,
      "tip": "One practical tip for visiting"
    }
  ]
}

Rules:
- Every must-visit place MUST appear as a stop — do not skip any
- Order stops to minimise backtracking from the starting point
- walkMin = walking minutes from the previous stop (0 for first stop)
- visitMin = realistic time to spend there
- Use accurate GPS coordinates for ${cityName}
- Tips should be practical (hours, prices, what to see first)
- Consider opening hours and logical walking order
- If the user selected many places and they don't fit the time window, include them all but note in the description that it's an ambitious schedule
- Total time (walk + visit) should ideally fit within the ${duration === 'half-day' ? '4–5' : '7–8'} hour window`,
    null,
    'image/jpeg',
    2048
  );
};

export const findTopPlaces = (city, category) => {
  const cityName = city === 'florence' ? 'Florence' : 'Rome';
  const catLabels = {
    cafe:       'cafes and coffee bars',
    restaurant: 'restaurants (all cuisines)',
    pizza:      'pizzerias',
    gelato:     'gelaterias',
  };
  const catLabel = catLabels[category] ?? category;

  return askClaude(
    `You are a local food expert in ${cityName}, Italy.

List the top 12 highest-rated, most notable ${catLabel} in ${cityName} that a tourist should actually visit. Only include places that are genuinely well-regarded — famous spots, local favourites, critically acclaimed, or iconic institutions. No generic or mediocre places.

Respond with ONLY a valid JSON array (no markdown, no code fences):
[
  {
    "name": "Place Name",
    "latitude": 41.8902,
    "longitude": 12.4922,
    "description": "Why it's notable — 1 short sentence",
    "specialty": "What to order or what it's known for",
    "price": "€ or €€ or €€€",
    "neighborhood": "Trastevere"
  }
]

Rules:
- Use accurate GPS coordinates for ${cityName}
- Only include real, currently operating places
- Mix well-known tourist favourites with genuine local gems
- "specialty" should be specific (e.g. "supplì al telefono" not "Italian food")
- "description" should explain WHY this place is special, not just what it is`,
    null,
    'image/jpeg',
    2048
  );
};

export const translateText = (text, fromLang, toLang) => {
  const from = LANGUAGE_NAMES[fromLang] ?? fromLang;
  const to   = LANGUAGE_NAMES[toLang]   ?? toLang;
  return askClaude(
    `You are a professional translator specialising in travel contexts. ` +
    `Translate the following ${from} text into ${to}. ` +
    `Return ONLY the translation — no explanation, no original text, no quotes. ` +
    `Preserve tone and intent. If the text contains a proper name or place, keep it as-is.\n\n` +
    `Text to translate:\n${text}`
  );
};
