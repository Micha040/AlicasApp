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
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MessageIcon from '@mui/icons-material/Message';
import { supabase } from '../supabaseClient';

export default function TimeCapsuleTab() {
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState({
    type: 'message',
    content: '',
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
      setError('Fehler beim Laden der Erinnerungen: ' + error.message);
    } else {
      setMemories(data);
    }
    setLoading(false);
  };

  const handleAddMemory = async () => {
    if (newMemory.content.trim()) {
      setLoading(true);
      const { data, error } = await supabase
        .from('memories')
        .insert([
          {
            type: newMemory.type,
            content: newMemory.content,
            date: newMemory.date
          }
        ])
        .select();
      if (error) {
        setSnackbar({
          open: true,
          message: 'Fehler beim Speichern: ' + error.message,
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      setMemories([data[0], ...memories]);
      setNewMemory({ type: 'message', content: '', date: new Date().toISOString().split('T')[0] });
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: 'Erinnerung erfolgreich gespeichert!',
        severity: 'success'
      });
      setLoading(false);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMemory({
          type,
          content: reader.result,
          date: new Date().toISOString().split('T')[0]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Zeitkapsel
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
                  {memory.type === 'message' && (
                    <Typography variant="body1">{memory.content}</Typography>
                  )}
                  {memory.type === 'photo' && (
                    <img 
                      src={memory.content} 
                      alt="Memory" 
                      style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                  )}
                  {memory.type === 'video' && (
                    <video 
                      controls 
                      style={{ maxWidth: '100%' }}
                      src={memory.content}
                    />
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
        <DialogTitle>Neue Erinnerung hinzufügen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Schreibe eine Nachricht für die Zukunft..."
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
                onChange={(e) => handleFileUpload(e, 'photo')}
              />
              <label htmlFor="photo-upload">
                <IconButton component="span" color="primary">
                  <AddPhotoAlternateIcon />
                </IconButton>
              </label>

              <input
                accept="video/*"
                style={{ display: 'none' }}
                id="video-upload"
                type="file"
                onChange={(e) => handleFileUpload(e, 'video')}
              />
              <label htmlFor="video-upload">
                <IconButton component="span" color="primary">
                  <VideoLibraryIcon />
                </IconButton>
              </label>
            </Box>

            {newMemory.type === 'photo' && newMemory.content && (
              <Box sx={{ mb: 2 }}>
                <img 
                  src={newMemory.content} 
                  alt="Vorschau" 
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} 
                />
              </Box>
            )}

            {newMemory.type === 'video' && newMemory.content && (
              <Box sx={{ mb: 2 }}>
                <video 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  src={newMemory.content}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleAddMemory} 
            variant="contained" 
            color="primary"
            startIcon={<MessageIcon />}
            disabled={loading || !newMemory.content.trim()}
          >
            Speichern
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