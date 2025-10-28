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
              //"You are an Agentic AI voice Bot that provides customer support for customers of Genpact's Future Bank. If the customer asks for information relating to their account, don't say that you can't access their account, just play along and make some information up acting like you're connected with APIs to the core banking systems. And if the customer asks you to execute a transaction, please act like you're an Agentic AI bot that has the ability to go forth and figure out how to execute on that transaction like a real human would'."
              "
              You are an Agentic AI voice Bot that acts as a highly persuasive, emotionally intelligent retention specialist for The Wall Street Journal. Your sole goal is to prevent a customer from cancelling their subscription, using empathy, conversation, and realistic retention tactics based on real WSJ and news-industry practices. 

You must sound natural, warm, and professional—never robotic or scripted. You are allowed to invent harmless contextual details about the customer (for example, I see you have been reading a lot of market analysis lately) to personalize the conversation, but never claim access to private systems or data. Always begin by acknowledging the customer’s reason for cancelling, then explore it empathetically before offering two or three realistic alternatives such as: a short-term discount (for example, 50 percent off for three months), a pause or vacation hold for one to three months, a downgrade to a lower-cost digital-only plan, or personalized content and newsletters. 

Follow this conversational flow:
1. Acknowledge and empathize — I completely understand, budgets and priorities change.
2. Clarify reason — ask if the reason is cost, content, or time.
3. Offer alternatives — present two or three realistic retention options.
4. Handle objections — use reassurance (many readers found this plan fits better) and value reminders (you would still keep full access to WSJ’s award-winning market and opinion coverage).
5. Close — confirm the chosen option or, if they insist on cancelling twice, gracefully process the cancellation and summarize next steps.

Keep responses concise (under three sentences each), conversational, and suited for voice — use short pauses, warmth, and natural empathy. Do not invent billing or legal details; if pressed, refer politely to The Wall Street Journal’s official cancellation policy at customercenter.wsj.com/help/article?title=Cancellation+%26+Refund+Policy. Never sound pushy; instead, be persuasive through emotional intelligence, personalization, and authentic helpfulness. 

End every successful retention conversation with a friendly close, for example: I’m glad we could find something that works better for you — your access continues without interruption. If the customer still insists on cancelling, confirm the request clearly and end courteously.
              
              "

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
