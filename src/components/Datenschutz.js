import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export default function Datenschutz() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Datenschutzerklärung
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph>
            1. Datenschutz auf einen Blick
          </Typography>
          <Typography variant="body1" paragraph>
            Allgemeine Hinweise
          </Typography>
          <Typography variant="body1" paragraph>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
          </Typography>
          <Typography variant="body1" paragraph>
            2. Datenerfassung auf dieser Website
          </Typography>
          <Typography variant="body1" paragraph>
            Wer ist verantwortlich für die Datenerfassung auf dieser Website?
          </Typography>
          <Typography variant="body1" paragraph>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </Typography>
          <Typography variant="body1" paragraph>
            3. Allgemeine Hinweise und Pflichtinformationen
          </Typography>
          <Typography variant="body1" paragraph>
            Datenschutz
          </Typography>
          <Typography variant="body1" paragraph>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 