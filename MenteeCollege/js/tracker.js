(function() {
  var API_URL = 'https://api.menteecollege.com/api/track-page/';
  var SESSION_KEY = 'mc_session_id';

  function getSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : 'mc_' + Math.random().toString(36).substr(2, 16);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  var ua = navigator.userAgent;
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  var isIOS = /iPad|iPhone|iPod/.test(ua);

  var os = 'Unknown';
  if (isIOS) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'MacOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';

  var browser = 'Unknown';
  if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edg') > -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';

  var startTime = new Date();
  var sessionId = getSessionId();

  var pageData = {
    session_id: sessionId,
    page_url: window.location.href,
    page_path: window.location.pathname,
    timestamp: startTime.toISOString(),
    time_spent: 0,
    referrer_url: document.referrer || 'Direct',
    user_agent: ua,
    device_type: isMobile ? 'Mobile' : 'Desktop',
    device_os: os,
    browser_name: browser,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight
  };

  function send(data) {
    var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, blob);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  // Track page entry
  send(pageData);

  // Track time spent on unload
  function onLeave() {
    var timeSpent = Math.round((new Date() - startTime) / 1000);
    if (timeSpent > 0) {
      send(Object.assign({}, pageData, { time_spent: timeSpent }));
    }
  }

  if (isIOS) {
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') onLeave();
    });
  } else {
    window.addEventListener('beforeunload', onLeave);
  }
})();
