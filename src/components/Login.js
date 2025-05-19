// src/components/Login.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';
import { Card, CardContent, Typography, TextField, Button, Box, Alert, InputAdornment } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

export default function Login({ onLogin }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // User anhand E-Mail oder Username suchen
    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .limit(1)
      .single();

    if (dbError || !data) {
      setError('Benutzer nicht gefunden.');
      return;
    }

    // Passwort prüfen
    const valid = await bcrypt.compare(password, data.password);
    if (!valid) {
      setError('Falsches Passwort.');
      return;
    }

    // Überprüfen, ob E-Mail bestätigt wurde
    if (!data.is_verified) {
      setError('Bitte bestätige zuerst deine E-Mail-Adresse!');
      return;
    }

    // Login erfolgreich
    if (onLogin) onLogin(data);
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', my: 2, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <LockIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" gutterBottom>Login</Typography>
        </Box>
        <form onSubmit={handleLogin}>
          <TextField
            label="E-Mail oder Benutzername"
            value={emailOrUsername}
            onChange={e => setEmailOrUsername(e.target.value)}
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
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}