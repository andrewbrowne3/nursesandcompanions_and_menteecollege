import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import '../Header.css';
import { Avatar, Card, CardContent, Typography, Box, Chip, Divider, Button } from '@mui/material';
import { LocalHospital, AccountCircle, School, Book, ListAlt, AdminPanelSettings, Group, Logout } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import CartIcon from './Cart/CartIcon';
import { logout } from '../actions/userActions';

const Header = () => {
  const [studentData, setStudentData] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Access the values from the Redux store
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    const fetchStudentData = async () => {
      if (userInfo && userInfo.username) {
        try {
          const response = await axios.get(`https://api.menteecollege.com/api/students/${userInfo.username}/`, {
            headers: {
              Authorization: `Bearer ${userInfo.token}`, // Use the access token for authorization
            },
          });
          setStudentData(response.data);
        } catch (error) {
          console.error('Error fetching student data:', error);
        }
      }
    };

    fetchStudentData();
  }, [userInfo]);

  const getCurrentSemester = () => {
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 1 && currentMonth <= 5) {
      return 'Spring';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      return 'Summer';
    } else {
      return 'Fall';
    }
  };

  const currentYear = new Date().getFullYear();
  const currentSemester = getCurrentSemester();

  // Check if user is admin to show admin links
  const isAdmin = userInfo && userInfo.isAdmin;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="header-wrapper">
      <Card className="header-card" elevation={3}>
        <CardContent className="header-content">
          <Box className="header-logo-section">
            <LocalHospital className="header-logo-icon" />
            <Typography variant="h4" component="h1" className="header-title">
              Nurses Express
            </Typography>
            <Chip 
              label={`${currentSemester} ${currentYear}`} 
              color="primary" 
              variant="outlined" 
              className="semester-chip"
            />
          </Box>
          
          <Divider orientation="vertical" flexItem className="header-divider" />
          
          <Box className="header-user-section">
            {userInfo ? (
              <>
                <Avatar className="user-avatar">
                  {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : <AccountCircle />}
                </Avatar>
                <Box className="user-info">
                  <Typography variant="h6" className="welcome-text">
                    Welcome, {userInfo.username}
                  </Typography>
                  <Typography variant="body2" className="user-email">
                    {userInfo.email}
                  </Typography>
                  {studentData && studentData.program && (
                    <Box className="program-info">
                      <School fontSize="small" />
                      <Typography variant="body2">
                        {studentData.program}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <Typography variant="body1">
                Please log in to view your dashboard
              </Typography>
            )}
          </Box>
          
          {/* Navigation Links */}
          <Box className="nav-links">
            <CartIcon color="inherit" />
            <Button
              component={Link}
              to="/courses"
              variant="text"
              color="inherit"
              startIcon={<ListAlt />}
              className="nav-button"
            >
              Course Catalog
            </Button>
            
            {isAdmin && (
              <>
                <Button
                  component={Link}
                  to="/course-manager"
                  variant="outlined"
                  color="primary"
                  startIcon={<Book />}
                  className="admin-nav-button"
                >
                  Course Manager
                </Button>
                <Button
                  component={Link}
                  to="/cohort-management"
                  variant="outlined"
                  color="info"
                  startIcon={<Group />}
                  className="admin-nav-button"
                >
                  Cohort Management
                </Button>
                <Button
                  component={Link}
                  to="/required-documents"
                  variant="outlined"
                  color="warning"
                  startIcon={<Book />}
                  className="admin-nav-button"
                >
                  Required Docs
                </Button>
                <Button
                  component={Link}
                  to="/admin"
                  variant="contained"
                  color="secondary"
                  startIcon={<AdminPanelSettings />}
                  className="admin-nav-button"
                >
                  Admin Panel
                </Button>
                <Button
                  component={Link}
                  to="/Dashboard"
                  variant="text"
                  color="primary"
                  className="admin-nav-button"
                >
                  Dashboard
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              className="nav-button"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default Header;
