import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' });
  }
  const { message, username } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Keine Nachricht erhalten.' });
  }
  try {
    const prompt = `Du bist ein freundlicher, persönlicher Chatbot namens AlicaBot. Sprich den Nutzer "${username}" direkt an und antworte empathisch und kreativ.\n\nNutzer: ${message}\nAlicaBot:`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Du bist ein freundlicher, persönlicher Chatbot namens AlicaBot.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });
    const reply = completion.choices[0].message.content.trim();
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Fehler bei der KI-Antwort.' });
  }
} 