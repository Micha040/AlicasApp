import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Avatar, IconButton, CircularProgress
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { supabase } from '../supabaseClient';

export default function RecipeCommentsDialog({ open, onClose, recipeId, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) fetchComments();
    // eslint-disable-next-line
  }, [open]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipe_comments')
      .select('*, user:user_id(username, avatar_url)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: true });
    if (!error) setComments(data);
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && !image) return;
    setUploading(true);
    const { error } = await supabase
      .from('recipe_comments')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        comment: newComment,
        image_url: image || null
      });
    setUploading(false);
    if (!error) {
      setNewComment('');
      setImage(null);
      fetchComments();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Kommentare</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ textAlign: 'center', my: 4 }}><CircularProgress /></Box>
        ) : comments.length === 0 ? (
          <Typography color="text.secondary">Noch keine Kommentare.</Typography>
        ) : (
          comments.map((c) => (
            <Box key={c.id} sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar src={c.user?.avatar_url} alt={c.user?.username} />
              <Box>
                <Typography variant="subtitle2">{c.user?.username || 'Unbekannt'}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{c.comment}</Typography>
                {c.image_url && (
                  <img src={c.image_url} alt="Kommentarbild" style={{ maxWidth: 200, borderRadius: 8 }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {new Date(c.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2 }}>
        <TextField
          label="Kommentar schreiben..."
          fullWidth
          multiline
          minRows={2}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="comment-image-upload"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="comment-image-upload">
            <IconButton component="span" color="primary">
              <AddPhotoAlternateIcon />
            </IconButton>
          </label>
          {image && <img src={image} alt="Vorschau" style={{ maxWidth: 60, borderRadius: 4 }} />}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddComment}
            disabled={uploading || (!newComment.trim() && !image)}
          >
            {uploading ? 'Speichern...' : 'Kommentieren'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
} 