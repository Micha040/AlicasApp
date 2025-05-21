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
  Snackbar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Tooltip from '@mui/material/Tooltip';

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

// Spotify SVG Icon
const SpotifyIcon = (props) => (
  <svg
    width={28}
    height={28}
    viewBox="0 0 168 168"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="84" cy="84" r="84" fill="#1ED760" />
    <path
      d="M124.1 115.4c-2-3.3-5.9-4.3-9.1-2.3-24.9 15.2-56.4 18.6-93.5 10.1-3.7-.8-7.4 1.5-8.2 5.2-.8 3.7 1.5 7.4 5.2 8.2 40.5 8.9 75.1 5.1 102.2-11.3 3.2-2 4.2-6.1 2.3-9.9zm13.2-25.7c-2.5-4-7.7-5.2-11.7-2.7-28.5 17.5-71.9 22.6-105.6 12.2-4.5-1.3-9.2 1.2-10.5 5.7-1.3 4.5 1.2 9.2 5.7 10.5 37.7 11.2 85.2 5.7 117.2-13.2 4-2.4 5.2-7.7 2.7-11.7zm-1.2-27.2c-32.5-9.6-86.1-10.5-117.2 0-5 1.6-7.7 7-6.1 12 1.6 5 7 7.7 12 6.1 27.7-8.7 77.2-7.9 105.6 0 5 .9 10.1-2.1 11-7.1.9-5-2.1-10.1-7.1-11z"
      fill="#fff"
    />
  </svg>
);

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
  const [avatars, setAvatars] = useState({});

  useEffect(() => {
    // Lade alle geposteten Songs
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('favorite_songs')
        .select('*')
        .order('created_at', { ascending: false });
      setSongs(data || []);
      // Lade Avatare für alle Poster
      const usernames = Array.from(new Set((data || []).map(s => s.posted_by).filter(Boolean)));
      if (usernames.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .in('username', usernames);
        const avatarMap = {};
        profiles?.forEach(p => { avatarMap[p.username] = p.avatar_url; });
        setAvatars(avatarMap);
      }
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
    <Box sx={{ textAlign: 'center', mt: 0, mb: 4, position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>Musik</Typography>
      <List>
        {songs.map(song => (
          <ListItem alignItems="flex-start" sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#fff', p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, pb: 1 }}>
                <Avatar src={song.cover_url} alt={song.title} sx={{ width: 56, height: 56, mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {song.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {song.artist}
                  </Typography>
                </Box>
                {song.spotify_id && (
                  <Tooltip title="Auf Spotify öffnen">
                    <IconButton
                      href={`https://open.spotify.com/track/${song.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ ml: 2, alignSelf: 'flex-start', borderRadius: '50%', p: 0.5 }}
                    >
                      <img src="/spotify_logo.svg.webp" alt="Spotify" style={{ width: 28, height: 28, display: 'block' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {song.preview_url && previewOpen === song.spotify_id && (
                <Box sx={{ pl: 10, pb: 2 }}>
                  <audio controls autoPlay src={song.preview_url}>
                    Dein Browser unterstützt kein Audio.
                  </audio>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1, pt: 1, mt: 'auto' }}>
                <Avatar
                  src={avatars[song.posted_by]}
                  alt={song.posted_by}
                  sx={{ width: 28, height: 28, mr: 1 }}
                >
                  {(!avatars[song.posted_by] && song.posted_by) ? song.posted_by[0].toUpperCase() : ''}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  {song.posted_by || 'Unbekannt'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {song.created_at && new Date(song.created_at).toLocaleString()}
                </Typography>
                {song.preview_url && (
                  <Button
                    variant="contained"
                    color={previewOpen === song.spotify_id ? 'secondary' : 'primary'}
                    size="small"
                    sx={{ ml: 'auto', mr: 2 }}
                    onClick={() => setPreviewOpen(previewOpen === song.spotify_id ? null : song.spotify_id)}
                  >
                    {previewOpen === song.spotify_id ? 'Schließen' : 'Preview'}
                  </Button>
                )}
              </Box>
            </Box>
          </ListItem>
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