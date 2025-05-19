import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';

export default function SharedListsTab({ user }) {
  const [lists, setLists] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Lade Listen, an denen der User beteiligt ist
  useEffect(() => {
    if (!user) return;
    const fetchLists = async () => {
      const { data } = await supabase.rpc('get_user_lists', { user_id: user.id });
      setLists(data || []);
    };
    fetchLists();
  }, [user]);

  // Lade Einladungen
  useEffect(() => {
    if (!user) return;
    const fetchInvites = async () => {
      const { data } = await supabase
        .from('shared_list_members')
        .select('*, shared_lists(name)')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      setInvitations(data || []);
    };
    fetchInvites();
  }, [user]);

  // Neue Liste erstellen
  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await supabase.from('shared_lists').insert({ name: newListName, creator_id: user.id });
    setOpenDialog(false);
    setNewListName('');
    // Listen neu laden
    const { data } = await supabase.rpc('get_user_lists', { user_id: user.id });
    setLists(data || []);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Gemeinsame Listen</Typography>
      <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
        Neue Liste erstellen
      </Button>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Neue Liste erstellen</DialogTitle>
        <DialogContent>
          <TextField
            label="Name der Liste"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCreateList} variant="contained">Erstellen</Button>
        </DialogActions>
      </Dialog>

      {/* Einladungen */}
      {invitations.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Einladungen</Typography>
          <List>
            {invitations.map(invite => (
              <ListItem key={invite.id}>
                <ListItemText primary={`Einladung zu: ${invite.shared_lists.name}`} />
                <Chip label="Ausstehend" color="warning" />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Listenübersicht */}
      <Typography variant="h6">Deine Listen</Typography>
      <List>
        {lists.map(list => (
          <ListItem key={list.id} button>
            <ListItemText primary={list.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 