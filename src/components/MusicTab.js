import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Typography, TextField, Button, Card, CardContent, CardMedia, List, ListItem, ListItemText, ListItemAvatar, Avatar, Alert } from '@mui/material';

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
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    setError('');
    setSuccess('');
    setSearchResult(null);
    if (!query) return;
    setLoading(true);
    try {
      const token = await getSpotifyToken();
      const result = await searchSpotifyTrack(query, token);
      if (!result) {
        setError('Kein Song gefunden!');
      } else {
        setSearchResult(result);
      }
    } catch (e) {
      setError('Fehler bei der Spotify-Suche.');
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!searchResult) return;
    setError('');
    setSuccess('');
    const { spotify_id, title, artist, cover_url } = searchResult;
    const posted_by = user?.username || 'Unbekannt';
    const { error: dbError } = await supabase
      .from('favorite_songs')
      .insert([{ spotify_id, title, artist, cover_url, posted_by }]);
    if (dbError) {
      setError('Fehler beim Speichern!');
    } else {
      setSuccess('Song erfolgreich gepostet!');
      setSongs([{ spotify_id, title, artist, cover_url, posted_by, created_at: new Date().toISOString() }, ...songs]);
      setSearchResult(null);
      setQuery('');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" gutterBottom>Musik-Tab: Spotify-Songs vorschlagen</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Spotify-Link oder Songname"
          value={query}
          onChange={e => setQuery(e.target.value)}
          fullWidth
          disabled={loading}
        />
        <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading}>
          Suchen
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
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
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Alle geposteten Songs</Typography>
      <List>
        {songs.map(song => (
          <ListItem key={song.spotify_id + song.created_at} alignItems="flex-start">
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
        ))}
      </List>
    </Box>
  );
} 