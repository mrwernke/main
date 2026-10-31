// Lightweight, privacy-friendly site traffic logger for Wernke Math Resources.
// Fully compatible with school-issued Chromebooks, Lightspeed Filters, and Canvas iframes.

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_Ced2G9s6EDDVP5ZnXeWYF28HVX-cEOyEU508HJPElzB86R5do4R8i8LgndXTwXdxPQ/exec';
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes of inactivity starts a new visit session

let hasLoggedThisPage = false;

function getDeviceAndBrowser() {
  const ua = navigator.userAgent || '';
  const uaData = navigator.userAgentData;
  const browser = uaData?.brands?.find(({ brand }) => !/not.?a.?brand/i.test(brand))?.brand
    || (/Edg\//.test(ua) ? 'Edge'
      : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome'
          : /Safari\//.test(ua) && !/Chrome\//.test(ua) ? 'Safari'
            : 'Unknown');
  const device = uaData?.mobile ? 'mobile'
    : /iPad|Tablet|PlayBook|Silk/i.test(ua) ? 'tablet'
      : /Mobi|Android/i.test(ua) && !/Android.*\bMobile\b/i.test(ua) ? 'tablet'
        : /Mobi|iPhone|Android.*\bMobile\b/i.test(ua) ? 'mobile'
          : 'desktop';

  return { device, browser };
}

export function logVisit() {
  if (hasLoggedThisPage) return;

  try {
    const now = Date.now();

    // 1. Get or create persistent anonymous user ID
    let uid = localStorage.getItem('wmr_uid');
    if (!uid) {
      uid = 'u_' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('wmr_uid', uid);
    }

    // 2. Track visit count (increments after 30 min of inactivity or on first visit)
    const lastSeen = parseInt(localStorage.getItem('wmr_last_seen') || '0', 10);
    let visitCount = parseInt(localStorage.getItem('wmr_visits') || '0', 10);

    if (visitCount === 0 || now - lastSeen > SESSION_GAP_MS) {
      visitCount += 1;
      localStorage.setItem('wmr_visits', String(visitCount));
    }
    localStorage.setItem('wmr_last_seen', String(now));

    // 3. Determine referrer & context (Canvas iframe vs direct browser)
    const isIframe = window.self !== window.top;
    let referrerHost = '';
    if (document.referrer) {
      try {
        referrerHost = new URL(document.referrer, location.href).hostname;
      } catch {
        referrerHost = document.referrer.slice(0, 50);
      }
    }

    let referrerLabel = 'direct';
    if (isIframe) {
      referrerLabel = referrerHost ? `canvas (${referrerHost})` : 'canvas-iframe';
    } else if (referrerHost) {
      referrerLabel = referrerHost;
    }

    // 4. Format clean page label
    const rawTitle = document.title ? document.title.replace(/\s*[—–-]\s*Wernke.*$/i, '').trim() : '';
    const cleanPath = location.pathname.replace(/^\/main\//, '/');
    const pageLabel = rawTitle ? `${rawTitle} (${cleanPath})` : cleanPath;

    const { device, browser } = getDeviceAndBrowser();

    // 5. Send payload in the background
    const payload = JSON.stringify({
      userId: uid,
      page: pageLabel,
      visitCount: visitCount,
      referrer: referrerLabel,
      isCanvas: isIframe && /canvas/i.test(referrerHost),
      device,
      browser
    });

    hasLoggedThisPage = true;

    // Use standard CORS-safelisted request with redirect follow so the browser
    // can follow Google Apps Script's 302 redirect to the execution server.
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload,
      redirect: 'follow'
    }).catch(() => {});
  } catch {
    // Fail silently without interrupting user experience
  }
}

// Automatically trigger immediately upon module evaluation
logVisit();
