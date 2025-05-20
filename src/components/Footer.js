import React from 'react';
import { Box, Container, Link, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <Link
            href="/impressum"
            color="inherit"
            underline="hover"
            sx={{ color: 'text.secondary' }}
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            color="inherit"
            underline="hover"
            sx={{ color: 'text.secondary' }}
          >
            Datenschutz
          </Link>
        </Box>
      </Container>
    </Box>
  );
} 