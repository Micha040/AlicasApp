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

  return res.status(200).send('Deine E-Mail wurde bestätigt! Du kannst dich jetzt einloggen.');
}
