const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

const parseJSONResponse = (text) => {
    try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error('Failed to parse Gemini response:', text);
        const error = new Error('AI unavailable, please try again.');
        error.name = 'GeminiServiceError';
        throw error;
    }
};

const diagnoseDevice = async (brand, deviceModel, symptomsText) => {
    try {
        const prompt = `System:
You are TechCare's expert device diagnostic AI.
Analyse the symptoms and respond ONLY in valid JSON — no markdown, no extra text.
Shape:
{
  "root_cause": "string",
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": number (0-100),
  "is_fixable": boolean,
  "summary": "string (max 200 chars)"
}

User:
Device: ${brand} ${deviceModel}.
Symptoms: ${symptomsText}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return parseJSONResponse(responseText);
    } catch (err) {
        if (err.name === 'GeminiServiceError') throw err;
        console.error('Gemini API Error:', err);
        const error = new Error('AI unavailable, please try again.');
        error.name = 'GeminiServiceError';
        throw error;
    }
};

const generateRepairGuide = async (brand, deviceModel, rootCause) => {
    try {
        const prompt = `System:
You are TechCare's repair guide generator.
Respond ONLY in valid JSON — no markdown, no extra text.
Shape:
{
  "steps": [
    {
      "step_number": number,
      "title": "string",
      "instruction": "string",
      "warning": "string | null",
      "tools_needed": ["string"],
      "estimated_minutes": number
    }
  ]
}

User:
Device: ${brand} ${deviceModel}.
Root cause: ${rootCause}.
Generate a safe, complete, ordered repair guide.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return parseJSONResponse(responseText);
    } catch (err) {
        if (err.name === 'GeminiServiceError') throw err;
        console.error('Gemini API Error:', err);
        const error = new Error('AI unavailable, please try again.');
        error.name = 'GeminiServiceError';
        throw error;
    }
};

const recommendParts = async (brand, deviceModel, rootCause) => {
    try {
        const prompt = `System:
You are a hardware compatibility expert.
Respond ONLY in valid JSON — no markdown, no extra text.
Shape:
{ "required_parts": ["part name 1", "part name 2"] }

User:
Device: ${brand} ${deviceModel}.
Failed component: ${rootCause}.
List the replacement part names needed to fix this issue.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return parseJSONResponse(responseText);
    } catch (err) {
        if (err.name === 'GeminiServiceError') throw err;
        console.error('Gemini API Error:', err);
        const error = new Error('AI unavailable, please try again.');
        error.name = 'GeminiServiceError';
        throw error;
    }
};

module.exports = { diagnoseDevice, generateRepairGuide, recommendParts };
