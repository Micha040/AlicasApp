import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Nur POST erlaubt');
  }
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-Mail fehlt.' });
  }
  // User suchen
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (!user) {
    // Kein Fehler ausgeben, um Enumeration zu verhindern
    return res.status(200).json({ success: true });
  }
  // Token generieren
  const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
  await supabase
    .from('users')
    .update({ reset_token: token, reset_token_expires: new Date(Date.now() + 1000 * 60 * 60) }) // 1h gültig
    .eq('id', user.id);
  // E-Mail senden
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Alicas App <noreply@alicas-app.de>',
    to: email,
    subject: 'Passwort zurücksetzen',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px 0;">
        <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
          <div style="text-align: center;">
            <img src="https://alicas-app.de/logo.png" alt="Alicas App" style="width: 64px; margin-bottom: 16px;" />
            <h2 style="color: #ff4081; margin-bottom: 8px;">Passwort zurücksetzen</h2>
            <p style="color: #333; font-size: 1.1em; margin-bottom: 32px;">
              Klicke auf den Button, um dein Passwort zurückzusetzen. Der Link ist 1 Stunde gültig.
            </p>
            <a href="https://alicas-app.de/reset-password?token=${token}"
               style="display: inline-block; background: #ff4081; color: #fff; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 8px; font-size: 1.1em;">
              Passwort zurücksetzen
            </a>
            <p style="color: #888; font-size: 0.95em; margin-top: 32px;">
              Falls du kein Passwort zurücksetzen wolltest, kannst du diese E-Mail ignorieren.
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
} 