import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export default function ChatbotTab({ user }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hallo! Ich bin dein KI-Zeitkapsel-Bot. Was möchtest du mir erzählen oder fragen?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: input }]
          }]
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { sender: 'bot', text: data.candidates[0].content.parts[0].text }]);
    } catch (e) {
      setMessages([...newMessages, { sender: 'bot', text: 'Entschuldigung, es gab ein Problem mit der KI.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            <SmartToyIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#ff4081' }} /> KI-Chatbot
          </Typography>
          <Box sx={{ maxHeight: 350, overflowY: 'auto', mb: 2, bgcolor: '#f9f9f9', p: 2, borderRadius: 2 }}>
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', mb: 1, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <Avatar sx={{ bgcolor: msg.sender === 'user' ? '#ff4081' : '#eee', color: msg.sender === 'user' ? '#fff' : '#ff4081', ml: msg.sender === 'user' ? 1 : 0, mr: msg.sender === 'bot' ? 1 : 0 }}>
                  {msg.sender === 'user' ? (user?.username?.[0]?.toUpperCase() || 'U') : <SmartToyIcon />}
                </Avatar>
                <Box sx={{ bgcolor: msg.sender === 'user' ? '#ff80ab' : '#fff', color: '#222', px: 2, py: 1, borderRadius: 2, maxWidth: 320, boxShadow: 1 }}>
                  {msg.text}
                </Box>
              </Box>
            ))}
            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            placeholder="Nachricht eingeben..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          <Button variant="contained" color="primary" fullWidth onClick={sendMessage} disabled={loading || !input.trim()}>
            Senden
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
} 