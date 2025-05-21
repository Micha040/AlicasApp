import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Alert, Divider, Paper, IconButton, useMediaQuery, CircularProgress, Avatar, Card, CardActionArea, ButtonGroup } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DoneIcon from '@mui/icons-material/Done';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const PAGE_SIZE = 20;

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
  const [userMap, setUserMap] = useState({});
  const [imageToSend, setImageToSend] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUsername, setDialogUsername] = useState('');
  const [dialogResult, setDialogResult] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [lastMarkedRead, setLastMarkedRead] = useState([]);

  // Lade alle Usernamen und Avatare für Mapping
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id,username');
      const { data: profiles } = await supabase.from('profiles').select('id,avatar_url');
      if (data) {
        const map = {};
        data.forEach(u => {
          map[u.id] = { username: u.username };
        });
        if (profiles) {
          profiles.forEach(p => {
            if (map[p.id]) map[p.id].avatar_url = p.avatar_url;
          });
        }
        setUserMap(map);
      }
    };
    fetchUsers();
  }, []);

  // Realtime für Chats (neue Einladungen, akzeptierte Chats)
  useEffect(() => {
    const channel = supabase.channel('chats-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user1_id=eq.${user.id}`
      }, () => fetchChats())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user2_id=eq.${user.id}`
      }, () => fetchChats())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime für offene Anfragen (pendingRequests)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('chats-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user2_id=eq.${user.id}`
      }, () => fetchRequests())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Funktion zum Laden des User-Mappings
  const fetchUserMap = async (chatsList, requestsList) => {
    // IDs aus Chats und Requests sammeln
    const ids = new Set();
    (chatsList || []).forEach(c => {
      ids.add(c.user1_id);
      ids.add(c.user2_id);
    });
    (requestsList || []).forEach(r => {
      ids.add(r.user1_id);
      ids.add(r.user2_id);
    });
    const idArr = Array.from(ids).filter(Boolean);
    if (idArr.length === 0) return;
    const { data: users } = await supabase.from('users').select('id,username');
    const { data: profiles } = await supabase.from('profiles').select('id,avatar_url');
    const map = {};
    users?.forEach(u => { map[u.id] = { username: u.username }; });
    profiles?.forEach(p => { if (map[p.id]) map[p.id].avatar_url = p.avatar_url; });
    setUserMap(map);
  };

  // Lade alle Chats des Users
  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setChats(data || []);
    // Nach dem Laden UserMap aktualisieren
    fetchUserMap(data || [], pendingRequests);
  };
  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user]);

  // Lade offene Anfragen
  const fetchRequests = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user2_id', user.id)
      .eq('status', 'pending');
    setPendingRequests(data || []);
    // Nach dem Laden UserMap aktualisieren
    fetchUserMap(chats, data || []);
  };
  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  // Nachrichten laden (nur die letzten PAGE_SIZE)
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    setHasMore(true);
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (data) {
        setMessages(data.reverse());
        setOldestMessageId(data.length > 0 ? data[data.length - 1].id : null);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoadingMessages(false);
    };
    fetchMessages();
  }, [selectedChat]);

  // Infinite Scroll: Ältere Nachrichten laden
  const loadMoreMessages = async () => {
    if (!selectedChat || !hasMore || loadingMore || !oldestMessageId) return;
    setLoadingMore(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', selectedChat.id)
      .lt('id', oldestMessageId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (data && data.length > 0) {
      setMessages(prev => [...data.reverse(), ...prev]);
      setOldestMessageId(data[data.length - 1].id);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  // Scroll-Handler für Infinite Scroll
  const handleScroll = (e) => {
    if (e.target.scrollTop < 50 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  // Realtime-Subscription für neue Nachrichten
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${selectedChat.id}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setMessages(msgs => [...msgs, payload.new]);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Auto-Scroll zu neuen Nachrichten (nur wenn neue unten angehängt werden)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
    }
  };

  // Anfrage annehmen/ablehnen
  const handleRequestAction = async (chatId, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    await supabase.from('chats').update({ status }).eq('id', chatId);
    // Nach Annahme/Ablehnung sofort neu laden
    fetchRequests();
    fetchChats();
  };

  // Nachricht senden (Text oder Bild)
  const handleSend = async () => {
    if ((!newMessage.trim() && !imageToSend) || !selectedChat) return;
    let image_url = null;
    if (imageToSend) {
      image_url = imageToSend;
    }
    const partnerId = Number(selectedChat.user1_id === user.id ? selectedChat.user2_id : selectedChat.user1_id);
    await supabase.from('messages').insert([
      {
        chat_id: selectedChat.id,
        sender_id: user.id,
        receiver_id: partnerId,
        content: newMessage,
        image_url
      }
    ]);
    setNewMessage('');
    setImageToSend(null);
  };

  // Bild auswählen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToSend(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hilfsfunktion: Chatpartner-Objekt
  const getChatPartnerObj = (chat) => {
    const partnerId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
    return {
      id: partnerId,
      username: userMap[partnerId]?.username || `User #${partnerId}`,
      avatar_url: userMap[partnerId]?.avatar_url || undefined
    };
  };

  // Bild-Styles für Nachrichten
  const chatImageStyle = {
    maxWidth: '100%',
    maxHeight: 180,
    borderRadius: 8,
    marginBottom: 4,
    objectFit: 'contain',
    display: 'block',
  };

  // Dialog-Logik für neuen Chat
  const handleDialogSearch = async () => {
    setDialogError('');
    setDialogSuccess('');
    setDialogResult(null);
    if (!dialogUsername) return;
    if (dialogUsername === user.username) {
      setDialogError('Du kannst dich nicht selbst suchen!');
      return;
    }
    setDialogLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', dialogUsername)
      .single();
    if (!data) {
      setDialogError('Kein User gefunden!');
    } else {
      setDialogResult(data);
    }
    setDialogLoading(false);
  };

  const handleDialogRequest = async () => {
    if (!dialogResult) return;
    setDialogError('');
    setDialogSuccess('');
    // Prüfe, ob bereits ein Chat existiert
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${dialogResult.id}),and(user1_id.eq.${dialogResult.id},user2_id.eq.${user.id})`)
      .maybeSingle();
    if (existing) {
      setDialogError('Es existiert bereits ein Chat oder eine Anfrage!');
      return;
    }
    // Anfrage senden
    const { error: dbError } = await supabase
      .from('chats')
      .insert([{ user1_id: user.id, user2_id: dialogResult.id, status: 'pending' }]);
    if (dbError) {
      setDialogError('Fehler beim Senden der Anfrage!');
    } else {
      setDialogSuccess('Anfrage gesendet!');
      setDialogOpen(false);
      setSuccess('Anfrage gesendet!');
      setDialogUsername('');
      setDialogResult(null);
    }
  };

  // Nachrichten beim Öffnen des Chats als gelesen markieren
  useEffect(() => {
    if (!selectedChat || !user) return;
    const unread = messages.filter(
      m => m.receiver_id === user.id && !m.is_read
    ).map(m => m.id);
    // Nur wenn es neue ungelesene Nachrichten gibt
    if (unread.length > 0 && unread.join(',') !== lastMarkedRead.join(',')) {
      setLastMarkedRead(unread);
      supabase.from('messages').update({ is_read: true }).in('id', unread);
    }
    // eslint-disable-next-line
  }, [selectedChat, messages, user]);

  // Realtime-Subscription für Änderungen an Nachrichten (is_read)
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase.channel('messages-realtime-read')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${selectedChat.id}`
      }, payload => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setMessages(msgs => {
            // Prüfe, ob die Nachricht schon existiert
            if (msgs.some(m => m.id === payload.new.id)) {
              // Nachricht ersetzen (z.B. falls is_read geändert wurde)
              return msgs.map(m => m.id === payload.new.id ? payload.new : m);
            } else {
              // Nur hinzufügen, wenn sie noch nicht existiert
              return [...msgs, payload.new];
            }
          });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Hilfsfunktion: Gibt true zurück, wenn es im Chat ungelesene Nachrichten für den aktuellen User gibt
  const hasUnread = (chat) => {
    return messages.some(
      m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read
    );
  };

  // Mobile: Zeige nur Chat-Liste ODER Chat
  if (isMobile) {
    if (!selectedChat) {
      return (
        <Box sx={{ p: 2, position: 'relative', minHeight: '100vh', pb: 8 }}>
          <Typography variant="h5" gutterBottom>Chats</Typography>
          {/* Offene Anfragen */}
          {pendingRequests.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">Offene Chat-Anfragen</Typography>
              <List>
                {pendingRequests.map(req => {
                  const partner = getChatPartnerObj(req);
                  return (
                    <ListItem key={req.id} sx={{ alignItems: 'flex-start', display: 'flex' }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography>
                          Von: <b>{partner.username}</b>
                        </Typography>
                        <ButtonGroup variant="outlined" sx={{ mt: 0.5 }}>
                          <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>Annehmen</Button>
                          <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>Ablehnen</Button>
                        </ButtonGroup>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          <Typography variant="h6">Deine Chats</Typography>
          <List>
            {chats.filter(c => c.status === 'accepted').map(chat => {
              const partner = getChatPartnerObj(chat);
              const unread = messages.some(m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read);
              return (
                <Card key={chat.id} sx={{ mb: 2, boxShadow: 2, borderRadius: 2, bgcolor: selectedChat?.id === chat.id ? '#ffe4f3' : '#fff', position: 'relative' }}>
                  <CardActionArea onClick={() => setSelectedChat(chat)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
                      {unread && <FiberManualRecordIcon sx={{ color: '#ff4081', fontSize: 16, ml: 1 }} />}
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </List>
          <Tooltip title="Neuen Chat starten">
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => setDialogOpen(true)}
              sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Neuen Chat starten</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Username suchen"
                  value={dialogUsername}
                  onChange={e => setDialogUsername(e.target.value)}
                  fullWidth
                  disabled={dialogLoading}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={handleDialogSearch} disabled={dialogLoading || !dialogUsername} sx={{ mb: 2 }}>
                  Suchen
                </Button>
                {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
                {dialogSuccess && <Alert severity="success" sx={{ mb: 2 }}>{dialogSuccess}</Alert>}
                {dialogResult && (
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Avatar src={dialogResult.avatar_url} alt={dialogResult.username} sx={{ width: 32, height: 32, mr: 1 }}>
                      {(!dialogResult.avatar_url && dialogResult.username) ? dialogResult.username[0].toUpperCase() : ''}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 600, mr: 1 }}>{dialogResult.username}</Typography>
                    <Button variant="contained" color="secondary" onClick={handleDialogRequest}>
                      Chat-Anfrage senden
                    </Button>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={!!success}
            autoHideDuration={4000}
            onClose={() => setSuccess('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setSuccess('')} severity="success">
              {success}
            </Alert>
          </Snackbar>
        </Box>
      );
    } else {
      // Mobile: Chat-Vollansicht mit Zurück-Button
      const partner = getChatPartnerObj(selectedChat);
      return (
        <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={() => setSelectedChat(null)}><ArrowBackIcon /></IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>Chat mit {partner.username}</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {loadingMessages ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{ flex: 1, overflowY: 'auto', mb: 2, bgcolor: '#fafafa', borderRadius: 1, p: 1 }}
                ref={messagesListRef}
                onScroll={handleScroll}
              >
                <List>
                  {loadingMore && (
                    <ListItem sx={{ justifyContent: 'center' }}>
                      <CircularProgress size={20} />
                    </ListItem>
                  )}
                  {messages.map(msg => (
                    <ListItem key={msg.id} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                      <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#eee', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%', position: 'relative' }}>
                        {msg.image_url && <img src={msg.image_url} alt="Bild" style={chatImageStyle} />}
                        {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.7, mr: 1 }}>{msg.sender_id === user.id ? 'Du' : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
                          {msg.sender_id === user.id && (
                            msg.is_read ? (
                              <VisibilityIcon fontSize="small" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.7)' }} />
                            ) : (
                              <DoneIcon fontSize="small" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.7)' }} />
                            )
                          )}
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton component="label">
                  <ImageIcon />
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </IconButton>
                <TextField
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  fullWidth
                  placeholder="Nachricht schreiben..."
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                />
                <Button onClick={handleSend} variant="contained">Senden</Button>
              </Box>
              {imageToSend && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <img src={imageToSend} alt="Vorschau" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                  <Button size="small" onClick={() => setImageToSend(null)}>Entfernen</Button>
                </Box>
              )}
            </>
          )}
        </Box>
      );
    }
  }

  // Desktop: Chat-Liste links, Chat rechts
  return (
    <Box sx={{ display: 'flex', height: '70vh', maxWidth: 1000, mx: 'auto', mt: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 2, position: 'relative', minHeight: '100vh', pb: 8 }}>
      {/* Chat-Liste */}
      <Box sx={{ width: 300, borderRight: '1px solid #eee', p: 2, overflowY: 'auto' }}>
        <Typography variant="h5" gutterBottom>Chats</Typography>
        {/* Offene Anfragen */}
        {pendingRequests.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Offene Chat-Anfragen</Typography>
            <List>
              {pendingRequests.map(req => {
                const partner = getChatPartnerObj(req);
                return (
                  <ListItem key={req.id} sx={{ alignItems: 'flex-start', display: 'flex' }}>
                    <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography>
                        Von: <b>{partner.username}</b>
                      </Typography>
                      <ButtonGroup variant="outlined" sx={{ mt: 0.5 }}>
                        <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>Annehmen</Button>
                        <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>Ablehnen</Button>
                      </ButtonGroup>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
        <Typography variant="h6">Deine Chats</Typography>
        <List>
          {chats.filter(c => c.status === 'accepted').map(chat => {
            const partner = getChatPartnerObj(chat);
            const unread = messages.some(m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read);
            return (
              <Card key={chat.id} sx={{ mb: 2, boxShadow: 2, borderRadius: 2, bgcolor: selectedChat?.id === chat.id ? '#ffe4f3' : '#fff', position: 'relative' }}>
                <CardActionArea onClick={() => setSelectedChat(chat)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
                    {unread && <FiberManualRecordIcon sx={{ color: '#ff4081', fontSize: 16, ml: 1 }} />}
                  </Box>
                </CardActionArea>
              </Card>
            );
          })}
        </List>
      </Box>
      {/* Chat-Fenster */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, minWidth: 0 }}>
        {selectedChat ? (
          loadingMessages ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Chat mit {getChatPartnerObj(selectedChat).username}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{ flex: 1, overflowY: 'auto', mb: 2, bgcolor: '#fafafa', borderRadius: 1, p: 1 }}
                ref={messagesListRef}
                onScroll={handleScroll}
              >
                <List>
                  {loadingMore && (
                    <ListItem sx={{ justifyContent: 'center' }}>
                      <CircularProgress size={20} />
                    </ListItem>
                  )}
                  {messages.map(msg => (
                    <ListItem key={msg.id} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                      <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#eee', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%', position: 'relative' }}>
                        {msg.image_url && <img src={msg.image_url} alt="Bild" style={chatImageStyle} />}
                        {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.7, mr: 1 }}>{msg.sender_id === user.id ? 'Du' : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
                          {msg.sender_id === user.id && (
                            msg.is_read ? (
                              <VisibilityIcon fontSize="small" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.7)' }} />
                            ) : (
                              <DoneIcon fontSize="small" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.7)' }} />
                            )
                          )}
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton component="label">
                  <ImageIcon />
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </IconButton>
                <TextField
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  fullWidth
                  placeholder="Nachricht schreiben..."
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                />
                <Button onClick={handleSend} variant="contained">Senden</Button>
              </Box>
              {imageToSend && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <img src={imageToSend} alt="Vorschau" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                  <Button size="small" onClick={() => setImageToSend(null)}>Entfernen</Button>
                </Box>
              )}
            </>
          )
        ) : (
          <Box sx={{ textAlign: 'center', color: '#aaa', mt: 10 }}>
            <Typography>Wähle einen Chat aus oder starte einen neuen!</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
} 