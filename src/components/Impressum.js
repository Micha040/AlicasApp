import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Impressum() {
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
          {t('Impressum')}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {t('AngabenGemaess')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Micha Kröger<br />
            Elbtreppe 13<br />
            Hamburg, 22763
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Kontakt')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}><br />
            E-Mail: mkroeger.hh@gmail.com
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('VerantwortlichInhalt')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Micha Kröger<br />
            Elbtreppe 13<br />
            Hamburg, 22763
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('EUStreitschlichtung')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('EUStreitschlichtungText')}{' '}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              https://ec.europa.eu/consumers/odr/
            </a>
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>
            {t('Verbraucherschlichtung')}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {t('VerbraucherschlichtungText')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 