import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // 1. User in Supabase Auth anlegen
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    // 2. User in eigene Tabelle anlegen
    const authId = data.user.id;
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          auth_id: authId,
          username: username,
        }
      ]);
    if (userError) {
      setError(userError.message);
      return;
    }
    setSuccess('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <form onSubmit={handleSignup}>
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Benutzername"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <button type="submit">Registrieren</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </form>
  );
} 