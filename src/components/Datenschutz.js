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
            3. Welche Daten werden erfasst?
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Auf dieser Website werden folgende personenbezogene Daten erfasst:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
            <li>E-Mail-Adresse (für Login/Registrierung)</li>
            <li>Profilbild (optional)</li>
            <li>Benutzername</li>
            <li>Zeitkapsel-Einträge (Nachrichten, Bilder, Videos)</li>
            <li>Chat-Nachrichten</li>
            <li>Spielstand-Daten</li>
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            4. Wie werden Ihre Daten verarbeitet?
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Wir verwenden Supabase als Datenbankdienst. Die Datenschutzerklärung von Supabase finden Sie unter: 
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              https://supabase.com/privacy
            </a>
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            5. Ihre Rechte
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Sie haben jederzeit das Recht:
          </Typography>
          <Typography variant="body1" component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
            <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
            <li>Diese berichtigen zu lassen</li>
            <li>Die Löschung zu verlangen</li>
            <li>Die Verarbeitung einzuschränken</li>
            <li>Der Verarbeitung zu widersprechen</li>
            <li>Ihre Daten in einem strukturierten Format zu erhalten</li>
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            6. Speicherdauer
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Ihre Daten werden so lange gespeichert, wie es für die genannten Zwecke erforderlich ist. 
            Sie können Ihr Konto jederzeit löschen, wodurch alle Ihre personenbezogenen Daten gelöscht werden.
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            7. Cookies
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Diese Website verwendet nur technisch notwendige Cookies für die Funktionalität der Website. 
            Es werden keine Tracking-Cookies oder Cookies von Drittanbietern verwendet.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 