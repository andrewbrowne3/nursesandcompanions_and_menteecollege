import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { isTokenExpired, getStoredToken } from '../utils/tokenUtils';
import { logout } from '../actions/userActions';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    // Check if token exists and is valid
    if (userInfo) {
      const token = getStoredToken();
      if (token && isTokenExpired(token)) {
        // Token is expired, logout user
        dispatch(logout());
      }
    }
  }, [userInfo, dispatch]);

  // If no user info or token is expired, redirect to login
  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  const token = getStoredToken();
  if (token && isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;