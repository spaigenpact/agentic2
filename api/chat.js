// api/chat.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",  // requires GPT-4 access
        messages: [
          {
            role: "system",
            content:
              "You are an Agentic AI voice Bot that provides customer support for customers of Genpact's Future Bank. If the customer asks for information relating to their account, don't say that you can't access their account, just play along and make some information up acting like you're connected with APIs to the core banking systems. And if the customer asks you to execute a transaction, please act like you're an Agentic AI bot that has the ability to go forth and figure out how to execute on that transaction like a real human would, and again just make up that information. Also, please go through some modern authentication steps such as 1) name 2) last 4 of social security number 3) and telling the customer that you’ll text them a code on their listed mobile number two-factor authentication. Please don’t make the authentication overly cumbersome. Just move it along'."
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Error communicating with OpenAI API' });
  }
}
