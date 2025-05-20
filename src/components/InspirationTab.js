import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Card, CardContent, Typography, CircularProgress, Paper, Divider } from '@mui/material';

const HARVARD_API_KEY = process.env.REACT_APP_HARVARD_API_KEY;

export default function InspirationTab() {
  const [loading, setLoading] = useState(true);
  const [inspiration, setInspiration] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInspiration = async () => {
      setLoading(true);
      setError('');
      const today = new Date().toISOString().split('T')[0];
      // 1. Prüfe, ob es schon einen Eintrag für heute gibt
      const { data: existing, error: dbError } = await supabase
        .from('daily_inspiration')
        .select('*')
        .eq('date', today)
        .single();
      if (existing) {
        setInspiration(existing);
        setLoading(false);
        return;
      }
      // 2. Hole die Daten von den APIs
      try {
        // Kunstwerk
        const artRes = await fetch(`https://api.harvardartmuseums.org/object?size=1&sort=random&apikey=${HARVARD_API_KEY}&hasimage=1`);
        const artJson = await artRes.json();
        const artwork = artJson.records && artJson.records[0];
        // Zitat
        const quoteRes = await fetch('/api/zenquote');
        const quoteJson = await quoteRes.json();
        const quote = { q: quoteJson[0].q, a: quoteJson[0].a };
        // Fun Fact
        const factRes = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/today');
        const factJson = await factRes.json();
        // 3. In Supabase speichern
        const { data: saved, error: saveError } = await supabase
          .from('daily_inspiration')
          .insert([
            {
              date: today,
              artwork_title: artwork?.title || '',
              artwork_image: artwork?.primaryimageurl || '',
              artwork_artist: artwork?.people?.[0]?.name || '',
              quote: quote?.q || '',
              quote_author: quote?.a || '',
              fun_fact: factJson?.text || ''
            }
          ])
          .select()
          .single();
        console.log('Insert result:', saved, saveError);
        setInspiration(saved);
      } catch (e) {
        setError('Fehler beim Laden der Inspiration: ' + e.message);
      }
      setLoading(false);
    };
    fetchInspiration();
  }, []);

  if (loading) return <Box sx={{ textAlign: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!inspiration) return null;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          🎨 Kunstwerk des Tages
        </Typography>
        {inspiration.artwork_image && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src={inspiration.artwork_image} alt={inspiration.artwork_title} style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 320 }} />
          </Box>
        )}
        <Typography variant="h6" align="center">{inspiration.artwork_title}</Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 1 }}>
          {inspiration.artwork_artist}
        </Typography>
      </Paper>
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#f9fbe7' }}>
        <Typography variant="h5" align="center" gutterBottom>
          💡 Motivation des Tages
        </Typography>
        <Typography variant="h6" align="center" sx={{ fontStyle: 'italic' }}>
          "{inspiration.quote}"
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          – {inspiration.quote_author}
        </Typography>
      </Paper>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: '#e3f2fd' }}>
        <Typography variant="h5" align="center" gutterBottom>
          🤓 Fun Fact des Tages
        </Typography>
        <Typography variant="body1" align="center">
          {inspiration.fun_fact}
        </Typography>
      </Paper>
    </Box>
  );
} 