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
  IconButton,
  Switch,
  Card,
  CardActionArea
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

export default function SharedListsTab({ user }) {
  const { t } = useTranslation();
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
  const [memberSettingsOpen, setMemberSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberInviteAllowed, setMemberInviteAllowed] = useState(false);

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

  // Realtime für Listeneinträge
  useEffect(() => {
    if (!selectedList) return;
    const channel = supabase.channel('shared-list-items-' + selectedList.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_list_items',
        filter: `list_id=eq.${selectedList.id}`
      }, payload => {
        // Neu laden, wenn sich etwas ändert
        supabase
          .from('shared_list_items')
          .select('*')
          .eq('list_id', selectedList.id)
          .order('created_at', { ascending: true })
          .then(({ data }) => setListItems(data || []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedList]);

  // Realtime für Mitglieder
  useEffect(() => {
    if (!selectedList) return;
    const channel = supabase.channel('shared-list-members-' + selectedList.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_list_members',
        filter: `list_id=eq.${selectedList.id}`
      }, payload => {
        fetchMembers();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedList]);

  // Realtime für Einladungen (nur für den aktuellen User)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('shared-list-invites-' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_list_members',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        supabase
          .from('shared_list_members')
          .select('*, shared_lists(name)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .then(({ data }) => setInvitations(data || []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
    // Einladung speichern, can_invite immer false
    await supabase.from('shared_list_members').insert({
      list_id: selectedList.id,
      user_id: userToInvite.id,
      status: 'pending',
      can_invite: false
    });
    setInviteSuccess('Einladung verschickt!');
    setInviteUsername('');
    await fetchMembers();
  };

  // Öffne Member-Settings-Dialog
  const handleOpenMemberSettings = (member) => {
    setSelectedMember(member);
    setMemberInviteAllowed(!!member.can_invite);
    setMemberSettingsOpen(true);
  };

  // Speichere Member-Settings
  const handleSaveMemberSettings = async () => {
    if (!selectedMember) return;
    await supabase
      .from('shared_list_members')
      .update({ can_invite: memberInviteAllowed })
      .eq('id', selectedMember.id);
    setMemberSettingsOpen(false);
    await fetchMembers();
  };

  // Entferne Mitglied
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    await supabase
      .from('shared_list_members')
      .delete()
      .eq('id', selectedMember.id);
    setMemberSettingsOpen(false);
    await fetchMembers();
  };

  // Ermittle, ob der aktuelle User einladen darf
  const isErsteller = selectedList?.creator_id === user.id;
  const myMembership = members.find(m => m.user_id === user.id);
  const canInvite = isErsteller || (myMembership && myMembership.can_invite);

  return (
    <Box sx={{ textAlign: 'center', mt: 0, mb: 4, px: 2, position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>{t('Listen')}</Typography>
      <Box>
        <Typography variant="h6" sx={{ textAlign: 'left', mb: 2 }}>{t('DeineListen')}</Typography>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>{t('NeueListeErstellen')}</DialogTitle>
          <DialogContent>
            <TextField
              label={t('NameDerListe')}
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>{t('Abbrechen')}</Button>
            <Button onClick={handleCreateList} variant="contained">{t('Erstellen')}</Button>
          </DialogActions>
        </Dialog>

        {/* Einladungen */}
        {invitations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">{t('Einladungen')}</Typography>
            <List>
              {invitations.map(invite => (
                <ListItem key={invite.id}>
                  <ListItemText primary={`${t('EinladungZu')}: ${invite.shared_lists.name}`} />
                  <Button
                    color="success"
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={async () => {
                      await supabase
                        .from('shared_list_members')
                        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                        .eq('id', invite.id);
                      // Einladungen und Listen neu laden
                      const { data: newInv } = await supabase
                        .from('shared_list_members')
                        .select('*, shared_lists(name)')
                        .eq('user_id', user.id)
                        .eq('status', 'pending');
                      setInvitations(newInv || []);
                      const { data: newLists } = await supabase.rpc('get_user_lists', { user_id: user.id });
                      setLists(newLists || []);
                    }}
                  >
                    {t('Annehmen')}
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      await supabase
                        .from('shared_list_members')
                        .update({ status: 'declined' })
                        .eq('id', invite.id);
                      // Einladungen neu laden
                      const { data: newInv } = await supabase
                        .from('shared_list_members')
                        .select('*, shared_lists(name)')
                        .eq('user_id', user.id)
                        .eq('status', 'pending');
                      setInvitations(newInv || []);
                    }}
                  >
                    {t('Ablehnen')}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Listenübersicht */}
        <List sx={{ p: 0 }}>
          {lists.map(list => (
            <Card key={list.id} sx={{ mb: 2, boxShadow: 1, borderRadius: 2, p: 0, bgcolor: '#fff' }}>
              <CardActionArea onClick={() => openListDetail(list)}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                  <Box sx={{ width: 36, height: 36, bgcolor: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, fontWeight: 600, fontSize: 18 }}>
                    {list.name?.[0]?.toUpperCase() || '?'}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{list.name}</Typography>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </List>

        {/* Listen-Detail-Dialog */}
        <Dialog open={!!selectedList} onClose={() => setSelectedList(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{t('Liste')}: {selectedList?.name}</span>
            <IconButton onClick={handleOpenSettings}>
              <SettingsIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <TextField
                label={t('NeuerPunkt')}
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                fullWidth
                onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
              />
              <Button onClick={handleAddItem} variant="contained" sx={{ mt: 1 }}>
                {t('Hinzufuegen')}
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
            <Button onClick={() => setSelectedList(null)}>{t('Schliessen')}</Button>
          </DialogActions>
        </Dialog>

        {/* Mitglieder-/Einladen-Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('MitgliederVerwalten')}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('Mitglieder')}:</Typography>
            <List>
              {members.map(m => (
                <ListItem key={m.id}
                  secondaryAction={
                    selectedList?.creator_id === user.id ? (
                      <IconButton onClick={() => handleOpenMemberSettings(m)}>
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={m.users?.username || m.user_id}
                    secondary={
                      m.user_id === selectedList?.creator_id
                        ? t('Ersteller')
                        : m.status === 'accepted' ? (m.can_invite ? t('MitgliedDarfEinladen') : t('Mitglied')) : m.status
                    }
                  />
                  <Chip
                    label={
                      m.user_id === selectedList?.creator_id
                        ? t('Ersteller')
                        : m.status === 'accepted' ? t('Mitglied') : m.status
                    }
                    color={m.user_id === selectedList?.creator_id ? 'info' : m.status === 'accepted' ? 'success' : 'warning'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </ListItem>
              ))}
            </List>
            {/* Nur anzeigen, wenn canInvite true ist */}
            {canInvite && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">{t('NeuesMitgliedEinladen')}</Typography>
                <TextField
                  label={t('Username')}
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  fullWidth
                  sx={{ mt: 1, mb: 1 }}
                />
                <Button onClick={handleInvite} variant="contained">{t('Einladen')}</Button>
                {inviteError && <Typography color="error" sx={{ mt: 1 }}>{inviteError === 'User nicht gefunden!' ? t('UserNichtGefunden') : inviteError === 'User ist bereits eingeladen oder Mitglied!' ? t('UserBereitsMitglied') : inviteError}</Typography>}
                {inviteSuccess && <Typography color="success.main" sx={{ mt: 1 }}>{inviteSuccess === 'Einladung verschickt!' ? t('EinladungVerschickt') : inviteSuccess}</Typography>}
              </Box>
            )}
            {/* Liste löschen nur für Ersteller */}
            {selectedList?.creator_id === user.id && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={async () => {
                    // Liste löschen
                    await supabase.from('shared_lists').delete().eq('id', selectedList.id);
                    setSettingsOpen(false);
                    setSelectedList(null);
                    // Listen neu laden
                    const { data: newLists } = await supabase.rpc('get_user_lists', { user_id: user.id });
                    setLists(newLists || []);
                  }}
                >
                  {t('ListeLoeschen')}
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>{t('Schliessen')}</Button>
          </DialogActions>
        </Dialog>

        {/* Member-Settings-Dialog */}
        <Dialog open={memberSettingsOpen} onClose={() => setMemberSettingsOpen(false)} maxWidth="xs">
          <DialogTitle>{t('MitgliedVerwalten')}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>{selectedMember?.users?.username || selectedMember?.user_id}</Typography>
            {selectedMember && selectedMember.user_id !== selectedList?.creator_id && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Switch
                  checked={memberInviteAllowed}
                  onChange={e => setMemberInviteAllowed(e.target.checked)}
                  color="primary"
                />
                <Typography sx={{ ml: 1 }}>{t('DarfMitgliederEinladen')}</Typography>
              </Box>
            )}
            {selectedMember && selectedMember.user_id !== selectedList?.creator_id && (
              <Button
                color="error"
                variant="outlined"
                onClick={handleRemoveMember}
                sx={{ mt: 2 }}
              >
                {t('MitgliedEntfernen')}
              </Button>
            )}
            {selectedMember && selectedMember.user_id === selectedList?.creator_id && (
              <Typography color="info.main" sx={{ mt: 2 }}>{t('DasIstDerErsteller')}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMemberSettingsOpen(false)}>{t('Abbrechen')}</Button>
            {selectedMember && selectedMember.user_id !== selectedList?.creator_id && (
              <Button onClick={handleSaveMemberSettings} variant="contained">{t('Speichern')}</Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
      <Tooltip title={t('NeueListeErstellen')}>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setOpenDialog(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
} 