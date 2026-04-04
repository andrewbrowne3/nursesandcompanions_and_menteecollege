import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../actions/userActions';
import { isStoredTokenValid, clearAuthData, getTimeUntilExpiration, getStoredToken } from '../utils/tokenUtils';

/**
 * Custom hook to validate JWT token and auto-logout on expiration
 * Checks token validity on mount and periodically every 5 minutes
 */
const useTokenValidation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.userLogin);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Function to check token and logout if expired
    const checkTokenValidity = () => {
      // Only check if user is logged in
      if (!userInfo) {
        return;
      }

      const token = getStoredToken();

      if (!token) {
        console.log('No token found - logging out');
        handleLogout();
        return;
      }

      // Check if token is still valid
      if (!isStoredTokenValid()) {
        console.log('Token expired - auto-logout initiated');

        // Get time until expiration for logging
        const timeRemaining = getTimeUntilExpiration(token);
        console.log(`Token expired ${Math.abs(Math.floor(timeRemaining / 60))} minutes ago`);

        handleLogout();
      } else {
        // Token is valid - log time remaining (optional, for debugging)
        const timeRemaining = getTimeUntilExpiration(token);
        const daysRemaining = Math.floor(timeRemaining / (60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (60 * 60 * 24)) / (60 * 60));

        console.log(`Token valid - expires in ${daysRemaining} days, ${hoursRemaining} hours`);
      }
    };

    // Handle logout process
    const handleLogout = () => {
      // Clear auth data from localStorage
      clearAuthData();

      // Dispatch Redux logout action
      dispatch(logout());

      // Get current path for redirect after login
      const currentPath = location.pathname;

      // Don't redirect if already on login/register pages
      if (currentPath === '/login' || currentPath === '/' || currentPath === '/') {
        return;
      }

      // Redirect to login with return URL
      navigate(`/?redirect=${encodeURIComponent(currentPath)}`, {
        state: { message: 'Your session has expired. Please login again.' }
      });
    };

    // Listen for token expiration events from axios interceptor
    const handleTokenExpiredEvent = (event) => {
      console.log('Token expired event received');
      handleLogout();
    };

    window.addEventListener('auth-token-expired', handleTokenExpiredEvent);

    // Check token immediately on mount
    checkTokenValidity();

    // Set up periodic check every 5 minutes (300000 ms)
    intervalRef.current = setInterval(() => {
      checkTokenValidity();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('auth-token-expired', handleTokenExpiredEvent);
    };
  }, [userInfo, dispatch, navigate, location]);

  // Return nothing - this hook just manages side effects
  return null;
};

export default useTokenValidation;
