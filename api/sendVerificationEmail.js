import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Nur POST erlaubt');
  }
  const { email, token } = req.body;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Alicas App <noreply@alicas-app.de>',
      to: email,
      subject: 'Bitte bestätige deine E-Mail',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px 0;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
            <div style="text-align: center;">
              <img src="https://alicas-app.de/logo.png" alt="Alicas App" style="width: 64px; margin-bottom: 16px;" />
              <h2 style="color: #ff4081; margin-bottom: 8px;">Willkommen bei Alicas App!</h2>
              <p style="color: #333; font-size: 1.1em; margin-bottom: 32px;">
                Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
              </p>
              <a href="https://alicas-app.de/api/verify?token=${token}"
                 style="display: inline-block; background: #ff4081; color: #fff; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 8px; font-size: 1.1em;">
                E-Mail bestätigen
              </a>
              <p style="color: #888; font-size: 0.95em; margin-top: 32px;">
                Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
              </p>
            </div>
          </div>
          <div style="text-align: center; color: #bbb; font-size: 0.9em; margin-top: 24px;">
            © ${new Date().getFullYear()} Alicas App
          </div>
        </div>
      `
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
  }
} 