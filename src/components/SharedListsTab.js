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
  Chip,
  Checkbox,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function SharedListsTab({ user }) {
  const [lists, setLists] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [newItem, setNewItem] = useState('');

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

  // Listen-Detail: Lade Listeneinträge
  const openListDetail = async (list) => {
    setSelectedList(list);
    const { data } = await supabase
      .from('shared_list_items')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: true });
    setListItems(data || []);
  };

  // Hinzufügen eines neuen Listeneintrags
  const handleAddItem = async () => {
    if (!newItem.trim() || !selectedList) return;
    await supabase.from('shared_list_items').insert({
      list_id: selectedList.id,
      content: newItem,
      created_by: user.id
    });
    setNewItem('');
    // Neu laden
    const { data } = await supabase
      .from('shared_list_items')
      .select('*')
      .eq('list_id', selectedList.id)
      .order('created_at', { ascending: true });
    setListItems(data || []);
  };

  // Abhaken eines Eintrags
  const handleToggleChecked = async (item) => {
    await supabase.from('shared_list_items').update({
      checked: !item.checked,
      checked_by: !item.checked ? user.id : null,
      checked_at: !item.checked ? new Date().toISOString() : null
    }).eq('id', item.id);
    // Neu laden
    const { data } = await supabase
      .from('shared_list_items')
      .select('*')
      .eq('list_id', selectedList.id)
      .order('created_at', { ascending: true });
    setListItems(data || []);
  };

  // Löschen eines Eintrags
  const handleDeleteItem = async (item) => {
    await supabase.from('shared_list_items').delete().eq('id', item.id);
    // Neu laden
    const { data } = await supabase
      .from('shared_list_items')
      .select('*')
      .eq('list_id', selectedList.id)
      .order('created_at', { ascending: true });
    setListItems(data || []);
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
          <ListItem key={list.id} button onClick={() => openListDetail(list)}>
            <ListItemText primary={list.name} />
          </ListItem>
        ))}
      </List>

      {/* Listen-Detail-Dialog */}
      <Dialog open={!!selectedList} onClose={() => setSelectedList(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Liste: {selectedList?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Neuer Punkt"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              fullWidth
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
            />
            <Button onClick={handleAddItem} variant="contained" sx={{ mt: 1 }}>
              Hinzufügen
            </Button>
          </Box>
          <List>
            {listItems.map(item => (
              <ListItem key={item.id} secondaryAction={
                <IconButton edge="end" onClick={() => handleDeleteItem(item)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <Checkbox
                  checked={item.checked}
                  onChange={() => handleToggleChecked(item)}
                />
                <ListItemText
                  primary={item.content}
                  sx={{ textDecoration: item.checked ? 'line-through' : 'none' }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedList(null)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 