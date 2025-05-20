import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

async function getSpotifyToken() {
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  });
  const data = await resp.json();
  return data.access_token;
}

async function searchSpotifyTrack(query, token) {
  const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await resp.json();
  if (data.tracks && data.tracks.items.length > 0) {
    const t = data.tracks.items[0];
    return {
      spotify_id: t.id,
      title: t.name,
      artist: t.artists.map(a => a.name).join(', '),
      cover_url: t.album.images[0]?.url,
      preview_url: t.preview_url
    };
  }
  return null;
}

export default function MusicTab({ user }) {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    // Lade alle geposteten Songs
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('favorite_songs')
        .select('*')
        .order('created_at', { ascending: false });
      setSongs(data || []);
    };
    fetchSongs();
  }, []);

  const handleSearch = async () => {
    setDialogError('');
    setDialogSuccess('');
    setSearchResult(null);
    if (!query) return;
    setDialogLoading(true);
    try {
      const token = await getSpotifyToken();
      const result = await searchSpotifyTrack(query, token);
      if (!result) {
        setDialogError('Kein Song gefunden!');
      } else {
        setSearchResult(result);
      }
    } catch (e) {
      setDialogError('Fehler bei der Spotify-Suche.');
    }
    setDialogLoading(false);
  };

  const handlePost = async () => {
    if (!searchResult) return;
    setDialogError('');
    setDialogSuccess('');
    const { spotify_id, title, artist, cover_url, preview_url } = searchResult;
    const posted_by = user?.username || 'Unbekannt';
    const { error: dbError } = await supabase
      .from('favorite_songs')
      .insert([{ spotify_id, title, artist, cover_url, posted_by, preview_url }]);
    if (dbError) {
      setDialogError('Fehler beim Speichern!');
    } else {
      setDialogSuccess('Song erfolgreich gepostet!');
      setSongs([{ spotify_id, title, artist, cover_url, posted_by, preview_url, created_at: new Date().toISOString() }, ...songs]);
      setSearchResult(null);
      setQuery('');
      setDialogOpen(false);
      setSuccess('Song erfolgreich gepostet!');
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 4, mb: 4, position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>Musik</Typography>
      <List>
        {songs.map(song => (
          <React.Fragment key={song.spotify_id + song.created_at}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar src={song.cover_url} alt={song.title} />
              </ListItemAvatar>
              <ListItemText
                primary={song.title + ' – ' + song.artist}
                secondary={
                  <>
                    {song.posted_by && <span>Vorgeschlagen von: {song.posted_by} · </span>}
                    {song.created_at && new Date(song.created_at).toLocaleString()}
                  </>
                }
              />
              {song.preview_url && (
                <Button
                  variant="contained"
                  color={previewOpen === song.spotify_id ? 'secondary' : 'primary'}
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => setPreviewOpen(previewOpen === song.spotify_id ? null : song.spotify_id)}
                >
                  {previewOpen === song.spotify_id ? 'Schließen' : 'Preview'}
                </Button>
              )}
              {song.spotify_id && (
                <Button
                  href={`https://open.spotify.com/track/${song.spotify_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  sx={{ ml: 2 }}
                >
                  Auf Spotify öffnen
                </Button>
              )}
            </ListItem>
            {previewOpen === song.spotify_id && song.preview_url && (
              <Box sx={{ pl: 10, pb: 2 }}>
                <audio controls autoPlay src={song.preview_url}>
                  Dein Browser unterstützt kein Audio.
                </audio>
              </Box>
            )}
          </React.Fragment>
        ))}
      </List>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setDialogOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Song posten</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Spotify-Link oder Songname"
              value={query}
              onChange={e => setQuery(e.target.value)}
              fullWidth
              disabled={dialogLoading}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handleSearch} disabled={dialogLoading || !query} sx={{ mb: 2 }}>
              Suchen
            </Button>
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            {dialogSuccess && <Alert severity="success" sx={{ mb: 2 }}>{dialogSuccess}</Alert>}
            {searchResult && (
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <CardMedia
                    component="img"
                    image={searchResult.cover_url}
                    alt={searchResult.title}
                    sx={{ width: 80, height: 80, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">{searchResult.title}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">{searchResult.artist}</Typography>
                    {searchResult.preview_url && (
                      <audio controls src={searchResult.preview_url} style={{ marginTop: 8 }}>
                        Dein Browser unterstützt kein Audio.
                      </audio>
                    )}
                    <Button variant="contained" color="secondary" sx={{ mt: 1 }} onClick={handlePost}>
                      Song posten
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 