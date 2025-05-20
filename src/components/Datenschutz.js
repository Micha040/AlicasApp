import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function Datenschutz() {
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
          Datenschutzerklärung
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            1. Datenschutz auf einen Blick
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2, fontSize: '1.1rem' }}>
            Allgemeine Hinweise
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            2. Datenerfassung auf dieser Website
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2, fontSize: '1.1rem' }}>
            Wer ist verantwortlich für die Datenerfassung auf dieser Website?
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            3. Allgemeine Hinweise und Pflichtinformationen
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2, fontSize: '1.1rem' }}>
            Datenschutz
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            4. Datenerfassung auf dieser Website
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Wir verwenden Supabase als Datenbankdienst. Die Datenschutzerklärung von Supabase finden Sie unter: https://supabase.com/privacy
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 