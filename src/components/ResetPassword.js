import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, Typography, TextField, Button, Box, Alert } from '@mui/material';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    setMsg('');
    setError('');
    if (!password || !password2) {
      setError('Bitte beide Felder ausfüllen.');
      return;
    }
    if (password !== password2) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    try {
      const res = await fetch('/api/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Passwort erfolgreich geändert! Du kannst dich jetzt einloggen.');
      } else {
        setError(data.error || 'Fehler beim Zurücksetzen.');
      }
    } catch (e) {
      setError('Fehler beim Zurücksetzen.');
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', my: 4, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>Neues Passwort setzen</Typography>
        <TextField
          label="Neues Passwort"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Passwort wiederholen"
          type="password"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          fullWidth
          margin="normal"
        />
        {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }} onClick={handleReset}>
          Passwort speichern
        </Button>
      </CardContent>
    </Card>
  );
} 