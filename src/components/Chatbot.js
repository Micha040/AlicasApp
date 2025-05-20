import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Füge Benutzer-Nachricht hinzu
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: input
            }]
          }]
        }),
      });

      const data = await response.json();
      const botResponse = data.candidates[0].content.parts[0].text;
      
      // Füge KI-Antwort hinzu
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      setMessages(prev => [...prev, { 
        text: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Nachricht.', 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          height: '400px', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  maxWidth: '70%',
                  bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.100',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography>{message.text}</Typography>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <Paper elevation={1} sx={{ p: 1, bgcolor: 'grey.100' }}>
                <Typography>...</Typography>
              </Paper>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Schreibe eine Nachricht..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={isLoading}
          >
            Senden
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chatbot; 