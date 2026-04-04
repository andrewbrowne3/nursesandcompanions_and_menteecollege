// Helper function to create and style the cookie banner
function createCookieBanner(ipAddress) {
  const overlay = document.createElement('div');
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  `;
  document.body.appendChild(overlay);

  const banner = document.createElement('div');
  banner.style = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #11263D;
    color: white;
    padding: 1.5rem;
    font-size: 1.2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 9999;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.5);
    border-top: 5px solid #ff5722;
    animation: slideUp 0.5s ease-out;
  `;

  const text = document.createElement('div');
  text.style = `
    flex: 1;
    font-weight: bold;
    margin-right: 1rem;
  `;
  text.textContent = 'We use cookies to improve your experience.';

  const buttonContainer = document.createElement('div');
  buttonContainer.style = 'display: flex; gap: 1rem;';

  const acceptButton = createButton('Accept', () => handleConsent(true, banner, overlay));
  const declineButton = createButton('Decline', () => handleConsent(false, banner, overlay));

  buttonContainer.appendChild(acceptButton);
  buttonContainer.appendChild(declineButton);

  banner.appendChild(text);
  banner.appendChild(buttonContainer);
  document.body.appendChild(banner);
}

// Helper function to create styled buttons
function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style = `
    background-color: white;
    color: #007bff;
    border: 2px solid white;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
  `;
  button.addEventListener('click', onClick);
  return button;
}

// Handle user consent action
function handleConsent(accepted, banner, overlay) {
  localStorage.setItem('cookies_accepted', accepted ? 'true' : 'false');
  banner.remove();
  overlay.remove();
  if (accepted) setSessionCookie();
}

// Set a session cookie
function setSessionCookie() {
  const sessionId = crypto.randomUUID();
  document.cookie = `session_id=${sessionId}; path=/; SameSite=Strict; Secure`;
  console.log('Session ID set:', sessionId);
}

// Check if session cookie exists
function hasSessionCookie() {
  return document.cookie.split('; ').some(row => row.startsWith('session_id='));
}

// Fetch the user's public IP address
async function fetchIpAddress() {
  try {
    const response = await fetch('https://api64.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return 'Error fetching IP';
  }
}

// Track page data on unload
function trackPageData(ipAddress) {
  const sessionId = document.cookie
    .split('; ')
    .find(row => row.startsWith('session_id='))
    ?.split('=')[1];

  const pageData = {
    session_id: sessionId || 'unknown',
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer_url: document.referrer || 'Direct',
    timestamp: new Date().toISOString(),
    ip_address: ipAddress,
  };

  console.log('Prepared page data:', pageData);

  window.addEventListener('beforeunload', () => {
    console.log('Before unload event triggered', pageData);
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(pageData)], { type: 'application/json' });
      const success = navigator.sendBeacon('https://api.menteecollege.com/api/track-page/', blob); // Corrected
      console.log('SendBeacon success:', success);
    } else {
      fetch('https://api.menteecollege.com/api/track-page/', { // Corrected
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      })
        .then(response => console.log('Fetch success:', response.ok))
        .catch(err => console.error('Error tracking page data with fetch:', err));
    }
  });
}



// Test API connection
async function testApiConnection(ipAddress) {
  const sessionId = document.cookie
    .split('; ')
    .find(row => row.startsWith('session_id='))
    ?.split('=')[1];

  const pageData = {
    session_id: sessionId || 'unknown',
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer_url: document.referrer || 'Direct', // Add referrer info or fallback to "Direct"
    timestamp: new Date().toISOString(),
    ip_address: ipAddress,
  };

  try {
    const response = await fetch('https://api.menteecollege.com/api/track-page/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData),
    });
    console.log('API test response status:', response.status);
    console.log('API test response body:', await response.text());
  } catch (err) {
    console.error('Error testing API:', err);
  }

  window.addEventListener('beforeunload', () => {
    console.log('Before unload event triggered', pageData);
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(pageData)], { type: 'application/json' });
      const success = navigator.sendBeacon('https://api.menteecollege.com/api/track-page/', blob);
      console.log('SendBeacon success:', success);
    } else {
      fetch('https://api.menteecollege.com/api/track-page/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      })
        .then(response => console.log('Fetch success:', response.ok))
        .catch(err => console.error('Error tracking page data with fetch:', err));
    }
  });
}


// Initialize cookie consent and tracking
(async function initCookieConsent() {
  const consentGiven = localStorage.getItem('cookies_accepted');
  const ipAddress = await fetchIpAddress();

  if (!consentGiven || (consentGiven === 'false' && !hasSessionCookie())) {
    createCookieBanner(ipAddress);
  } else if (consentGiven === 'true' && !hasSessionCookie()) {
    setSessionCookie();
  }

  trackPageData(ipAddress);
  await testApiConnection(ipAddress);
})();
