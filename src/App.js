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
  DialogActions
} from '@mui/material';
import { motion } from 'framer-motion';
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
import { supabase } from './supabaseClient';

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
  const games = [
    { id: 'memory', name: 'Memory', icon: <PhotoLibraryIcon />, description: 'Finde die passenden Paare!' },
    { id: 'quiz', name: 'Liebes-Quiz', icon: <QuizIcon />, description: 'Teste dein Wissen über uns!' },
    { id: 'wordle', name: 'Wordle', icon: <CompareIcon />, description: 'Rate das Wort in 6 Versuchen!' }
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Wähle dein Spiel
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

function LoveQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const questions = [
    {
      question: "Was ist unser Lieblingsessen?",
      options: ["Pizza", "Sushi", "Pasta", "Burger"],
      correctAnswer: "Pizza"
    },
    {
      question: "Wo haben wir uns kennengelernt?",
      options: ["In der Uni", "Im Park", "Bei Freunden", "Online"],
      correctAnswer: "Bei Freunden"
    },
    {
      question: "Was ist unser Lieblingsfilm?",
      options: ["Titanic", "Notebook", "La La Land", "The Holiday"],
      correctAnswer: "Notebook"
    }
  ];

  const handleAnswer = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer('');
  };

  if (showResult) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Quiz beendet!
        </Typography>
        <Typography variant="h6" gutterBottom>
          Dein Ergebnis: {score} von {questions.length}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={resetQuiz}
          sx={{ mt: 2 }}
        >
          Noch einmal spielen
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Frage {currentQuestion + 1} von {questions.length}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {questions[currentQuestion].question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            >
              {questions[currentQuestion].options.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAnswer}
        disabled={!selectedAnswer}
      >
        Antwort prüfen
      </Button>
    </Box>
  );
}

function Wordle({ wordleWords }) {
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
    console.log('Neues Wort:', randomWord); // Für Debugging
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setMessage('');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (gameOver) return;

    if (e.key === 'Backspace') {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < targetWord.length) {
      setCurrentGuess(currentGuess + e.key.toUpperCase());
    }
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGuess, gameOver, targetWord]);

  return (
    <Box sx={{ textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Wordle
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Rate das Wort in 6 Versuchen
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={startNewGame}
          sx={{ mt: 1 }}
        >
          Neues Spiel
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        {[...Array(6)].map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const rowWord = isCurrentRow ? currentGuess : guesses[rowIndex] || '';
          // Status-Array für diese Zeile berechnen
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
                      }
                    }}
                  >
                    {letter}
                  </Box>
                );
              })}
            </Box>
          );
        })}
        {/* Überprüfen-Button */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCheckGuess}
          disabled={gameOver || currentGuess.length !== targetWord.length}
          sx={{ mt: 2 }}
        >
          Überprüfen
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
          Tippe Buchstaben ein und drücke Enter zum Raten
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
      case 'quiz':
        return <LoveQuiz />;
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
  const [tabValue, setTabValue] = useState(0);
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState({
    type: 'message',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wordleWords, setWordleWords] = useState([]);

  useEffect(() => {
    // Erinnerungen aus Supabase laden
    const fetchMemories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError('Fehler beim Laden der Erinnerungen: ' + error.message);
      } else {
        setMemories(data);
      }
      setLoading(false);
    };
    fetchMemories();
  }, []);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddMemory = async () => {
    if (newMemory.content.trim()) {
      setLoading(true);
      // In Supabase speichern
      const { data, error } = await supabase
        .from('memories')
        .insert([
          {
            type: newMemory.type,
            content: newMemory.content,
            date: newMemory.date
          }
        ])
        .select();
      if (error) {
        setError('Fehler beim Speichern: ' + error.message);
        setLoading(false);
        return;
      }
      setMemories([data[0], ...memories]);
      setNewMemory({ type: 'message', content: '', date: new Date().toISOString().split('T')[0] });
      setLoading(false);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMemory({
          type,
          content: reader.result,
          date: new Date().toISOString().split('T')[0]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Unsere Erinnerungen
          </Typography>
        </motion.div>

        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AccessTimeIcon />} label="Zeitkapsel" />
            <Tab icon={<SportsEsportsIcon />} label="Spiele" />
            <Tab icon={<FavoriteIcon />} label="Favoriten" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Typography color="primary">Lade Daten...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <TimeCapsule 
                memories={memories}
                setMemories={setMemories}
                newMemory={newMemory}
                setNewMemory={setNewMemory}
                handleAddMemory={handleAddMemory}
                handleFileUpload={handleFileUpload}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <GamesTab wordleWords={wordleWords} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom>
              Unsere Favoriten
            </Typography>
            <Typography>
              Hier werden deine liebsten Erinnerungen gespeichert.
            </Typography>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

export default App; 