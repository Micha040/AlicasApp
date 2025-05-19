import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';

export default function ChatTab({ user }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [refresh, setRefresh] = useState(0);

  // Lade alle Chats des Users
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setChats(data || []);
    };
    fetchChats();
  }, [user, refresh]);

  // Lade offene Anfragen
  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user2_id', user.id)
        .eq('status', 'pending');
      setPendingRequests(data || []);
    };
    fetchRequests();
  }, [user, refresh]);

  // Lade Nachrichten für ausgewählten Chat
  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
  }, [selectedChat, refresh]);

  // Suche nach Username
  const handleSearch = async () => {
    setError('');
    setSuccess('');
    setSearchResult(null);
    if (!searchUsername) return;
    if (searchUsername === user.username) {
      setError('Du kannst dich nicht selbst suchen!');
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', searchUsername)
      .single();
    if (!data) {
      setError('Kein User gefunden!');
    } else {
      setSearchResult(data);
    }
  };

  // Anfrage schicken
  const handleRequest = async () => {
    if (!searchResult) return;
    // Prüfe, ob schon ein Chat existiert
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${searchResult.id}),and(user1_id.eq.${searchResult.id},user2_id.eq.${user.id})`)
      .maybeSingle();
    if (existing) {
      setError('Es existiert bereits ein Chat oder eine Anfrage!');
      return;
    }
    const { error: dbError } = await supabase
      .from('chats')
      .insert([{ user1_id: user.id, user2_id: searchResult.id, status: 'pending' }]);
    if (dbError) {
      setError('Fehler beim Senden der Anfrage!');
    } else {
      setSuccess('Anfrage gesendet!');
      setSearchResult(null);
      setSearchUsername('');
      setRefresh(r => r + 1);
    }
  };

  // Anfrage annehmen/ablehnen
  const handleRequestAction = async (chatId, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    await supabase.from('chats').update({ status }).eq('id', chatId);
    setRefresh(r => r + 1);
  };

  // Nachricht senden
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    await supabase.from('messages').insert([
      { chat_id: selectedChat.id, sender_id: user.id, content: newMessage }
    ]);
    setNewMessage('');
    setRefresh(r => r + 1);
  };

  // Hilfsfunktion: Chatpartner anzeigen
  const getChatPartner = (chat) => {
    if (chat.user1_id === user.id) return chat.user2_id;
    return chat.user1_id;
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" gutterBottom>Chats</Typography>
      {/* Chat-Suche und Anfrage */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Neuen Chat starten</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <TextField
            label="Username suchen"
            value={searchUsername}
            onChange={e => setSearchUsername(e.target.value)}
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={handleSearch}>
            Suchen
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}
        {searchResult && (
          <Box sx={{ mb: 1 }}>
            <Typography>Gefunden: {searchResult.username} ({searchResult.email})</Typography>
            <Button variant="contained" color="secondary" onClick={handleRequest}>
              Chat-Anfrage senden
            </Button>
          </Box>
        )}
      </Box>
      {/* Offene Anfragen */}
      {pendingRequests.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Offene Chat-Anfragen</Typography>
          <List>
            {pendingRequests.map(req => (
              <ListItem key={req.id}>
                <ListItemText primary={`Von: User #${req.user1_id}`} />
                <Button color="primary" onClick={() => handleRequestAction(req.id, 'accept')}>Annehmen</Button>
                <Button color="secondary" onClick={() => handleRequestAction(req.id, 'declined')}>Ablehnen</Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      {/* Chat-Liste */}
      <Typography variant="h6">Deine Chats</Typography>
      <List>
        {chats.filter(c => c.status === 'accepted').map(chat => (
          <ListItem button key={chat.id} selected={selectedChat?.id === chat.id} onClick={() => setSelectedChat(chat)}>
            <ListItemText primary={`Chat mit User #${getChatPartner(chat)}`} />
          </ListItem>
        ))}
      </List>
      {/* Chat-Fenster */}
      <Dialog open={!!selectedChat} onClose={() => setSelectedChat(null)} fullWidth maxWidth="sm">
        <DialogTitle>Chat</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          <List>
            {messages.map(msg => (
              <ListItem key={msg.id}>
                <ListItemText
                  primary={msg.content}
                  secondary={msg.sender_id === user.id ? 'Du' : `User #${msg.sender_id}`}
                  sx={{ textAlign: msg.sender_id === user.id ? 'right' : 'left' }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <TextField
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            fullWidth
            placeholder="Nachricht schreiben..."
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />
          <Button onClick={handleSend} variant="contained">Senden</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 