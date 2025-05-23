import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  AppBar,
  Toolbar,
  useScrollTrigger,
  Slide,
  Switch
} from '@mui/material';
import { motion } from 'framer-motion';
import SettingsIcon from '@mui/icons-material/Settings';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CakeIcon from '@mui/icons-material/Cake';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import StarIcon from '@mui/icons-material/Star';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import QuizIcon from '@mui/icons-material/Quiz';
import CompareIcon from '@mui/icons-material/Compare';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import InspirationTab from './components/InspirationTab';
import { supabase } from './supabaseClient';
import Register from './components/Register';
import Login from './components/Login';
import MusicTab from './components/MusicTab';
import ChatTab from './components/ChatTab';
import ProfileDialog from './components/ProfileDialog';
import SharedListsTab from './components/SharedListsTab';
import MinesweeperTab from './components/MinesweeperTab';
import { Routes, Route } from 'react-router-dom';
import ResetPassword from './components/ResetPassword';
import Footer from './components/Footer';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import RecipesTab from './components/RecipesTab';
import RecipeDetail from './components/RecipeDetail';
import TimeCapsuleTab from './components/TimeCapsuleTab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import './i18n';
import { useTranslation } from 'react-i18next';
import SettingsDialog from './components/SettingsDialog';
import urlBase64ToUint8Array from './utils/urlBase64ToUint8Array';
import Game3DTab from './components/Game3DTab';
import Game3D from './components/Game3D';

function HideOnScroll(props) {
  const { children, setAppBarHidden } = props;
  const trigger = useScrollTrigger({ threshold: 80 });
  React.useEffect(() => {
    if (setAppBarHidden) setAppBarHidden(trigger);
  }, [trigger, setAppBarHidden]);
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function TimeCapsule({ memories, setMemories, newMemory, setNewMemory, handleAddMemory, handleFileUpload }) {
  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Schreibe eine Nachricht für die Zukunft..."
        value={newMemory.content}
        onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="photo-upload"
          type="file"
          onChange={(e) => handleFileUpload(e, 'photo')}
        />
        <label htmlFor="photo-upload">
          <IconButton component="span" color="primary">
            <AddPhotoAlternateIcon />
          </IconButton>
        </label>

        <input
          accept="video/*"
          style={{ display: 'none' }}
          id="video-upload"
          type="file"
          onChange={(e) => handleFileUpload(e, 'video')}
        />
        <label htmlFor="video-upload">
          <IconButton component="span" color="primary">
            <VideoLibraryIcon />
          </IconButton>
        </label>
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleAddMemory}
        startIcon={<MessageIcon />}
      >
        Zur Zeitkapsel hinzufügen
      </Button>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {memories.map((memory) => (
          <Grid item xs={12} key={memory.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  {memory.type === 'message' && (
                    <Typography variant="body1">{memory.content}</Typography>
                  )}
                  {memory.type === 'photo' && (
                    <img 
                      src={memory.content} 
                      alt="Memory" 
                      style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                  )}
                  {memory.type === 'video' && (
                    <video 
                      controls 
                      style={{ maxWidth: '100%' }}
                      src={memory.content}
                    />
                  )}
                  <Typography variant="caption" color="textSecondary">
                    {new Date(memory.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  const emojis = [
    { id: 1, icon: <EmojiEmotionsIcon />, name: 'Smiley' },
    { id: 2, icon: <FavoriteBorderIcon />, name: 'Herz' },
    { id: 3, icon: <LocalFloristIcon />, name: 'Blume' },
    { id: 4, icon: <CakeIcon />, name: 'Kuchen' },
    { id: 5, icon: <MusicNoteIcon />, name: 'Musik' },
    { id: 6, icon: <BeachAccessIcon />, name: 'Strand' },
  ];

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const gameCards = [...emojis, ...emojis]
      .map((card, index) => ({ ...card, uniqueId: index }))
      .sort(() => Math.random() - 0.5);
    setCards(gameCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
    setMoves(0);
  };

  const handleCardClick = (clickedCard) => {
    if (
      flippedCards.length === 2 ||
      flippedCards.includes(clickedCard.uniqueId) ||
      matchedPairs.includes(clickedCard.id)
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard.uniqueId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstCard, secondCard] = newFlippedCards.map(id => 
        cards.find(card => card.uniqueId === id)
      );

      if (firstCard.id === secondCard.id) {
        setMatchedPairs([...matchedPairs, firstCard.id]);
        setScore(score + 10);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const isCardFlipped = (card) => {
    return flippedCards.includes(card.uniqueId) || matchedPairs.includes(card.id);
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Unser Memory-Spiel
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          Punkte: {score} | Züge: {moves}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={initializeGame}
          sx={{ mt: 1 }}
        >
          Neu starten
        </Button>
      </Box>
      <Grid container spacing={2} sx={{ maxWidth: 600, margin: '0 auto' }}>
        {cards.map((card) => (
          <Grid item xs={3} key={card.uniqueId}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                onClick={() => handleCardClick(card)}
                sx={{
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isCardFlipped(card) ? '#f0f0f0' : '#ff4081',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: isCardFlipped(card) ? '#f0f0f0' : '#ff80ab',
                  },
                }}
              >
                <CardContent>
                  {isCardFlipped(card) ? (
                    <Box sx={{ fontSize: 40, color: '#ff4081' }}>
                      {card.icon}
                    </Box>
                  ) : (
                    <StarIcon sx={{ fontSize: 40, color: 'white' }} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      {matchedPairs.length === emojis.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
            Glückwunsch! Du hast gewonnen! 🎉
          </Typography>
        </motion.div>
      )}
    </Box>
  );
}

function GameSelection({ onSelectGame }) {
  const { t } = useTranslation();
  const games = [
    { id: 'memory', name: 'Memory', icon: <PhotoLibraryIcon />, description: 'Finde die passenden Paare!' },
    { id: 'minesweeper', name: 'Minesweeper', icon: <QuizIcon />, description: 'Finde alle Minen ohne sie zu treffen!' },
    { id: 'wordle', name: 'Wordle', icon: <CompareIcon />, description: 'Rate das Wort in 6 Versuchen!' }
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        {t('WaehleDeinSpiel')}
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {games.map((game) => (
          <Grid item xs={12} md={4} key={game.id}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2
                }}
                onClick={() => onSelectGame(game.id)}
              >
                <Box sx={{ fontSize: 40, color: '#ff4081', mb: 2 }}>
                  {game.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {game.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {game.description}
                </Typography>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function Wordle({ wordleWords }) {
  const { t } = useTranslation();
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (wordleWords.length > 0) {
      startNewGame();
    }
    // eslint-disable-next-line
  }, [wordleWords]);

  const startNewGame = () => {
    if (wordleWords.length === 0) return;
    const randomWord = wordleWords[Math.floor(Math.random() * wordleWords.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setMessage('');
    setError('');
  };

  // Überprüfen-Button Funktion
  const handleCheckGuess = () => {
    if (gameOver) return;
    if (currentGuess.length !== targetWord.length) return;
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameOver(true);
      setMessage('Glückwunsch! Du hast gewonnen! 🎉');
    } else if (newGuesses.length >= 6) {
      setGameOver(true);
      setMessage(`Game Over! Das Wort war: ${targetWord}`);
    }
  };

  const getGuessStatuses = (guess, target) => {
    const result = Array(target.length).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');
    const used = Array(target.length).fill(false);

    // Erst grün markieren
    for (let i = 0; i < target.length; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }
    // Dann gelb markieren
    for (let i = 0; i < target.length; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < target.length; j++) {
        if (!used[j] && guessArr[i] === targetArr[j]) {
          result[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }
    return result;
  };

  return (
    <Box sx={{ textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('Wordle')}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          {t('WordleDesc')}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={startNewGame}
          sx={{ mt: 1 }}
        >
          {t('NeuesSpiel')}
        </Button>
      </Box>

      {/* Verstecktes Input-Feld für mobile Tastatur */}
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none'
        }}
        value={currentGuess}
        onChange={(e) => {
          const value = e.target.value.toUpperCase();
          if (value.length <= targetWord.length && /^[A-Z]*$/.test(value)) {
            setCurrentGuess(value);
          }
        }}
        onBlur={(e) => e.target.blur()}
      />

      <Box sx={{ mb: 2 }}>
        {[...Array(6)].map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const rowWord = isCurrentRow ? currentGuess : guesses[rowIndex] || '';
          const statuses = guesses[rowIndex] ? getGuessStatuses(guesses[rowIndex], targetWord) : [];
          return (
            <Box
              key={rowIndex}
              sx={{
                display: 'flex',
                gap: 1,
                mb: 1,
                justifyContent: 'center'
              }}
              onClick={() => {
                if (isCurrentRow && !gameOver) {
                  // Fokus auf das versteckte Input-Feld setzen
                  document.querySelector('input[type="text"]').focus();
                }
              }}
            >
              {[...Array(targetWord.length)].map((_, colIndex) => {
                const letter = rowWord[colIndex] || '';
                const status = statuses[colIndex] || '';
                return (
                  <Box
                    key={colIndex}
                    sx={{
                      width: 50,
                      height: 50,
                      border: '2px solid',
                      borderColor: status ? 'transparent' : '#ccc',
                      backgroundColor: 
                        status === 'correct' ? '#6aaa64' :
                        status === 'present' ? '#c9b458' :
                        status === 'absent' ? '#787c7e' :
                        'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: status ? 'white' : 'black',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: isCurrentRow ? '#ff4081' : '#ccc'
                      },
                      cursor: isCurrentRow ? 'text' : 'default'
                    }}
                  >
                    {letter}
                  </Box>
                );
              })}
            </Box>
          );
        })}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCheckGuess}
          disabled={gameOver || currentGuess.length !== targetWord.length}
          sx={{ mt: 2 }}
        >
          {t('Ueberpruefen')}
        </Button>
      </Box>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography 
            variant="h6" 
            color="error"
            sx={{ mt: 2 }}
          >
            {error}
          </Typography>
        </motion.div>
      )}

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h6" 
            color={message.includes('gewonnen') ? 'primary' : 'error'}
            sx={{ mt: 2 }}
          >
            {message}
          </Typography>
        </motion.div>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('WordleHint')}
        </Typography>
      </Box>
    </Box>
  );
}

function GamesTab({ wordleWords }) {
  const [selectedGame, setSelectedGame] = useState(null);

  const renderGame = () => {
    switch (selectedGame) {
      case 'memory':
        return <MemoryGame />;
      case 'minesweeper':
        return <MinesweeperTab />;
      case 'wordle':
        return <Wordle wordleWords={wordleWords} />;
      default:
        return <GameSelection onSelectGame={setSelectedGame} />;
    }
  };

  return (
    <Box>
      {selectedGame && (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setSelectedGame(null)}
          sx={{ mb: 2 }}
        >
          Zurück zur Spieleauswahl
        </Button>
      )}
      {renderGame()}
    </Box>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wordleWords, setWordleWords] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [appBarHidden, setAppBarHidden] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [themeSetting, setThemeSetting] = useState('system');
  const [languageSetting, setLanguageSetting] = useState('de');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showMobileChatDetail, setShowMobileChatDetail] = useState(false);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 600;
  const { t, i18n } = useTranslation();

  // Prüfe Push-Support und Subscription-Status
  useEffect(() => {
    console.log('[Push-DEBUG] Prüfe Push-Support...');
    const checkPushSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push-DEBUG] Push notifications are not supported');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        console.log('[Push-DEBUG] Service Worker registration:', registration);
        console.log('[Push-DEBUG] Aktuelle Push-Subscription:', subscription);
        setPushEnabled(!!subscription);
      } catch (error) {
        console.error('[Push-DEBUG] Error checking push subscription:', error);
      }
    };
    checkPushSupport();
    console.log('[Push-DEBUG] User aus localStorage:', user);
  }, [user]);

  // Push-Subscription aktivieren/deaktivieren
  const handlePushToggle = async () => {
    console.log('[Push-DEBUG] ===== PUSH TOGGLE START =====');
    console.log('[Push-DEBUG] User:', user);
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push-DEBUG] Push-API nicht unterstützt');
      alert(t('PushBenachrichtigungenNichtUnterstuetzt'));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push-DEBUG] Service Worker ready:', registration);

      if (!pushEnabled) {
        console.log('[Push-DEBUG] Push wird aktiviert');
        console.log('[Push-DEBUG] User ID:', user.id);
        
        const applicationServerKey = urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        console.log('[Push-DEBUG] Neue Subscription:', subscription);
        const subscriptionJson = subscription.toJSON();
        
        // Subscription in Supabase speichern
        const subscriptionData = {
          user_id: user.id,
          subscription: subscriptionJson,
          created_at: new Date().toISOString()
        };
        
        console.log('[Push-DEBUG] Versuche Supabase Insert mit Daten:', subscriptionData);
        
        const { data, error } = await supabase
          .from('push_subscriptions')
          .upsert(subscriptionData)
          .select();

        if (error) {
          console.error('[Push-DEBUG] Fehler beim Speichern in Supabase:', error);
          throw error;
        }

        console.log('[Push-DEBUG] Supabase Antwort:', data);
        console.log('[Push-DEBUG] ===== PUSH TOGGLE ENDE =====');
        
        setPushEnabled(true);
        alert(t('PushBenachrichtigungenAktiviert'));
      } else {
        // Push-Subscription deaktivieren
        console.log('[Push-DEBUG] Push wird deaktiviert');
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          
          const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);

          if (error) {
            console.error('[Push-DEBUG] Fehler beim Löschen in Supabase:', error);
            throw error;
          }

          setPushEnabled(false);
          alert(t('PushBenachrichtigungenDeaktiviert'));
        }
      }
    } catch (error) {
      console.error('[Push-DEBUG] Fehler beim Umschalten der Push-Subscription:', error);
      alert('Fehler beim Aktivieren/Deaktivieren der Push-Benachrichtigungen: ' + error.message);
    }
  };

  // Wordle-Wörter aus Supabase laden
  useEffect(() => {
    const fetchWords = async () => {
      const { data, error } = await supabase
        .from('wordle_words')
        .select('word');
      if (!error && data) {
        setWordleWords(data.map(row => row.word.toUpperCase()));
      }
    };
    fetchWords();
  }, []);

  // Profil nach Login oder App-Start laden
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !user.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, username')
        .eq('id', user.id)
        .single();
      if (profile) {
        setUser((prev) => ({ ...prev, ...profile }));
        localStorage.setItem('user', JSON.stringify({ ...user, ...profile }));
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user && user.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // User-Session auch in localStorage speichern
  const handleLogin = async (userData) => {
    // Nach Login Profil laden
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', userData.id)
      .single();
    const mergedUser = profile ? { ...userData, ...profile } : userData;
    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="*" element={
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <Box sx={{ width: '100%', maxWidth: 400, p: 2 }}>
              <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, color: '#ff4081' }}>
                {t('Willkommen')}
              </Typography>
              <Typography variant="h6" align="center" gutterBottom>
                {t('LoginText')}
              </Typography>
              {!showRegister ? (
                <>
                  <Login onLogin={handleLogin} />
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button variant="text" onClick={() => setShowRegister(true)}>
                      {t('NochKeinAccount')}
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Register onRegister={() => setShowRegister(false)} />
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button variant="text" onClick={() => setShowRegister(false)}>
                      {t('ZurueckZumLogin')}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        } />
      </Routes>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/rezepte/:id" element={<RecipeDetail />} />
        <Route path="*" element={
          <>
            {/* AppBar (Avatar/Settings) nur anzeigen, wenn NICHT in Mobile-Chat-Detail */}
            {!(isMobile && showMobileChatDetail) && (
              <HideOnScroll setAppBarHidden={setAppBarHidden}>
                <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', height: 56, justifyContent: 'center' }}>
                  <Toolbar sx={{ minHeight: 56, px: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <IconButton 
                      size="large" 
                      edge="start" 
                      color="inherit"
                      onClick={() => setProfileDialogOpen(true)}
                    >
                      <Avatar src={user?.avatar_url} sx={{ bgcolor: 'grey.400' }} />
                    </IconButton>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="large" edge="end" color="inherit" onClick={() => setSettingsDialogOpen(true)}>
                      <SettingsIcon />
                    </IconButton>
                  </Toolbar>
                </AppBar>
              </HideOnScroll>
            )}
            {/* Tab-Leiste nur anzeigen, wenn NICHT in Mobile-Chat-Detail */}
            {!(isMobile && showMobileChatDetail) && (
              <AppBar
                position="sticky"
                color="inherit"
                elevation={1}
                sx={{
                  top: appBarHidden ? 0 : 56,
                  zIndex: 1100,
                  transition: 'top 0.3s',
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}
                  TabIndicatorProps={{ style: { height: 3, background: '#ff4081' } }}
                >
                  <Tab icon={<AccessTimeIcon />} label={t('Zeitkapsel')} sx={{ minHeight: 48 }} />
                  <Tab icon={<SportsEsportsIcon />} label={t('Spiele')} sx={{ minHeight: 48 }} />
                  <Tab icon={<FavoriteIcon />} label={t('Musik')} sx={{ minHeight: 48 }} />
                  <Tab icon={<MessageIcon />} label={t('Chat')} sx={{ minHeight: 48 }} />
                  <Tab icon={<ListAltIcon />} label={t('Listen')} sx={{ minHeight: 48 }} />
                  <Tab icon={<SoupKitchenIcon />} label={t('Rezepte')} sx={{ minHeight: 48 }} />
                  <Tab icon={<StarIcon />} label={t('Inspiration')} sx={{ minHeight: 48 }} />
                  <Tab icon={<SmartToyIcon />} label={t('3D Spiel')} sx={{ minHeight: 48 }} />
                </Tabs>
              </AppBar>
            )}
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Container maxWidth="md" sx={{ pt: 4 }}>
                <Paper sx={{ width: '100%', mb: 4, boxShadow: 0, bgcolor: 'transparent' }}>
                  <TabPanel value={tabValue} index={0}>
                    <TimeCapsuleTab />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <GamesTab wordleWords={wordleWords} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    <MusicTab user={user} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={3}>
                    <ChatTab user={user} onChatDetailViewChange={setShowMobileChatDetail} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={4}>
                    <SharedListsTab user={user} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={5}>
                    <RecipesTab user={user} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={6}>
                    <InspirationTab />
                  </TabPanel>
                  <TabPanel value={tabValue} index={7}>
                    <Game3DTab />
                  </TabPanel>
                </Paper>
              </Container>
            </Box>
            <Footer />
          </>
        } />
        <Route path="/game3d" element={<Game3D />} />
      </Routes>
      
      {/* Dialoge */}
      <ProfileDialog 
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        user={user}
        themeSetting={themeSetting}
        setThemeSetting={setThemeSetting}
        languageSetting={languageSetting}
        setLanguageSetting={setLanguageSetting}
        pushEnabled={pushEnabled}
        setPushEnabled={setPushEnabled}
      />
    </Box>
  );
}

export default App; 