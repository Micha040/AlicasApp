import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';

const SIZE = 8;
const MINES = 10;

function generateBoard() {
  // Leeres Feld
  const board = Array(SIZE).fill().map(() => Array(SIZE).fill({ mine: false, revealed: false, count: 0, flagged: false }));
  // Minen setzen
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (!board[r][c].mine) {
      board[r][c] = { ...board[r][c], mine: true };
      minesPlaced++;
    }
  }
  // Zahlen setzen
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) count++;
        }
      }
      board[r][c] = { ...board[r][c], count };
    }
  }
  return board;
}

export default function MinesweeperTab() {
  const [board, setBoard] = useState(generateBoard());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    // Sieg prüfen
    let safe = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!board[r][c].mine && board[r][c].revealed) safe++;
      }
    }
    if (safe === SIZE * SIZE - MINES && !gameOver) {
      setWon(true);
      setGameOver(true);
    }
    setRevealedCount(safe);
  }, [board, gameOver]);

  const reveal = (r, c) => {
    if (gameOver || board[r][c].revealed) return;
    if (board[r][c].mine) {
      // Spiel verloren
      setGameOver(true);
      setWon(false);
      const newBoard = board.map(row => row.map(cell => ({ ...cell, revealed: true })));
      setBoard(newBoard);
      return;
    }
    // Flood fill für 0er Felder
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      if (newBoard[cr][cc].revealed) continue;
      newBoard[cr][cc].revealed = true;
      if (newBoard[cr][cc].count === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !newBoard[nr][nc].revealed && !newBoard[nr][nc].mine) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
    setBoard(newBoard);
  };

  const reset = () => {
    setBoard(generateBoard());
    setGameOver(false);
    setWon(false);
    setRevealedCount(0);
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 2 }}>
      <Typography variant="h5" gutterBottom>Minesweeper</Typography>
      <Typography variant="body2" gutterBottom>
        Finde alle {MINES} Minen! Klicke auf ein Feld, um es aufzudecken.
      </Typography>
      <Button onClick={reset} variant="contained" sx={{ mb: 2 }}>Neues Spiel</Button>
      <Box sx={{ display: 'inline-block', border: '2px solid #888', borderRadius: 2, p: 1, background: '#eee' }}>
        <Grid container spacing={0}>
          {board.map((row, r) => (
            <Grid container item key={r} spacing={0}>
              {row.map((cell, c) => (
                <Grid item key={c}>
                  <Paper
                    onClick={() => reveal(r, c)}
                    sx={{
                      width: 36, height: 36, m: 0.2, p: 0,
                      background: cell.revealed ? (cell.mine ? '#e57373' : '#fff') : '#bdbdbd',
                      color: cell.mine ? '#b71c1c' : cell.count === 1 ? '#1976d2' : cell.count === 2 ? '#388e3c' : cell.count > 2 ? '#fbc02d' : '#333',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      cursor: gameOver ? 'not-allowed' : 'pointer',
                      userSelect: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                    }}
                    elevation={cell.revealed ? 1 : 3}
                  >
                    {cell.revealed ? (cell.mine ? '💣' : (cell.count > 0 ? cell.count : '')) : ''}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ mt: 2 }}>
        {gameOver && (
          <Typography variant="h6" color={won ? 'success.main' : 'error'}>
            {won ? 'Glückwunsch! Du hast gewonnen!' : 'Game Over!'}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Aufgedeckte Felder: {revealedCount} / {SIZE * SIZE - MINES}
        </Typography>
      </Box>
    </Box>
  );
} 