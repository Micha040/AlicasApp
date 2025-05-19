import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Box,
  Typography,
  IconButton,
  TextField
} from '@mui/material';
import { supabase } from '../supabaseClient';

function ProfileDialog({ open, onClose, user, onLogout, onProfileUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      // Datei in Supabase Storage hochladen
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Public URL generieren
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Profil in der Datenbank aktualisieren
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // UI aktualisieren
      onProfileUpdate({ ...user, avatar_url: publicUrl });
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onProfileUpdate({ ...user, username: username });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzernamens:', error);
      alert('Fehler beim Aktualisieren des Benutzernamens');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Profil</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-image-upload"
            type="file"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          <label htmlFor="profile-image-upload">
            <IconButton component="span" disabled={uploading}>
              <Avatar
                src={user?.avatar_url}
                sx={{ width: 100, height: 100, cursor: 'pointer' }}
              />
            </IconButton>
          </label>
          <Typography variant="body2" color="text.secondary">
            {uploading ? 'Bild wird hochgeladen...' : 'Klicke auf das Bild zum Ändern'}
          </Typography>

          <TextField
            fullWidth
            label="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleUsernameUpdate}
            disabled={!username || username === user?.username}
          >
            Benutzernamen aktualisieren
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
        <Button onClick={onLogout} color="error">
          Abmelden
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProfileDialog; 