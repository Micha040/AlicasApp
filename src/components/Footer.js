import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

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
            to="/impressum"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Impressum
          </Link>
          <Link
            to="/datenschutz"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Datenschutz
          </Link>
        </Box>
      </Container>
    </Box>
  );
} 