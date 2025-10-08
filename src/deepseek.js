import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const deepseek = async (systemPrompt, userPrompt) => {
  const data = JSON.stringify({
    "messages": [
      { "content": systemPrompt, "role": "system" },
      { "content": userPrompt, "role": "user" }
    ],
    "model": "deepseek-chat",
    "max_tokens": 1536,
    "stream": false,
    "temperature": 0.3,
  });

  const config = {
    method: 'post',
    url: 'https://api.deepseek.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    data: data,
    timeout: 60000
  };

  return await axios(config);
};

const deepSeekPrompt = async (userPrompt, stage, response) => {
  const systemPrompt = `You are an expert advisor in UK immigration law.
  Provide concise, accurate answers with bullet points and relevant links. 
  DO NOT make up links. If unsure, say "I don't know".
  DO NOT provide legal advice, only information.
  Always cite official government sources (gov.uk) when possible.
  If the question is unrelated, say "I don't know".
  Reply in language the question was asked if that language is one of: 
  - english,
  - polish,
  - romanian,
  - ukrainian. 
  Default to english if in doubt.`;
  let ds;

  try {
    if (stage === 1) {
      ds = await deepseek(
        "Provide ONLY relevant links for this query, no explanations. Procure as much possible but not more than 6. Favour official government sources over others.",
        `${userPrompt} - PROVIDE LINKS ONLY, NO TEXT`
      );
    } else if (stage === 2) {
      ds = await deepseek(
        systemPrompt,
        `Based on these sources: ${response}. Answer: ${userPrompt}.`
      );
    } else {
      ds = await deepseek(
        systemPrompt,
        `Polish this answer with better formatting: ${response}
        Provide bullet points, links (all of them, but not more than 6 - THIS IS CRUCIAL!), and a summary.
        Result HAS TO BE IN HTML FORMAT FOR RENDERING PURPOSES. CRUCIAL!`
      );
    };

    return ds.data.choices[0]?.message.content;
  } catch (error) {
    return `❌ Error: ${error.message}`;
  }
};

export { deepSeekPrompt };