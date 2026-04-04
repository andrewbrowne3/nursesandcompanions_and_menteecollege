import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Alert, CircularProgress
} from '@mui/material';
import {
  NotificationsActive
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AlertsCard = () => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (userInfo) {
      fetchAlerts();
    }
  }, [userInfo]);

  const fetchAlerts = async () => {
    setLoading(true);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/student/dashboard/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!alerts || alerts.length === 0) {
    return null; // Don't show the card if no alerts
  }

  return (
    <Card className="dashboard-card" sx={{ mb: 3 }}>
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <NotificationsActive className="card-header-icon" color="warning" />
          <Typography variant="h6" className="dashboard-card-title">
            Important Alerts
          </Typography>
        </Box>
      </Box>

      <CardContent>
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            severity={getSeverity(alert.priority)}
            sx={{ mb: index < alerts.length - 1 ? 1.5 : 0 }}
            variant="filled"
          >
            {alert.message}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default AlertsCard;
