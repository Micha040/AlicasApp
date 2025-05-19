import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Kein Token angegeben.');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('verification_token', token)
    .single();

  if (!user) {
    return res.status(400).send('Ungültiger oder abgelaufener Token.');
  }

  await supabase
    .from('users')
    .update({ is_verified: true, verification_token: null })
    .eq('id', user.id);

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>E-Mail bestätigt</title>
      <style>
        body {
          background: #f7f7f7;
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 420px;
          margin: 60px auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px #0001;
          padding: 32px 24px 24px 24px;
          text-align: center;
        }
        h2 {
          color: #ff4081;
          margin-bottom: 16px;
        }
        p {
          color: #333;
          font-size: 1.1em;
          margin-bottom: 32px;
        }
        a.button {
          display: inline-block;
          background: #ff4081;
          color: #fff;
          text-decoration: none;
          font-weight: bold;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 1.1em;
          transition: background 0.2s;
        }
        a.button:hover {
          background: #e73370;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Deine E-Mail wurde bestätigt!</h2>
        <p>Du kannst dich jetzt einloggen.</p>
        <a class="button" href="/login">Zurück zum Login</a>
      </div>
    </body>
    </html>
  `);
}
