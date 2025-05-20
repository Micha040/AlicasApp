import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export default function Impressum() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Impressum
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph>
            Angaben gemäß § 5 TMG
          </Typography>
          <Typography variant="body1" paragraph>
            [Dein Name]<br />
            [Deine Adresse]<br />
            [Deine PLZ und Stadt]
          </Typography>
          <Typography variant="body1" paragraph>
            Kontakt:<br />
            Telefon: [Deine Telefonnummer]<br />
            E-Mail: [Deine E-Mail-Adresse]
          </Typography>
          <Typography variant="body1" paragraph>
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:<br />
            [Dein Name]<br />
            [Deine Adresse]<br />
            [Deine PLZ und Stadt]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 