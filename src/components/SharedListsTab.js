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
import SettingsIcon from '@mui/icons-material/Settings';

export default function SharedListsTab({ user }) {
  const [lists, setLists] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

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

  // Mitglieder laden
  const fetchMembers = async () => {
    if (!selectedList) return;
    const { data } = await supabase
      .from('shared_list_members')
      .select('*, users(username)')
      .eq('list_id', selectedList.id)
      .eq('status', 'accepted');
    setMembers(data || []);
  };

  // Öffne Einstellungen (Mitglieder)
  const handleOpenSettings = async () => {
    await fetchMembers();
    setSettingsOpen(true);
    setInviteUsername('');
    setInviteError('');
    setInviteSuccess('');
  };

  // User einladen
  const handleInvite = async () => {
    setInviteError('');
    setInviteSuccess('');
    if (!inviteUsername.trim()) return;
    // User suchen
    const { data: userToInvite } = await supabase
      .from('users')
      .select('id,username')
      .eq('username', inviteUsername)
      .single();
    if (!userToInvite) {
      setInviteError('User nicht gefunden!');
      return;
    }
    // Prüfen, ob schon eingeladen/Teilnehmer
    const { data: existing } = await supabase
      .from('shared_list_members')
      .select('*')
      .eq('list_id', selectedList.id)
      .eq('user_id', userToInvite.id)
      .maybeSingle();
    if (existing) {
      setInviteError('User ist bereits eingeladen oder Mitglied!');
      return;
    }
    // Einladung speichern
    await supabase.from('shared_list_members').insert({
      list_id: selectedList.id,
      user_id: userToInvite.id,
      status: 'pending'
    });
    setInviteSuccess('Einladung verschickt!');
    setInviteUsername('');
    await fetchMembers();
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Liste: {selectedList?.name}</span>
          <IconButton onClick={handleOpenSettings}>
            <SettingsIcon />
          </IconButton>
        </DialogTitle>
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

      {/* Mitglieder-/Einladen-Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mitglieder verwalten</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Mitglieder:</Typography>
          <List>
            {members.map(m => (
              <ListItem key={m.id}>
                <ListItemText primary={m.users?.username || m.user_id} />
                <Chip label={m.status === 'accepted' ? 'Mitglied' : m.status} color={m.status === 'accepted' ? 'success' : 'warning'} size="small" />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Neues Mitglied einladen</Typography>
            <TextField
              label="Username"
              value={inviteUsername}
              onChange={e => setInviteUsername(e.target.value)}
              fullWidth
              sx={{ mt: 1, mb: 1 }}
            />
            <Button onClick={handleInvite} variant="contained">Einladen</Button>
            {inviteError && <Typography color="error" sx={{ mt: 1 }}>{inviteError}</Typography>}
            {inviteSuccess && <Typography color="success.main" sx={{ mt: 1 }}>{inviteSuccess}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 