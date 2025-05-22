import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Alert, Divider, Paper, IconButton, useMediaQuery, CircularProgress, Avatar, Card, CardActionArea, ButtonGroup, Badge } from '@mui/material';
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
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { sendPushNotification } from '../utils/pushNotifications';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatSettingsDialog from './ChatSettingsDialog';
import MenuIcon from '@mui/icons-material/Menu';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

const PAGE_SIZE = 20;

// Hilfsfunktion zum Verkleinern/Komprimieren von Bildern
function resizeImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = width * scale;
        height = height * scale;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  });
}

// Hilfsfunktion für Zeitformatierung mm:ss
function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Hilfsfunktion zum Extrahieren der Waveform aus einer Audiodatei
async function getAudioWaveform(audioUrl, sampleCount = 32) {
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Für längere Audiodateien: Mehr Samples für bessere Auflösung
    const duration = audioBuffer.duration;
    const adjustedSampleCount = Math.min(128, Math.max(32, Math.floor(duration * 2)));
    
    const rawData = audioBuffer.getChannelData(0); // Mono
    const blockSize = Math.floor(rawData.length / adjustedSampleCount);
    const waveform = [];
    
    // Optimierte Berechnung der Waveform
    for (let i = 0; i < adjustedSampleCount; i++) {
      let sum = 0;
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, rawData.length);
      
      for (let j = start; j < end; j++) {
        const abs = Math.abs(rawData[j]);
        sum += abs;
        max = Math.max(max, abs);
      }
      
      // Kombiniere Durchschnitt und Maximum für bessere Visualisierung
      waveform.push((sum / blockSize + max) / 2);
    }
    
    // Normalisiere die Waveform
    const maxValue = Math.max(...waveform);
    if (maxValue > 0) {
      for (let i = 0; i < waveform.length; i++) {
        waveform[i] = waveform[i] / maxValue;
      }
    }
    
    await audioCtx.close();
    return waveform;
  } catch (error) {
    console.error('Fehler bei der Waveform-Berechnung:', error);
    return null;
  }
}

export default function ChatTab({ user, onChatDetailViewChange }) {
  const { t } = useTranslation();
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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [zoomContainer, setZoomContainer] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

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
        console.log('[Chat-DEBUG] Nachrichten aus DB geladen:', data);
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
        console.log('[Chat-DEBUG] Realtime-Event empfangen:', payload);
        if (payload.eventType === 'INSERT') {
          // Prüfe auf Duplikate und merge Felder
          setMessages(msgs => {
            const existing = msgs.find(m => m.id === payload.new.id);
            if (existing) {
              // Merge nur, wenn das neue Objekt mehr Felder hat (z.B. image_url)
              return msgs.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m);
            }
            return [...msgs, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(msgs => 
            msgs.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)
          );
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
    const { error } = await supabase.from('messages').insert([
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
    if (!error) {
      console.log('[Push-DEBUG] Sende Push an Partner:', partnerId, 'von', user.username, 'mit Nachricht:', newMessage);
      await sendPushNotification(
        partnerId,
        `${user.username} (${t('NeueNachricht')})`,
        newMessage
      );
    }
  };

  // Bild auswählen
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Komprimiere das Bild vor dem Senden
      const resizedDataUrl = await resizeImage(file);
      setImageToSend(resizedDataUrl);
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
    // Nur wenn es neue ungelesene Nachrichten gibt und sie sich von den zuletzt markierten unterscheiden
    if (unread.length > 0 && unread.join(',') !== lastMarkedRead.join(',')) {
      setLastMarkedRead(unread);
      // Batch-Update für bessere Performance
      supabase.from('messages')
        .update({ is_read: true })
        .in('id', unread)
        .then(() => {
          // Lokal aktualisieren
          setMessages(prev => prev.map(msg => 
            unread.includes(msg.id) ? { ...msg, is_read: true } : msg
          ));
        });
    }
  }, [selectedChat, messages, user, lastMarkedRead]);

  // Hilfsfunktion: Gibt true zurück, wenn es im Chat ungelesene Nachrichten für den aktuellen User gibt
  const hasUnread = (chat) => {
    return messages.some(
      m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read
    );
  };

  // Neue Funktion: Hole ungelesene Nachrichten pro Chat aus Supabase
  const fetchUnreadCounts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('messages')
      .select('id, chat_id')
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    if (!error && data) {
      const counts = {};
      data.forEach(row => {
        counts[row.chat_id] = (counts[row.chat_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  };

  // Nach jedem Laden der Chats und bei neuen Nachrichten aufrufen
  useEffect(() => {
    fetchUnreadCounts();
  }, [chats, user]);

  // Realtime-Subscription für neue Nachrichten und Updates (nur für unreadCounts)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('messages-unread-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Vor dem Rendern der Nachrichten Duplikate filtern (z.B. nach id)
  const uniqueMessages = Array.from(new Map(messages.map(m => [m.id, m])).values());

  // Hilfsfunktion zum Erstellen des Zoom-Containers
  const createZoomContainer = () => {
    if (zoomContainer) {
      document.body.removeChild(zoomContainer);
    }
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(40,40,40,0.95)';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.onclick = () => {
      document.body.removeChild(container);
      setZoomContainer(null);
    };
    document.body.appendChild(container);
    setZoomContainer(container);
    return container;
  };

  // Hilfsfunktion zum Speichern/Herunterladen des Bildes
  const saveImage = async (imageUrl) => {
    try {
      // Prüfe ob iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Für iOS: Öffne das Bild in einem neuen Tab
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Für andere Geräte: Download
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Bildes:', error);
      alert('Fehler beim Speichern des Bildes. Bitte versuche es erneut.');
    }
  };

  // Effekt: Informiere Parent, ob Chat-Detailansicht aktiv ist (nur Mobile)
  useEffect(() => {
    if (!onChatDetailViewChange) return;
    if (isMobile) {
      onChatDetailViewChange(!!selectedChat);
      // Verstecke die Tab-Leiste, wenn wir im Chat-Detail sind
      if (selectedChat) {
        document.body.style.overflow = 'hidden';
        // Optional: Verstecke die Tab-Leiste
        const tabBar = document.querySelector('.MuiBottomNavigation-root');
        if (tabBar) {
          tabBar.style.display = 'none';
        }
      } else {
        document.body.style.overflow = '';
        // Optional: Zeige die Tab-Leiste wieder an
        const tabBar = document.querySelector('.MuiBottomNavigation-root');
        if (tabBar) {
          tabBar.style.display = 'flex';
        }
      }
    }
  }, [isMobile, selectedChat, onChatDetailViewChange]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      const tabBar = document.querySelector('.MuiBottomNavigation-root');
      if (tabBar) {
        tabBar.style.display = 'flex';
      }
    };
  }, []);

  // Funktion zum Starten der Aufnahme
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Dauer auslesen mit Polling, bis ein sinnvoller Wert vorliegt
        const tempAudio = new Audio(url);
        const trySetDuration = () => {
          if (
            tempAudio.duration &&
            isFinite(tempAudio.duration) &&
            !isNaN(tempAudio.duration) &&
            tempAudio.duration > 0
          ) {
            setRecordedDuration(Math.round(tempAudio.duration));
          } else {
            setTimeout(trySetDuration, 100);
          }
        };
        tempAudio.onloadedmetadata = trySetDuration;

        clearInterval(recordingTimerRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      alert('Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Berechtigungen.');
    }
  };

  // Funktion zum Stoppen der Aufnahme
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Funktion zum Abspielen der Aufnahme
  const togglePlayback = () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Funktion zum Senden der Sprachnachricht
  const handleSendVoiceMessage = async () => {
    if (!audioBlob || audioBlob.size === 0 || !selectedChat) {
      alert('Die Aufnahme ist leer oder fehlgeschlagen!');
      return;
    }

    // Audiodatei zu Supabase Storage hochladen
    const fileName = `voice-message-${Date.now()}-${user.id}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBlob, { contentType: 'audio/webm' });

    if (uploadError) {
      alert('Fehler beim Hochladen der Sprachnachricht: ' + uploadError.message);
      return;
    }

    // Public URL generieren
    const { data: publicUrlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName);
    const audioUrlToSave = publicUrlData?.publicUrl;

    // Waveform berechnen und als JSON speichern
    let waveformArr = null;
    try {
      waveformArr = await getAudioWaveform(audioUrlToSave, 32);
    } catch (e) {
      waveformArr = null;
    }

    const partnerId = Number(selectedChat.user1_id === user.id ? selectedChat.user2_id : selectedChat.user1_id);

    const { error } = await supabase.from('messages').insert([
      {
        chat_id: selectedChat.id,
        sender_id: user.id,
        receiver_id: partnerId,
        content: 'Sprachnachricht',
        audio_url: audioUrlToSave,
        waveform: waveformArr ? JSON.stringify(waveformArr) : null
      }
    ]);

    if (!error) {
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordedDuration(0);
      setRecordingTime(0);
      setMediaMenuOpen(false);
      await sendPushNotification(
        partnerId,
        `${user.username} (${t('NeueSprachnachricht')})`,
        'Sprachnachricht'
      );
    }
  };

  // Cleanup bei Komponenten-Unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Mobile: Zeige nur Chat-Liste ODER Chat
  if (isMobile) {
    if (!selectedChat) {
      return (
        <Box sx={{ pt: 0, pb: 8, px: 2, position: 'relative', minHeight: '100vh', bgcolor: '#fff', background: '#f5f5f5' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>{t('Chats')}</Typography>
          {/* Offene Anfragen */}
          {pendingRequests.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">{t('OffeneChatAnfragen')}</Typography>
              <List>
                {pendingRequests.map(req => {
                  const partner = getChatPartnerObj(req);
                  return (
                    <ListItem key={req.id} sx={{ alignItems: 'flex-start', display: 'flex' }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography>
                          {t('Von')} <b>{partner.username}</b>
                        </Typography>
                        <ButtonGroup variant="outlined" sx={{ mt: 0.5 }}>
                          <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>{t('Annehmen')}</Button>
                          <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>{t('Ablehnen')}</Button>
                        </ButtonGroup>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          <Typography variant="h6">{t('DeineChats')}</Typography>
          <List>
            {chats.filter(c => c.status === 'accepted').map(chat => {
              const partner = getChatPartnerObj(chat);
              const unread = messages.some(m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read);
              return (
                <Card key={chat.id} sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#fff', p: 0 }}>
                  <CardActionArea onClick={() => setSelectedChat(chat)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
                      </Box>
                      <Badge badgeContent={unreadCounts[chat.id] || 0} color="error" showZero sx={{ mr: 1.5 }} />
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </List>
          <Tooltip title={t('NeuenChatStarten')}>
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
            <DialogTitle>{t('NeuenChatStarten')}</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  label={t('UsernameSuchen')}
                  value={dialogUsername}
                  onChange={e => setDialogUsername(e.target.value)}
                  fullWidth
                  disabled={dialogLoading}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={handleDialogSearch} disabled={dialogLoading || !dialogUsername} sx={{ mb: 2 }}>
                  {t('Suchen')}
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
                      {t('ChatAnfrageSenden')}
                    </Button>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>{t('Schliessen')}</Button>
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
          <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
            <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 0, bgcolor: '#222' }}>
              <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 10 }}>
                <CloseIcon />
              </IconButton>
              {lightboxImg && (
                <img
                  src={lightboxImg}
                  alt="Bild groß"
                  style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 4px 32px #000a' }}
                />
              )}
            </DialogContent>
          </Dialog>
        </Box>
      );
    } else {
      // Mobile: Chat-Vollansicht mit fixierter Eingabeleiste über dem Footer
      const FOOTER_HEIGHT = 56; // ggf. anpassen!
      const partner = getChatPartnerObj(selectedChat);
      return (
        <>
          {/* Header-Leiste mit Abstand nach unten */}
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            zIndex: 1300,
            bgcolor: '#fff', // Weiß!
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            px: 1,
            m: 0,
            p: 0,
            background: '#fff'
          }}>
            <IconButton onClick={() => setSelectedChat(null)}><ArrowBackIcon /></IconButton>
            {/* Avatar und Username des Chatpartners */}
            <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, ml: 1, mr: 1 }}>
              {(!partner.avatar_url && partner.username) ? partner.username[0].toUpperCase() : ''}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={() => setSettingsOpen(true)} sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Box>
          <ChatSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
          {/* Chat-Fenster darunter */}
          <Box
            sx={{ 
              position: 'fixed',
              top: '56px', // Direkt unter dem Header
              left: 0,
              right: 0,
              bottom:'0px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fff', // Weiß!
              zIndex: 1200,
              background: '#fff'
            }}
          >
            {/* Nachrichtenbereich */}
            <Box
              sx={{ 
                flex: 1, 
                overflowY: 'auto',
                overflowX: 'hidden', // Verhindert horizontales Scrollen
                WebkitOverflowScrolling: 'touch', // Besseres Scrollen auf iOS
                overscrollBehavior: 'contain', // Verhindert Scroll-Überlauf
                pb: mediaMenuOpen ? '92px' : '84px',
                pt: '8px',
                px: 1,
                width: '100%', // Stellt sicher, dass die Box die volle Breite nutzt
                maxWidth: '100%', // Verhindert horizontales Überlaufen
                position: 'relative', // Hilft bei der Scroll-Containment
                touchAction: 'pan-y', // Erlaubt nur vertikales Scrollen auf Touch-Geräten
              }}
              ref={messagesListRef}
              onScroll={handleScroll}
            >
              <List sx={{ 
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                {loadingMore && (
                  <ListItem sx={{ justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                  </ListItem>
                )}
                {uniqueMessages.map(msg => (
                  <ListItem key={msg.id + '-' + (msg.created_at || '')} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#e0e0e0', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%', position: 'relative' }}>
                      {msg.image_url && (
                        <Box sx={{ position: 'relative', minHeight: 100 }}>
                          <Box 
                            onClick={() => { 
                              console.log('[Lightbox-DEBUG] Bild wurde geklickt:', msg.image_url);
                              setLightboxImg(msg.image_url); 
                              setLightboxOpen(true); 
                            }} 
                            sx={{ cursor: 'zoom-in', width: '100%', height: '100%', display: 'inline-block' }}
                            tabIndex={0}
                            role="button"
                            aria-label="Bild vergrößern"
                          >
                            <ChatImageWithLoader src={msg.image_url} alt="Bild" style={chatImageStyle} />
                          </Box>
                        </Box>
                      )}
                      {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                      {msg.audio_url && (
                        <VoiceMessageBubble
                          url={msg.audio_url}
                          duration={msg.duration}
                          isOwn={msg.sender_id === user.id}
                          waveform={msg.waveform}
                        />
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, mr: 1 }}>{msg.sender_id === user.id ? t('Du') : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
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
            {/* Bildvorschau über der Eingabeleiste */}
            {imageToSend && (
              <Box sx={{ 
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: mediaMenuOpen ? '176px' : '84px', // Über der Eingabeleiste
                zIndex: 25,
                bgcolor: '#f5f5f5',
                borderTop: '1px solid #eee',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  maxHeight: '200px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  boxShadow: 1
                }}>
                  <img 
                    src={imageToSend} 
                    alt="Vorschau" 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      maxHeight: '200px'
                    }} 
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => setImageToSend(null)}
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
            {/* Fixierte Eingabezeile über dem Footer */}
            <Box sx={{ 
              position: 'fixed', 
              left: 0, 
              right: 0, 
              bottom: mediaMenuOpen ? '92px' : 0, 
              zIndex: 30, 
              bgcolor: '#fff', 
              borderTop: '1px solid #eee', 
              p: 2.5, 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center', 
              transition: 'bottom 0.2s',
              height: '84px'
            }}>
              <IconButton onClick={() => setMediaMenuOpen(open => !open)} sx={{ p: 1, mt: -2 }}>
                <MenuIcon />
              </IconButton>
              <TextField
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                fullWidth
                placeholder={t('NachrichtSchreiben')}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    height: '56px',
                    mt: -2
                  }, 
                  mr: 0 
                }}
              />
              <Button 
                onClick={handleSend} 
                variant="contained"
                sx={{ 
                  minWidth: '64px', 
                  height: '56px',
                  flexShrink: 0, 
                  px: 1.5, 
                  mr: 1,
                  mt: -2
                }}
              >
                Senden
              </Button>
            </Box>
            {/* Medien-Auswahlmenü unter der Eingabeleiste */}
            {mediaMenuOpen && (
              <Box sx={{ 
                position: 'fixed', 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 40, 
                bgcolor: '#f5f5f5', 
                borderTop: '1px solid #eee', 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2,
                transition: 'all 0.3s ease'
              }}>
                {/* Hauptbuttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <IconButton size="large" sx={{ mx: 2, bgcolor: '#fff', boxShadow: 1 }} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    <PhotoCameraIcon fontSize="large" />
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => { handleImageChange(e); setMediaMenuOpen(false); }} />
                  </IconButton>
                  <IconButton 
                    size="large" 
                    sx={{ 
                      mx: 2, 
                      bgcolor: isRecording ? '#ff4081' : '#fff', 
                      boxShadow: 1,
                      color: isRecording ? '#fff' : 'inherit',
                      width: 64,
                      height: 64
                    }} 
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
                  </IconButton>
                  <IconButton size="large" sx={{ mx: 2, bgcolor: '#fff', boxShadow: 1 }} onClick={() => setMediaMenuOpen(false)}>
                    <AttachFileIcon fontSize="large" />
                  </IconButton>
                </Box>

                {/* Aufnahme-Vorschau */}
                {(isRecording || audioUrl) && (
                  <Box sx={{ 
                    bgcolor: '#fff', 
                    borderRadius: 2, 
                    p: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1,
                    boxShadow: 1
                  }}>
                    {isRecording ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <FiberManualRecordIcon sx={{ color: '#ff4081', animation: 'pulse 1s infinite' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            Aufnahme läuft...
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={togglePlayback} size="small">
                              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <Typography variant="body2">
                              {Math.floor(recordedDuration / 60)}:{(recordedDuration % 60).toString().padStart(2, '0')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              onClick={handleSendVoiceMessage}
                            >
                              {t('Senden')}
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => {
                                setAudioBlob(null);
                                setAudioUrl(null);
                                setRecordedDuration(0);
                                setRecordingTime(0);
                              }}
                            >
                              {t('Entfernen')}
                            </Button>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
          <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
            <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 0, bgcolor: '#222' }}>
              <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 10 }}>
                <CloseIcon />
              </IconButton>
              {lightboxImg && (
                <img
                  src={lightboxImg}
                  alt="Bild groß"
                  style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 4px 32px #000a' }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      );
    }
  }

  // Desktop: Chat-Liste links, Chat rechts
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', bgcolor: '#fff' }}>
      <Box sx={{ display: 'flex', height: '70vh', maxWidth: 1000, width: '100%', mx: 'auto', mt: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 2, position: 'relative', minHeight: '100vh', pb: 8 }}>
        {/* Chat-Liste */}
        <Box sx={{ width: 300, borderRight: '1px solid #eee', p: 2, overflowY: 'auto' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>{t('Chats')}</Typography>
          {/* Offene Anfragen */}
          {pendingRequests.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">{t('OffeneChatAnfragen')}</Typography>
              <List>
                {pendingRequests.map(req => {
                  const partner = getChatPartnerObj(req);
                  return (
                    <ListItem key={req.id} sx={{ alignItems: 'flex-start', display: 'flex' }}>
                      <Avatar src={partner.avatar_url} sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography>
                          {t('Von')} <b>{partner.username}</b>
                        </Typography>
                        <ButtonGroup variant="outlined" sx={{ mt: 0.5 }}>
                          <Button color="primary" size="small" onClick={() => handleRequestAction(req.id, 'accept')}>{t('Annehmen')}</Button>
                          <Button color="secondary" size="small" onClick={() => handleRequestAction(req.id, 'declined')}>{t('Ablehnen')}</Button>
                        </ButtonGroup>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          <Typography variant="h6">{t('DeineChats')}</Typography>
          <List>
            {chats.filter(c => c.status === 'accepted').map(chat => {
              const partner = getChatPartnerObj(chat);
              const unread = messages.some(m => m.chat_id === chat.id && m.receiver_id === user.id && !m.is_read);
              return (
                <Card key={chat.id} sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#fff', p: 0 }}>
                  <CardActionArea onClick={() => setSelectedChat(chat)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={partner.avatar_url} sx={{ width: 36, height: 36, mr: 2 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{partner.username}</Typography>
                      </Box>
                      <Badge badgeContent={unreadCounts[chat.id] || 0} color="error" showZero sx={{ mr: 1.5 }} />
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
                  {t('ChatMit')} {getChatPartnerObj(selectedChat).username}
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
                    {uniqueMessages.map(msg => (
                      <ListItem key={msg.id + '-' + (msg.created_at || '')} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                        <Paper sx={{ p: 1.5, bgcolor: msg.sender_id === user.id ? '#ff4081' : '#e0e0e0', color: msg.sender_id === user.id ? 'white' : 'black', borderRadius: 2, maxWidth: '70%', position: 'relative' }}>
                          {msg.image_url && (
                            <Box sx={{ position: 'relative', minHeight: 100 }}>
                              <Box 
                                onClick={() => { 
                                  console.log('[Lightbox-DEBUG] Bild wurde geklickt:', msg.image_url);
                                  setLightboxImg(msg.image_url); 
                                  setLightboxOpen(true); 
                                }} 
                                sx={{ cursor: 'zoom-in', width: '100%', height: '100%', display: 'inline-block' }}
                                tabIndex={0}
                                role="button"
                                aria-label="Bild vergrößern"
                              >
                                <ChatImageWithLoader src={msg.image_url} alt="Bild" style={chatImageStyle} />
                              </Box>
                            </Box>
                          )}
                          {msg.content && <Typography variant="body2">{msg.content}</Typography>}
                          {msg.audio_url && (
                            <VoiceMessageBubble
                              url={msg.audio_url}
                              duration={msg.duration}
                              isOwn={msg.sender_id === user.id}
                              waveform={msg.waveform}
                            />
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7, mr: 1 }}>{msg.sender_id === user.id ? t('Du') : userMap[msg.sender_id]?.username || `User #${msg.sender_id}`}</Typography>
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
                    placeholder={t('NachrichtSchreiben')}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  />
                  <Button onClick={handleSend} variant="contained">Senden</Button>
                </Box>
              </>
            )
          ) : (
            <Box sx={{ textAlign: 'center', color: '#aaa', mt: 10 }}>
              <Typography>{t('WaehleChatOderStarteNeuen')}</Typography>
            </Box>
          )}
        </Box>
        {/* Lightbox-Dialog für große Bildanzeige */}
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 0, bgcolor: '#222' }}>
            <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 10 }}>
              <CloseIcon />
            </IconButton>
            {lightboxImg && (
              <img
                src={lightboxImg}
                alt="Bild groß"
                style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 4px 32px #000a' }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

// Komponente für Bild mit Ladeindikator
function ChatImageWithLoader({ src, alt, style }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <Box sx={{ position: 'relative', minHeight: 100 }}>
      {!imgLoaded && <CircularProgress sx={{ position: 'absolute', top: '40%', left: '45%' }} />}
      <img
        src={src}
        alt={alt}
        style={{ ...style, display: imgLoaded ? 'block' : 'none' }}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
      />
    </Box>
  );
}

function AudioWaveform({ waveform, color = "#fff", progress = 0, onScrub, isScrubbing, isOwn }) {
  const svgRef = React.useRef();
  const isDraggingRef = React.useRef(false);
  const width = waveform.length * 10;
  const height = 64;
  const barWidth = 8;
  const barRadius = 4;
  const progressBarWidth = 8;
  const progressBarRadius = 4;

  // Berechne die Position relativ zum SVG-Element
  const calculateProgress = React.useCallback((clientX) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  // Verbesserte Pointer-Move-Handler
  const handlePointerMove = React.useCallback((e) => {
    if (!isDraggingRef.current || !onScrub) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newProgress = calculateProgress(clientX);
    onScrub(newProgress, 'move');
  }, [onScrub, calculateProgress]);

  // Verbesserter Pointer-Down-Handler
  const handlePointerDown = React.useCallback((e) => {
    if (!onScrub) return;
    e.preventDefault();
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newProgress = calculateProgress(clientX);
    onScrub(newProgress, 'start');

    // Event-Listener hinzufügen
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  }, [onScrub, calculateProgress]);

  // Verbesserter Pointer-Up-Handler
  const handlePointerUp = React.useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    isDraggingRef.current = false;
    
    // Event-Listener entfernen
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
    
    onScrub(null, 'end');
  }, [onScrub, handlePointerMove]);

  // Cleanup bei Unmount
  React.useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Smoothes Bewegen: CSS-Transition für den Balken
  const progressBarX = Math.max(0, Math.min(width - progressBarWidth, progress * width - progressBarWidth / 2));

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ 
        touchAction: 'none', 
        cursor: onScrub ? 'pointer' : 'default', 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onPointerDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      role="slider"
      aria-label="Audio Position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        const step = 0.01; // 5% Schrittweite
        if (e.key === 'ArrowLeft') {
          onScrub(Math.max(0, progress - step), 'move');
        } else if (e.key === 'ArrowRight') {
          onScrub(Math.min(1, progress + step), 'move');
        }
      }}
    >
      {waveform.map((v, i) => (
        <rect
          key={i}
          x={i * 10}
          y={64 - (v / Math.max(...waveform, 0.01)) * 54}
          width={barWidth}
          height={(v / Math.max(...waveform, 0.01)) * 54}
          fill={color}
          rx={barRadius}
        />
      ))}
      {/* Fortschrittsbalken */}
      <rect
        x={0}
        y={0}
        width={progressBarWidth}
        height={height}
        fill={isOwn ? "#fff" : "#e91e63"}
        opacity={isScrubbing ? 0.95 : 0.8}
        rx={progressBarRadius}
        style={{ 
          pointerEvents: 'none', 
          transform: `translateX(${progressBarX}px)`,
          transition: isScrubbing ? 'none' : 'transform 0.15s cubic-bezier(.4,1.3,.6,1)'
        }}
      />
    </svg>
  );
}

function VoiceMessageBubble({ url, duration, isOwn, waveform: waveformProp }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audio, setAudio] = React.useState(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [waveform, setWaveform] = React.useState(null);
  const [waveformError, setWaveformError] = React.useState(null);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubTime, setScrubTime] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const durationToShow = duration || (audio ? audio.duration : 0);
  const audioRef = React.useRef(null);
  const audioContextRef = React.useRef(null);

  // Initialisiere Audio-Objekt
  React.useEffect(() => {
    if (!url) return;
    
    const newAudio = new window.Audio(url);
    audioRef.current = newAudio;
    
    // Setze Preload auf "auto" für bessere Performance
    newAudio.preload = "auto";
    
    newAudio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    newAudio.ontimeupdate = () => {
      setCurrentTime(newAudio.currentTime);
    };

    // Lade-Event-Handler
    newAudio.onloadeddata = () => {
      setIsLoading(false);
    };

    setAudio(newAudio);

    return () => {
      if (newAudio) {
        newAudio.pause();
        newAudio.currentTime = 0;
      }
    };
  }, [url]);

  // Waveform-Berechnung
  React.useEffect(() => {
    let cancelled = false;
    if (waveformProp) {
      if (Array.isArray(waveformProp)) {
        setWaveform(waveformProp);
        setIsLoading(false);
      } else if (typeof waveformProp === 'string') {
        try {
          if (waveformProp.trim().startsWith('[')) {
            setWaveform(JSON.parse(waveformProp));
            setIsLoading(false);
          } else {
            setWaveform(undefined);
          }
        } catch {
          setWaveform(undefined);
        }
      } else {
        setWaveform(undefined);
      }
    } else if (url) {
      setWaveform(null);
      setWaveformError(null);
      setIsLoading(true);
      
      getAudioWaveform(url)
        .then(w => { 
          if (!cancelled) {
            setWaveform(w);
            setIsLoading(false);
          }
        })
        .catch(e => { 
          if (!cancelled) {
            setWaveformError(e.message);
            setIsLoading(false);
          }
        });
    }
    return () => { cancelled = true; };
  }, [url, waveformProp]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Wenn pausiert, von der aktuellen Position weiterspielen
      audioRef.current.play().catch(error => {
        console.error('Fehler beim Abspielen:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // Scrubbing-Handler
  const handleScrub = (progress, phase) => {
    // Zusätzliche Checks für gültige Werte
    if (!audioRef.current || !durationToShow || !isFinite(durationToShow) || isNaN(durationToShow)) return;

    if (phase === 'start') {
      setIsScrubbing(true);
      setScrubTime(progress * durationToShow);
    } else if (phase === 'move') {
      setScrubTime(progress * durationToShow);
    } else if (phase === 'end') {
      setIsScrubbing(false);
      if (
        scrubTime != null &&
        isFinite(scrubTime) &&
        !isNaN(scrubTime) &&
        scrubTime >= 0 &&
        scrubTime <= durationToShow
      ) {
        audioRef.current.currentTime = scrubTime;
        setCurrentTime(scrubTime);
        if (isPlaying) {
          audioRef.current.play();
        }
      }
      setScrubTime(null);
    }
  };

  // Wenn eine andere Nachricht abgespielt wird, stoppe diese
  React.useEffect(() => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const progress = isScrubbing && scrubTime != null
    ? scrubTime / durationToShow
    : (durationToShow ? currentTime / durationToShow : 0);

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      bgcolor: isOwn ? '#ff4081' : '#e0e0e0',
      borderRadius: 3,
      px: 2,
      py: 1,
      minWidth: 180,
      maxWidth: 320,
      gap: 1,
      mt: 1,
      mb: 0.5,
      boxShadow: 0,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        <IconButton 
          size="small" 
          onClick={handlePlayPause} 
          disabled={isLoading}
          sx={{ 
            ml: -1.5, 
            color: isOwn ? 'white' : '#ff4081', 
            bgcolor: isOwn ? '#ff4081' : '#e0e0e0', 
            '&:hover': { bgcolor: isOwn ? '#e91e63' : '#d5d5d5' },
            '&.Mui-disabled': {
              color: isOwn ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 64, 129, 0.5)',
              bgcolor: isOwn ? 'rgba(255, 64, 129, 0.5)' : 'rgba(224, 224, 224, 0.5)'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayArrowIcon />
          )}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 160, maxWidth: 260, mx: 0.5 }}>
          {waveform ? (
            <AudioWaveform
              waveform={waveform}
              color={isOwn ? "#fff" : "#ff4081"}
              progress={progress}
              onScrub={handleScrub}
              isScrubbing={isScrubbing}
              isOwn={isOwn}
            />
          ) : waveformError ? (
            <Typography variant="caption" color="error">Waveform-Fehler</Typography>
          ) : (
            <CircularProgress size={20} />
          )}
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, minWidth: 36, textAlign: 'right', ml: 1, flexShrink: 0 }}>
        {formatDuration(durationToShow)}
      </Typography>
    </Box>
  );
}

// Füge CSS für die Puls-Animation hinzu
<style>
  {`
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `}
</style> 