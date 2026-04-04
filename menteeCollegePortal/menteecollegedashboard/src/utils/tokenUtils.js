/**
 * Token Utility Functions
 * Handles JWT token validation and expiration checking
 */

/**
 * Decode a JWT token to get payload data
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;

    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (middle part)
    const payload = parts[1];

    // Base64 decode
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} - true if expired, false if still valid
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
      return true; // Consider invalid tokens as expired
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;

    // Add 10 second buffer to account for clock skew
    return decoded.exp < (currentTime + 10);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get token expiration date
 * @param {string} token - JWT token string
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time remaining until token expires (in seconds)
 * @param {string} token - JWT token string
 * @returns {number} - Seconds remaining, or 0 if expired
 */
export const getTimeUntilExpiration = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Date.now() / 1000;
    const remaining = decoded.exp - currentTime;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Error getting time until expiration:', error);
    return 0;
  }
};

/**
 * Get token from userInfo in localStorage
 * @returns {string|null} - Token string or null
 */
export const getStoredToken = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;

    const parsed = JSON.parse(userInfo);
    return parsed.token || parsed.access || null;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

/**
 * Check if stored token is valid
 * @returns {boolean} - true if valid, false if expired or missing
 */
export const isStoredTokenValid = () => {
  const token = getStoredToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Remove all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('token');
};

/**
 * Log token information (for debugging)
 * @param {string} token - JWT token string
 */
export const logTokenInfo = (token) => {
  if (!token) {
    console.log('No token provided');
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    console.log('Invalid token');
    return;
  }

  const expiration = getTokenExpiration(token);
  const timeRemaining = getTimeUntilExpiration(token);
  const expired = isTokenExpired(token);

  console.log('Token Info:', {
    userId: decoded.user_id,
    username: decoded.username,
    expiration: expiration?.toLocaleString(),
    timeRemaining: `${Math.floor(timeRemaining / 60)} minutes`,
    expired
  });
};
