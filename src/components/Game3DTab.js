import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

function Game3DTab() {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 3
    }}>
      <Typography variant="h4" component="h2" gutterBottom>
        3D Spiel Abenteuer
      </Typography>
      <Typography variant="body1" textAlign="center" sx={{ mb: 4 }}>
        Tauche ein in eine faszinierende 3D-Welt voller Herausforderungen und Abenteuer!
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<SportsEsportsIcon />}
        onClick={() => navigate('/game3d')}
        sx={{
          padding: '12px 24px',
          fontSize: '1.2rem'
        }}
      >
        Spiel starten
      </Button>
    </Box>
  );
}

export default Game3DTab; 