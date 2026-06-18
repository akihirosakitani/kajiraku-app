const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(500).json({ error: "OPENAI_API_KEY が未設定です。" });
    return;
  }

  try {
    const payload = request.body || {};
    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(buildOpenAiRequest(payload)),
    });

    const data = await openAiResponse.json();
    if (!openAiResponse.ok) {
      response.status(openAiResponse.status).json({
        error: data.error?.message || "OpenAI API の呼び出しに失敗しました。",
      });
      return;
    }

    const parsed = extractStructuredOutput(data);
    if (!parsed?.suggestions?.length) {
      response.status(502).json({ error: "AI候補の解析に失敗しました。" });
      return;
    }

    response.status(200).json(parsed);
  } catch (error) {
    response.status(500).json({
      error: error.message || "AI候補の生成に失敗しました。",
    });
  }
};

function buildOpenAiRequest(payload) {
  return {
    model: DEFAULT_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "あなたは家庭向け献立アシスタントです。",
              "日本の一般家庭で作りやすい夕食候補を提案してください。",
              "家にある食材を最大限活かし、不足食材は少なめにしてください。",
              "家族リクエストがあれば優先してください。",
              "quickOnly=true の場合は 20分以内にしてください。",
              "必ず JSON schema に従って返してください。",
            ].join("\n"),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(payload),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "meal_suggestions",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            suggestions: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  time: { type: "number" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  ingredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                  availableIngredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                  missingIngredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                  reason: { type: "string" },
                },
                required: [
                  "id",
                  "name",
                  "description",
                  "time",
                  "tags",
                  "ingredients",
                  "availableIngredients",
                  "missingIngredients",
                  "reason",
                ],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    },
  };
}

function extractStructuredOutput(data) {
  if (data.output_text) {
    return JSON.parse(data.output_text);
  }

  const messageText = data.output
    ?.flatMap((entry) => entry.content || [])
    ?.find((entry) => entry.type === "output_text")
    ?.text;

  if (messageText) {
    return JSON.parse(messageText);
  }

  return null;
}
