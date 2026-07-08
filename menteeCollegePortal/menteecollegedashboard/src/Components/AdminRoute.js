import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [error, setError] = useState(null);

  // Get user info from Redux store
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    const checkAdminStatus = () => {
      if (!userInfo) {
        setCheckingAdmin(false);
        return;
      }

      // Check if user is admin based on userInfo from Redux (populated during login)
      const adminStatus = userInfo.isAdmin || false;
      
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        setError('You do not have admin privileges to access this area.');
      }
      
      setCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [userInfo]);

  // Redirect to login if not authenticated
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking admin status
  if (checkingAdmin) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error if there was an issue checking admin status
  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Redirect students to their dashboard if not admin (route is capitalized).
  if (!isAdmin) {
    return <Navigate to="/Dashboard" replace />;
  }

  // Render admin content if user is admin
  return children;
};

export default AdminRoute;