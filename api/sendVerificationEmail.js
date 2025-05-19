import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Nur POST erlaubt');
  }
  const { email, token } = req.body;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Alicas-App <noreply@alicas-app.de>',
      to: email,
      subject: 'Bitte bestätige deine E-Mail',
      html: `<a href="https://www.alicas-app.de/api/verify?token=${token}">Klicke hier, um deine E-Mail zu bestätigen</a>`
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
  }
} 