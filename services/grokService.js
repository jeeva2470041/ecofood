const axios = require('axios');

const API_KEY = process.env.GROK_API_KEY;
const BASE_URL = process.env.GROK_API_URL || 'https://api.groq.com/openai/v1';

if (!API_KEY) {
  console.warn('Warning: GROK_API_KEY (Groq API Key) is not set. Chat requests will fail until you set it in your .env file.');
}

const parseTextFromResponse = (data) => {
  // Groq/OpenAI format
  return data?.choices?.[0]?.message?.content || JSON.stringify(data);
};

const generateText = async (prompt, model = 'llama-3.1-8b-instant') => {
  if (!API_KEY) throw new Error('GROK_API_KEY is not configured');

  const url = `${BASE_URL}/chat/completions`;
  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    return parseTextFromResponse(resp.data);
  } catch (err) {
    console.error('Error in grokService.generateText:', err.message || err);
    throw err;
  }
};

const analyzeFood = async (foodName, foodDescription) => {
  const prompt = `Analyze the following food item for a donation platform:
Name: ${foodName}
Description: ${foodDescription}

Please provide:
1. A brief description of the food.
2. Estimated shelf life if not provided.
3. Storage recommendations (e.g., refrigerated, room temperature).
4. Potential allergens.

Format the response as a JSON object with keys: description, shelfLife, storage, allergens.`;

  try {
    const text = await generateText(prompt, 'llama-3.1-8b-instant');

    const jsonMatch = String(text).match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: 'Failed to parse AI response', raw: text };
  } catch (err) {
    console.error('Error in grokService.analyzeFood:', err.message || err);
    throw new Error('AI analysis failed');
  }
};

module.exports = { generateText, analyzeFood };