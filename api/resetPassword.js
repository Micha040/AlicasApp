import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Nur POST erlaubt');
  }
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token oder Passwort fehlt.' });
  }
  // User mit Token suchen
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('reset_token', token)
    .single();
  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Token ungültig oder abgelaufen.' });
  }
  // Passwort hashen
  const hashed = await bcrypt.hash(password, 10);
  await supabase
    .from('users')
    .update({ password: hashed, reset_token: null, reset_token_expires: null })
    .eq('id', user.id);
  res.status(200).json({ success: true });
} 