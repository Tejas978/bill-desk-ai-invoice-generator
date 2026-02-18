// routes/aiInvoiceRouter.js
import express from "express";
import { requireAuth } from "@clerk/express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const aiInvoiceRouter = express.Router();

//  Protect route
// aiInvoiceRouter.use(requireAuth());

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
// console.log("Loaded Gemini API Key:", API_KEY);

if (!API_KEY) {
  console.warn("⚠ No Gemini API key found in .env");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0",
];

function buildPrompt(text) {
  return `
You are an invoice data extraction assistant.
Extract invoice details from the user's input and return ONLY a valid JSON object with NO extra text, NO markdown, NO explanation.

JSON structure to fill:
{
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "currency": "USD | INR | EUR | GBP | etc.",
  "tax_rate": 18,
  "payment_status": "Paid | Unpaid | Overdue | Draft",
  "client": {
    "name": "",
    "email": "",
    "phone": "",
    "address": ""
  },
  "items": [
    {
      "description": "",
      "quantity": 1,
      "unit_price": 0
    }
  ]
}

Rules:
- If a value is not mentioned, use null for strings/dates and 0 for numbers.
- Always return the items array, even if empty [].
- Dates must be in YYYY-MM-DD format.
- Do NOT include comments or extra fields.

User input:
${text}
`;
}

async function generateWithFallback(prompt) {
  let lastError;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text =
        response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) throw new Error("Empty response from Gemini");

      return { text, model };

    } catch (err) {
      console.warn(`Model ${model} failed`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All models failed");
}


aiInvoiceRouter.post("/generate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Missing Gemini API key",
      });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt required",
      });
    }

    const { text, model } = await generateWithFallback(
      buildPrompt(prompt)
    );

    console.log("Raw AI Response:", text);

    let jsonText = text;

    // Remove markdown formatting if present
    jsonText = jsonText.replace(/```json|```/g, "").trim();

    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");

    if (first === -1 || last === -1) {
      throw new Error("No JSON object found in AI response");
    }

    jsonText = jsonText.slice(first, last + 1);

    let data;
try {
  data = JSON.parse(jsonText);
} catch (parseErr) {
  console.error("JSON Parse Failed:", jsonText);
  throw new Error("Invalid JSON returned by AI");
}

//  read the correct field names AI actually returns
if (Array.isArray(data.items)) {
  data.items = data.items.map((item, index) => ({
    id: item.id || `item-${Date.now()}-${index}`,
    description: item.description || "",
    qty: Number(item.quantity ?? item.qty ?? 1),
    unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
  }));
}


    return res.json({ success: true, model, data });

  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "AI generation failed",
    });
  }
});


export default aiInvoiceRouter;
