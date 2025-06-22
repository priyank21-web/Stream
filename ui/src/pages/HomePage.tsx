import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
      <Typography variant="h2" gutterBottom color="primary">Welcome to Stream</Typography>
      <Typography variant="h5" gutterBottom>Experience seamless remote streaming and control.</Typography>
      <Box mt={4}>
        <Button component={Link} to="/login" variant="contained" color="primary" size="large" sx={{ mr: 2 }}>
          Login
        </Button>
        <Button component={Link} to="/signup" variant="outlined" color="primary" size="large">
          Sign Up
        </Button>
      </Box>
    </Box>
  );
}
