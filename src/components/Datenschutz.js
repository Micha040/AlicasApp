import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Datenschutz() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        {t('Zurueck')}
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
          {t('Datenschutzerklaerung')}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {t('DatenschutzUebersicht')}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2, fontSize: '1.1rem' }}>
            {t('AllgemeineHinweise')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('DatenschutzAllgemeinText')}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Datenerfassung')}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2, fontSize: '1.1rem' }}>
            {t('Verantwortlicher')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('VerantwortlicherText')}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('WelcheDaten')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('WelcheDatenText')}
          </Typography>
          <Typography variant="body1" component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
            {t('WelcheDatenListe').split(';').map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Datenverarbeitung')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('DatenverarbeitungText')}{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              https://supabase.com/privacy
            </a>
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Rechte')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('RechteText')}
          </Typography>
          <Typography variant="body1" component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
            {t('RechteListe').split(';').map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Speicherdauer')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('SpeicherdauerText')}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Cookies')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('CookiesText')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 