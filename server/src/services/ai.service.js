export async function summarizeTranscript(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // fallback if no AI key set
    return {
      summary: "AI is not configured. Add OPENAI_API_KEY in server .env to enable summaries.",
      actionItems: ["Add OPENAI_API_KEY to enable AI meeting notes."]
    };
  }

  // Minimal OpenAI Responses API call using fetch
  const prompt = `
You are an assistant that produces meeting notes.
Input transcript:
${transcript}

Return:
1) Summary (5-8 bullet points)
2) Action Items (as bullet list, imperative, with owners if present)
`;

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    return {
      summary: `AI error: ${resp.status}. ${err}`,
      actionItems: []
    };
  }

  const data = await resp.json();
  const text =
    data.output_text ||
    data.output?.[0]?.content?.map((c) => c.text).join("\n") ||
    "No AI output.";

  // Simple parsing: split into sections if possible
  const actionStart = text.toLowerCase().indexOf("action");
  let summaryText = text;
  let actionItems = [];

  if (actionStart !== -1) {
    summaryText = text.slice(0, actionStart).trim();
    const actionText = text.slice(actionStart).trim();
    actionItems = actionText
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter((l) => l && !l.toLowerCase().includes("action"));
  }

  return { summary: summaryText, actionItems };
}
