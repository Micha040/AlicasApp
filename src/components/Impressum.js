import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function Impressum() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Zurück
      </Button>
      <Paper 
        sx={{ 
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.1)',
          bgcolor: 'background.paper'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: 'primary.main',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.125rem' }
          }}
        >
          Impressum
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Angaben gemäß § 5 TMG
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            [Dein Name]<br />
            [Deine Adresse]<br />
            [Deine PLZ und Stadt]
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            Kontakt
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Telefon: [Deine Telefonnummer]<br />
            E-Mail: [Deine E-Mail-Adresse]
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            [Dein Name]<br />
            [Deine Adresse]<br />
            [Deine PLZ und Stadt]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 