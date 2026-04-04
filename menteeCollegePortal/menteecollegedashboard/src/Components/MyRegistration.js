import React, { useState, useEffect } from 'react';
import '../Myregistration.css';
import {
  Card, CardContent, Typography, Divider,
  Button, Chip, Box, Grid, IconButton, CircularProgress,
  Tabs, Tab
} from '@mui/material';
import {
  EventNote, School, Grade, Edit, CalendarToday,
  ArticleOutlined, TrendingUp, History
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import AcademicRecords from './AcademicRecords';

const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  
  if (currentMonth >= 1 && currentMonth <= 5) {
      return 'Spring';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
      return 'Summer';
  } else {
      return 'Fall';
  }
};

const MyRegistration = () => {
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [academicData, setAcademicData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (userInfo) {
      fetchAcademicData();
    }
  }, [userInfo]);

  const fetchAcademicData = async () => {
    setLoading(true);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/student/dashboard/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setAcademicData(response.data);
    } catch (error) {
      console.error('Error fetching academic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStandingColor = (standing) => {
    if (standing?.toLowerCase().includes('good')) return 'success';
    if (standing?.toLowerCase().includes('probation')) return 'warning';
    return 'error';
  };

  return (
    <Card className="registration-card dashboard-card">
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <School className="card-header-icon" />
          <Typography variant="h6" className="dashboard-card-title">
            {academicData?.student ?
              `${academicData.student.first_name} ${academicData.student.last_name}'s Registration` :
              'My Registration'
            }
          </Typography>
        </Box>
        <Chip
          icon={<CalendarToday fontSize="small" />}
          label={`${currentSemester} ${currentYear}`}
          color="primary"
          variant="outlined"
          className="semester-badge"
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="registration tabs">
          <Tab label="Overview" icon={<School />} iconPosition="start" />
          <Tab label="Academic Records" icon={<History />} iconPosition="start" />
        </Tabs>
      </Box>

      <CardContent className="registration-content">
        {/* Tab 0: Overview */}
        {activeTab === 0 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>Loading academic information...</Typography>
            </Box>
          ) : !academicData ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No academic information available
              </Typography>
            </Box>
          ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box className="action-buttons">
              <Button
                variant="contained"
                startIcon={<EventNote />}
                className="view-schedule-btn"
                color="primary"
                component={Link}
                to="/course-schedule-editor"
              >
                View Course Schedule
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                className="edit-schedule-btn"
                color="primary"
                component={Link}
                to="/course-schedule-editor"
              >
                Edit Course Schedule
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider className="section-divider">
              <Chip label="Academic Information" color="primary" size="small" />
            </Divider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className="info-item">
              <Typography variant="subtitle2" className="info-label">
                <ArticleOutlined fontSize="small" /> Course Status
              </Typography>
              <Box className="info-action">
                <Chip 
                  label="Add/Drop/Withdraw" 
                  size="small" 
                  className="status-chip"
                  color="primary"
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className="info-item">
              <Typography variant="subtitle2" className="info-label">
                <School fontSize="small" /> Academic Standing
              </Typography>
              <Box className="info-value">
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Chip
                    label={academicData?.academic_progress?.academic_standing || 'Good'}
                    size="small"
                    className="status-chip good-status"
                    color={getStandingColor(academicData?.academic_progress?.academic_standing)}
                  />
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="info-item">
              <Typography variant="subtitle2" className="info-label">
                <Grade fontSize="small" /> Semester GPA
              </Typography>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" className="info-value gpa-value">
                  {academicData?.academic_progress?.gpa?.toFixed(2) || '0.00'}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="info-item">
              <Typography variant="subtitle2" className="info-label">
                <TrendingUp fontSize="small" /> Overall GPA
              </Typography>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" className="info-value gpa-value">
                  {academicData?.academic_progress?.gpa?.toFixed(2) || '0.00'}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
          )}
        </>
        )}

        {/* Tab 1: Academic Records */}
        {activeTab === 1 && (
          <AcademicRecords />
        )}
      </CardContent>
    </Card>
  );
};

export default MyRegistration;