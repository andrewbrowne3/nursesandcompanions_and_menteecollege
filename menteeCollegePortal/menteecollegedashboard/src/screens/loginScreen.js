import React from 'react';
import './loginScreen.css';
import LoginPage from '../Components/login';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const LoginScreen = () => {
  return (
    <div className="login-page">
      <Grid container className="login-container">
        <Grid item xs={12} md={7} className="login-image-container">
          <div className="login-overlay"></div>
          <div className="login-content-left">
            <Typography variant="h3" className="welcome-text">
              Welcome to <span>Nurses Express</span>
            </Typography>
            <Typography variant="body1" className="welcome-subtitle">
              Your complete portal for nursing education management
            </Typography>
            
            <Box className="feature-list">
              <Box className="feature-item">
                <div className="feature-icon">📊</div>
                <Typography variant="body1">Track your academic progress</Typography>
              </Box>
              <Box className="feature-item">
                <div className="feature-icon">💰</div>
                <Typography variant="body1">Manage tuition and financial aid</Typography>
              </Box>
              <Box className="feature-item">
                <div className="feature-icon">📝</div>
                <Typography variant="body1">Access course materials and schedules</Typography>
              </Box>
            </Box>
          </div>
        </Grid>
        
        <Grid item xs={12} md={5} className="login-right-container">
          <Paper elevation={0} className="login-paper">
            <Box className="login-header">
              <LocalHospital className="login-logo-icon" />
              <Typography variant="h4" className="login-title">
                Nurses Express
              </Typography>
            </Box>
            
            <Box className="login-form-container">
              <Typography variant="h5" className="login-subtitle">
                Sign in to your account
              </Typography>
              <LoginPage />
              
              <Box className="login-footer">
                <Typography variant="body2" className="login-footer-text">
                  &copy; 2023 Nurses Express. All rights reserved.
                </Typography>
                <Typography variant="body2" className="login-help-text">
                  <a href="#help">Need help signing in?</a>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default LoginScreen;

