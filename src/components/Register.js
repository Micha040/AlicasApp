// src/components/Register.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';
import { Card, CardContent, Typography, TextField, Button, Box, Alert, InputAdornment } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { v4 as uuidv4 } from 'uuid';

export default function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !username || !password) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Token generieren
    const token = uuidv4();

    // In Supabase speichern
    const { data, error: dbError } = await supabase
      .from('users')
      .insert([
        { email, username, password: hashedPassword, is_verified: false, verification_token: token }
      ])
      .select();

    if (dbError) {
      setError('Fehler: ' + dbError.message);
    } else {
      // Bestätigungs-E-Mail senden über eigene API-Route
      try {
        await fetch('/api/sendVerificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token })
        });
        setSuccess('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');
        setEmail('');
        setUsername('');
        setPassword('');
        if (onRegister) onRegister();
      } catch (mailErr) {
        setError('Registrierung gespeichert, aber E-Mail konnte nicht gesendet werden. Kontaktiere den Support.');
      }
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', my: 2, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" gutterBottom>Registrieren</Typography>
        </Box>
        <form onSubmit={handleRegister}>
          <TextField
            label="E-Mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
            required
          />
          <TextField
            label="Benutzername"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
            required
          />
          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            }}
            required
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Registrieren
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}