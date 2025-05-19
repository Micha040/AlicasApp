import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Alert, Divider, Paper, IconButton, useMediaQuery, CircularProgress, Avatar, Card, CardActionArea, ButtonGroup } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';

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

  // Lade alle Chats des Users
  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setChats(data || []);
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
      // Bild als Base64 in Supabase speichern (alternativ: Storage nutzen)
      image_url = imageToSend;
    }
    await supabase.from('messages').insert([
      { chat_id: selectedChat.id, sender_id: user.id, content: newMessage, image_url }
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

  // Mobile: Zeige nur Chat-Liste ODER Chat
  if (isMobile) {
    if (!selectedChat) {
      return (
        <Box sx={{ p: 2 }}>
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
                {pendingRequests.map(req => {
                  const partner = getChatPartnerObj(req);
                  return (
                    <ListItem key={req.id} sx={{ alignItems: 'center', display: 'flex' }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap>
                          Von: <b>{partner.username}</b>
                        </Typography>
                      </Box>
                      <ButtonGroup variant="outlined" sx={{ ml: 1 }}>
                        <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>Annehmen</Button>
                        <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>Ablehnen</Button>
                      </ButtonGroup>
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
              return (
                <Card key={chat.id} sx={{ mb: 2, boxShadow: 2, borderRadius: 2, bgcolor: selectedChat?.id === chat.id ? '#ffe4f3' : '#fff' }}>
                  <CardActionArea onClick={() => setSelectedChat(chat)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </List>
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
                      <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#eee', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%' }}>
                        {msg.image_url && <img src={msg.image_url} alt="Bild" style={chatImageStyle} />}
                        {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>{msg.sender_id === user.id ? 'Du' : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
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
    <Box sx={{ display: 'flex', height: '70vh', maxWidth: 1000, mx: 'auto', mt: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 2 }}>
      {/* Chat-Liste */}
      <Box sx={{ width: 300, borderRight: '1px solid #eee', p: 2, overflowY: 'auto' }}>
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
              {pendingRequests.map(req => {
                const partner = getChatPartnerObj(req);
                return (
                  <ListItem key={req.id} sx={{ alignItems: 'center', display: 'flex' }}>
                    <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap>
                        Von: <b>{partner.username}</b>
                      </Typography>
                    </Box>
                    <ButtonGroup variant="outlined" sx={{ ml: 1 }}>
                      <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>Annehmen</Button>
                      <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>Ablehnen</Button>
                    </ButtonGroup>
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
            return (
              <Card key={chat.id} sx={{ mb: 2, boxShadow: 2, borderRadius: 2, bgcolor: selectedChat?.id === chat.id ? '#ffe4f3' : '#fff' }}>
                <CardActionArea onClick={() => setSelectedChat(chat)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
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
                      <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#eee', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%' }}>
                        {msg.image_url && <img src={msg.image_url} alt="Bild" style={chatImageStyle} />}
                        {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>{msg.sender_id === user.id ? 'Du' : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
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