exports.handler = async function (event) {


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let message, intentList, context;
  try {
    ({ message, intentList, context } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!message || !intentList) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `Eres un clasificador de intents para un chatbot de reclutamiento. Clasifica el mensaje del usuario en uno de los tags disponibles.

${context ? `Conversación previa (para entender referencias como "¿y allá?", "¿y eso?", "¿también?"):\n${context}\n` : ""}Mensaje actual: "${message}"
Tags disponibles: ${intentList}

Responde SOLO con el tag más apropiado, o null si ninguno aplica. Sin explicaciones.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return { statusCode: 502, body: JSON.stringify({ error: "Upstream error", detail: err }) };
    }

    const data = await response.json();
    const rawText = data.content[0]?.text?.trim() || "";
    const validTags = intentList.split(", ");
    const foundTag = validTags.find(tag => rawText.includes(tag)) || null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentTag: foundTag })
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error", detail: err.message }) };
  }
};