import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, textAlign: 'center' }}>
        <Typography variant="h3" color="error" gutterBottom>404</Typography>
        <Typography variant="h5">Page Not Found</Typography>
      </Paper>
    </Box>
  );
}
