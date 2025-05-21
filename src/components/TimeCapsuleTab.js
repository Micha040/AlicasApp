import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Snackbar,
  Alert,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

export default function TimeCapsuleTab() {
  const { t } = useTranslation();
  // User aus localStorage holen
  const user = React.useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState({
    content: '',
    image_url: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(t('FehlerLaden') + ': ' + error.message);
    } else {
      setMemories(data);
    }
    setLoading(false);
  };

  const handleAddMemory = async () => {
    if (!newMemory.content.trim() && !newMemory.image_url) {
      setSnackbar({ open: true, message: t('BitteTextOderBild'), severity: 'error' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          content: newMemory.content,
          image_url: newMemory.image_url,
          date: newMemory.date,
          posted_by: user?.username || t('Unbekannt')
        }
      ])
      .select();
    if (error) {
      setSnackbar({
        open: true,
        message: t('FehlerSpeichern') + ': ' + error.message,
        severity: 'error'
      });
      setLoading(false);
      return;
    }
    setMemories([data[0], ...memories]);
    setNewMemory({ content: '', image_url: '', date: new Date().toISOString().split('T')[0] });
    setOpenDialog(false);
    setSnackbar({
      open: true,
      message: t('ErinnerungErfolg'),
      severity: 'success'
    });
    setLoading(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMemory((prev) => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        {t('Zeitkapsel')}
      </Typography>

      <Grid container spacing={3}>
        {memories.map((memory) => (
          <Grid item xs={12} key={memory.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                      {memory.posted_by ? memory.posted_by[0]?.toUpperCase() : '?'}
                    </Avatar>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('GepostetVon')}: {memory.posted_by || t('Unbekannt')}
                    </Typography>
                  </Box>
                  {memory.content && (
                    <Typography variant="body1" sx={{ mb: memory.image_url ? 2 : 0 }}>{memory.content}</Typography>
                  )}
                  {memory.image_url && (
                    <Box sx={{ mb: 2 }}>
                      <img 
                        src={memory.image_url} 
                        alt={t('MemoryBildAlt')} 
                        style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} 
                      />
                    </Box>
                  )}
                  <Typography variant="caption" color="textSecondary">
                    {new Date(memory.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setOpenDialog(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        <AddIcon />
      </Fab>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('NeueErinnerung')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder={t('NachrichtFuerZukunft')}
              value={newMemory.content}
              onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="photo-upload">
                <IconButton component="span" color="primary">
                  <AddPhotoAlternateIcon />
                </IconButton>
              </label>
            </Box>
            {newMemory.image_url && (
              <Box sx={{ mb: 2 }}>
                <img 
                  src={newMemory.image_url} 
                  alt={t('VorschauBildAlt')} 
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('Abbrechen')}</Button>
          <Button 
            onClick={handleAddMemory} 
            variant="contained" 
            color="primary"
            disabled={loading || (!newMemory.content.trim() && !newMemory.image_url)}
          >
            {t('Speichern')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 