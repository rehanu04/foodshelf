interface Env {
  GEMINI_API_KEY: string;
}

type SuggestMealsRequest = {
  inventory: Array<{
    name: string;
    qty?: number;
    unit?: string;
    tags?: string[];
    category?: string;
    storage?: string; // fridge/pantry/freezer
  }>;
  mealRequests?: string[]; // e.g. ["biryani", "something spicy"]
  dietary?: {
    vegetarian?: boolean;
    halal?: boolean;
  };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });
}

function buildPrompt(body: SuggestMealsRequest) {
  const inv = body.inventory?.slice(0, 200) ?? [];
  const requests = body.mealRequests?.slice(0, 20) ?? [];
  const dietary = body.dietary ?? {};

  return `
You are a meal-planning assistant for a household.

Input inventory (JSON):
${JSON.stringify(inv)}

User meal requests (optional):
${JSON.stringify(requests)}

Dietary preferences:
${JSON.stringify(dietary)}

Return ONLY valid JSON (no markdown, no explanation, no code fences) with this schema:
{
  "meals": [
    {
      "title": "string",
      "why_it_fits": "string",
      "uses": ["ingredient names used"],
      "missing": [{"name":"string","qty":number|null,"unit":"string|null"}],
      "steps": ["short steps"]
    }
  ]
}

Rules:
- Suggest exactly 3 meals.
- Prefer meals using existing inventory.
- If something is missing, include it in "missing".
- Keep steps short (max 6 steps).
`.trim();
}

function mockMeals(): any {
  return {
    meals: [
      {
        title: "Spicy Chicken Rice Bowl",
        why_it_fits: "Uses rice, chicken, and onion; quick, spicy and filling.",
        uses: ["Rice", "Chicken", "Onion"],
        missing: [
          { name: "Chili powder", qty: null, unit: null },
          { name: "Ginger-garlic paste", qty: null, unit: null }
        ],
        steps: [
          "Cook rice.",
          "Sauté onion, add chicken and spices.",
          "Simmer until chicken is cooked.",
          "Serve chicken over rice."
        ]
      },
      {
        title: "Onion Chicken Stir Fry",
        why_it_fits: "Minimal ingredients, uses perishables first.",
        uses: ["Chicken", "Onion"],
        missing: [
          { name: "Soy sauce", qty: null, unit: null }
        ],
        steps: [
          "Slice onion and chicken.",
          "Stir fry chicken until browned.",
          "Add onion and sauce/spices.",
          "Cook until onion softens."
        ]
      },
      {
        title: "Simple Chicken Fried Rice",
        why_it_fits: "Great reuse of rice; fast meal.",
        uses: ["Rice", "Chicken", "Onion"],
        missing: [
          { name: "Egg", qty: 1, unit: "pcs" },
          { name: "Spring onion", qty: null, unit: null }
        ],
        steps: [
          "Cook/prepare rice.",
          "Cook chicken with onion.",
          "Add rice and stir on high heat.",
          "Finish with egg/greens if available."
        ]
      }
    ]
  };
}
function extractJson(text: string): any | null {
  // Try direct parse
  try { return JSON.parse(text); } catch {}

  // Try to extract first JSON object/array from text
  const startObj = text.indexOf("{");
  const startArr = text.indexOf("[");
  const start = startObj === -1 ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr));
  if (start === -1) return null;

  // naive scan for matching end
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0 && ch === "}") {
      const slice = text.slice(start, i + 1);
      try { return JSON.parse(slice); } catch { return null; }
    }
  }
  return null;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return json({ ok: true });

    if (url.pathname === "/health") {
      return json({ ok: true, service: "foodshelf-worker", ts: new Date().toISOString() });
    }

    if (url.pathname === "/suggestMeals" && request.method === "POST") {
      let body: SuggestMealsRequest;
      try {
        body = (await request.json()) as SuggestMealsRequest;
      } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
      }

      const prompt = buildPrompt(body);

      // Gemini REST call (server-side)
      const model = (env as any).GEMINI_MODEL || "models/gemini-2.0-flash";
      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/" + model + ":generateContent?key=" +
        env.GEMINI_API_KEY;

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      const raw = await resp.text();

      if (!resp.ok) {
        // Fallback: keep app usable even if API is blocked by geo/quota/policy
        return json({
          ok: true,
          mode: "mock",
          note: "AI provider unavailable; returning mock suggestions.",
          error_status: resp.status,
          error_raw: raw,
          result: mockMeals()
        }, 200);
      }

      // Extract model text
      try {
        const data = JSON.parse(raw);
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";

        // The model should return JSON; parse it
        const parsed = extractJson(text);
        if (parsed) return json({ ok: true, result: parsed });
        return json({ ok: true, result_text: text }, 200);
      } catch {
        // If model returned non-JSON, return the raw text for debugging
        return json({ ok: true, result_raw: raw }, 200);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};



